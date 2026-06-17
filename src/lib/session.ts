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
