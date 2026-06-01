# Launch readiness score

Generated: 2026-05-18

| Area | Score | Notes |
|------|-------|-------|
| Premium cloud E2E | 70/100 | Run `npm run qa:cloud-e2e` with QA_SESSION_COOKIE + Render workers |
| Hybrid UX | 75/100 | Modal on ToolPage + dedicated hybrid tools; auth restore wired |
| Tool honesty | 85/100 | Coming-soon hidden; cloud badge only on 3 live tools |
| Mobile / PWA | 70/100 | /get-app, manifest updated; bottom-sheet modal on mobile |
| SEO / trust | 65/100 | Run `node scripts/qa-seo-scan.mjs`; tier-accurate copy in progress |
| Security | 80/100 | QA bypass blocked in prod; callback secret validated |
| **Overall** | **74/100** | Staging-ready; complete cloud E2E on prod for 90+ |

## Blockers

1. Prove presign → worker → callback on production for all 3 pools
2. Align Vercel `ENHANCED_MAX_FILE_MB=50` and `NEXT_PUBLIC_ENHANCED_ENABLED=true`
3. Render `WORKER_POOL` per service (ocr / docx / compress)
