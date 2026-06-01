# Railway: translate-worker service

1. **GitHub repo:** `shashankpandey2405-cpu/pdf-translate` branch `master`

## Option A — Dockerfile (recommended)

| Setting | Value |
|---------|--------|
| Config file path | `railway.translate-worker.toml` |
| Builder | **Dockerfile** |
| Dockerfile path | `docker/translate-worker/Dockerfile` |
| Start command | `npm run worker:translate` |

Build log must show `FROM node:22-bookworm-slim` — **not** Railpack.

## Option B — Railpack (if Dockerfile not available)

Add these **service variables** on `translate-worker` only (required):

```text
RAILPACK_INSTALL_CMD=npm install --legacy-peer-deps --ignore-scripts
RAILPACK_BUILD_CMD=echo pdftrusted-translate-worker-skip-next-build
```

Do **not** override install/build in `railpack.json` steps — that breaks `node_modules` copy.

Optional:

```text
RAILPACK_CONFIG_FILE=railpack.json
```

Redeploy after setting variables. Build log should show `npm install` (not `npm ci`) and no `npm run build`.
