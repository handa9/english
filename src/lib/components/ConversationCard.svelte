<script lang="ts">
  import { speak, speechSupported } from '$lib/speech';
  import type { Card, Grade } from '$lib/types';

  let { card, onGrade }: { card: Card; onGrade: (g: Grade) => void } = $props();

  let selected = $state<number | null>(null);
  const canSpeak = speechSupported();

  const prompt = $derived(card.conversation?.prompt ?? '');

  // カードが変わったら状態をリセットし、質問を自動再生する
  $effect(() => {
    card;
    selected = null;
    if (canSpeak && prompt) speak(prompt);
  });

  function choose(i: number) {
    if (selected !== null) return;
    selected = i;
  }

  function next() {
    if (selected === null) return;
    const correct = selected === card.conversation?.answerIndex;
    onGrade(correct ? 'good' : 'again');
  }

  function classFor(i: number): string {
    if (selected === null) return '';
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
  {:else if selected !== null}
    <p class="prompt-text muted">「{prompt}」</p>
  {/if}

  <p class="ask muted">適切な応答を選んでください</p>

  <div class="choices">
    {#each card.conversation?.choices ?? [] as choice, i}
      <button class={classFor(i)} disabled={selected !== null} onclick={() => choose(i)}>
        {choice}
      </button>
    {/each}
  </div>

  {#if selected !== null && card.conversation?.explanation}
    <p class="explanation muted">{card.conversation.explanation}</p>
  {/if}
</div>

{#if selected !== null}
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
  .choices button {
    text-align: left;
    padding: 0.85rem 1rem;
  }
  .choices button.correct {
    background: var(--good);
    color: #00121e;
  }
  .choices button.wrong {
    background: var(--bad);
    color: #fff;
  }
  .choices button.dim {
    opacity: 0.5;
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
