# English Trainer (PWA)

英単語・英文法を学ぶための **サーバレス PWA**。SvelteKit + IndexedDB で完全オフライン動作し、GitHub Pages に静的配信できます。

## 機能

- 🔤 **単語フラッシュカード** — 表/裏のカード暗記
- 🧩 **英熟語** — 句動詞・連語のフラッシュカード
- 📊 **レベル選択** — 単語・英熟語・文法は TOEIC スコア帯（初級〜500／中級500〜700／上級700〜）で出題を切替（選択は端末に保存）
- 🔁 **SRS（間隔反復）** — SM-2 を簡略化したスケジューリングで復習タイミングを最適化
- 📝 **文法クイズ** — 4 択 + 解説
- 👂 **ヒアリングテスト** — r/l・b/v など日本人が聞き分けにくいミニマルペアを音声で出題
- 💬 **日常会話テスト** — 音声で流れる質問に適切な応答を 4 択で選択
- 🔊 **音声読み上げ** — Web Speech API（オフライン・サーバ不要）
- 📦 **PWA** — インストール可能・オフラインキャッシュ

学習進捗は端末の **IndexedDB** に保存されます（サーバなし）。

## 開発（Dev Container）

VS Code + Dev Containers 拡張で本リポジトリを開き、「Reopen in Container」を選ぶだけ。
コンテナ生成時に `npm install` が走ります。

```bash
npm run dev       # 開発サーバ (http://localhost:5173)
npm run build     # 本番ビルド -> build/
npm run preview   # ビルド結果のプレビュー
npm run check     # 型チェック
npm run icons     # SVG から PWA アイコンを生成
```

> アイコン PNG は `static/icons/icon.svg` から `prebuild` で自動生成されます（`sharp` 使用）。

## デプロイ（GitHub Pages）

1. リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定。
2. `main` に push すると `.github/workflows/deploy.yml` が自動でビルド・公開します。
3. プロジェクトページ（`https://<user>.github.io/<repo>/`）配信のため、ワークフローの
   `BASE_PATH` をリポジトリ名に合わせてください（既定 `/english`）。
   ユーザー/組織ページ（`<user>.github.io`）の場合は `BASE_PATH` を空にします。

## 構成

```
src/
  lib/
    types.ts        学習データ・進捗の型
    db.ts           IndexedDB ラッパー（progress ストア）
    srs.ts          SM-2 簡略版スケジューラ
    speech.ts       Web Speech API 読み上げ
    levels.ts       レベル定義（TOEIC スコア帯ラベル）
    decks.ts        data/*.json を読み込みデッキを組み立てるローダー
    data/*.json     問題データ（vocab / idiom / grammar / listening / conversation）
    session.ts      キュー生成・採点・集計・シャッフル
    components/     Flashcard / Quiz / ListeningCard / ConversationCard / StudySession
  routes/           ホーム・単語・熟語・文法・聞取り・会話・復習
```

## 収録問題数（約 5,600 問）

| カテゴリ | 問題数 |
| --- | --- |
| 英単語 | 約 3,300 |
| 英熟語 | 約 1,500 |
| 文法 | 約 190 |
| ヒアリング | 約 270 |
| 日常会話 | 約 370 |

## カスタマイズ

問題は `src/lib/data/*.json` に格納されています。各 JSON は「内容」だけを持ち、
`decks.ts` が読み込み時に `id` と `kind` を自動付与します。問題の追加・編集は JSON を直接編集します。

- `vocab.json` / `idiom.json` … `{ level, term, meaning, pos?, example }`
- `grammar.json` … `{ level, question(空所は ___), choices[4], answerIndex, explanation }`
- `listening.json` … `{ options（似た発音）, answerIndex（再生＝正解）, meaning?, hint? }`
- `conversation.json` … `{ prompt（読み上げる質問）, situation?, choices[4], answerIndex, explanation? }`

`level`（`'beginner' | 'intermediate' | 'advanced'`）を付けると、単語・英熟語・文法は
画面上部のレベルタブ（TOEIC スコア帯）で絞り込めます。ラベルは `src/lib/levels.ts` で定義しています。
