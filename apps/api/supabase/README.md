# Supabase SQL Migrations

This directory is for Supabase-specific SQL changes that should not be managed by Prisma.

Use this for resources in the Supabase database layer such as:
- `public.profiles`
- RLS policies
- auth-trigger functions

Prisma migrations in `apps/api/prisma/migrations` remain the system of record for the API Postgres schema.

## Commands

From the repository root:

```bash
pnpm -C apps/api supabase:migrate:status
pnpm -C apps/api supabase:migrate
```

## Environment

Set `SUPABASE_DB_URL` to a Postgres connection string with privileges to apply SQL migrations.

## Migration tracking

Applied files are tracked in:

```sql
public._supabase_migrations
```

Files run in lexical order and should be named with a numeric prefix, for example:

```txt
0001_public_profiles.sql
0002_another_change.sql
```
