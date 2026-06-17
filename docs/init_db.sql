-- ============================================================
-- Mini Jira - Supabase PostgreSQL Schema
-- ============================================================

-- Recomendado para UUIDs
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type public.user_role as enum (
  'admin',
  'user'
);

create type public.ticket_status as enum (
  'todo',
  'in_progress',
  'review',
  'blocked',
  'done',
  'archived'
);

create type public.ticket_priority as enum (
  'low',
  'medium',
  'high',
  'critical'
);

create type public.notification_event_type as enum (
  'ticket_assigned',
  'user_mentioned',
  'ticket_blocked'
);

create type public.notification_status as enum (
  'pending',
  'sent',
  'failed'
);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- USERS
-- ============================================================
-- En Supabase, auth.users es la tabla gestionada por Supabase Auth.
-- Esta tabla public.usuarios guarda el perfil funcional del sistema.

create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_usuarios_updated_at
before update on public.usuarios
for each row
execute function public.set_updated_at();

-- ============================================================
-- TICKETS
-- ============================================================

create table public.tickets (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  description text,

  status public.ticket_status not null default 'todo',
  priority public.ticket_priority not null default 'medium',

  labels text[] not null default '{}',

  creator_id uuid not null references public.usuarios(id) on delete restrict,
  assignee_id uuid references public.usuarios(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  archived_at timestamptz,

  version integer not null default 1,

  constraint tickets_title_not_empty check (length(trim(title)) > 0),

  constraint tickets_archived_consistency check (
    (status = 'archived' and archived_at is not null)
    or
    (status <> 'archived')
  ),

  constraint tickets_closed_consistency check (
    (status = 'done' and closed_at is not null)
    or
    (status <> 'done')
  )
);

create trigger trg_tickets_updated_at
before update on public.tickets
for each row
execute function public.set_updated_at();

-- ============================================================
-- COMMENTS
-- ============================================================

create table public.comentarios (
  id uuid primary key default gen_random_uuid(),

  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_id uuid not null references public.usuarios(id) on delete restrict,

  body text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint comentarios_body_not_empty check (length(trim(body)) > 0)
);

create trigger trg_comentarios_updated_at
before update on public.comentarios
for each row
execute function public.set_updated_at();

-- ============================================================
-- TICKET AUDIT LOGS
-- ============================================================

create table public.ticket_audit_logs (
  id uuid primary key default gen_random_uuid(),

  ticket_id uuid not null references public.tickets(id) on delete cascade,
  user_id uuid references public.usuarios(id) on delete set null,

  field text not null,
  old_value text,
  new_value text,

  created_at timestamptz not null default now()
);

-- ============================================================
-- NOTIFICATION EVENTS
-- ============================================================

create table public.notification_events (
  id uuid primary key default gen_random_uuid(),

  ticket_id uuid references public.tickets(id) on delete cascade,
  recipient_id uuid not null references public.usuarios(id) on delete cascade,

  event_type public.notification_event_type not null,
  status public.notification_status not null default 'pending',

  sent_at timestamptz,
  created_at timestamptz not null default now(),

  -- Evita duplicados básicos por reintentos para el mismo ticket,
  -- usuario y tipo de evento.
  constraint notification_events_unique_event unique (
    ticket_id,
    recipient_id,
    event_type
  )
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_tickets_status on public.tickets(status);
create index idx_tickets_priority on public.tickets(priority);
create index idx_tickets_creator_id on public.tickets(creator_id);
create index idx_tickets_assignee_id on public.tickets(assignee_id);
create index idx_tickets_created_at on public.tickets(created_at);
create index idx_tickets_closed_at on public.tickets(closed_at);
create index idx_tickets_archived_at on public.tickets(archived_at);
create index idx_tickets_labels on public.tickets using gin(labels);

create index idx_comentarios_ticket_id on public.comentarios(ticket_id);
create index idx_comentarios_author_id on public.comentarios(author_id);
create index idx_comentarios_created_at on public.comentarios(created_at);

create index idx_ticket_audit_logs_ticket_id on public.ticket_audit_logs(ticket_id);
create index idx_ticket_audit_logs_user_id on public.ticket_audit_logs(user_id);
create index idx_ticket_audit_logs_created_at on public.ticket_audit_logs(created_at);

create index idx_notification_events_ticket_id on public.notification_events(ticket_id);
create index idx_notification_events_recipient_id on public.notification_events(recipient_id);
create index idx_notification_events_status on public.notification_events(status);
create index idx_notification_events_event_type on public.notification_events(event_type);

-- ============================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================

create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role
  from public.usuarios
  where id = auth.uid()
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.can_view_ticket(ticket_row public.tickets)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    public.is_admin()
    or ticket_row.creator_id = auth.uid()
    or ticket_row.assignee_id = auth.uid();
$$;

-- ============================================================
-- ENABLE RLS
-- ============================================================

alter table public.usuarios enable row level security;
alter table public.tickets enable row level security;
alter table public.comentarios enable row level security;
alter table public.ticket_audit_logs enable row level security;
alter table public.notification_events enable row level security;

-- ============================================================
-- RLS POLICIES: USUARIOS
-- ============================================================

create policy "usuarios_select_self_or_admin"
on public.usuarios
for select
to authenticated
using (
  id = auth.uid()
  or public.is_admin()
);

create policy "usuarios_insert_self"
on public.usuarios
for insert
to authenticated
with check (
  id = auth.uid()
);

create policy "usuarios_update_self_or_admin"
on public.usuarios
for update
to authenticated
using (
  id = auth.uid()
  or public.is_admin()
)
with check (
  id = auth.uid()
  or public.is_admin()
);

-- No se define DELETE.
-- En el MVP no se elimina físicamente información crítica.

-- ============================================================
-- RLS POLICIES: TICKETS
-- ============================================================

create policy "tickets_select_visible"
on public.tickets
for select
to authenticated
using (
  public.is_admin()
  or creator_id = auth.uid()
  or assignee_id = auth.uid()
);

create policy "tickets_insert_authenticated"
on public.tickets
for insert
to authenticated
with check (
  creator_id = auth.uid()
);

create policy "tickets_update_creator_assignee_or_admin"
on public.tickets
for update
to authenticated
using (
  archived_at is null
  and (
    public.is_admin()
    or creator_id = auth.uid()
    or assignee_id = auth.uid()
  )
)
with check (
  (
    public.is_admin()
    or creator_id = auth.uid()
    or assignee_id = auth.uid()
  )
);

-- No se define DELETE.
-- La acción "Eliminar" debe actualizar status = 'archived' y archived_at = now().

-- ============================================================
-- RLS POLICIES: COMENTARIOS
-- ============================================================

create policy "comentarios_select_for_visible_tickets"
on public.comentarios
for select
to authenticated
using (
  exists (
    select 1
    from public.tickets t
    where t.id = comentarios.ticket_id
      and (
        public.is_admin()
        or t.creator_id = auth.uid()
        or t.assignee_id = auth.uid()
      )
  )
);

create policy "comentarios_insert_for_visible_active_tickets"
on public.comentarios
for insert
to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1
    from public.tickets t
    where t.id = comentarios.ticket_id
      and t.archived_at is null
      and (
        public.is_admin()
        or t.creator_id = auth.uid()
        or t.assignee_id = auth.uid()
      )
  )
);

