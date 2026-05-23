#!/bin/sh
# ============================================================================
# PostgreSQL Backup Script — Sadoksan ERP
# Usage: ./scripts/backup-db.sh
# Cron: 0 2 * * * /app/scripts/backup-db.sh
# ============================================================================
set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_USER="${POSTGRES_USER:-sadoksan}"
DB_NAME="${POSTGRES_DB:-sadoksan}"
CONTAINER="${CONTAINER:-sadoksan-postgres-prod}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

# Dump
docker exec "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl -Fc \
  > "$BACKUP_DIR/backup_${TIMESTAMP}.dump"

# Also create a plain SQL backup for easier inspection
docker exec "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl \
  > "$BACKUP_DIR/backup_${TIMESTAMP}.sql"

# Compress SQL
gzip -f "$BACKUP_DIR/backup_${TIMESTAMP}.sql"

# Remove backups older than RETENTION_DAYS
find "$BACKUP_DIR" -name "backup_*.dump" -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime "+$RETENTION_DAYS" -delete

echo "Backup complete: backup_${TIMESTAMP}.dump + backup_${TIMESTAMP}.sql.gz"
echo "Backups in $BACKUP_DIR:"
ls -lh "$BACKUP_DIR" | tail -5
