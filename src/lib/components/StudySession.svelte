<script lang="ts">
  import { base } from '$app/paths';
  import { buildQueue, buildReviewQueue, gradeCard, shuffle } from '$lib/session';
  import { levels } from '$lib/levels';
  import type { Card, Grade, Level } from '$lib/types';
  import Flashcard from './Flashcard.svelte';
  import Quiz from './Quiz.svelte';
  import ListeningCard from './ListeningCard.svelte';
  import ConversationCard from './ConversationCard.svelte';

  // review=true で復習モード（苦手＋期限到来を優先、尽きたら完了表示）。
  let { kind, review = false }: { kind?: Card['kind']; review?: boolean } = $props();

  // レベル選択が意味を持つ種別（単語・英熟語・文法）。復習モードでは出さない。
  const levelable = $derived(
    !review && (kind === 'vocab' || kind === 'idiom' || kind === 'grammar')
  );
  // 音声を自動再生する種別（開始ボタンを挟んでから出題する）
  const audioFirst = $derived(kind === 'listening' || kind === 'conversation');
  const LS_KEY = 'english-pwa:level';

  function initialLevel(): Level {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(LS_KEY);
      if (saved === 'beginner' || saved === 'intermediate' || saved === 'advanced') return saved;
    }
    return 'beginner';
  }

  let level = $state<Level>(initialLevel());
  let queue = $state<Card[]>([]);
  let index = $state(0);
  let loading = $state(true);
  let done = $state(0); // この種別で学習した累計枚数
  let started = $state(false); // 音声系で「開始」が押されたか

  let finished = $state(false); // 復習モードでキューを学習し切ったか

  async function load() {
    loading = true;
    started = false;
    finished = false;
    queue = review
      ? await buildReviewQueue(kind)
      : await buildQueue(kind, levelable ? level : undefined);
    index = 0;
    done = 0;
    loading = false;
  }

  /**
   * 次のカードへ進む。
   * 復習モードはキューを 1 周したら完了で止める。
   * 通常モードは末尾まで来たら再シャッフルして繰り返す（完了で止めない）。
   */
  function advance() {
    if (index + 1 < queue.length) {
      index += 1;
      return;
    }
    if (review) {
      finished = true;
      return;
    }
    if (queue.length <= 1) {
      // 1 枚しかなければそのまま同じカードを再出題
      index = 0;
      return;
    }
    // 再シャッフル。直前のカードが先頭に来たら 2 枚目と入れ替えて連続出題を避ける
    const lastId = queue[index].id;
    let reshuffled = shuffle(queue);
    if (reshuffled[0].id === lastId) {
      [reshuffled[0], reshuffled[1]] = [reshuffled[1], reshuffled[0]];
    }
    queue = reshuffled;
    index = 0;
  }

  function selectLevel(l: Level) {
    if (l === level) return;
    level = l;
    if (typeof localStorage !== 'undefined') localStorage.setItem(LS_KEY, l);
  }

  // kind か level が変わったら再読み込み
  $effect(() => {
    kind;
    level;
    load();
  });

  async function handleGrade(g: Grade) {
    const card = queue[index];
    if (!card) return;
    await gradeCard(card.id, g);
    done += 1;
    advance();
  }

  const current = $derived(queue[index]);
</script>

{#if levelable}
  <div class="levels" role="tablist" aria-label="レベル選択">
    {#each levels as l}
      <button
        role="tab"
        aria-selected={level === l.level}
        class:active={level === l.level}
        onclick={() => selectLevel(l.level)}
      >
        <span class="lv-label">{l.label}</span>
        <span class="lv-toeic">TOEIC {l.toeic}</span>
      </button>
    {/each}
  </div>
{/if}

{#if loading}
  <p class="muted">読み込み中…</p>
{:else if review && finished}
  <div class="done card">
    <h2>🎉 復習完了</h2>
    <p class="muted">期限が来た問題と苦手な問題をすべて復習しました。お疲れさまでした。</p>
    <button class="btn primary" onclick={load}>もう一度復習する</button>
    <a class="btn ghost" href={`${base}/`}>ホームへ</a>
  </div>
{:else if !current}
  <div class="done card">
    {#if review}
      <h2>✅ 復習はありません</h2>
      <p class="muted">
        いま復習が必要な問題はありません。各テストを進めると、苦手だった問題や期限が来た問題がここに集まります。
      </p>
    {:else}
      <h2>準備中</h2>
      <p class="muted">
        {levelable ? 'このレベルには' : ''}まだ問題がありません。別のレベルを選んでください。
      </p>
    {/if}
    <a class="btn primary" href={`${base}/`}>ホームへ</a>
  </div>
{:else if audioFirst && !started}
  <div class="start card">
    <h2>{kind === 'listening' ? '👂 ヒアリングテスト' : '💬 日常会話テスト'}</h2>
    <p class="muted">
      {kind === 'listening'
        ? '開始すると単語が音声で流れます。聞こえた語を選んでください。同じ発音で区別できないと思ったら「聴き分けられない」を選びます。'
        : '開始すると質問が音声で流れます。準備ができたら始めてください。'}
    </p>
    <button class="primary start-btn" onclick={() => (started = true)}>▶ 開始する</button>
  </div>
{:else}
  <div class="progress muted">
    {index + 1} / {queue.length}
    <span class="count">・学習 {done} 枚</span>
  </div>
  {#if current.kind === 'grammar'}
    <Quiz card={current} onGrade={handleGrade} />
  {:else if current.kind === 'listening'}
    <ListeningCard card={current} onGrade={handleGrade} />
  {:else if current.kind === 'conversation'}
    <ConversationCard card={current} onGrade={handleGrade} />
  {:else}
    <Flashcard card={current} onGrade={handleGrade} />
  {/if}
{/if}

<style>
  .levels {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.4rem;
    margin-bottom: 1rem;
  }
  .levels button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    padding: 0.5rem 0.3rem;
    background: var(--surface);
    border: 1px solid var(--surface-2);
  }
  .levels button.active {
    background: var(--accent-strong);
    color: #00121e;
    border-color: var(--accent-strong);
  }
  .lv-label {
    font-weight: 600;
    font-size: 0.95rem;
  }
  .lv-toeic {
    font-size: 0.65rem;
    opacity: 0.85;
  }
  .progress {
    text-align: center;
    margin-bottom: 0.75rem;
    font-size: 0.85rem;
  }
  .progress .count {
    opacity: 0.75;
  }
  .done {
    text-align: center;
  }
  .done h2 {
    margin-top: 0;
  }
  .done .btn,
  .done button {
    margin-top: 1rem;
    display: block;
    width: 100%;
  }
  .done .ghost {
    background: var(--surface);
    border: 1px solid var(--surface-2);
    margin-top: 0.6rem;
  }
  .start {
    text-align: center;
  }
  .start h2 {
    margin-top: 0;
  }
  .start p {
    line-height: 1.6;
  }
  .start-btn {
    margin-top: 1rem;
    width: 100%;
    font-size: 1.05rem;
    padding: 0.9rem 1.4rem;
  }
</style>
