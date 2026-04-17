create extension if not exists pgcrypto;

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_date date not null,
  title text not null,
  counterparty text not null,
  amount integer not null check (amount > 0),
  kind text not null check (kind in ('income', 'expense')),
  scope text not null check (scope in ('personal', 'business')),
  category text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists loans (
  id uuid primary key default gen_random_uuid(),
  person text not null,
  amount integer not null check (amount > 0),
  direction text not null check (direction in ('lent', 'borrowed')),
  due_date date not null,
  status text not null default 'open' check (status in ('open', 'settled')),
  memo text,
  created_at timestamptz not null default now()
);

create table if not exists time_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  start_time time not null,
  end_time time not null,
  duration_minutes integer not null check (duration_minutes > 0),
  work text not null,
  client_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients (id) on delete set null,
  invoice_number text not null unique,
  issued_on date not null,
  due_on date not null,
  seller_name text not null,
  seller_email text not null,
  client_name text not null,
  client_address text not null,
  subject text not null,
  notes text,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid')),
  created_at timestamptz not null default now()
);

create table if not exists invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices (id) on delete cascade,
  label text not null,
  quantity numeric(10, 2) not null check (quantity > 0),
  unit_price integer not null check (unit_price > 0),
  created_at timestamptz not null default now()
);

create index if not exists transactions_transaction_date_idx
  on transactions (transaction_date desc);

create index if not exists transactions_scope_kind_idx
  on transactions (scope, kind);

create index if not exists loans_status_due_date_idx
  on loans (status, due_date);

create index if not exists time_entries_entry_date_idx
  on time_entries (entry_date desc);

create index if not exists invoices_issued_on_idx
  on invoices (issued_on desc);

create index if not exists invoice_lines_invoice_id_idx
  on invoice_lines (invoice_id);
