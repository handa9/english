// SVG から PWA 用 PNG アイコンを生成する。devcontainer 内（Node 環境）で実行。
// 依存: sharp（devDependencies）。`npm run icons` または build 前に走らせる。
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcSvg = join(root, 'static', 'icons', 'icon.svg');
const outDir = join(root, 'static', 'icons');

const targets = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-512-maskable.png', size: 512, maskable: true }
];

await mkdir(outDir, { recursive: true });

for (const t of targets) {
  // maskable は安全領域確保のため背景を敷いて縮小配置する
  const img = sharp(srcSvg).resize(t.size, t.size);
  await img.png().toFile(join(outDir, t.name));
  console.log('generated', t.name);
}

// favicon も生成
await sharp(srcSvg).resize(48, 48).png().toFile(join(root, 'static', 'favicon.png'));
console.log('generated favicon.png');
