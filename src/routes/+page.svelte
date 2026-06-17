<script lang="ts">
  import { base } from '$app/paths';
  import { getStats, type Stats } from '$lib/session';

  let stats = $state<Stats | null>(null);

  $effect(() => {
    getStats().then((s) => (stats = s));
  });

  const links = [
    { href: 'vocab', emoji: '🔤', title: '単語学習', desc: 'レベル別フラッシュカード' },
    { href: 'idiom', emoji: '🧩', title: '英熟語', desc: 'レベル別の句動詞・連語' },
    { href: 'grammar', emoji: '📝', title: '文法クイズ', desc: 'レベル別4択問題' },
    { href: 'listening', emoji: '👂', title: 'ヒアリングテスト', desc: 'r/l など似た発音を聞き分け' },
    { href: 'conversation', emoji: '💬', title: '日常会話テスト', desc: '音声の質問に応答を選ぶ' },
    { href: 'review', emoji: '🔁', title: '復習', desc: 'SRS で期限が来たカード' }
  ];
</script>

<section class="hero card">
  <h2>今日の学習</h2>
  {#if stats}
    <div class="stats">
      <div><strong>{stats.dueNow}</strong><span class="muted">復習待ち</span></div>
      <div><strong>{stats.learned}</strong><span class="muted">学習済み</span></div>
      <div><strong>{stats.total}</strong><span class="muted">総カード</span></div>
    </div>
  {:else}
    <p class="muted">集計中…</p>
  {/if}
</section>

<div class="menu">
  {#each links as l}
    <a class="tile card" href={`${base}/${l.href}`}>
      <span class="emoji">{l.emoji}</span>
      <div>
        <div class="title">{l.title}</div>
        <div class="muted desc">{l.desc}</div>
      </div>
    </a>
  {/each}
</div>

<style>
  .hero {
    margin-bottom: 1.25rem;
  }
  .hero h2 {
    margin-top: 0;
  }
  .stats {
    display: flex;
    gap: 1.5rem;
  }
  .stats div {
    display: flex;
    flex-direction: column;
  }
  .stats strong {
    font-size: 1.8rem;
    color: var(--accent);
  }
  .stats span {
    font-size: 0.75rem;
  }
  .menu {
    display: grid;
    gap: 0.75rem;
  }
  .tile {
    display: flex;
    align-items: center;
    gap: 1rem;
    text-decoration: none;
    color: var(--text);
  }
  .emoji {
    font-size: 2rem;
  }
  .title {
    font-weight: 600;
  }
  .desc {
    font-size: 0.85rem;
  }
</style>
