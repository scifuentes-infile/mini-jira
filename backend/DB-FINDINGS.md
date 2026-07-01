# DB Findings

Date: 2026-06-24
Project: mini-jira
Supabase project ref: drkmtnvhgsytcgepjfui

## Context

The request was to read `@database-schema.yaml` and create the following tables in Supabase via MCP, in FK-safe order:

1. `users`, `tags`
2. `projects`, `tickets`
3. `project_members`, `ticket_assignees`, `ticket_tags`, `comments`
4. `audit_log`, `ticket_locks`

The file found was:

- `/home/scifuentes/Documentos/Curso de IA/backend/database-schema.yaml`

## Main Finding

There is a mismatch between the requested table list and `database-schema.yaml`.

Tables present in `database-schema.yaml` include:

- `users`
- `sessions`
- `labels`
- `tickets`
- `ticket_labels`
- `comments`
- `comment_mentions`
- `audit_logs`
- `notifications`
- `notification_attempts`
- `outbox_events`

Tables requested but not defined in `database-schema.yaml`:

- `projects`
- `project_members`
- `ticket_assignees`
- `ticket_locks`

Requested names that differ from the YAML names:

- Requested `tags`; YAML defines `labels`.
- Requested `ticket_tags`; YAML defines `ticket_labels`.
- Requested `audit_log`; YAML defines `audit_logs`.

## What Was Created

The Supabase database was initially empty in schema `public`. The following objects were created via MCP:

Tables:

- `users`
- `tags`
- `projects`
- `tickets`
- `project_members`
- `ticket_assignees`
- `ticket_tags`
- `comments`
- `audit_log`
- `ticket_locks`

Supporting objects:

- Extension `pgcrypto`
- Extension `unaccent`, moved to schema `extensions` after advisor warning
- Enums: `user_role`, `user_status`, `ticket_status`, `ticket_priority`, `label_color`, `audit_action`, `project_role`
- Trigger function `public.set_updated_at()`
- Trigger function `public.set_ticket_search_vector()`
- Indexes and foreign keys for the created tables
- RLS enabled on all created tables

## Important Schema Assumptions Made

Because `projects`, `project_members`, `ticket_assignees`, and `ticket_locks` were not in the YAML, minimal coherent definitions were inferred:

- `projects` groups tickets and has optional `owner_id -> users.id`.
- `tickets` includes `project_id -> projects.id` in addition to YAML-like ticket fields.
- `project_members` is a join table between `projects` and `users` with a `project_role` enum.
- `ticket_assignees` supports many-to-many ticket assignment while `tickets.assignee_id` still supports the YAML/API single-assignee shape.
- `ticket_locks` stores one active lock row per ticket using `ticket_id` as primary key.

These assumptions should be reviewed before relying on this schema as the canonical production schema.

## Verification Performed

Each requested table was verified immediately after creation using `to_regclass`, column checks, and RLS status checks.

Final table list in `public`:

- `audit_log`
- `comments`
- `project_members`
- `projects`
- `tags`
- `ticket_assignees`
- `ticket_locks`
- `ticket_tags`
- `tickets`
- `users`

Foreign keys were also listed and confirmed after creation.

## Supabase Advisors

Security advisor findings after corrections:

- Remaining informational findings: `RLS Enabled No Policy` for all created tables.
- This means tables are closed under RLS until explicit policies are added.
- No generic policies were created because authorization rules were not specified, and broad policies could create BOLA/IDOR risk.

Corrected advisor warnings:

- `Function Search Path Mutable` for `public.set_updated_at()` was fixed with an explicit `search_path`.
- `Function Search Path Mutable` for `public.set_ticket_search_vector()` was fixed with an explicit `search_path`.
- `Extension in Public` for `unaccent` was fixed by moving the extension to schema `extensions`.

Performance advisor findings:

- Several `unused_index` informational findings appeared.
- These are expected immediately after creating a new empty schema because no workload has used the indexes yet.
- Indexes were kept because they map to expected query patterns from the YAML/API contract.

## Recommended Next Step

Before continuing application integration, choose one canonical schema direction:

1. Rename/rebuild to match `database-schema.yaml` exactly: `labels`, `ticket_labels`, `audit_logs`, plus the additional YAML tables.
2. Update `database-schema.yaml` to include the project-based model and requested names: `tags`, `ticket_tags`, `audit_log`, `projects`, `project_members`, `ticket_assignees`, `ticket_locks`.

After that decision, add explicit RLS policies matching the actual access model.
