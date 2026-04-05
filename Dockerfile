# syntax=docker/dockerfile:1.7

FROM node:20-alpine

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV="production"

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json

RUN CI=true pnpm install --frozen-lockfile --prod=false --filter @app/api...

COPY apps/api ./apps/api

RUN pnpm -C apps/api prisma:generate

EXPOSE 8080

CMD ["sh", "-c", "pnpm -C apps/api prisma:migrate:deploy && pnpm -C apps/api start"]
