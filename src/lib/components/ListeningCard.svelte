<script lang="ts">
  import { speak, speechSupported } from '$lib/speech';
  import type { Card, Grade } from '$lib/types';

  let { card, onGrade }: { card: Card; onGrade: (g: Grade) => void } = $props();

  let selected = $state<number | null>(null);
  const canSpeak = speechSupported();

  const answer = $derived(card.listening ? card.listening.options[card.listening.answerIndex] : '');

  // カードが変わったら状態をリセットし、正解の語を自動再生する
  $effect(() => {
    card;
    selected = null;
    if (canSpeak && answer) speak(answer);
  });

  function choose(i: number) {
    if (selected !== null) return;
    selected = i;
  }

  function next() {
    if (selected === null) return;
    const correct = selected === card.listening?.answerIndex;
    onGrade(correct ? 'good' : 'again');
  }

  function classFor(i: number): string {
    if (selected === null) return '';
    if (i === card.listening?.answerIndex) return 'correct';
    if (i === selected) return 'wrong';
    return 'dim';
  }
</script>

<div class="listening card">
  <p class="prompt muted">聞こえた単語はどれ？</p>

  <button
    class="play primary"
    aria-label="もう一度再生"
    disabled={!canSpeak}
    onclick={() => answer && speak(answer)}
  >
    🔊 もう一度聞く
  </button>

  {#if !canSpeak}
    <p class="muted nospeak">この端末では音声を再生できません。</p>
  {/if}

  <div class="choices">
    {#each card.listening?.options ?? [] as opt, i}
      <button class={classFor(i)} disabled={selected !== null} onclick={() => choose(i)}>
        {opt}
        {#if selected !== null && i === card.listening?.answerIndex && canSpeak}
          <span
            class="repeat"
            role="button"
            tabindex="0"
            aria-label="この単語を聞く"
            onclick={(e) => {
              e.stopPropagation();
              speak(opt);
            }}
            onkeydown={(e) => {
              if (e.key === 'Enter') {
                e.stopPropagation();
                speak(opt);
              }
            }}>🔊</span
          >
        {/if}
      </button>
    {/each}
  </div>

  {#if selected !== null}
    {#if card.listening?.meaning}
      <p class="meaning">{card.listening.meaning}</p>
    {/if}
    {#if card.listening?.hint}
      <p class="hint muted">💡 {card.listening.hint}</p>
    {/if}
  {/if}
</div>

{#if selected !== null}
  <button class="primary next" onclick={next}>次へ</button>
{/if}

<style>
  .listening {
    text-align: center;
  }
  .prompt {
    margin-top: 0;
    font-size: 0.9rem;
  }
  .play {
    font-size: 1.05rem;
    padding: 0.9rem 1.4rem;
    margin-bottom: 1.25rem;
  }
  .nospeak {
    font-size: 0.8rem;
    margin: -0.5rem 0 1rem;
  }
  .choices {
    display: grid;
    gap: 0.6rem;
  }
  .choices button {
    font-size: 1.15rem;
    padding: 0.85rem 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
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
  .repeat {
    font-size: 0.9rem;
    cursor: pointer;
  }
  .meaning {
    margin-top: 1rem;
    font-weight: 600;
  }
  .hint {
    margin-top: 0.5rem;
    line-height: 1.5;
    font-size: 0.9rem;
  }
  .next {
    width: 100%;
    margin-top: 1rem;
  }
</style>
