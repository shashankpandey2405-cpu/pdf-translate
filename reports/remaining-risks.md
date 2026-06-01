# Remaining risks

Generated: 2026-05-18

1. Apply migration 003 on production Supabase before deploying API changes
2. Production cloud E2E on all three Render pools with real session cookie
3. R2 CORS must allow PUT from production origin
4. Mobile physical device upload smoke (manual)
5. Redis queue format v2 — ensure workers redeployed with consumer changes
