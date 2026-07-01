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

run() {
  if [ "$DRY_RUN" = true ]; then
    printf '+ %q' "$@"
    printf '\n'
  else
    "$@"
  fi
}

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

package_dirs() {
  if [ -f "$ROOT_DIR/package.json" ]; then
    printf '%s\n' "$ROOT_DIR"
  fi

  if [ -d "$ROOT_DIR/apps" ]; then
    find "$ROOT_DIR/apps" -mindepth 2 -maxdepth 2 -name package.json -print | while read -r file; do
      dirname "$file"
    done
  fi

  for dir in "$ROOT_DIR/backend" "$ROOT_DIR/frontend"; do
    if [ -f "$dir/package.json" ]; then
      printf '%s\n' "$dir"
    fi
  done
}

copy_env_files() {
  local example target
  while IFS= read -r example; do
    target="${example%.example}"
    if [ ! -f "$target" ]; then
      run cp "$example" "$target"
    else
      echo "Keeping existing ${target#$ROOT_DIR/}"
    fi
  done < <(find "$ROOT_DIR" -maxdepth 3 -path '*/node_modules' -prune -o -name '.env.example' -type f -print)
}

run_drizzle_migrations() {
  local config_dir=""
  local config

  for config in "$ROOT_DIR"/drizzle.config.* "$ROOT_DIR"/backend/drizzle.config.* "$ROOT_DIR"/frontend/drizzle.config.*; do
    if [ -f "$config" ]; then
      config_dir="$(dirname "$config")"
      break
    fi
  done

  if [ -z "$config_dir" ]; then
    echo "No drizzle.config.* found; skipping drizzle-kit migrate."
    return
  fi

  if [ "$DRY_RUN" = true ]; then
    echo "+ (cd $config_dir && pnpm exec drizzle-kit migrate)"
  else
    (cd "$config_dir" && pnpm exec drizzle-kit migrate)
  fi
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

check_db() {
  if [ "$DRY_RUN" = true ]; then
    echo "+ psql -v ON_ERROR_STOP=1 -c 'select 1 as ok;'"
    return
  fi

  require_db_env

  if ! command -v psql >/dev/null 2>&1; then
    echo "psql is required to confirm database connectivity" >&2
    exit 1
  fi

  if [ -n "${DATABASE_URL:-}" ]; then
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "select 1 as ok;"
  else
    PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
      -h "$SUPABASE_DB_HOST" \
      -p "${SUPABASE_DB_PORT:-6543}" \
      -U "$SUPABASE_DB_USER" \
      -d "${SUPABASE_DB_NAME:-postgres}" \
      -v ON_ERROR_STOP=1 \
      -c "select 1 as ok;"
  fi
}

if ! command -v pnpm >/dev/null 2>&1 && [ "$DRY_RUN" = false ]; then
  echo "pnpm is required to install dependencies" >&2
  exit 1
fi

while IFS= read -r dir; do
  echo "Installing dependencies in ${dir#$ROOT_DIR/}"
  if [ "$DRY_RUN" = true ]; then
    echo "+ (cd $dir && pnpm install)"
  else
    (cd "$dir" && pnpm install)
  fi
done < <(package_dirs)

copy_env_files
load_env
run_drizzle_migrations
check_db

echo "Development setup complete."
