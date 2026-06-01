-- Add premium status columns to profiles table.
-- Run in Supabase SQL editor if profiles table already exists.

-- Ensure the profiles table exists (Supabase may auto-create it via triggers).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Add premium columns (idempotent — will not error if they already exist).
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_premium'
  ) then
    alter table public.profiles add column is_premium boolean not null default false;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'premium_until'
  ) then
    alter table public.profiles add column premium_until timestamptz;
  end if;
end $$;

alter table public.profiles enable row level security;

-- Users can read their own profile row.
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'profiles_select_own'
  ) then
    create policy profiles_select_own on public.profiles
      for select using (auth.uid() = id);
  end if;
end $$;
