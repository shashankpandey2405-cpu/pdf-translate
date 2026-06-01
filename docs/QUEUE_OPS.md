# Queue operations runbook

## Priority queues

Set on **Vercel and all Render/Railway workers simultaneously**:

```
WORKERS_PRIORITY_QUEUES=true
```

Premium jobs enqueue to `enhanced:queue:{pool}:premium`. Workers must pop premium → default → free (implemented in `claimQueueItem`).

## Atomic claim

Workers use `RPOPLPUSH` from queue list → `:processing` list. Orphan recovery cron requeues items older than 900s.

## Health check

```
GET /api/enhanced/health
Authorization: Bearer $CRON_SECRET
```

Fields: `queueDepth`, `queueByPriority`, `processingQueueDepth`, `deadLetterDepth`.

## Scaling

- **Render**: scale worker services per pool under load
- **Railway AI**: increase `AI_WORKER_BATCH_SIZE` to 2 only after multiple replicas use claim semantics
- **Queue busy**: `QUEUE_MAX_DEPTH=50` returns 503 — scale workers or raise cap temporarily

## Deploy order

1. backend-service workers (backward compatible claim)
2. Vercel frontend
3. Smoke: `node scripts/qa-cloud-e2e.mjs`
