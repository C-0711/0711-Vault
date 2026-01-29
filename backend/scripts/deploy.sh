#!/bin/bash
# 0711 Vault Full Deployment Script
# Complete setup from scratch

set -euo pipefail

# Configuration
ENVIRONMENT="${1:-staging}"
DOMAIN="${DOMAIN:-0711.io}"
AWS_REGION="${AWS_REGION:-eu-central-1}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

# ===========================================
# PRE-FLIGHT CHECKS
# ===========================================
header "Pre-flight Checks"

# Check required tools
for cmd in kubectl helm terraform aws docker; do
    if ! command -v $cmd &>/dev/null; then
        error "$cmd is required but not installed"
    fi
    log "✓ $cmd found"
done

# Check AWS credentials
if ! aws sts get-caller-identity &>/dev/null; then
    error "AWS credentials not configured"
fi
log "✓ AWS credentials valid"

# Check environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    error "Environment must be 'staging' or 'production'"
fi
log "✓ Environment: $ENVIRONMENT"

# ===========================================
# TERRAFORM - INFRASTRUCTURE
# ===========================================
header "Provisioning Infrastructure with Terraform"

cd terraform

# Initialize
terraform init -upgrade

# Plan
terraform plan -var="environment=${ENVIRONMENT}" -out=tfplan

# Confirm
read -p "Apply Terraform plan? (y/N) " -n 1 -r
echo
[[ ! $REPLY =~ ^[Yy]$ ]] && error "Deployment cancelled"

# Apply
terraform apply tfplan

# Get outputs
CLUSTER_NAME=$(terraform output -raw cluster_name)
RDS_ENDPOINT=$(terraform output -raw rds_endpoint)
REDIS_ENDPOINT=$(terraform output -raw redis_endpoint)
S3_BUCKET=$(terraform output -raw s3_bucket)

log "Infrastructure provisioned:"
log "  Cluster: $CLUSTER_NAME"
log "  RDS: $RDS_ENDPOINT"
log "  Redis: $REDIS_ENDPOINT"
log "  S3: $S3_BUCKET"

cd ..

# ===========================================
# CONFIGURE KUBECTL
# ===========================================
header "Configuring kubectl"

aws eks update-kubeconfig --name $CLUSTER_NAME --region $AWS_REGION
kubectl cluster-info
log "✓ kubectl configured"

# ===========================================
# INSTALL PREREQUISITES
# ===========================================
header "Installing Cluster Prerequisites"

# Nginx Ingress Controller
log "Installing Nginx Ingress Controller..."
helm upgrade --install ingress-nginx ingress-nginx \
    --repo https://kubernetes.github.io/ingress-nginx \
    --namespace ingress-nginx --create-namespace \
    --set controller.service.type=LoadBalancer \
    --wait

# Cert-Manager
log "Installing Cert-Manager..."
helm upgrade --install cert-manager cert-manager \
    --repo https://charts.jetstack.io \
    --namespace cert-manager --create-namespace \
    --set installCRDs=true \
    --wait

# External Secrets Operator
log "Installing External Secrets Operator..."
helm upgrade --install external-secrets external-secrets \
    --repo https://charts.external-secrets.io \
    --namespace external-secrets --create-namespace \
    --wait

# Metrics Server
log "Installing Metrics Server..."
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

log "✓ Prerequisites installed"

# ===========================================
# CREATE NAMESPACE & SECRETS
# ===========================================
header "Setting Up Namespace"

kubectl apply -f k8s/namespace.yaml

# Create secrets from AWS Secrets Manager
log "Creating secrets..."
kubectl create secret generic vault-secrets \
    --namespace vault-0711 \
    --from-literal=POSTGRES_USER=vault \
    --from-literal=POSTGRES_PASSWORD="$(aws secretsmanager get-secret-value --secret-id vault/${ENVIRONMENT}/credentials --query SecretString --output text | jq -r .postgres_password)" \
    --from-literal=POSTGRES_DB=vault \
    --from-literal=DATABASE_URL="postgresql://vault:$(aws secretsmanager get-secret-value --secret-id vault/${ENVIRONMENT}/credentials --query SecretString --output text | jq -r .postgres_password)@${RDS_ENDPOINT}/vault" \
    --from-literal=REDIS_PASSWORD="$(aws secretsmanager get-secret-value --secret-id vault/${ENVIRONMENT}/credentials --query SecretString --output text | jq -r .redis_password)" \
    --from-literal=REDIS_URL="redis://:$(aws secretsmanager get-secret-value --secret-id vault/${ENVIRONMENT}/credentials --query SecretString --output text | jq -r .redis_password)@${REDIS_ENDPOINT}:6379" \
    --from-literal=JWT_SECRET="$(aws secretsmanager get-secret-value --secret-id vault/${ENVIRONMENT}/credentials --query SecretString --output text | jq -r .jwt_secret)" \
    --from-literal=MINIO_ACCESS_KEY="${AWS_ACCESS_KEY_ID}" \
    --from-literal=MINIO_SECRET_KEY="${AWS_SECRET_ACCESS_KEY}" \
    --dry-run=client -o yaml | kubectl apply -f -

