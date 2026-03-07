# syntax=docker/dockerfile:1.7

FROM node:20-alpine

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/agent/package.json apps/agent/package.json
COPY apps/widget/package.json apps/widget/package.json
COPY apps/website/package.json apps/website/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm -C apps/agent build \
  && pnpm -C apps/widget build \
  && pnpm -C apps/website build \
  && pnpm -C apps/api prisma:generate

EXPOSE 8080

CMD ["sh", "-c", "\
  case \"${RAILWAY_SERVICE_NAME:-getswyft}\" in \
    website) pnpm -C apps/website start ;; \
    widget) pnpm -C apps/widget start ;; \
    agent) pnpm -C apps/agent start ;; \
    getswyft|api) pnpm -C apps/api start ;; \
    *) echo \"Unsupported RAILWAY_SERVICE_NAME=${RAILWAY_SERVICE_NAME}\" && exit 1 ;; \
  esac \
"]
