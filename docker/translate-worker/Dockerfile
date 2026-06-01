# Translate queue consumer — avoids Railpack/Next.js build on Railway.
FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
# Do not set NODE_ENV=production before install (Railpack omits dev peers and breaks npm ci).
RUN npm ci --legacy-peer-deps --ignore-scripts

COPY . .

ENV NODE_ENV=production

CMD ["npm", "run", "worker:translate"]
