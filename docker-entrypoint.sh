#!/bin/bash
set -e

# Wait for postgres to be ready
echo "Waiting for postgres to be ready..."
until pg_isready -h postgres -U sadoksan; do
  echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "Postgres is up - continuing"

# Run migrations
cd /app
echo "Running Prisma migrations..."
pnpm -F @sadoksan/api run db:migrate --skip-generate || true

echo "Starting API..."
exec "$@"
