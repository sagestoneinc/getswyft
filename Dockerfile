# syntax=docker/dockerfile:1.7

FROM node:20-alpine

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV="production"

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json

RUN pnpm install --frozen-lockfile --prod --filter @app/api...

COPY apps/api ./apps/api

EXPOSE 8080

CMD ["pnpm", "-C", "apps/api", "start"]
