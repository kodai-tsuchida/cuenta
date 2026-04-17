# Cuenta

Cuenta は、個人のお金・時間の管理と、個人事業主としての業務管理を1か所で扱うための個人用ダッシュボードです。

このリポジトリの現在地は、`Next.js 16 + App Router + Tailwind CSS + shadcn/ui` で作った MVP です。いまは Supabase のテーブル設計、環境変数、Server Actions ベースの登録フォーム、個人用パスワード保護まで実装済みです。

## 現在実装済みのもの

- ダッシュボード画面
- トランザクション管理の一覧表示
- 個人支出 / 事業経費 / 未回収貸借 / 稼働時間のサマリー表示
- 友人間の貸借管理 UI
- 勤怠・時間管理の自動稼働時間計算
- 事業用支出の月別・勘定科目別集計
- 印刷向け請求書テンプレート画面
- Server Actions による登録フォーム
- Supabase 接続時の実データ表示
- 個人用パスワードログイン

## 技術スタック

- Next.js 16.2.4
- React 19
- Tailwind CSS 4
- shadcn/ui
- Vercel 想定
- Supabase 想定

## 開発コマンド

```bash
npm install
npm run dev
npm run lint
npm run build
```

## 主要ファイル

- `src/app/page.tsx`
  Cuenta の総合ダッシュボードと登録フォーム
- `src/app/invoice/preview/page.tsx`
  印刷向け請求書テンプレート
- `src/lib/cuenta-data.ts`
  サンプルデータと集計ロジック
- `src/lib/cuenta-db.ts`
  Supabase からの取得とサンプル表示の切り替え
- `src/app/actions.ts`
  登録フォーム用の Server Actions
- `src/app/login/page.tsx`
  個人用ログイン画面
- `src/proxy.ts`
  デプロイ時のルート保護
- `supabase/schema.sql`
  Supabase に流し込むテーブル定義
- `src/app/globals.css`
  Cuenta のデザインテーマ

## Supabase セットアップ

### 1. Supabase プロジェクト作成

無料プランで以下を準備します。

- Supabase プロジェクト
- `Project URL`
- `anon public key`
- `service_role key`

### 2. 環境変数の追加

`.env.local` は作成済みです。実際のキーに差し替えてください。

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
APP_PASSWORD=your-private-app-password
APP_SESSION_SECRET=replace-with-a-long-random-string
```

`APP_PASSWORD` と `APP_SESSION_SECRET` を入れると、デプロイ後は `/login` からパスワード認証が有効になります。

### 3. テーブル設計

SQL エディタで `supabase/schema.sql` を実行してください。

現在のテーブルは次の6つです。

- `transactions`
- `loans`
- `time_entries`
- `clients`
- `invoices`
- `invoice_lines`

### 4. 今の保存フロー

- トランザクション登録フォーム
- 貸借登録フォーム
- 勤怠登録フォーム
- 請求書登録フォーム

各フォームは Next.js の Server Actions から Supabase に保存します。

## 次の実装優先順

1. 認証と Row Level Security
2. 各データの編集・削除
3. 請求書の複数明細対応
4. ダッシュボードの月切替
5. CSV / PDF の出力強化

## 補足

このアプリは「個人用」である前提なので、いまは無料で扱いやすいパスワード保護を先に入れています。
その次の段階で、Supabase Auth と RLS による本格的な保護へ移行できます。
