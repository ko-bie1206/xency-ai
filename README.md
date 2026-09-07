# Xency AI

X（旧Twitter）運用代行事業向けの社内ツール。投稿作成AI・投稿予定カレンダー（クライアント承認フロー付き）・コンテキストまとめ・ヒアリングAIをまとめた Next.js アプリ。

## ローカル開発

1. 依存関係をインストール

   ```bash
   npm install
   ```

2. `.env` を用意し、以下を設定
   - `DATABASE_URL` — Postgres接続文字列（[Neon](https://neon.tech) 等で無料作成可）
   - `AI_PROVIDER` — `gemini`（無料枠あり）または `anthropic`
   - 選んだプロバイダのAPIキー（`GEMINI_API_KEY` または `ANTHROPIC_API_KEY`）
   - `BLOB_READ_WRITE_TOKEN` は空でOK（未設定時は `public/uploads` にローカル保存される）
   - `BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD` も空でOK（ローカルでは認証なしで動く）

3. DBスキーマを反映

   ```bash
   npx prisma migrate dev
   ```

4. 開発サーバー起動

   ```bash
   npm run dev
   ```

   [http://localhost:3000](http://localhost:3000) を開く。

## 本番デプロイ（Vercel）

1. GitHubリポジトリを作成してpush
2. Vercelでそのリポジトリをインポート
3. Vercelプロジェクトの Storage タブから Blob ストアを作成・接続（`BLOB_READ_WRITE_TOKEN` が自動で環境変数に入る）
4. Vercelの Environment Variables に以下を設定
   - `DATABASE_URL`（本番用Postgres。ローカルと同じNeonプロジェクトでも、別プロジェクトでも可）
   - `AI_PROVIDER` / `GEMINI_API_KEY` または `ANTHROPIC_API_KEY`
   - `BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD`（スタッフ用ダッシュボードを保護する簡易認証。クライアント確認用リンク `/review/[token]` はこの認証の対象外）
5. デプロイ後、本番DBに対してマイグレーションを反映

   ```bash
   npx prisma migrate deploy
   ```

## 認証について

`/post` `/schedule` `/context` `/hearing` `/settings` はBasic認証で保護されています（`BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD` が両方設定されている場合のみ有効）。`/review/[token]` はクライアントがログインなしで開ける専用リンクなので認証対象外です。
