-- PdfTrusted AI credit ledger (Phase 2)
-- Run in Supabase SQL editor or via CLI: supabase db push

create table if not exists public.credit_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  lifetime_granted integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_holds (
  job_id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null check (amount > 0),
  status text not null default 'active' check (status in ('active', 'settled', 'released')),
  meta jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists credit_holds_user_status_idx on public.credit_holds (user_id, status);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id uuid,
  type text not null check (
    type in ('grant', 'purchase', 'reserve', 'settle', 'refund', 'release', 'expire')
  ),
  amount integer not null,
  balance_after integer,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists credit_transactions_user_created_idx
  on public.credit_transactions (user_id, created_at desc);

alter table public.credit_accounts enable row level security;
alter table public.credit_holds enable row level security;
alter table public.credit_transactions enable row level security;

create policy credit_accounts_select_own on public.credit_accounts
  for select using (auth.uid() = user_id);

create policy credit_transactions_select_own on public.credit_transactions
  for select using (auth.uid() = user_id);

-- Service role writes only (no insert/update policies for authenticated users)
