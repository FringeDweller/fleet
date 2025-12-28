#!/bin/bash
set -e

# Load environment variables if .env exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=${BACKUP_DIR:-./backups}
mkdir -p "$BACKUP_DIR"

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set."
  exit 1
fi

FILENAME="$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

echo "Starting backup to $FILENAME..."
pg_dump "$DATABASE_URL" | gzip > "$FILENAME"

echo "Backup completed successfully: $FILENAME"

# Optional: Upload to S3 (example)
# aws s3 cp "$FILENAME" s3://my-backup-bucket/
