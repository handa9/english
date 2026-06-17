<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import '../app.css';

  let { children } = $props();

  const nav = [
    { href: '', label: 'ホーム', icon: '🏠' },
    { href: 'vocab', label: '単語', icon: '🔤' },
    { href: 'idiom', label: '熟語', icon: '🧩' },
    { href: 'grammar', label: '文法', icon: '📝' },
    { href: 'listening', label: '聞取り', icon: '👂' },
    { href: 'conversation', label: '会話', icon: '💬' },
    { href: 'review', label: '復習', icon: '🔁' }
  ];

  function isActive(href: string): boolean {
    const path = $page.url.pathname.replace(base, '').replace(/^\//, '');
    return href === '' ? path === '' : path.startsWith(href);
  }
</script>

<div class="app">
  <header>
    <h1>English Trainer</h1>
  </header>

  <main>
    {@render children()}
  </main>

  <nav>
    {#each nav as item}
      <a href={`${base}/${item.href}`} class:active={isActive(item.href)}>
        <span class="icon">{item.icon}</span>
        <span class="label">{item.label}</span>
      </a>
    {/each}
  </nav>
</div>
