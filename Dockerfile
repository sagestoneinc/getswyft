FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/agent/package.json apps/agent/package.json
COPY apps/widget/package.json apps/widget/package.json
COPY apps/website/package.json apps/website/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN corepack enable && pnpm install --frozen-lockfile

COPY . .

RUN pnpm -C apps/api db:generate && pnpm run build

ENV NODE_ENV=production

RUN addgroup -S appuser && adduser -S -G appuser appuser && chown -R appuser:appuser /app

USER appuser

EXPOSE 3000

CMD ["node", "apps/api/src/index.js"]
