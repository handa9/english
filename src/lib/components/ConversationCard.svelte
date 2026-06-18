<script lang="ts">
  import { speak, speechSupported } from '$lib/speech';
  import type { Card, Grade } from '$lib/types';

  let { card, onGrade }: { card: Card; onGrade: (g: Grade) => void } = $props();

  let selected = $state<number | null>(null);
  let gaveUp = $state(false); // 「分からない」を選んだか
  const canSpeak = speechSupported();

  const prompt = $derived(card.conversation?.prompt ?? '');
  // 選択肢を選んだ、または「分からない」を押したら回答済み
  const answered = $derived(selected !== null || gaveUp);

  // カードが変わったら状態をリセットし、質問を自動再生する
  $effect(() => {
    card;
    selected = null;
    gaveUp = false;
    if (canSpeak && prompt) speak(prompt);
  });

  function choose(i: number) {
    if (answered) return;
    selected = i;
  }

  function dontKnow() {
    if (answered) return;
    gaveUp = true;
  }

  function next() {
    if (!answered) return;
    // 「分からない」または不正解は again（苦手として復習対象に）
    const correct = !gaveUp && selected === card.conversation?.answerIndex;
    onGrade(correct ? 'good' : 'again');
  }

  function classFor(i: number): string {
    if (!answered) return '';
    if (i === card.conversation?.answerIndex) return 'correct';
    if (i === selected) return 'wrong';
    return 'dim';
  }
</script>

<div class="conv card">
  {#if card.conversation?.situation}
    <p class="situation muted">{card.conversation.situation}</p>
  {/if}

  <button
    class="play primary"
    aria-label="質問をもう一度再生"
    disabled={!canSpeak}
    onclick={() => prompt && speak(prompt)}
  >
    🔊 質問を聞く
  </button>

  {#if !canSpeak}
    <p class="muted nospeak">この端末では音声を再生できません。テキストで出題します。</p>
    <p class="prompt-text">{prompt}</p>
  {:else if answered}
    <p class="prompt-text muted">「{prompt}」</p>
  {/if}

  <p class="ask muted">適切な応答を選んでください</p>

  <div class="choices">
    {#each card.conversation?.choices ?? [] as choice, i}
      <div class="choice-row">
        <button class="choice {classFor(i)}" disabled={answered} onclick={() => choose(i)}>
          {choice}
        </button>
        {#if answered && canSpeak}
          <!-- 回答後の応答再生ボタン。disabled な選択肢ボタンの外に置く（中だと押せない）。 -->
          <button class="repeat" aria-label="この応答を聞く" onclick={() => speak(choice)}>🔊</button>
        {/if}
      </div>
    {/each}
  </div>

  {#if !answered}
    <button class="dont-know" onclick={dontKnow}>🤷 分からない</button>
  {:else if gaveUp}
    <p class="gaveup muted">正解を確認しましょう（上で緑色の応答が正解です）。</p>
  {/if}

  {#if answered && card.conversation?.explanation}
    <p class="explanation muted">{card.conversation.explanation}</p>
  {/if}
</div>

{#if answered}
  <button class="primary next" onclick={next}>次へ</button>
{/if}

<style>
  .situation {
    margin-top: 0;
    font-size: 0.9rem;
  }
  .play {
    font-size: 1.05rem;
    padding: 0.9rem 1.4rem;
    margin-bottom: 1rem;
    width: 100%;
  }
  .nospeak {
    font-size: 0.8rem;
  }
  .prompt-text {
    font-size: 1.05rem;
    font-weight: 600;
    margin: 0.25rem 0 1rem;
  }
  .ask {
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
  }
  .choices {
    display: grid;
    gap: 0.6rem;
  }
  .choice-row {
    display: flex;
    align-items: stretch;
    gap: 0.5rem;
  }
  .choice {
    flex: 1;
    text-align: left;
    padding: 0.85rem 1rem;
  }
  .choice:disabled {
    cursor: default;
  }
  .choice.correct {
    background: var(--good);
    color: #00121e;
  }
  .choice.wrong {
    background: var(--bad);
    color: #fff;
  }
  .choice.dim {
    opacity: 0.5;
  }
  /* 回答後に各応答を再生するボタン（独立させて押せるようにする） */
  .repeat {
    flex: 0 0 auto;
    font-size: 1.1rem;
    padding: 0 1rem;
  }
  .dont-know {
    width: 100%;
    margin-top: 0.6rem;
    background: var(--surface);
    border: 1px dashed var(--surface-2);
    color: var(--text, inherit);
    opacity: 0.85;
  }
  .gaveup {
    margin-top: 0.75rem;
    font-size: 0.85rem;
  }
  .explanation {
    margin-top: 1rem;
    line-height: 1.5;
  }
  .next {
    width: 100%;
    margin-top: 1rem;
  }
</style>
