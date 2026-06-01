-- User feedback from post-success modal (Phase 6)
-- Apply manually in Supabase SQL editor.

create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  rating smallint not null check (rating >= 1 and rating <= 10),
  feedback_text text,
  screenshot_url text,
  tool_name text,
  page_url text,
  user_agent text,
  device_info jsonb default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'reviewed', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists user_feedback_created_at_idx on public.user_feedback (created_at desc);
create index if not exists user_feedback_rating_idx on public.user_feedback (rating);
create index if not exists user_feedback_status_idx on public.user_feedback (status);

alter table public.user_feedback enable row level security;

-- No public policies — inserts via service role only (API route).

comment on table public.user_feedback is 'Post-tool success feedback; admin reads via service role.';

-- Storage bucket (create in Supabase dashboard): feedback-screenshots (private)
-- Policy: service role upload only; signed URLs for admin review.
