import type { Grade, Progress } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

/** 新規カードの初期進捗を生成する（即時 due）。 */
export function initialProgress(cardId: string, now = Date.now()): Progress {
  return {
    cardId,
    repetitions: 0,
    ease: 2.5,
    intervalDays: 0,
    due: now,
    lastReviewed: 0
  };
}

/**
 * SM-2 を簡略化したスケジューラ。grade に応じて次回間隔と ease を更新する。
 * - again: 連続正解をリセットし当日中に再出題
 * - hard:  間隔を控えめに伸ばし ease を下げる
 * - good:  標準どおり間隔を伸ばす
 * - easy:  大きく間隔を伸ばし ease を上げる
 */
export function review(prev: Progress, grade: Grade, now = Date.now()): Progress {
  let { repetitions, ease, intervalDays } = prev;

  if (grade === 'again') {
    repetitions = 0;
    intervalDays = 0;
    ease = Math.max(1.3, ease - 0.2);
    // 10 分後に再出題
    return {
      ...prev,
      repetitions,
      ease,
      intervalDays,
      due: now + 10 * 60 * 1000,
      lastReviewed: now
    };
  }

  // 正解系の ease 調整
  const easeDelta = grade === 'hard' ? -0.15 : grade === 'easy' ? 0.15 : 0;
  ease = Math.max(1.3, ease + easeDelta);

  repetitions += 1;

  if (repetitions === 1) {
    intervalDays = grade === 'easy' ? 3 : 1;
  } else if (repetitions === 2) {
    intervalDays = grade === 'easy' ? 7 : 6;
  } else {
    const factor = grade === 'hard' ? 1.2 : ease;
    intervalDays = Math.round(intervalDays * factor);
  }

  return {
    ...prev,
    repetitions,
    ease,
    intervalDays,
    due: now + intervalDays * DAY_MS,
    lastReviewed: now
  };
}

/** due が現在時刻以前なら復習対象。 */
export function isDue(p: Progress, now = Date.now()): boolean {
  return p.due <= now;
}
