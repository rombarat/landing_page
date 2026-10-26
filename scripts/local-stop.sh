#!/usr/bin/env bash
cd "$(dirname "$0")/.."
for p in gotrue proxy smtp; do [ -f .local/$p.pid ] && kill "$(cat .local/$p.pid)" 2>/dev/null; rm -f .local/$p.pid; done
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
if [ "$(id -u)" = "0" ]; then su postgres -s /bin/bash -c "$PGBIN/pg_ctl -D $PWD/.local/pg stop" ; else "$PGBIN/pg_ctl" -D .local/pg stop; fi
