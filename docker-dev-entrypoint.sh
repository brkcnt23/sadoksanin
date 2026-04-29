#!/bin/sh
set -eu

cd /app

if [ ! -f pnpm-lock.yaml ]; then
  echo "pnpm-lock.yaml is required for container installs. Run pnpm install on the host first." >&2
  exit 1
fi

fingerprint_file="/app/node_modules/.sadoksan-deps-fingerprint"
fingerprint_input="$(mktemp)"

for file in \
  package.json \
  pnpm-workspace.yaml \
  pnpm-lock.yaml \
  apps/api/package.json \
  apps/admin/package.json \
  apps/storefront/package.json \
  packages/shared/package.json \
  packages/ui/package.json
do
  if [ -f "$file" ]; then
    sha256sum "$file" >> "$fingerprint_input"
  fi
done

fingerprint="$(sha256sum "$fingerprint_input" | awk '{ print $1 }')"
rm -f "$fingerprint_input"

current_fingerprint=""
if [ -f "$fingerprint_file" ]; then
  current_fingerprint="$(cat "$fingerprint_file")"
fi

if [ ! -d /app/node_modules/.pnpm ] || [ "$current_fingerprint" != "$fingerprint" ]; then
  echo "Installing workspace dependencies inside the container..."
  pnpm install --frozen-lockfile
  mkdir -p /app/node_modules
  printf '%s\n' "$fingerprint" > "$fingerprint_file"
fi

exec "$@"
