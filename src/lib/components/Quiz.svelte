<script lang="ts">
  import type { Card, Grade } from '$lib/types';

  let { card, onGrade }: { card: Card; onGrade: (g: Grade) => void } = $props();

  let selected = $state<number | null>(null);

  $effect(() => {
    card;
    selected = null;
  });

  function choose(i: number) {
    if (selected !== null) return;
    selected = i;
  }

  function next() {
    if (selected === null) return;
    const correct = selected === card.grammar?.answerIndex;
    onGrade(correct ? 'good' : 'again');
  }

  function classFor(i: number): string {
    if (selected === null) return '';
    if (i === card.grammar?.answerIndex) return 'correct';
    if (i === selected) return 'wrong';
    return 'dim';
  }
</script>

<div class="quiz card">
  <p class="question">{card.grammar?.question}</p>
  <div class="choices">
    {#each card.grammar?.choices ?? [] as choice, i}
      <button class={classFor(i)} disabled={selected !== null} onclick={() => choose(i)}>
        {choice}
      </button>
    {/each}
  </div>

  {#if selected !== null && card.grammar?.explanation}
    <p class="explanation muted">{card.grammar.explanation}</p>
  {/if}
</div>

{#if selected !== null}
  <button class="primary next" onclick={next}>次へ</button>
{/if}

<style>
  .question {
    font-size: 1.25rem;
    font-weight: 600;
    margin-top: 0;
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
