# Getswyft Phase 1 Architecture

## Overview
Phase 1 establishes production-ready foundations while preserving the existing monorepo scaffold:

- `apps/api`: Express + Socket.IO, now modularized with tenant-aware middleware and persistence.
- `apps/website`: existing UI shell, now wired to auth and tenant context providers.
- `apps/agent` and `apps/widget`: upgraded from Vite demos to runtime connectivity shells.
- `packages/shared`: contract and permission constants for API-first consistency.

## Backend boundaries
- `middleware/auth.js`: OIDC token processing and user context.
- `middleware/tenant.js`: tenant resolution + membership enforcement.
- `middleware/rbac.js`: permission gate middleware.
- `modules/*`: route modules (`auth`, `tenants`, `users`, `notifications`, `storage`, `audit`, `analytics`).
- `modules/presence/presence.socket.js`: socket auth, presence updates, compatibility messaging events.

## Data model
Prisma schema introduces tenant, identity, RBAC, presence, notifications, audit, analytics, AI config, and moderation report foundations.

## Security posture in Phase 1
- Request context and structured logging.
- Tenant-aware query requirements.
- Permission checks for privileged endpoints.
- Secrets moved toward `.env.example` + runtime env provisioning.

## Railway deployment
Single Dockerfile continues to support per-service runtime via `RAILWAY_SERVICE_NAME`.
