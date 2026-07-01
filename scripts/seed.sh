#!/bin/bash
set -e

DRY_RUN=false
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    *) echo "Unknown argument: $arg" >&2; exit 1 ;;
  esac
done

load_env() {
  local file
  for file in "$ROOT_DIR/.env" "$ROOT_DIR/backend/.env"; do
    if [ -f "$file" ]; then
      set -a
      # shellcheck disable=SC1090
      . "$file"
      set +a
    fi
  done
}

require_db_env() {
  if [ -n "${DATABASE_URL:-}" ]; then
    return
  fi

  : "${SUPABASE_DB_HOST:?Set DATABASE_URL or SUPABASE_DB_HOST in .env}"
  : "${SUPABASE_DB_PORT:=6543}"
  : "${SUPABASE_DB_NAME:=postgres}"
  : "${SUPABASE_DB_USER:?Set DATABASE_URL or SUPABASE_DB_USER in .env}"
  : "${SUPABASE_DB_PASSWORD:?Set DATABASE_URL or SUPABASE_DB_PASSWORD in .env}"
}

psql_exec() {
  if [ "$DRY_RUN" = true ]; then
    cat
    return
  fi

  if [ -n "${DATABASE_URL:-}" ]; then
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1
  else
    PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
      -h "$SUPABASE_DB_HOST" \
      -p "${SUPABASE_DB_PORT:-6543}" \
      -U "$SUPABASE_DB_USER" \
      -d "${SUPABASE_DB_NAME:-postgres}" \
      -v ON_ERROR_STOP=1
  fi
}

load_env
if [ "$DRY_RUN" = false ]; then
  require_db_env
fi

if [ "$DRY_RUN" = false ] && ! command -v psql >/dev/null 2>&1; then
  echo "psql is required to run seed.sh" >&2
  exit 1
fi

psql_exec <<'SQL'
begin;

do $$
declare
  tables text[];
begin
  select array_agg(format('public.%I', table_name) order by ord)
  into tables
  from (
    values
      (1, 'ticket_locks'),
      (2, 'ticket_assignees'),
      (3, 'ticket_tags'),
      (4, 'ticket_labels'),
      (5, 'comments'),
      (6, 'audit_log'),
      (7, 'audit_logs'),
      (8, 'project_members'),
      (9, 'tickets'),
      (10, 'projects'),
      (11, 'sessions'),
      (12, 'users')
  ) as ordered(ord, table_name)
  where to_regclass('public.' || table_name) is not null;

  if tables is not null then
    execute 'truncate table ' || array_to_string(tables, ', ') || ' restart identity cascade';
  end if;
end $$;

insert into public.users (
  id, username, name, email, password_hash, role, status, avatar_url
) values
  ('00000000-0000-0000-0000-000000000101', 'ana.admin', 'Ana Admin', 'ana.admin@example.com', 'password123', 'admin', 'active', null),
  ('00000000-0000-0000-0000-000000000102', 'bruno.user', 'Bruno User', 'bruno.user@example.com', 'password123', 'user', 'active', null),
  ('00000000-0000-0000-0000-000000000103', 'carla.user', 'Carla User', 'carla.user@example.com', 'password123', 'user', 'active', null);

insert into public.projects (
  id, key, name, description, owner_id
) values
  ('00000000-0000-0000-0000-000000000201', 'MJ', 'Mini Jira', 'Proyecto principal de desarrollo', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000202', 'OPS', 'Operaciones', 'Proyecto de soporte operativo', '00000000-0000-0000-0000-000000000102');

insert into public.project_members (
  project_id, user_id, role
) values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 'owner'),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000102', 'member'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000102', 'owner'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000103', 'member');

insert into public.tickets (
  id, project_id, key, title, description, status, priority, creator_id, assignee_id, position, version, closed_at, archived_at
) values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000201', 'MJ-001', 'Configurar entorno local', 'Preparar variables, dependencias y conexión de base de datos.', 'todo', 'medium', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000102', 0, 1, null, null),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000201', 'MJ-002', 'Implementar listado de tickets', 'Conectar el tablero con datos reales y filtros básicos.', 'in_progress', 'high', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000103', 0, 1, null, null),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000201', 'MJ-003', 'Revisar permisos de edición', 'Validar reglas de admin, creador y responsable.', 'review', 'medium', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000101', 0, 1, null, null),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000202', 'OPS-001', 'Resolver bloqueo de login', 'Investigar fallo intermitente de sesiones.', 'blocked', 'high', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000102', 0, 1, null, null),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000202', 'OPS-002', 'Documentar proceso de despliegue', 'Cerrar checklist operativo para despliegues internos.', 'done', 'low', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000103', 0, 1, now(), null);

insert into public.ticket_assignees (
  ticket_id, user_id
) values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000102'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000103'),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000102'),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000103')
on conflict do nothing;

commit;
SQL

echo "Seed complete: 2 projects, 3 users, 5 tickets."
