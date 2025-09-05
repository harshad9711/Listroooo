#!/usr/bin/env bash
set -euo pipefail

# Usage: ./run_all_migrations.sh
# This script runs all SQL migrations in this directory in order using psql.
# You can set PGHOST, PGUSER, PGPASSWORD, PGDATABASE as env vars, or the script will prompt for them.

MIGRATION_DIR="$(dirname "$0")"

# Prompt for connection details if not set
: "${PGHOST:=$(read -p 'Postgres host: ' h && echo $h)}"
: "${PGUSER:=$(read -p 'Postgres user: ' u && echo $u)}"
: "${PGPASSWORD:=$(read -s -p 'Postgres password: ' p && echo $p; echo)}"
: "${PGDATABASE:=$(read -p 'Postgres database: ' d && echo $d)}"

export PGPASSWORD

cd "$MIGRATION_DIR"
echo "Running migrations in $PWD..."

for sql in $(ls *.sql | sort); do
  echo "Applying $sql..."
  psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -f "$sql"
  echo "✅ $sql applied"
done

echo "🎉 All migrations applied successfully!" 