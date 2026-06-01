# Render worker flow

Generated: 2026-05-18

```mermaid
sequenceDiagram
  participant API as Next_API
  participant Redis as Upstash
  participant W as Render_Worker
  participant R2 as R2
  participant SB as Supabase

  API->>SB: create job + trace_id
  API->>Redis: LPUSH queue payload
  W->>Redis: RPOPLPUSH to processing
  W->>R2: GET input
  W->>W: process
  W->>R2: PUT output
  W->>API: POST callback (traceId)
  API->>SB: update status + trace events
  API->>SB: recordCloudJobCompleted
```

## Reliability
- Max 3 attempts per job (Redis `enhanced:attempts:{jobId}`)
- Dead letter list `enhanced:dead:{pool}`
- Cron requeues orphaned processing entries (15m)
