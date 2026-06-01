# Supabase schema changes

Generated: 2026-05-18

Migration: `supabase/migrations/003_usage_audit_trace.sql`

## New tables
- `login_events` — OAuth login audit (ip_hash, user_agent)
- `user_usage_monthly` — monthly browser/cloud counters
- `user_usage_totals` — lifetime rollups
- `job_trace_events` — pipeline trace timeline per job

## Extended tables
- `user_usage`: `browser_used`, `cloud_used`
- `processing_jobs`: `trace_id`, `client_meta`, nullable `input_r2_key`

## RLS
Users SELECT own rows; writes via service role on Vercel API only.
