import type { Level } from './types';

/** レベル選択 UI 用の定義。TOEIC スコア帯を目安に表示する。 */
export interface LevelInfo {
  level: Level;
  label: string; // 短いラベル（タブ表示用）
  toeic: string; // TOEIC スコア帯の目安
}

export const levels: LevelInfo[] = [
  { level: 'beginner', label: '初級', toeic: '〜500' },
  { level: 'intermediate', label: '中級', toeic: '500〜700' },
  { level: 'advanced', label: '上級', toeic: '700〜' }
];

export const levelLabel: Record<Level, string> = {
  beginner: '初級（TOEIC 〜500）',
  intermediate: '中級（TOEIC 500〜700）',
  advanced: '上級（TOEIC 700〜）'
};
