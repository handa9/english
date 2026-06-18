import type { Card, Deck, Level } from './types';
import vocabData from './data/vocab.json';
import idiomData from './data/idiom.json';
import grammarData from './data/grammar.json';
import listeningData from './data/listening.json';
import conversationData from './data/conversation.json';

/**
 * 学習デッキは `src/lib/data/*.json` の素データから組み立てる。
 * JSON はカテゴリ固有の「内容」のみを持ち、id と kind はここで付与する
 * （id はカテゴリ接頭辞 + 連番で一意に採番）。問題の追加は JSON 側で行う。
 */

interface VocabRow {
  level?: Level;
  term: string;
  meaning: string;
  pos?: string;
  example?: string;
}

interface GrammarRow {
  level?: Level;
  question: string;
  choices: string[];
  answerIndex: number;
  explanation?: string;
}

interface ListeningRow {
  options: string[];
  answerIndex: number;
  meaning?: string;
  hint?: string;
  homophone?: boolean;
}

interface ConversationRow {
  prompt: string;
  situation?: string;
  choices: string[];
  answerIndex: number;
  explanation?: string;
}

function buildVocabLike(rows: VocabRow[], kind: 'vocab' | 'idiom', prefix: string): Card[] {
  return rows.map((r, i) => ({
    id: `${prefix}-${i}`,
    kind,
    level: r.level,
    vocab: { term: r.term, meaning: r.meaning, pos: r.pos, example: r.example }
  }));
}

const vocab: Card[] = buildVocabLike(vocabData as VocabRow[], 'vocab', 'v');
const idiom: Card[] = buildVocabLike(idiomData as VocabRow[], 'idiom', 'i');

const grammar: Card[] = (grammarData as GrammarRow[]).map((r, i) => ({
  id: `g-${i}`,
  kind: 'grammar' as const,
  level: r.level,
  grammar: {
    question: r.question,
    choices: r.choices,
    answerIndex: r.answerIndex,
    explanation: r.explanation
  }
}));

const listening: Card[] = (listeningData as ListeningRow[]).map((r, i) => ({
  id: `l-${i}`,
  kind: 'listening' as const,
  listening: {
    options: r.options,
    answerIndex: r.answerIndex,
    meaning: r.meaning,
    hint: r.hint,
    homophone: r.homophone
  }
}));

const conversation: Card[] = (conversationData as ConversationRow[]).map((r, i) => ({
  id: `c-${i}`,
  kind: 'conversation' as const,
  conversation: {
    prompt: r.prompt,
    situation: r.situation,
    choices: r.choices,
    answerIndex: r.answerIndex,
    explanation: r.explanation
  }
}));

export const decks: Deck[] = [
  {
    id: 'core-vocab',
    name: '基本英単語',
    description: 'よく出る重要単語のフラッシュカード',
    cards: vocab
  },
  {
    id: 'core-idiom',
    name: '英熟語',
    description: '句動詞・連語のフラッシュカード',
    cards: idiom
  },
  {
    id: 'core-grammar',
    name: '英文法クイズ',
    description: '4択で学ぶ基本文法',
    cards: grammar
  },
  {
    id: 'core-listening',
    name: 'ヒアリングテスト',
    description: 'r/l などよく似た発音を聞き分ける',
    cards: listening
  },
  {
    id: 'core-conversation',
    name: '日常会話テスト',
    description: '音声の質問に適切な応答を選ぶ',
    cards: conversation
  }
];

/** 全デッキを横断した cardId → Card のマップ。 */
export const cardIndex: Map<string, Card> = new Map(
  decks.flatMap((d) => d.cards).map((c) => [c.id, c])
);

export const allCards: Card[] = decks.flatMap((d) => d.cards);