create policy "comentarios_update_author_or_admin"
on public.comentarios
for update
to authenticated
using (
  author_id = auth.uid()
  or public.is_admin()
)
with check (
  author_id = auth.uid()
  or public.is_admin()
);

-- No se define DELETE para comentarios en MVP.

-- ============================================================
-- RLS POLICIES: TICKET AUDIT LOGS
-- ============================================================

create policy "audit_logs_select_for_visible_tickets"
on public.ticket_audit_logs
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.tickets t
    where t.id = ticket_audit_logs.ticket_id
      and (
        t.creator_id = auth.uid()
        or t.assignee_id = auth.uid()
      )
  )
);

create policy "audit_logs_insert_admin_or_system"
on public.ticket_audit_logs
for insert
to authenticated
with check (
  public.is_admin()
  or user_id = auth.uid()
);

-- No update/delete para auditoría.
-- Los logs deben ser inmutables desde la aplicación.

-- ============================================================
-- RLS POLICIES: NOTIFICATION EVENTS
-- ============================================================

create policy "notification_events_select_recipient_or_admin"
on public.notification_events
for select
to authenticated
using (
  recipient_id = auth.uid()
  or public.is_admin()
);

create policy "notification_events_insert_admin_or_visible_ticket"
on public.notification_events
for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1
    from public.tickets t
    where t.id = notification_events.ticket_id
      and (
        t.creator_id = auth.uid()
        or t.assignee_id = auth.uid()
      )
  )
);

create policy "notification_events_update_admin"
on public.notification_events
for update
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

-- No DELETE para eventos de notificación.

-- ============================================================
-- OPTIONAL: UPDATED_AT + VERSION TRIGGER FOR TICKETS
-- ============================================================
-- Este trigger incrementa version automáticamente en cada UPDATE.
-- Si prefieres controlarlo desde la API con UPDATE ... WHERE version = x,
-- puedes omitir este trigger y manejar version manualmente.

create or replace function public.increment_ticket_version()
returns trigger
language plpgsql
as $$
begin
  new.version = old.version + 1;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tickets_increment_version on public.tickets;

create trigger trg_tickets_increment_version
before update on public.tickets
for each row
execute function public.increment_ticket_version();
