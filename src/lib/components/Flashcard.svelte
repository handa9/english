<script lang="ts">
  import { speak, speechSupported } from '$lib/speech';
  import type { Card, Grade } from '$lib/types';

  let { card, onGrade }: { card: Card; onGrade: (g: Grade) => void } = $props();

  let revealed = $state(false);
  const canSpeak = speechSupported();

  // カードが変わったら裏面を隠す
  $effect(() => {
    card;
    revealed = false;
  });

  const grades: { g: Grade; label: string; color: string }[] = [
    { g: 'again', label: 'もう一度', color: 'var(--bad)' },
    { g: 'hard', label: '難しい', color: '#f59e0b' },
    { g: 'good', label: '普通', color: 'var(--accent-strong)' },
    { g: 'easy', label: '簡単', color: 'var(--good)' }
  ];
</script>

<div class="flashcard card">
  <div class="term">
    {card.vocab?.term}
    {#if canSpeak}
      <button
        class="speak"
        aria-label="発音を聞く"
        onclick={() => card.vocab && speak(card.vocab.term)}>🔊</button
      >
    {/if}
  </div>
  {#if card.vocab?.pos}
    <div class="pos muted">{card.vocab.pos}</div>
  {/if}

  {#if revealed}
    <hr />
    <div class="meaning">{card.vocab?.meaning}</div>
    {#if card.vocab?.example}
      <p class="example muted">
        {card.vocab.example}
        {#if canSpeak}
          <button
            class="speak small"
            aria-label="例文を聞く"
            onclick={() => card.vocab?.example && speak(card.vocab.example)}>🔊</button
          >
        {/if}
      </p>
    {/if}
  {/if}
</div>

{#if revealed}
  <div class="grades">
    {#each grades as { g, label, color }}
      <button style:background={color} style:color="#00121e" onclick={() => onGrade(g)}>
        {label}
      </button>
    {/each}
  </div>
{:else}
  <button class="primary reveal" onclick={() => (revealed = true)}>答えを見る</button>
{/if}

<style>
  .flashcard {
    text-align: center;
    margin-bottom: 1rem;
  }
  .term {
    font-size: 2rem;
    font-weight: 700;
  }
  .pos {
    font-style: italic;
    margin-top: 0.25rem;
  }
  hr {
    border: none;
    border-top: 1px solid var(--surface-2);
    margin: 1rem 0;
  }
  .meaning {
    font-size: 1.4rem;
  }
  .example {
    margin-top: 0.75rem;
    font-size: 0.95rem;
  }
  .speak {
    background: transparent;
    padding: 0.2rem 0.4rem;
    font-size: 1rem;
  }
  .speak.small {
    font-size: 0.85rem;
  }
  .reveal {
    width: 100%;
  }
  .grades {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }
  .grades button {
    font-weight: 600;
    font-size: 0.85rem;
  }
</style>
