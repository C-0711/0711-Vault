#!/bin/bash
# 0711 Vault - Hetzner Cloud Setup Script
# Deutsches Hosting, DSGVO-konform

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
info() { echo -e "${BLUE}[i]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# ===========================================
# PRE-FLIGHT
# ===========================================
header "0711 Vault - Hetzner Setup 🇩🇪"

echo "Dieses Script richtet die komplette Infrastruktur auf Hetzner Cloud ein."
echo ""
echo "Voraussetzungen:"
echo "  • Hetzner Cloud Account"
echo "  • API Token (Read & Write)"
echo "  • SSH Key in Hetzner hochgeladen"
echo ""

# Check tools
for cmd in terraform kubectl helm hcloud; do
    if ! command -v $cmd &>/dev/null; then
        error "$cmd ist nicht installiert"
    fi
done
log "Alle Tools installiert"

# ===========================================
# CONFIGURATION
# ===========================================
header "Konfiguration"

# Environment
read -p "Environment (staging/production) [production]: " ENVIRONMENT
ENVIRONMENT=${ENVIRONMENT:-production}

# Hetzner Token
if [ -z "${HCLOUD_TOKEN:-}" ]; then
    read -sp "Hetzner API Token: " HCLOUD_TOKEN
    echo ""
fi
export HCLOUD_TOKEN

# Verify token
if ! hcloud server list &>/dev/null; then
    error "Ungültiger Hetzner API Token"
fi
log "Hetzner Token gültig"

# SSH Key
info "Verfügbare SSH Keys:"
hcloud ssh-key list
read -p "SSH Key ID: " SSH_KEY_ID

# Domain
read -p "Domain [0711.io]: " DOMAIN
DOMAIN=${DOMAIN:-0711.io}

# Location
echo ""
info "Verfügbare Standorte:"
echo "  nbg1 - Nürnberg (empfohlen)"
echo "  fsn1 - Falkenstein"
echo "  hel1 - Helsinki"
read -p "Standort [nbg1]: " LOCATION
LOCATION=${LOCATION:-nbg1}

log "Konfiguration:"
echo "  Environment: $ENVIRONMENT"
echo "  Domain: $DOMAIN"
echo "  Standort: $LOCATION"
echo "  SSH Key: $SSH_KEY_ID"

read -p "Weiter? (y/N) " CONFIRM
[[ ! $CONFIRM =~ ^[Yy]$ ]] && error "Abgebrochen"

# ===========================================
# TERRAFORM
# ===========================================
header "Infrastructure mit Terraform"

cd "$(dirname "$0")/../terraform/hetzner"

# Generate K3s token
K3S_TOKEN=$(openssl rand -hex 32)

# Create tfvars
cat > terraform.tfvars <<EOF
hcloud_token = "$HCLOUD_TOKEN"
environment  = "$ENVIRONMENT"
location     = "$LOCATION"
domain       = "$DOMAIN"
ssh_keys     = ["$SSH_KEY_ID"]
k3s_token    = "$K3S_TOKEN"
EOF

log "terraform.tfvars erstellt"

# Init
terraform init -upgrade
log "Terraform initialisiert"

# Plan
info "Erstelle Terraform Plan..."
terraform plan -out=tfplan

echo ""
read -p "Terraform apply? (y/N) " CONFIRM
[[ ! $CONFIRM =~ ^[Yy]$ ]] && error "Abgebrochen"

# Apply
terraform apply tfplan
log "Infrastruktur erstellt"

# Get outputs
CONTROL_PLANE_IP=$(terraform output -raw control_plane_ip)
LB_IP=$(terraform output -raw load_balancer_ip)

log "Control Plane: $CONTROL_PLANE_IP"
log "Load Balancer: $LB_IP"

# ===========================================
# WAIT FOR K3S
# ===========================================
header "Warte auf K3s Cluster"

info "K3s wird installiert, das dauert ~2-3 Minuten..."

for i in {1..30}; do
    if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$CONTROL_PLANE_IP 'kubectl get nodes' &>/dev/null; then
        log "K3s ist bereit"
        break
    fi
    echo -n "."
    sleep 10
done

# ===========================================
# KUBECONFIG
# ===========================================
header "Kubeconfig"

ssh -o StrictHostKeyChecking=no root@$CONTROL_PLANE_IP 'cat /etc/rancher/k3s/k3s.yaml' | \
    sed "s/127.0.0.1/$CONTROL_PLANE_IP/g" > kubeconfig.yaml

export KUBECONFIG=$(pwd)/kubeconfig.yaml
log "Kubeconfig gespeichert: $(pwd)/kubeconfig.yaml"

# Verify
kubectl get nodes
log "Cluster erreichbar"

# ===========================================
# INSTALL PREREQUISITES
# ===========================================
header "Installiere Cluster-Komponenten"

# Nginx Ingress
info "Installiere Nginx Ingress..."
helm upgrade --install ingress-nginx ingress-nginx \
    --repo https://kubernetes.github.io/ingress-nginx \
    --namespace ingress-nginx --create-namespace \
    --set controller.service.type=NodePort \
    --set controller.service.nodePorts.http=80 \
    --set controller.service.nodePorts.https=443 \
    --wait
log "Nginx Ingress installiert"

# Cert-Manager
info "Installiere Cert-Manager..."
helm upgrade --install cert-manager cert-manager \
    --repo https://charts.jetstack.io \
    --namespace cert-manager --create-namespace \
    --set installCRDs=true \
    --wait
log "Cert-Manager installiert"

# ===========================================
# DEPLOY APPLICATION
# ===========================================
header "Deploye Anwendung"

cd ../../

# Namespace
kubectl apply -f k8s/namespace.yaml
log "Namespace erstellt"

# Generate secrets
info "Generiere Secrets..."
POSTGRES_PASSWORD=$(openssl rand -base64 24)
REDIS_PASSWORD=$(openssl rand -base64 24)
JWT_SECRET=$(openssl rand -base64 48)

kubectl create secret generic vault-secrets \
    --namespace vault-0711 \
    --from-literal=POSTGRES_USER=vault \
    --from-literal=POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
    --from-literal=POSTGRES_DB=vault \
    --from-literal=DATABASE_URL="postgresql://vault:$POSTGRES_PASSWORD@postgres:5432/vault" \
    --from-literal=NEO4J_USER=neo4j \
    --from-literal=NEO4J_PASSWORD="$POSTGRES_PASSWORD" \
    --from-literal=NEO4J_URI="bolt://neo4j:7687" \
    --from-literal=REDIS_PASSWORD="$REDIS_PASSWORD" \
    --from-literal=REDIS_URL="redis://:$REDIS_PASSWORD@redis:6379" \
    --from-literal=JWT_SECRET="$JWT_SECRET" \
    --from-literal=MINIO_ACCESS_KEY="minioadmin" \
    --from-literal=MINIO_SECRET_KEY="$POSTGRES_PASSWORD" \
    --dry-run=client -o yaml | kubectl apply -f -
log "Secrets erstellt"

# Deploy databases
info "Deploye Datenbanken..."
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/neo4j.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/minio.yaml

# Wait
kubectl rollout status statefulset/postgres -n vault-0711 --timeout=300s || true
log "Datenbanken deployed"

# Deploy services
info "Deploye Anwendungen..."
kubectl apply -f k8s/ai-service.yaml
kubectl apply -f k8s/vault-api.yaml

# Wait
kubectl rollout status deployment/vault-api -n vault-0711 --timeout=300s || true
log "Anwendungen deployed"

# Ingress
info "Konfiguriere Ingress..."
sed "s/0711.io/$DOMAIN/g" k8s/ingress.yaml | kubectl apply -f -
log "Ingress konfiguriert"

# ===========================================
# DONE
# ===========================================
header "Setup abgeschlossen! 🎉"

echo ""
echo -e "${GREEN}Infrastruktur:${NC}"
echo "  Control Plane:  $CONTROL_PLANE_IP"
echo "  Load Balancer:  $LB_IP"
echo "  Kubeconfig:     $(pwd)/terraform/hetzner/kubeconfig.yaml"
echo ""
echo -e "${GREEN}DNS Records erstellen:${NC}"
echo "  A    api.$DOMAIN      →  $LB_IP"
echo "  A    ws.$DOMAIN       →  $LB_IP"
echo "  A    storage.$DOMAIN  →  $LB_IP"
echo ""
echo -e "${GREEN}Nächste Schritte:${NC}"
echo "  1. DNS Records erstellen"
echo "  2. Warten auf TLS-Zertifikate (~2 Min)"
echo "  3. Testen: curl https://api.$DOMAIN/health"
echo ""
echo -e "${GREEN}Nützliche Befehle:${NC}"
echo "  export KUBECONFIG=$(pwd)/terraform/hetzner/kubeconfig.yaml"
echo "  kubectl get pods -n vault-0711"
echo "  kubectl logs -f deployment/vault-api -n vault-0711"
echo ""
echo -e "${YELLOW}Kosten: ~€$([ "$ENVIRONMENT" == "production" ] && echo "250" || echo "60")/Monat${NC}"
echo ""

# Save credentials
cat > credentials-$ENVIRONMENT.txt <<EOF
# 0711 Vault Credentials - $ENVIRONMENT
# KEEP THIS FILE SECURE!

PostgreSQL:
  Host: postgres.vault-0711.svc.cluster.local
  User: vault
  Password: $POSTGRES_PASSWORD
  Database: vault

Redis:
  Host: redis.vault-0711.svc.cluster.local
  Password: $REDIS_PASSWORD

JWT Secret: $JWT_SECRET

Control Plane: $CONTROL_PLANE_IP
Load Balancer: $LB_IP
EOF

warn "Credentials gespeichert in: credentials-$ENVIRONMENT.txt"
warn "DIESE DATEI SICHER AUFBEWAHREN!"

exit 0
