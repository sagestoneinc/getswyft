# syntax=docker/dockerfile:1.7

FROM node:20-alpine

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

ARG VITE_API_BASE_URL
ARG VITE_WS_BASE_URL
ARG VITE_AUTH_PROVIDER
ARG VITE_KEYCLOAK_URL
ARG VITE_KEYCLOAK_REALM
ARG VITE_KEYCLOAK_CLIENT_ID
ARG VITE_DEV_AUTH_BYPASS
ARG VITE_DEV_USER_ID
ARG VITE_DEV_USER_EMAIL
ARG VITE_DEV_TENANT_SLUG
ARG VITE_SOCKET_TOKEN

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_BASE_URL=$VITE_WS_BASE_URL
ENV VITE_AUTH_PROVIDER=$VITE_AUTH_PROVIDER
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL
ENV VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM
ENV VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID
ENV VITE_DEV_AUTH_BYPASS=$VITE_DEV_AUTH_BYPASS
ENV VITE_DEV_USER_ID=$VITE_DEV_USER_ID
ENV VITE_DEV_USER_EMAIL=$VITE_DEV_USER_EMAIL
ENV VITE_DEV_TENANT_SLUG=$VITE_DEV_TENANT_SLUG
ENV VITE_SOCKET_TOKEN=$VITE_SOCKET_TOKEN

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