# Create image pull secret for GHCR
log "Creating image pull secret..."
kubectl create secret docker-registry ghcr-secret \
    --namespace vault-0711 \
    --docker-server=ghcr.io \
    --docker-username="${GITHUB_USER}" \
    --docker-password="${GITHUB_TOKEN}" \
    --dry-run=client -o yaml | kubectl apply -f -

log "✓ Namespace and secrets created"

# ===========================================
# DEPLOY STATEFUL SERVICES
# ===========================================
header "Deploying Stateful Services"

# Neo4j
log "Deploying Neo4j..."
kubectl apply -f k8s/neo4j.yaml
kubectl rollout status statefulset/neo4j -n vault-0711 --timeout=300s

# Redis (if not using ElastiCache)
# log "Deploying Redis..."
# kubectl apply -f k8s/redis.yaml
# kubectl rollout status deployment/redis -n vault-0711 --timeout=120s

# MinIO (if not using S3)
# log "Deploying MinIO..."
# kubectl apply -f k8s/minio.yaml
# kubectl rollout status deployment/minio -n vault-0711 --timeout=120s

# Ollama
log "Deploying Ollama..."
kubectl apply -f k8s/ai-service.yaml
kubectl rollout status deployment/ollama -n vault-0711 --timeout=600s

log "✓ Stateful services deployed"

# ===========================================
# DEPLOY APPLICATION SERVICES
# ===========================================
header "Deploying Application Services"

# Vault API
log "Deploying Vault API..."
kubectl apply -f k8s/vault-api.yaml
kubectl rollout status deployment/vault-api -n vault-0711 --timeout=300s

# AI Service
log "Deploying AI Service..."
kubectl rollout status deployment/ai-service -n vault-0711 --timeout=300s

log "✓ Application services deployed"

# ===========================================
# CONFIGURE INGRESS
# ===========================================
header "Configuring Ingress"

# Update domain in ingress
sed -i "s/0711.io/${DOMAIN}/g" k8s/ingress.yaml
kubectl apply -f k8s/ingress.yaml

# Wait for certificate
log "Waiting for TLS certificate..."
kubectl wait --for=condition=Ready certificate/vault-tls -n vault-0711 --timeout=300s || true

# Get Load Balancer IP
LB_HOSTNAME=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
log "Load Balancer: $LB_HOSTNAME"
log "Please create DNS records:"
log "  api.${DOMAIN} -> $LB_HOSTNAME"
log "  storage.${DOMAIN} -> $LB_HOSTNAME"
log "  ws.${DOMAIN} -> $LB_HOSTNAME"

# ===========================================
# INSTALL MONITORING
# ===========================================
header "Installing Monitoring Stack"

helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
    --namespace monitoring --create-namespace \
    -f monitoring/prometheus-values.yaml \
    --wait

# Apply custom alerts
kubectl apply -f monitoring/alerts.yaml

# Create Grafana dashboard ConfigMap
kubectl create configmap grafana-vault-dashboards \
    --namespace monitoring \
    --from-file=monitoring/grafana-dashboard.json \
    --dry-run=client -o yaml | kubectl apply -f -

log "✓ Monitoring installed"
log "Grafana: https://grafana.${DOMAIN}"

# ===========================================
# CONFIGURE BACKUP CRONJOB
# ===========================================
header "Setting Up Backups"

cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: CronJob
metadata:
  name: vault-backup
  namespace: vault-0711
spec:
  schedule: "0 3 * * *"  # Daily at 3 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: amazon/aws-cli:latest
            command: ["/bin/bash", "-c"]
            args:
            - |
              # Backup script runs here
              echo "Starting backup..."
              # (simplified - use full backup.sh in production)
            env:
            - name: S3_BUCKET
              value: "${S3_BUCKET}"
            - name: NAMESPACE
              value: "vault-0711"
          restartPolicy: OnFailure
          serviceAccountName: vault-backup
EOF

log "✓ Backup CronJob configured"

# ===========================================
# FINAL VERIFICATION
# ===========================================
header "Verifying Deployment"

# Wait for all pods
log "Waiting for all pods to be ready..."
kubectl wait --for=condition=Ready pods --all -n vault-0711 --timeout=300s

# Health check
sleep 30
log "Running health checks..."

API_HEALTH=$(curl -s https://api.${DOMAIN}/health || echo '{"status":"error"}')
if echo "$API_HEALTH" | jq -e '.status == "healthy"' &>/dev/null; then
    log "✓ API health check passed"
else
    warn "API health check failed: $API_HEALTH"
fi

# ===========================================
# SUMMARY
# ===========================================
header "Deployment Complete! 🚀"

echo ""
echo "Environment: $ENVIRONMENT"
echo ""
echo "URLs:"
echo "  API:        https://api.${DOMAIN}"
echo "  WebSocket:  wss://ws.${DOMAIN}"
echo "  Grafana:    https://grafana.${DOMAIN}"
echo ""
echo "Next steps:"
echo "  1. Create DNS records pointing to: $LB_HOSTNAME"
echo "  2. Wait for TLS certificates to be issued"
echo "  3. Test the API: curl https://api.${DOMAIN}/health"
echo "  4. Configure mobile apps with API endpoint"
echo ""
echo "Useful commands:"
echo "  kubectl get pods -n vault-0711"
echo "  kubectl logs -f deployment/vault-api -n vault-0711"
echo "  kubectl port-forward svc/grafana 3000:3000 -n monitoring"
echo ""

exit 0
