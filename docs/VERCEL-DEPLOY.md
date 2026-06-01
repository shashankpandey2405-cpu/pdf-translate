# Vercel production deploy (armanpanday12-lgtm)

## Use this command (not plain `vercel --prod`)

```bash
npm run deploy:vercel:prod
```

This forces team **`armanpanday12-lgtms-projects`** and project **`pdftrusted`** (see `.vercel/project.json`).

CLI must be logged in as **armanpanday12-lgtm**:

```bash
vercel whoami
# should print: armanpanday12-lgtm
```

If not:

```bash
vercel logout
vercel login
```

## Why GitHub pushes show "Blocked" / account verify fail

- Repo: `shashankpandey2405-cpu/pdf`
- Commits were authored as **`shashankpandeypaytm-commits`**
- Vercel project belongs to **`armanpanday12-lgtm`** — that GitHub user is not on the team → Git auto-deploy fails.

**Fix (pick one):**

1. **Recommended for now:** Deploy only via CLI (`npm run deploy:vercel:prod`). In Vercel → Project → Settings → Git → disable auto-deploy for unwanted branches, or disconnect the `shashankpandey2405-cpu` Git link.

2. **Team access:** Vercel → Team → Members → invite the GitHub user that pushes (`shashankpandey2405-cpu` / `shashankpandeypaytm-commits`).

3. **Same identity for Git:** On this machine, set **repo-local** author (run once in project folder):

   ```bash
   git config user.name "armanpanday12-lgtm"
   git config user.email "YOUR_ARMAN_VERCEL_EMAIL"
   ```

   Push with GitHub account linked to **armanpanday12-lgtm** (`gh auth login`).

## Revert is kept

Production code is on revert commit `78be5e6` (stable `ba7d89e` state). Do not undo that revert unless you fix the Vercel build first.

## Vercel Toolbar (production)

The injected Vercel Toolbar can throw `suggestReflections` errors and break tool pages. Disable it for Production:

1. Vercel → Project → **Settings** → disable **Vercel Toolbar** for Production.
2. `next.config.mjs` sets `NEXT_PUBLIC_VERCEL_TOOLBAR_ENABLED: "0"`.
3. `AppErrorBoundary` ignores external toolbar script errors as a fallback.

After routing fixes, users on old PWA caches should tap **Update now** (amber banner) or hard-refresh once; `public/sw.js` cache version bumps force new JS.
