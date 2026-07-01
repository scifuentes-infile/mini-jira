# Phase 01 - Backend Foundation

Date: 2026-06-24
Project: Mini Jira backend
Location: `/home/scifuentes/Documentos/Curso de IA/backend`

## Objective

Build the initial backend for Mini Jira using Next.js App Router, Supabase, Supavisor/Postgres pooling, strict TypeScript, Zod validation, OpenAPI generation, Swagger UI, and the P0 ticket/auth API surface from `api-contract.md`.

## Inputs Read

- `api-contract.md`
- `database-schema.yaml`
- `openapi.yaml`
- Frontend `docs/CODEX.md` as project context
- Supabase skill guidance for security, RLS, schema and MCP work

## User Decisions

- Supabase client: `@supabase/supabase-js`
- Connection pooling: yes, via Supavisor on port `6543`
- TypeScript strict: yes
- API envelope: yes, all JSON responses use `{ data, error }` except `204 No Content`

## Project Setup

Created a Next.js backend project directly in `backend`.

Main package choices:

- `next@15.5.19`
- `react@19`
- `@supabase/supabase-js@2.49.8`
- `pg`
- `zod`
- `@asteasolutions/zod-to-openapi`
- `yaml`
- `swagger-ui-dist`
- `typescript`
- `eslint`

Next 15.5.19 was selected because the newest Next 16 required Node 20+, while the local environment is Node 18.20.8. Next 15.5.19 remains compatible with Node 18 and avoids the security warning seen on older Next 15.5.6.

## Environment Contract

