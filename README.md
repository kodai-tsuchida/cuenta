# Cuenta

個人用のお金・勤怠・個人事業を1画面で管理するダッシュボード。

- **収支** ― 銀行残高・手持ち現金・クレカの引き落とし・引落予定・貸付・給与予測
- **CROSLAN** ― 勤怠カレンダー、交通費(出勤日数 × 往復運賃)、会社経費、請求書発行(印刷→PDF)
- **ゾウさん開発** ― 仕訳帳・レシート保管(Supabase Storage)・扶養計算機(税金48万 / 社保130万)
- **Road to 100** ― AMEX プラチナ ボーナス用 100万円チャレンジ

技術スタック:

- Next.js 16 + React 19 + Tailwind 4 + shadcn/ui
- Supabase Postgres(状態保存) + Supabase Storage(レシート画像)
- Vercel デプロイ

データはサーバ(Supabase)に同期され、PCとスマホで同じ内容を見られます。スマホからは閲覧と
レシート撮影が可能で、編集や請求書発行は PC からのみ行えます。

---

## セットアップ手順(初回のみ)

### 1. Supabase プロジェクトを作る

1. <https://supabase.com> にログイン → 「New project」
2. プロジェクト名(`cuenta` など)、リージョン(Tokyo `ap-northeast-1` 推奨)、DBパスワードを入力
3. プロジェクトが起動したら、左メニューの **Project Settings → API** から以下をコピー:
   - **Project URL** (例: `https://abcdefghij.supabase.co`)
   - **anon public** key (今回使わないが控え用)
   - **service_role** key (秘密鍵 — Vercel 環境変数にだけ入れる)

### 2. テーブルを作る

1. 左メニュー **SQL Editor** → **New query**
2. このリポジトリの `supabase/schema.sql` の中身を全部コピペ
3. **Run** を押す。`app_state` と `receipts` テーブルが作成されます。

### 3. レシート用 Storage バケットを作る

1. 左メニュー **Storage** → **New bucket**
2. Name: `receipts`、**Public bucket** にチェック → Create
3. これで `<URL>/storage/v1/object/public/receipts/...` で画像が読める状態に

### 4. Vercel に環境変数を設定

1. Vercel ダッシュボード → `cuenta` プロジェクト → **Settings → Environment Variables**
2. 次の2つを **Production / Preview / Development の全部** に追加:
   - `NEXT_PUBLIC_SUPABASE_URL` = ステップ1で控えた Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = ステップ1で控えた service_role キー
3. **Deployments → 最新の行 → Redeploy** を押して反映

### 5. ローカル開発するとき

`.env.local` を作って同じ2つを設定:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

```bash
npm install
npm run dev
```

---

## ファイル構成(主要分)

```
src/
  app/
    layout.tsx              ルートレイアウト(サイドバー + 下部ナビ)
    page.tsx                / → /income にリダイレクト
    income/page.tsx         収支
    croslan/page.tsx        CROSLAN(勤怠カレンダー、経費)
    croslan/invoice/page.tsx 請求書プレビュー(印刷→PDF)
    zou/page.tsx            ゾウさん開発(仕訳・レシート・扶養計算)
    road-to-100/page.tsx    AMEX 100万円チャレンジ
    api/
      state/route.ts        GET/PUT /api/state — Supabase の app_state を読み書き
      receipts/route.ts     GET 一覧 / POST 画像アップロード
      receipts/[id]/route.ts GET 画像 / DELETE
  components/
    sidebar.tsx             デスクトップ用サイドバー
    mobile-nav.tsx          スマホ用 下部ナビ
    mobile-topbar.tsx       スマホ用 上部バー
    sync-indicator.tsx      Supabase 同期状況の表示
    money-input.tsx         金額入力
    page-header.tsx         ページ見出し+StatCard
    ui/                     shadcn/ui のコンポーネント
  lib/
    types.ts                AppState の型定義
    store.ts                useSyncExternalStore + サーバ同期(debounced)
    receipts-client.ts      /api/receipts のクライアント
    supabase-server.ts      Supabase service_role クライアント
    format.ts               日付・金額のフォーマッタ
    calendar.ts             月のカレンダー生成
supabase/
  schema.sql                Supabase に流し込む SQL
```

## 開発コマンド

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

## モバイル動作の仕様

`<main className="ro-on-mobile">` に対して以下のCSSが効きます(`globals.css`):

- スマホ(<768px)では、`form` は `display:none`、`input`/`button` は `pointer-events:none`
- `data-mobile="keep"` を付けた要素は通常通り動作(レシート撮影、ナビ、同期表示)
- `data-mobile="hide"` を付けた要素は完全に非表示(請求書ボタンなど)

## 補足

- データはすべて Supabase に保存されます。レシート画像も Storage バケット `receipts` に残ります。
- ブラウザの localStorage はオフラインキャッシュとして併用しています(初回表示の高速化用)。
- パスワード等の認証は入れていません。URLが知られなければ大丈夫ですが、念のため URL は私的に管理してください。
