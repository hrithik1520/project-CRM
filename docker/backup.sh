#!/bin/bash
# CRM Backup Script
# Run daily via cron: 0 2 * * * /path/to/crm/docker/backup.sh

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS="${RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR/sessions"

echo "[backup] Starting backup at $DATE"

# ── Backup WhatsApp session auth files ─────────────────────────────
echo "[backup] Backing up WhatsApp sessions..."
docker run --rm \
    -v crm_whatsapp-sessions:/source:ro \
    -v "$(pwd)/$BACKUP_DIR/sessions":/backup \
    alpine \
    tar czf "/backup/sessions_$DATE.tar.gz" -C /source .

echo "[backup] Sessions backed up: $BACKUP_DIR/sessions/sessions_$DATE.tar.gz"

# ── Remove old backups ──────────────────────────────────────────────
echo "[backup] Removing backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -name "*.sql.gz" -mtime "+$RETENTION_DAYS" -delete

echo "[backup] Backup complete."
