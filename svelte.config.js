import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// GitHub Pages のプロジェクトページ配信用ベースパス。
// 環境変数 BASE_PATH を CI で設定する（例: /english）。ローカルでは空。
const base = process.env.BASE_PATH ?? '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      // SPA フォールバック。クライアントサイドルーティングを GitHub Pages で動かす。
      fallback: '404.html',
      precompress: false,
      strict: true
    }),
    paths: {
      base
    }
  }
};

export default config;
