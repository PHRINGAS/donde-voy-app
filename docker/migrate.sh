#!/bin/sh
set -e

HOST="${PGHOST:-db}"
USER="${PGUSER:-postgres}"
DB="${PGDATABASE:-dondevoy}"

export PGPASSWORD="${PGPASSWORD:-postgres}"

echo "esperando a postgres..."
until psql -h "$HOST" -U "$USER" -d "$DB" -c 'SELECT 1' >/dev/null 2>&1; do
  sleep 2
done
echo "postgres listo"

psql -h "$HOST" -U "$USER" -d "$DB" -c \
  "CREATE TABLE IF NOT EXISTS _migrations(id text primary key, applied_at timestamptz default now())"

for f in /migrations/*.sql; do
  name=$(basename "$f")
  done_flag=$(psql -tA -h "$HOST" -U "$USER" -d "$DB" -c "SELECT 1 FROM _migrations WHERE id='$name'")

  if [ "$done_flag" = "1" ]; then
    echo "skip $name"
    continue
  fi

  echo "aplicando $name"
  psql -1 -v ON_ERROR_STOP=1 -h "$HOST" -U "$USER" -d "$DB" -f "$f"
  psql -q -h "$HOST" -U "$USER" -d "$DB" -c "INSERT INTO _migrations(id) VALUES ('$name')"
done

echo "migraciones al dia"
