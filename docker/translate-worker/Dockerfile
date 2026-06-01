# Translate queue consumer — avoids Railpack/Next.js build on Railway.
FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
# npm install (not ci) — lockfile optional peer deps differ on Linux builders.
RUN npm install --legacy-peer-deps --ignore-scripts

COPY . .

ENV NODE_ENV=production

CMD ["npm", "run", "worker:translate"]
