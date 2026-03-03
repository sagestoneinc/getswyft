# syntax=docker/dockerfile:1.7

FROM node:20-alpine

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV="production"

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/website/package.json apps/website/package.json

RUN pnpm install --frozen-lockfile --filter website...

COPY apps/website ./apps/website

RUN pnpm -C apps/website build

EXPOSE 8080

CMD ["pnpm", "-C", "apps/website", "start"]