Created `.env.example` with the backend variables needed to run against Supabase and Supavisor:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_DB_HOST`
- `SUPABASE_DB_PORT=6543`
- `SUPABASE_DB_NAME`
- `SUPABASE_DB_USER`
- `SESSION_SECRET`

`src/lib/env.ts` provides build-time placeholders so `next build` can complete without real secrets. Runtime still requires real values for database/API calls.

## Architecture Created

Shared backend utilities:

- `src/lib/supabase.ts`
  - Exports a singleton Supabase client.
  - Exports a singleton `pg.Pool` for Supavisor/Postgres access.
  - Avoids creating clients inside route handlers.

- `src/lib/http.ts`
  - Centralizes `{ data, error }` success/error envelopes.
  - Defines `HttpError` and route error handling.

- `src/lib/auth.ts`
  - Implements HTTP-only session cookie handling.
  - Uses `public.sessions` when present.
  - Falls back to a signed cookie if the `sessions` table does not exist.
  - Provides `getCurrentUser()` and `requireUser()`.

- `src/lib/schema-compat.ts`
  - Handles the mismatch between the YAML schema and earlier Supabase table names.
  - Supports both `labels`/`ticket_labels`/`audit_logs` and `tags`/`ticket_tags`/`audit_log`.

- `src/lib/tickets.ts`
  - Implements P0 ticket business logic.
  - Uses Postgres transactions via `pg.Pool`.
  - Handles optimistic concurrency with `version`.
  - Writes audit rows in the same transaction as ticket mutations.

- `src/lib/locks.ts`
  - Implements ticket lock acquisition, renewal, conflict, timeout cleanup, and unlock.

- `src/lib/audit.ts`
  - Implements read-only audit log listing.

- `src/lib/schemas.ts`
  - Defines Zod schemas with `.openapi()` metadata.
  - Central source for request/response schemas.

- `src/openapi/document.ts`
  - Registers OpenAPI paths and schemas.

## API Endpoints Implemented

Auth:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

Tickets P0:

- `GET /api/v1/tickets`
- `POST /api/v1/tickets`
- `GET /api/v1/tickets/[ticketId]`
- `PUT /api/v1/tickets/[ticketId]`
- `PATCH /api/v1/tickets/[ticketId]`
- `PATCH /api/v1/tickets/[ticketId]/status`
- `PATCH /api/v1/tickets/[ticketId]/position`
- `POST /api/v1/tickets/[ticketId]/archive`
- `POST /api/v1/tickets/[ticketId]/restore`

Locks:

- `POST /api/v1/tickets/[ticketId]/lock`
- `DELETE /api/v1/tickets/[ticketId]/lock`

Audit:

- `GET /api/v1/audit/[ticketId]`

Docs:

- `GET /api/docs`
- `GET /openapi.yaml`

## Ticket Lock Behavior

Implemented in `src/lib/locks.ts`.

Rules:

- Deletes expired locks before evaluating current lock state: `expires_at < now()`.
- If no active lock exists, creates one.
- If the same user already holds the lock, renews it.
- If another user holds the lock, returns `409` with blocker data in `error.details.lock`.
- `DELETE` releases the lock for the owner; admin can also release.

## Audit Behavior

Implemented audit write behavior in ticket mutations.

Important transaction rule:

- In `PATCH /api/v1/tickets/[ticketId]`, if `status` changes, `updateTicket()` inserts `status_changed` in the audit table inside the same database transaction.
- If the audit insert fails, the whole PATCH transaction rolls back.

Read-only audit endpoint:

- `GET /api/v1/audit/[ticketId]`
- Validates that the ticket is visible to the current user.
- Returns paginated audit rows ordered by `created_at desc`.

## OpenAPI and Swagger

Generated `openapi.yaml` from Zod/OpenAPI metadata using:

```bash
npm run openapi
```

Swagger UI is served at:

```text
http://localhost:3000/api/docs
```

Runtime OpenAPI YAML is served at:

```text
http://localhost:3000/openapi.yaml
```

Added OpenAPI entries for:

- `PATCH /api/v1/tickets/{ticketId}`
- `POST /api/v1/tickets/{ticketId}/lock`
- `DELETE /api/v1/tickets/{ticketId}/lock`
- `GET /api/v1/audit/{ticketId}`

Added OpenAPI schemas:

- `LockTicketPayload`
- `TicketLock`
- `TicketLockEnvelope`
- `AuditLog`
- `AuditLogListEnvelope`

## Verification Performed

Commands run successfully:

```bash
npm run openapi
npm run typecheck
npm run lint
npm run build
```

Local HTTP checks:

```bash
curl -I http://localhost:3000/api/docs
curl -s http://localhost:3000/openapi.yaml | rg "/api/v1/tickets/\{ticketId\}/lock|/api/v1/audit/\{ticketId\}"
```

Results:

- `/api/docs` responds `200 OK` after restarting the dev server.
- `/openapi.yaml` includes the new lock and audit routes.
- Next build lists the new API routes.

## Operational Notes

The dev server was restarted after `.next` was cleaned. Cleaning `.next` while `next dev` is running can leave the dev process with stale webpack cache and cause transient `MODULE_NOT_FOUND` errors. Restarting the dev server fixed it.

Current dev URL:

```text
http://localhost:3000
```

## Known Risks and Pending Work

- Real `.env` values are still required for runtime database calls.
- `npm audit` reports low/moderate dependency issues. They did not block build or typecheck.
- The database schema currently has a naming mismatch:
  - YAML expects `labels`, `ticket_labels`, `audit_logs`.
  - Earlier Supabase work created/requested `tags`, `ticket_tags`, `audit_log`.
  - Backend compatibility logic supports both, but the canonical schema should be decided and normalized.
- RLS policies are not defined yet. Tables with RLS enabled but no policies are closed to normal client roles. The backend currently uses server-side DB access.
- Auth is implemented against the app `users` table and optional `sessions` table, not Supabase Auth user sessions.
- Tests were not added yet; verification was typecheck/lint/build plus route availability checks.

## Files Created or Changed

Core config:

- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `next.config.ts`
- `eslint.config.mjs`
- `.env.example`
- `next-env.d.ts`

App shell/docs:

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/api/docs/route.ts`
- `src/app/openapi.yaml/route.ts`
- `openapi.yaml`
- `scripts/generate-openapi.ts`

Libraries:

- `src/lib/env.ts`
- `src/lib/supabase.ts`
- `src/lib/http.ts`
- `src/lib/auth.ts`
- `src/lib/schema-compat.ts`
- `src/lib/schemas.ts`
- `src/lib/tickets.ts`
- `src/lib/locks.ts`
- `src/lib/audit.ts`
- `src/openapi/document.ts`

Routes:

- `src/app/api/v1/auth/login/route.ts`
- `src/app/api/v1/auth/logout/route.ts`
- `src/app/api/v1/auth/me/route.ts`
- `src/app/api/v1/tickets/route.ts`
- `src/app/api/v1/tickets/[ticketId]/route.ts`
- `src/app/api/v1/tickets/[ticketId]/status/route.ts`
- `src/app/api/v1/tickets/[ticketId]/position/route.ts`
- `src/app/api/v1/tickets/[ticketId]/archive/route.ts`
- `src/app/api/v1/tickets/[ticketId]/restore/route.ts`
- `src/app/api/v1/tickets/[ticketId]/lock/route.ts`
- `src/app/api/v1/audit/[ticketId]/route.ts`
