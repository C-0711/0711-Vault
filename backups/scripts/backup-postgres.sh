#!/bin/bash
# 0711 Vault - PostgreSQL Backup Script
# Runs daily via cron

BACKUP_DIR="/home/christoph.bertsch/0711-Vault/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/vault_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

echo "[$(date -Iseconds)] Starting PostgreSQL backup..."

# Create backup using docker exec
docker exec vault-postgres pg_dump -U vault vault | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[$(date -Iseconds)] ✅ Backup created: $BACKUP_FILE ($SIZE)"
    
    # Delete old backups
    find "$BACKUP_DIR" -name "vault_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    echo "[$(date -Iseconds)] Old backups cleaned (>$RETENTION_DAYS days)"
else
    echo "[$(date -Iseconds)] ❌ Backup failed!"
    exit 1
fi
