#!/bin/bash
# 0711 Vault Backup Script
# Run daily via cron or Kubernetes CronJob

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
S3_BUCKET="${S3_BUCKET:-0711-vault-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
NAMESPACE="${NAMESPACE:-vault-0711}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"; exit 1; }

# Create backup directory
mkdir -p "${BACKUP_DIR}/${TIMESTAMP}"
cd "${BACKUP_DIR}/${TIMESTAMP}"

log "Starting backup ${TIMESTAMP}"

# ===========================================
# POSTGRESQL BACKUP
# ===========================================
log "Backing up PostgreSQL..."

if kubectl get pod -n ${NAMESPACE} -l app=postgres &>/dev/null; then
    # Kubernetes deployment
    kubectl exec -n ${NAMESPACE} postgres-0 -- \
        pg_dump -U vault -Fc vault > postgres-${TIMESTAMP}.dump
elif [ -n "${DATABASE_URL:-}" ]; then
    # Direct connection
    pg_dump "${DATABASE_URL}" -Fc > postgres-${TIMESTAMP}.dump
else
    warn "PostgreSQL backup skipped - no connection available"
fi

if [ -f "postgres-${TIMESTAMP}.dump" ]; then
    gzip postgres-${TIMESTAMP}.dump
    log "PostgreSQL backup complete: $(du -h postgres-${TIMESTAMP}.dump.gz | cut -f1)"
fi

# ===========================================
# NEO4J BACKUP
# ===========================================
log "Backing up Neo4j..."

if kubectl get pod -n ${NAMESPACE} -l app=neo4j &>/dev/null; then
    kubectl exec -n ${NAMESPACE} neo4j-0 -- \
        neo4j-admin database dump neo4j --to-path=/tmp/
    kubectl cp ${NAMESPACE}/neo4j-0:/tmp/neo4j.dump neo4j-${TIMESTAMP}.dump
    gzip neo4j-${TIMESTAMP}.dump
    log "Neo4j backup complete: $(du -h neo4j-${TIMESTAMP}.dump.gz | cut -f1)"
else
    warn "Neo4j backup skipped - pod not found"
fi

# ===========================================
# REDIS BACKUP
# ===========================================
log "Backing up Redis..."

if kubectl get pod -n ${NAMESPACE} -l app=redis &>/dev/null; then
    kubectl exec -n ${NAMESPACE} -l app=redis -- redis-cli BGSAVE
    sleep 5
    kubectl cp ${NAMESPACE}/$(kubectl get pod -n ${NAMESPACE} -l app=redis -o jsonpath='{.items[0].metadata.name}'):/data/dump.rdb redis-${TIMESTAMP}.rdb
    gzip redis-${TIMESTAMP}.rdb
    log "Redis backup complete: $(du -h redis-${TIMESTAMP}.rdb.gz | cut -f1)"
else
    warn "Redis backup skipped - pod not found"
fi

# ===========================================
# MINIO/S3 SYNC
# ===========================================
log "Syncing MinIO data..."

if command -v mc &>/dev/null; then
    # Using MinIO Client
    mc mirror --overwrite minio/vault s3/${S3_BUCKET}/vault-data/${TIMESTAMP}/
    log "MinIO sync complete"
elif command -v aws &>/dev/null; then
    # Using AWS CLI for S3-to-S3 copy
    aws s3 sync s3://0711-vault-production s3://${S3_BUCKET}/vault-data/${TIMESTAMP}/
    log "S3 sync complete"
else
    warn "MinIO/S3 sync skipped - no client available"
fi

# ===========================================
# KUBERNETES CONFIG BACKUP
# ===========================================
log "Backing up Kubernetes configs..."

kubectl get all,secrets,configmaps,pvc -n ${NAMESPACE} -o yaml > k8s-${TIMESTAMP}.yaml
gzip k8s-${TIMESTAMP}.yaml

# ===========================================
# UPLOAD TO S3
# ===========================================
log "Uploading backups to S3..."

if command -v aws &>/dev/null; then
    aws s3 cp . s3://${S3_BUCKET}/backups/${TIMESTAMP}/ --recursive --exclude "*" --include "*.gz" --include "*.dump"
    log "Upload complete"
else
    warn "S3 upload skipped - AWS CLI not available"
fi

# ===========================================
# CLEANUP OLD BACKUPS
# ===========================================
log "Cleaning up old backups..."

# Local cleanup
find "${BACKUP_DIR}" -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} \; 2>/dev/null || true

# S3 cleanup (using lifecycle policy is preferred)
if command -v aws &>/dev/null; then
    aws s3 ls s3://${S3_BUCKET}/backups/ | while read -r line; do
        DIR=$(echo $line | awk '{print $2}' | tr -d '/')
        if [ -n "$DIR" ]; then
            DIR_DATE=$(echo $DIR | cut -d'-' -f1)
            CUTOFF_DATE=$(date -d "-${RETENTION_DAYS} days" +%Y%m%d)
            if [ "$DIR_DATE" -lt "$CUTOFF_DATE" ]; then
                log "Deleting old backup: $DIR"
                aws s3 rm s3://${S3_BUCKET}/backups/${DIR}/ --recursive
            fi
        fi
    done
fi

# ===========================================
# VERIFY BACKUP
# ===========================================
log "Verifying backup integrity..."

BACKUP_SIZE=$(du -sh "${BACKUP_DIR}/${TIMESTAMP}" | cut -f1)
BACKUP_FILES=$(ls -1 "${BACKUP_DIR}/${TIMESTAMP}" | wc -l)

if [ "$BACKUP_FILES" -lt 2 ]; then
    error "Backup verification failed - expected at least 2 files, got ${BACKUP_FILES}"
fi

log "Backup complete!"
log "Location: ${BACKUP_DIR}/${TIMESTAMP}"
log "Size: ${BACKUP_SIZE}"
log "Files: ${BACKUP_FILES}"

# ===========================================
# SEND NOTIFICATION
# ===========================================
if [ -n "${SLACK_WEBHOOK:-}" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ Vault backup completed\nTimestamp: ${TIMESTAMP}\nSize: ${BACKUP_SIZE}\nFiles: ${BACKUP_FILES}\"}" \
        "${SLACK_WEBHOOK}"
fi

exit 0
