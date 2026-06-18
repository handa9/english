import { allCards } from './decks';
import { getAllProgress, getProgress, putProgress } from './db';
import { initialProgress, isDue, review } from './srs';
import type { Card, Grade, Level, Progress } from './types';

/** 配列をシャッフルした新しい配列を返す（Fisher–Yates）。 */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 出題対象のカードをシャッフルして返す。
 * 問題が尽きて「完了」にならないよう due フィルタは行わず、
 * 該当する全カードを対象にする（繰り返し出題は呼び出し側でループする）。
 * 任意で kind（vocab/idiom/grammar...）と level（難易度）で絞り込める。
 */
export async function buildQueue(kind?: Card['kind'], level?: Level): Promise<Card[]> {
  let pool = kind ? allCards.filter((c) => c.kind === kind) : allCards;
  if (level) pool = pool.filter((c) => c.level === level);
  return shuffle(pool);
}

/**
 * 復習キューを構築する。過去に学習したカードのうち、
 *  - 直近で again/hard を付けた「苦手」カード、または
 *  - SRS の期限（due）が到来したカード
 * を対象にする。苦手を先頭に、その後を due 順（古いものから）で並べる。
 * 任意で kind を指定すると、その種別（vocab/idiom/...）だけに絞り込める。
 */
export async function buildReviewQueue(kind?: Card['kind'], now = Date.now()): Promise<Card[]> {
  const progressList = await getAllProgress();
  const progressMap = new Map(progressList.map((p) => [p.cardId, p]));

  const pool = kind ? allCards.filter((c) => c.kind === kind) : allCards;

  type Entry = { card: Card; weak: boolean; due: number };
  const entries: Entry[] = [];
  for (const card of pool) {
    const p = progressMap.get(card.id);
    if (!p || p.lastReviewed === 0) continue; // 未学習は復習対象外
    const weak = p.lastGrade === 'again' || p.lastGrade === 'hard';
    if (weak || isDue(p, now)) {
      entries.push({ card, weak, due: p.due });
    }
  }

  // 苦手を優先し、同区分内は due の古い順。
  entries.sort((a, b) => {
    if (a.weak !== b.weak) return a.weak ? -1 : 1;
    return a.due - b.due;
  });

  return entries.map((e) => e.card);
}

/** カードを採点し、SRS で次回スケジュールを更新して保存する。 */
export async function gradeCard(cardId: string, grade: Grade): Promise<Progress> {
  const existing = (await getProgress(cardId)) ?? initialProgress(cardId);
  const updated = review(existing, grade);
  await putProgress(updated);
  return updated;
}

export interface Stats {
  total: number;
  learned: number; // 一度でも学習したカード数
  dueNow: number; // 現在 due のカード数
}

/** ダッシュボード用の集計。 */
export async function getStats(): Promise<Stats> {
  const progressList = await getAllProgress();
  const now = Date.now();
  const learned = progressList.filter((p) => p.lastReviewed > 0).length;
  const progressMap = new Map(progressList.map((p) => [p.cardId, p]));

  let dueNow = 0;
  for (const card of allCards) {
    const p = progressMap.get(card.id);
    if (!p || isDue(p, now)) dueNow += 1;
  }

  return { total: allCards.length, learned, dueNow };
}
