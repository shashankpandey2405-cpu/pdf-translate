-- Processing jobs table — required for enhanced/AI job tracking.
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug text NOT NULL,
  mode text NOT NULL DEFAULT 'enhanced',
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','processing','done','failed','cancelled')),
  input_r2_key text,
  output_r2_key text,
  error_code text,
  error_message text,
  pages integer,
  file_size_bytes bigint NOT NULL DEFAULT 0,
  worker_pool text NOT NULL DEFAULT 'ocr',
  progress integer NOT NULL DEFAULT 0,
  trace_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS processing_jobs_user_created_idx
  ON public.processing_jobs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS processing_jobs_status_idx
  ON public.processing_jobs (status);

ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='processing_jobs' AND policyname='processing_jobs_select_own'
  ) THEN
    CREATE POLICY processing_jobs_select_own ON public.processing_jobs
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- User daily usage tracking
CREATE TABLE IF NOT EXISTS public.user_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  enhanced_used integer NOT NULL DEFAULT 0,
  cloud_used integer NOT NULL DEFAULT 0,
  browser_used integer NOT NULL DEFAULT 0,
  ocr_used integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='user_usage' AND policyname='user_usage_select_own'
  ) THEN
    CREATE POLICY user_usage_select_own ON public.user_usage
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Job trace events for debugging
CREATE TABLE IF NOT EXISTS public.job_trace_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid,
  trace_id uuid NOT NULL,
  stage text NOT NULL,
  status text NOT NULL DEFAULT 'ok',
  message text,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_trace_events_trace_idx
  ON public.job_trace_events (trace_id, created_at);

ALTER TABLE public.job_trace_events ENABLE ROW LEVEL SECURITY;
