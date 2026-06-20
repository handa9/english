<script lang="ts">
  import { playWord, speechSupported } from '$lib/speech';
  import type { Card, Grade } from '$lib/types';

  let { card, onGrade }: { card: Card; onGrade: (g: Grade) => void } = $props();

  let selected = $state<number | null>(null);
  const canSpeak = speechSupported();

  const listening = $derived(card.listening);
  const options = $derived(listening?.options ?? []);
  const homophone = $derived(listening?.homophone === true);
  const answerIndex = $derived(listening?.answerIndex ?? 0);
  const answer = $derived(options[answerIndex] ?? '');
  // 「聴き分けられない（同音）」の選択肢を語の末尾に常設する。index は語数に等しい。
  const SAME_SOUND = $derived(options.length);
  // 同音問題なら「聴き分けられない」が正解。聴き取り問題なら再生語が正解。
  const correctIndex = $derived(homophone ? SAME_SOUND : answerIndex);
  const answered = $derived(selected !== null);

  // カードが変わったら状態をリセットし、正解として再生する語を自動再生する。
  // 同音問題でも options[answerIndex] の語を実際に再生する（音は全語同じ）。
  $effect(() => {
    card;
    selected = null;
    if (canSpeak && answer) playWord(answer);
  });

  function choose(i: number) {
    if (answered) return;
    selected = i;
  }

  function next() {
    if (!answered) return;
    onGrade(selected === correctIndex ? 'good' : 'again');
  }

  function classFor(i: number): string {
    if (!answered) return '';
    if (i === correctIndex) return 'correct';
    if (i === selected) return 'wrong';
    return 'dim';
  }
</script>

<div class="listening card">
  <p class="prompt muted">聞こえた単語はどれ？（同じ発音で区別できないと思ったら「聴き分けられない」）</p>

  <button
    class="play primary"
    aria-label="もう一度再生"
    disabled={!canSpeak}
    onclick={() => answer && playWord(answer)}
  >
    🔊 もう一度聞く
  </button>

  {#if !canSpeak}
    <p class="muted nospeak">この端末では音声を再生できません。</p>
  {/if}

  <div class="choices">
    {#each options as opt, i}
      <div class="choice-row">
        <button class="choice {classFor(i)}" disabled={answered} onclick={() => choose(i)}>
          {opt}
        </button>
        {#if answered && canSpeak}
          <!-- 回答後の再生ボタン。disabled な選択肢ボタンの外に置く（中だと押せない）。 -->
          <button class="repeat" aria-label={`${opt} を聞く`} onclick={() => playWord(opt)}>🔊</button>
        {/if}
      </div>
    {/each}

    <!-- 全問共通の「聴き分けられない（同音）」選択肢 -->
    <div class="choice-row">
      <button
        class="choice same-sound {classFor(SAME_SOUND)}"
        disabled={answered}
        onclick={() => choose(SAME_SOUND)}
      >
        🔇 聴き分けられない（同音）
      </button>
    </div>
  </div>

  {#if answered}
    {#if homophone}
      <p class="meaning">
        ✅ これらは<strong>同じ発音（同音）</strong>。再生されたのは <strong>{answer}</strong>{#if listening?.meaning}（{listening.meaning}）{/if}
      </p>
    {:else}
      <p class="meaning">再生されたのは <strong>{answer}</strong></p>
      {#if listening?.meaning}
        <p class="meaning sub">{listening.meaning}</p>
      {/if}
    {/if}
    {#if listening?.hint}
      <p class="hint muted">💡 {listening.hint}</p>
    {/if}
  {/if}
</div>

{#if answered}
  <button class="primary next" onclick={next}>次へ</button>
{/if}

<style>
  .listening {
    text-align: center;
  }
  .prompt {
    margin-top: 0;
    font-size: 0.85rem;
    line-height: 1.5;
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
  .choice-row {
    display: flex;
    align-items: stretch;
    gap: 0.5rem;
  }
  .choice {
    flex: 1;
    font-size: 1.15rem;
    padding: 0.85rem 1rem;
  }
  /* disabled でも見た目が暗くならないように（pointer-events だけ無効化） */
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
  /* 「聴き分けられない」選択肢は語の選択肢と視覚的に区別する */
  .same-sound {
    font-size: 0.95rem;
    border: 1px dashed var(--surface-2);
    background: var(--surface);
  }
  .same-sound.correct,
  .same-sound.wrong {
    border-style: solid;
  }
  /* 回答後に各選択肢の音声を再生するボタン（独立させて押せるようにする） */
  .repeat {
    flex: 0 0 auto;
    font-size: 1.1rem;
    padding: 0 1rem;
  }
  .meaning {
    margin-top: 1rem;
    font-weight: 600;
    line-height: 1.5;
  }
  .meaning.sub {
    margin-top: 0.3rem;
    font-weight: 500;
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
