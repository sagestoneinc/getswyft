FROM node:20-alpine

WORKDIR /app

COPY . .

RUN corepack enable && pnpm install && pnpm -C apps/api db:generate

EXPOSE 3000

CMD ["node", "apps/api/src/index.js"]
