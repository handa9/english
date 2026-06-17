/** 学習カードの種別 */
export type CardKind = 'vocab' | 'idiom' | 'grammar' | 'listening' | 'conversation';

/**
 * 難易度レベル。値は中立的に保ち、表示ラベル（TOEIC スコア帯など）は
 * `lib/levels.ts` で定義する。単語・英熟語・文法で共通利用する。
 */
export type Level = 'beginner' | 'intermediate' | 'advanced';

/** 単語フラッシュカードの内容 */
export interface VocabContent {
  term: string; // 英単語・熟語
  meaning: string; // 日本語訳
  example?: string; // 例文
  pos?: string; // 品詞 (noun, verb, ...)
}

/** 文法クイズ（4択）の内容 */
export interface GrammarContent {
  question: string; // 問題文（___ を空所として含む場合あり）
  choices: string[]; // 選択肢
  answerIndex: number; // 正解の選択肢インデックス
  explanation?: string; // 解説
}

/**
 * ヒアリング（ミニマルペア）の内容。
 * 似た発音の単語群を提示し、再生された 1 語がどれかを当てさせる。
 * 日本人が聞き分けにくい r/l, b/v, s/th などのペアを想定。
 */
export interface ListeningContent {
  options: string[]; // 似た発音の選択肢（例: ['rice', 'lice']）
  answerIndex: number; // 実際に再生する＝正解の単語インデックス
  meaning?: string; // 正解単語の意味（解説用）
  hint?: string; // 聞き分けのヒント（例: 'r は舌を巻く / l は舌先を上の歯茎に付ける'）
}

/**
 * 日常会話テストの内容。
 * 質問文を音声で再生し、適切な応答を 4 択から選ばせる。
 */
export interface ConversationContent {
  prompt: string; // 読み上げる質問・呼びかけ（例: 'How was your weekend?'）
  situation?: string; // 場面の説明（例: 'レストランで店員に話しかけられて'）
  choices: string[]; // 応答の選択肢
  answerIndex: number; // 適切な応答のインデックス
  explanation?: string; // 解説
}

/** デッキに含まれる 1 件の学習項目（出題内容のみ。進捗は含まない） */
export interface Card {
  id: string;
  kind: CardKind;
  level?: Level; // 難易度（単語・英熟語・文法で使用。未設定は全レベル扱い）
  vocab?: VocabContent;
  grammar?: GrammarContent;
  listening?: ListeningContent;
  conversation?: ConversationContent;
}

/** デッキ（カードの集合） */
export interface Deck {
  id: string;
  name: string;
  description?: string;
  cards: Card[];
}

/**
 * SRS の進捗状態。SM-2 を簡略化したスケジューリングに使う。
 * IndexedDB の 'progress' ストアに cardId をキーとして保存される。
 */
export interface Progress {
  cardId: string;
  repetitions: number; // 連続正解回数
  ease: number; // 易しさ係数（初期 2.5）
  intervalDays: number; // 次回までの間隔（日）
  due: number; // 次回出題予定の epoch ms
  lastReviewed: number; // 最終学習の epoch ms
}

/** 復習の自己評価（SM-2 の grade に対応） */
export type Grade = 'again' | 'hard' | 'good' | 'easy';
