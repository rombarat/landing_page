#!/usr/bin/env bash
# Wipes the local database and re-creates it from migrations.
set -euo pipefail
cd "$(dirname "$0")/.."
bash scripts/local-stop.sh >/dev/null 2>&1 || true
rm -rf .local/pg .local/storage .local/mail
bash scripts/local-stack.sh
