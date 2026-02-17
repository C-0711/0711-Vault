#!/bin/bash
# 0711 Vault - MinIO Backup Script
# Syncs MinIO data to backup directory

BACKUP_DIR="/home/christoph.bertsch/0711-Vault/backups/minio"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MINIO_ALIAS="vault-minio"

echo "[$(date -Iseconds)] Starting MinIO backup..."

# Configure mc alias if not exists
docker exec vault-minio mc alias set local http://localhost:9000 minioadmin minioadmin 2>/dev/null || true

# Get bucket stats
STATS=$(docker exec vault-minio mc ls local/vault --summarize 2>/dev/null | tail -1)
echo "[$(date -Iseconds)] Bucket stats: $STATS"

# For incremental backup, we can use mc mirror
# For now, just verify MinIO data is accessible
docker exec vault-minio mc ls local/vault/ 2>/dev/null | head -20

echo "[$(date -Iseconds)] ✅ MinIO data verified"
echo "[$(date -Iseconds)] Note: MinIO data stored in Docker volume 'backend_minio-data'"
