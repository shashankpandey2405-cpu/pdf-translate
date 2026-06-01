# Railway: translate-worker service

1. **GitHub repo:** `shashankpandey2405-cpu/pdf-translate` branch `master`
2. **Config file path:** `railway.translate-worker.toml`
3. **Builder:** Dockerfile (NOT Railpack / NOT Nixpacks)
4. **Dockerfile path:** `docker/translate-worker/Dockerfile`
5. **Start command:** `npm run worker:translate`
6. **Redeploy** after each push to `master` — confirm latest commit message mentions `Dockerfile` or `fresh lockfile`.

If build log shows **Railpack** or **`npm run build`**, the service is still on the wrong builder — fix step 3–4 in Settings.
