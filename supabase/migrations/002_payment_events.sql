-- Phase 4: idempotent payment webhook processing

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_id text not null,
  event_type text not null,
  user_id uuid references auth.users (id) on delete set null,
  payload jsonb,
  processed_at timestamptz not null default now(),
  unique (provider, external_id)
);

create index if not exists payment_events_user_processed_idx
  on public.payment_events (user_id, processed_at desc);

alter table public.payment_events enable row level security;

-- No policies: service role only
