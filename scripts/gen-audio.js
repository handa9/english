/**
 * リスニングテスト用の単語音声を OpenAI TTS で生成し、
 * static/audio/<slug>.mp3 として保存する。
 *
 * 使い方:
 *   OPENAI_API_KEY=sk-... node scripts/gen-audio.js
 *
 * - listening.json の全選択肢語（再生される語＋回答後に再生する語）を対象にする。
 * - 既に存在する mp3 はスキップするので、語を追加したら再実行すれば差分だけ生成される。
 * - 音声モデル・声は環境変数で上書き可能（TTS_MODEL / TTS_VOICE）。
 *
 * audioSlug のロジックは src/lib/audioSlug.ts と一致させること（再生側と一致が必要）。
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'src/lib/data/listening.json');
const OUT_DIR = join(ROOT, 'static/audio');

const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.TTS_MODEL ?? 'tts-1';
const VOICE = process.env.TTS_VOICE ?? 'alloy';
const CONCURRENCY = Number(process.env.TTS_CONCURRENCY ?? 4);

/** src/lib/audioSlug.ts と同一ロジック。 */
function audioSlug(word) {
  return word
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function collectWords() {
  const data = JSON.parse(readFileSync(DATA, 'utf8'));
  const set = new Set();
  for (const q of data) for (const opt of q.options) set.add(opt);
  return [...set];
}

async function synth(word) {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      voice: VOICE,
      input: word,
      response_format: 'mp3'
    })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`TTS failed for "${word}": ${res.status} ${body.slice(0, 200)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return buf;
}

async function main() {
  if (!API_KEY) {
    console.error('OPENAI_API_KEY が設定されていません。');
    console.error('例: OPENAI_API_KEY=sk-... node scripts/gen-audio.js');
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const words = collectWords();

  // 生成すべき語（既存ファイルはスキップ）
  const pending = words.filter((w) => {
    const slug = audioSlug(w);
    return slug && !existsSync(join(OUT_DIR, `${slug}.mp3`));
  });

  console.log(`対象語: ${words.length} / 生成必要: ${pending.length}（既存はスキップ）`);
  console.log(`モデル: ${MODEL} / 声: ${VOICE} / 並列: ${CONCURRENCY}`);

  let done = 0;
  let failed = 0;

  // 簡易並列ワーカー
  let cursor = 0;
  async function worker() {
    while (cursor < pending.length) {
      const word = pending[cursor++];
      const slug = audioSlug(word);
      try {
        const buf = await synth(word);
        writeFileSync(join(OUT_DIR, `${slug}.mp3`), buf);
        done++;
        if (done % 25 === 0 || done === pending.length) {
          console.log(`  ${done}/${pending.length} 完了`);
        }
      } catch (err) {
        failed++;
        console.error(`  ✗ ${word}: ${err.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`\n完了: 生成 ${done} / 失敗 ${failed} / 既存スキップ ${words.length - pending.length}`);
  if (failed > 0) {
    console.error('一部失敗しました。再実行すると失敗分だけ再生成されます。');
    process.exit(1);
  }
}

main();
