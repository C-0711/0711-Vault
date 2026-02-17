#!/bin/bash
# 0711 Vault - PostgreSQL Restore Script
# Usage: ./restore-postgres.sh <backup_file.sql.gz>

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo "Available backups:"
    ls -lh /home/christoph.bertsch/0711-Vault/backups/postgres/
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will REPLACE all data in the vault database!"
echo "Backup file: $BACKUP_FILE"
read -p "Are you sure? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo "[$(date -Iseconds)] Starting restore..."

# Drop and recreate database
docker exec vault-postgres psql -U vault -c "DROP DATABASE IF EXISTS vault_restore;" 2>/dev/null
docker exec vault-postgres psql -U vault -c "CREATE DATABASE vault_restore;"

# Restore to temporary database first
gunzip -c "$BACKUP_FILE" | docker exec -i vault-postgres psql -U vault vault_restore

if [ $? -eq 0 ]; then
    echo "[$(date -Iseconds)] ✅ Restore to vault_restore completed"
    echo "[$(date -Iseconds)] To swap databases, run:"
    echo "  docker exec vault-postgres psql -U vault -c 'ALTER DATABASE vault RENAME TO vault_old;'"
    echo "  docker exec vault-postgres psql -U vault -c 'ALTER DATABASE vault_restore RENAME TO vault;'"
else
    echo "[$(date -Iseconds)] ❌ Restore failed!"
    exit 1
fi
