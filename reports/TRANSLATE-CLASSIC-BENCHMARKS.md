# Classic Translate — performance benchmarks (post-MVP)

Run after deploying `translate-mt` + `worker:translate` on target hardware.

| Scenario | Target | How to measure |
|----------|--------|----------------|
| 10-page digital EN→HI | &lt; 30s CPU (medium VPS) | Job trace `processing` → `done` |
| 50-page digital EN→DE | &lt; 90s CPU | Same |
| Scanned PDF | Routes to AI, `needs_ai_translate` if forced Classic | `/api/translate/analyze` |
| Redis MT cache hit | Second identical doc faster | Compare job logs |

Record: `TRANSLATE_MT_URL`, RAM, vCPU, Argos pairs installed, p50/p95 job time.
