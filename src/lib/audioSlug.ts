/**
 * リスニング用の単語を音声ファイル名（スラッグ）に変換する。
 * 生成スクリプト（scripts/gen-audio.js）と再生側（speech.ts）で
 * 同一の規則を使うため、ここに一元化する。
 *
 * 例: "right" -> "right", "I'd" -> "i-d", "ice cream" -> "ice-cream"
 */
export function audioSlug(word: string): string {
  return word
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '') // アポストロフィは除去（I'd -> id ではなく id を避けたいので下のハイフン化前に消す）
    .replace(/[^a-z0-9]+/g, '-') // 英数字以外はハイフン
    .replace(/^-+|-+$/g, ''); // 前後のハイフンを除去
}
