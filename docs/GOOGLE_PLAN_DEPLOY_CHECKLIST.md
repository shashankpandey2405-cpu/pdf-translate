# Google Plan — Deploy & GSC Checklist

Manual steps for Phase E and deploy verification (Phase deploy-env).

## Vercel / Railway environment

- [ ] `AI_LIFETIME_TRIAL_LIMIT=0` (monthly credits, no lifetime AI trial)
- [ ] `OPENROUTER_API_KEY` set for AI tools
- [ ] Supabase `SUPABASE_SERVICE_ROLE_KEY` + URL configured
- [ ] Redis URL configured for cloud jobs + credits fallback

## Supabase

- [ ] Run [`supabase/migrations/001_credit_ledger.sql`](../supabase/migrations/001_credit_ledger.sql) if not applied
- [ ] Verify tables: `credit_accounts`, `credit_transactions`, `credit_holds`
- [ ] Optional: inspect grants — `select * from credit_transactions where type = 'grant' order by created_at desc limit 10;`

## Credits verification (signed-in free user)

1. Sign in with Google
2. `GET /api/credits/balance` → `credits.monthlyGrant` should be **10**
3. `GET /api/enhanced/usage` → `enhancedRemaining` should match available credits
4. Run one Turbo Cloud job → credits decrease; browser merge without login → no credits used

## Google Search Console (Phase E)

1. Property: `https://www.pdftrusted.com/`
2. Submit sitemap: `https://www.pdftrusted.com/sitemap.xml`
3. URL inspect samples:
   - `/en/merge-pdf`
   - `/en/ai-summarize`
   - `/en/compare/speed`
4. Monitor Core Web Vitals (mobile): Home, merge-pdf, compress-pdf
5. Lighthouse mobile targets: LCP &lt; 2.5s, CLS &lt; 0.1, INP &lt; 200ms

## Community (manual, 30 min/day)

- Answer 1–2 genuine questions on r/pdf or Quora per week
- Link to compare or tool hub — no copy-paste spam

## After deploy smoke test

- [ ] Private Local merge (guest, no login)
- [ ] Turbo Cloud OCR (signed in, credits deduct)
- [ ] iPhone Safari download from result panel
- [ ] Processing monitor shows 0 uploads in Private Local mode
