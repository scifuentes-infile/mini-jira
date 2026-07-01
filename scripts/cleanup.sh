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

clean_tmp() {
  if [ "$DRY_RUN" = true ]; then
    echo "+ find $ROOT_DIR/tmp -mindepth 1 -delete"
    return
  fi

  mkdir -p "$ROOT_DIR/tmp"
  find "$ROOT_DIR/tmp" -mindepth 1 -delete
}

load_env
if [ "$DRY_RUN" = false ]; then
  require_db_env
fi

if [ "$DRY_RUN" = false ] && ! command -v psql >/dev/null 2>&1; then
  echo "psql is required to run cleanup.sh" >&2
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

commit;
SQL

clean_tmp

echo "Cleanup complete."
