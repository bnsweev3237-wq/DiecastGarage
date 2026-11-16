#!/usr/bin/env bash
# Database rule tests. Builds a throwaway database from every migration in supabase/migrations,
# then runs each tests/db/*.test.sql file. Each test file runs in a transaction that is rolled back,
# and stops at the first failed check (a check is a DO block that raises when a rule doesn't hold).
#
# Needs a Postgres 15+ server you can create databases on. Defaults to localhost:5432 as postgres;
# set PGHOST, PGPORT, PGUSER, PGPASSWORD to change. Run with: npm run test:db
set -euo pipefail
cd "$(dirname "$0")/../.."
export PGHOST="${PGHOST:-localhost}" PGPORT="${PGPORT:-5432}" PGUSER="${PGUSER:-postgres}"
DB="${TEST_DB:-chq_rules_test}"
export PGOPTIONS="${PGOPTIONS:-} -c client_min_messages=warning"
PSQL=(psql -X -q -v ON_ERROR_STOP=1 --no-psqlrc)

"${PSQL[@]}" -d postgres -c "drop database if exists $DB" -c "create database $DB" >/dev/null
# Roles are shared by the whole server, so only create them if they're missing.
"${PSQL[@]}" -d "$DB" -c "do \$\$ begin create role anon nologin; exception when duplicate_object then null; end \$\$;
  do \$\$ begin create role authenticated nologin; exception when duplicate_object then null; end \$\$;" >/dev/null
"${PSQL[@]}" -d "$DB" -f tests/db/supabase-stub.sql >/dev/null
for f in supabase/migrations/*.sql; do
  "${PSQL[@]}" -d "$DB" -f "$f" >/dev/null 2>"/tmp/chq-migration.err" || { echo "✗ migration $f failed:"; cat /tmp/chq-migration.err; exit 1; }
done
# Tables get member access by default (set in supabase-stub.sql, as on Supabase); extensions need this too.
"${PSQL[@]}" -d "$DB" -c "grant usage on schema extensions to anon, authenticated;" >/dev/null
echo "✓ $(ls supabase/migrations/*.sql | wc -l) migrations applied"

fail=0; passed=0
shopt -s nullglob
for t in tests/db/*.test.sql; do
  if out=$( { echo "begin;"; cat tests/db/helpers.sql "$t"; echo "rollback;"; } | "${PSQL[@]}" -d "$DB" 2>&1 ); then
    n=$(grep -c "^-- check:" "$t" || true); passed=$((passed + n)); echo "✓ $(basename "$t") ($n checks)"
  else
    fail=1; echo "✗ $(basename "$t")"; echo "$out" | grep -E "ERROR|CONTEXT" | head -5 | sed 's/^/    /'
  fi
done
[ -n "${KEEP_DB:-}" ] || "${PSQL[@]}" -d postgres -c "drop database if exists $DB" >/dev/null
[ $fail = 0 ] && echo "All $passed database checks passed" || { echo "Database tests failed"; exit 1; }
