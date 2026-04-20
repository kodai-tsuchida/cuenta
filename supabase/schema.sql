-- ============================================================================
-- Cuenta (個人用ダッシュボード) Supabase schema
-- ----------------------------------------------------------------------------
-- 実行方法:
--   1. Supabase の SQL Editor を開く(左メニュー「SQL Editor」→「New query」)
--   2. このファイル全体をそのまま貼り付けて "Run"
--   3. 続いて「Storage」→「New bucket」で `receipts` バケットを Public として作成
-- ============================================================================

-- 1. アプリ全体の状態を保存する、シングルトン的なテーブル
create table if not exists public.app_state (
  id text primary key default 'singleton',
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 起動時に行がない状態でも読めるように、初期レコードを挿入しておく
insert into public.app_state (id, state)
values ('singleton', '{}'::jsonb)
on conflict (id) do nothing;

-- 2. レシートのメタデータテーブル(画像本体は Storage バケット `receipts` に置く)
create table if not exists public.receipts (
  id text primary key,
  name text not null,
  mime text not null,
  size bigint not null,
  added_at timestamptz not null default now(),
  path text not null,  -- Storage バケット内のオブジェクト名
  journal_entry_id text,
  memo text
);

create index if not exists receipts_added_at_idx
  on public.receipts (added_at desc);

-- 3. RLS は off のまま(このアプリは service_role key をサーバ側でのみ使う)
-- このプロジェクトは単一ユーザ/個人用で、クライアントへ service_role を出さない前提。
-- 公開したい場合は RLS を有効にして適切なポリシーを書いてください。
