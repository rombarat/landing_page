#!/usr/bin/env bash
# Local Supabase-compatible stack without Docker:
#   Postgres 15+ (port 54322) + GoTrue/Supabase Auth (9999) + SMTP sink (2500)
#   + proxy exposing /auth/v1 on 54321 (same layout as a hosted project).
# Requirements: Postgres binaries, a GoTrue binary and its migrations directory.
#   GOTRUE_BIN   path to the auth binary        (default /opt/gotrue/bin/auth)
#   GOTRUE_SRC   path to supabase/auth checkout  (default /opt/gotrue/src)
set -euo pipefail
cd "$(dirname "$0")/.."

ROOT="$PWD"
LOCAL="$ROOT/.local"
PGDATA="$LOCAL/pg"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
GOTRUE_BIN="${GOTRUE_BIN:-/opt/gotrue/bin/auth}"
GOTRUE_SRC="${GOTRUE_SRC:-/opt/gotrue/src}"
JWT_SECRET="${JWT_SECRET:-local-dev-jwt-secret-change-me-0123456789abcdef}"
export JWT_SECRET
mkdir -p "$LOCAL/logs" "$LOCAL/mail" "$LOCAL/storage"

as_pg() { if [ "$(id -u)" = "0" ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi; }

if [ ! -f "$PGDATA/PG_VERSION" ]; then
  mkdir -p "$PGDATA"
  [ "$(id -u)" = "0" ] && chown -R postgres "$LOCAL/pg"
  as_pg "$PGBIN/initdb -D '$PGDATA' -U postgres --auth=trust -E UTF8 --locale=C.UTF-8 >/dev/null"
fi
[ "$(id -u)" = "0" ] && chown -R postgres "$LOCAL/pg"
if ! as_pg "$PGBIN/pg_ctl -D '$PGDATA' status" >/dev/null 2>&1; then
  as_pg "$PGBIN/pg_ctl -D '$PGDATA' -o '-p 54322 -k /tmp -c listen_addresses=127.0.0.1 -c timezone=UTC' -l '$PGDATA/server.log' start" >/dev/null
fi
for _ in $(seq 1 30); do pg_isready -h 127.0.0.1 -p 54322 >/dev/null 2>&1 && break; sleep 0.5; done

PSQL="psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -v ON_ERROR_STOP=1 -q"
$PSQL -c "alter user postgres password 'postgres'"
$PSQL -f scripts/local-bootstrap.sql

start_bg() { # name, command...
  local name=$1; shift
  if [ -f "$LOCAL/$name.pid" ] && kill -0 "$(cat "$LOCAL/$name.pid")" 2>/dev/null; then return; fi
  nohup "$@" >"$LOCAL/logs/$name.log" 2>&1 &
  echo $! >"$LOCAL/$name.pid"
}

start_bg smtp node scripts/local-smtp-sink.mjs

env -i PATH="$PATH" HOME="$HOME" \
  GOTRUE_API_HOST=127.0.0.1 PORT=9999 API_EXTERNAL_URL=http://127.0.0.1:54321/auth/v1 \
  GOTRUE_DB_DRIVER=postgres \
  DATABASE_URL="postgres://supabase_auth_admin:local-auth-admin@127.0.0.1:54322/postgres" \
  GOTRUE_DB_MIGRATIONS_PATH="$GOTRUE_SRC/migrations" \
  GOTRUE_SITE_URL=http://localhost:3000 GOTRUE_URI_ALLOW_LIST="http://localhost:3000/**,http://127.0.0.1:3000/**" \
  GOTRUE_JWT_SECRET="$JWT_SECRET" GOTRUE_JWT_EXP=3600 GOTRUE_JWT_AUD=authenticated \
  GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated GOTRUE_JWT_ADMIN_ROLES=service_role \
  GOTRUE_DISABLE_SIGNUP=false GOTRUE_EXTERNAL_EMAIL_ENABLED=true GOTRUE_MAILER_AUTOCONFIRM=true \
  GOTRUE_SMTP_HOST=127.0.0.1 GOTRUE_SMTP_PORT=2500 GOTRUE_SMTP_USER=local GOTRUE_SMTP_PASS=local \
  GOTRUE_SMTP_ADMIN_EMAIL=noreply@dukan.local GOTRUE_SMTP_SENDER_NAME=Dukan \
  GOTRUE_RATE_LIMIT_EMAIL_SENT=1000 GOTRUE_RATE_LIMIT_TOKEN_REFRESH=10000 GOTRUE_RATE_LIMIT_VERIFY=10000 \
  GOTRUE_LOG_LEVEL=warn \
  nohup "$GOTRUE_BIN" >"$LOCAL/logs/gotrue.log" 2>&1 &
echo $! >"$LOCAL/gotrue.pid"

for _ in $(seq 1 60); do curl -fsS http://127.0.0.1:9999/health >/dev/null 2>&1 && break; sleep 0.5; done
curl -fsS http://127.0.0.1:9999/health >/dev/null || { echo "GoTrue failed to start, see $LOCAL/logs/gotrue.log"; exit 1; }

$PSQL -f scripts/local-after-auth.sql
start_bg proxy node scripts/local-supabase-proxy.mjs

node scripts/gen-local-env.mjs .env.local
DATABASE_URL="postgres://postgres:postgres@127.0.0.1:54322/postgres" node scripts/migrate.mjs
echo "local stack ready: db 54322, auth http://127.0.0.1:54321/auth/v1"
