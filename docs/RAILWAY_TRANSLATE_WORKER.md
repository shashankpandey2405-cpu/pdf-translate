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

Add **service variable** on `translate-worker` only:

```text
RAILPACK_CONFIG_FILE=railpack.worker.json
```

This skips `npm ci` + `npm run build` and runs `npm install` + `npm run worker:translate`.

Optional overrides instead of config file:

```text
RAILPACK_INSTALL_CMD=npm install --legacy-peer-deps --ignore-scripts
RAILPACK_BUILD_CMD=echo skip-next-build
```

## After push

Redeploy and confirm latest commit on `master`. If logs still show `npm ci`, builder/config is wrong — use Option A or set `RAILPACK_CONFIG_FILE`.
