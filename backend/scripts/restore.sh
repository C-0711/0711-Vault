#!/bin/bash
# 0711 Vault Restore Script
# Disaster recovery - restore from backup

set -euo pipefail

# Configuration
BACKUP_TIMESTAMP="${1:-}"
S3_BUCKET="${S3_BUCKET:-0711-vault-backups}"
NAMESPACE="${NAMESPACE:-vault-0711}"
RESTORE_DIR="/tmp/vault-restore"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"; exit 1; }

usage() {
    echo "Usage: $0 <backup_timestamp>"
    echo ""
    echo "Example: $0 20240129-030000"
    echo ""
    echo "Available backups:"
    aws s3 ls s3://${S3_BUCKET}/backups/ | tail -10
    exit 1
}

# Check arguments
[ -z "$BACKUP_TIMESTAMP" ] && usage

# Confirmation
echo ""
echo "⚠️  WARNING: This will restore the database from backup ${BACKUP_TIMESTAMP}"
echo "⚠️  Current data will be OVERWRITTEN"
echo ""
read -p "Type 'RESTORE' to confirm: " CONFIRM
[ "$CONFIRM" != "RESTORE" ] && error "Restore cancelled"

log "Starting restore from ${BACKUP_TIMESTAMP}"

# Create restore directory
rm -rf "${RESTORE_DIR}"
mkdir -p "${RESTORE_DIR}"
cd "${RESTORE_DIR}"

# ===========================================
# DOWNLOAD BACKUPS
# ===========================================
log "Downloading backups from S3..."

aws s3 cp s3://${S3_BUCKET}/backups/${BACKUP_TIMESTAMP}/ . --recursive

# Decompress
for f in *.gz; do
    [ -f "$f" ] && gunzip "$f"
done

log "Downloaded files:"
ls -la

# ===========================================
# SCALE DOWN APPLICATIONS
# ===========================================
log "Scaling down applications..."

kubectl scale deployment vault-api --replicas=0 -n ${NAMESPACE} || true
kubectl scale deployment ai-service --replicas=0 -n ${NAMESPACE} || true

sleep 10

# ===========================================
# RESTORE POSTGRESQL
# ===========================================
if [ -f postgres-*.dump ]; then
    log "Restoring PostgreSQL..."
    
    POSTGRES_DUMP=$(ls postgres-*.dump | head -1)
    
    # Drop and recreate database
    kubectl exec -n ${NAMESPACE} postgres-0 -- psql -U vault -c "DROP DATABASE IF EXISTS vault_restore;"
    kubectl exec -n ${NAMESPACE} postgres-0 -- psql -U vault -c "CREATE DATABASE vault_restore;"
    
    # Restore to new database
    kubectl cp "${POSTGRES_DUMP}" ${NAMESPACE}/postgres-0:/tmp/restore.dump
    kubectl exec -n ${NAMESPACE} postgres-0 -- pg_restore -U vault -d vault_restore /tmp/restore.dump
    
    # Swap databases
    kubectl exec -n ${NAMESPACE} postgres-0 -- psql -U vault -c "
        SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'vault';
        DROP DATABASE vault;
        ALTER DATABASE vault_restore RENAME TO vault;
    "
    
    log "PostgreSQL restore complete"
else
    warn "PostgreSQL backup not found - skipping"
fi

# ===========================================
# RESTORE NEO4J
# ===========================================
if [ -f neo4j-*.dump ]; then
    log "Restoring Neo4j..."
    
    NEO4J_DUMP=$(ls neo4j-*.dump | head -1)
    
    # Stop Neo4j
    kubectl scale statefulset neo4j --replicas=0 -n ${NAMESPACE}
    sleep 30
    
    # Copy dump and restore
    kubectl cp "${NEO4J_DUMP}" ${NAMESPACE}/neo4j-0:/tmp/restore.dump
    kubectl exec -n ${NAMESPACE} neo4j-0 -- neo4j-admin database load neo4j --from-path=/tmp/ --overwrite-destination
    
    # Start Neo4j
    kubectl scale statefulset neo4j --replicas=1 -n ${NAMESPACE}
    
    log "Neo4j restore complete"
else
    warn "Neo4j backup not found - skipping"
fi

# ===========================================
# RESTORE REDIS
# ===========================================
if [ -f redis-*.rdb ]; then
    log "Restoring Redis..."
    
    REDIS_RDB=$(ls redis-*.rdb | head -1)
    
    # Stop Redis
    kubectl scale deployment redis --replicas=0 -n ${NAMESPACE}
    sleep 10
    
    # Copy RDB file
    kubectl cp "${REDIS_RDB}" ${NAMESPACE}/$(kubectl get pod -n ${NAMESPACE} -l app=redis -o jsonpath='{.items[0].metadata.name}'):/data/dump.rdb
    
    # Start Redis
    kubectl scale deployment redis --replicas=1 -n ${NAMESPACE}
    
    log "Redis restore complete"
else
    warn "Redis backup not found - skipping"
fi

# ===========================================
# RESTORE VAULT DATA (S3/MinIO)
# ===========================================
if aws s3 ls s3://${S3_BUCKET}/vault-data/${BACKUP_TIMESTAMP}/ &>/dev/null; then
    log "Restoring vault data from S3..."
    
    # Sync back to production bucket
    aws s3 sync s3://${S3_BUCKET}/vault-data/${BACKUP_TIMESTAMP}/ s3://0711-vault-production/
    
    log "Vault data restore complete"
else
    warn "Vault data backup not found - skipping"
fi

# ===========================================
# SCALE UP APPLICATIONS
# ===========================================
log "Scaling up applications..."

kubectl scale deployment vault-api --replicas=3 -n ${NAMESPACE}
kubectl scale deployment ai-service --replicas=2 -n ${NAMESPACE}

# Wait for pods
kubectl rollout status deployment vault-api -n ${NAMESPACE} --timeout=300s
kubectl rollout status deployment ai-service -n ${NAMESPACE} --timeout=300s

# ===========================================
# VERIFY RESTORE
# ===========================================
log "Verifying restore..."

# Health check
sleep 30
HEALTH=$(curl -s https://api.0711.io/health | jq -r '.status')
if [ "$HEALTH" != "healthy" ]; then
    error "Health check failed after restore"
fi

log "✅ Restore complete!"
log "Backup timestamp: ${BACKUP_TIMESTAMP}"
log "All services are healthy"

# Cleanup
rm -rf "${RESTORE_DIR}"

# Notification
if [ -n "${SLACK_WEBHOOK:-}" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🔄 Vault restored from backup ${BACKUP_TIMESTAMP}\"}" \
        "${SLACK_WEBHOOK}"
fi

exit 0
