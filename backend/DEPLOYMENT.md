# 0711 Vault - Full Deployment Guide

## Quick Start

### Option A: Local Development (Docker Compose)

```bash
# 1. Clone and configure
cd backend
cp .env.example .env
# Edit .env with your passwords

# 2. Start everything
docker compose up -d

# 3. Wait for Ollama models (first time only)
docker compose logs -f ollama-init

# 4. Test
curl http://localhost:8000/health
```

### Option B: Cloud Deployment (AWS + Kubernetes)

```bash
# 1. Configure AWS
aws configure

# 2. Run deployment script
./scripts/deploy.sh production

# 3. Wait for DNS propagation and TLS

# 4. Test
curl https://api.0711.io/health
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
│   📱 iOS    🤖 Android    🌐 Web    💻 Mac                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER / CDN                          │
│                    (AWS ALB + CloudFront)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       KUBERNETES                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Vault API   │  │  AI Service  │  │   Ollama     │          │
│  │   (3 pods)   │  │   (2 pods)   │  │   (1 pod)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ RDS      │  │ ElastiC. │  │ S3       │  │ Neo4j    │        │
│  │(Postgres)│  │ (Redis)  │  │          │  │          │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
backend/
├── docker-compose.yml      # Local development
├── .env.example            # Environment template
├── README.md               # Documentation
├── ARCHITECTURE.md         # Design decisions
├── DEPLOYMENT.md           # This file
│
├── services/
│   ├── vault-api/          # Main API (FastAPI)
│   │   ├── Dockerfile
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── requirements.txt
│   │   └── routers/
│   │       ├── auth.py     # Zero-knowledge auth
│   │       ├── vault.py    # CRUD operations
│   │       ├── search.py   # Vector + Graph search
│   │       ├── messages.py # E2E messaging
│   │       └── sync.py     # Multi-device sync
│   │
│   └── ai-service/         # AI processing
│       ├── Dockerfile
│       ├── main.py
│       └── requirements.txt
│
├── k8s/                    # Kubernetes manifests
│   ├── namespace.yaml
│   ├── secrets.yaml
│   ├── postgres.yaml
│   ├── neo4j.yaml
│   ├── redis.yaml
│   ├── minio.yaml
│   ├── vault-api.yaml
│   ├── ai-service.yaml
│   └── ingress.yaml
│
├── terraform/              # Infrastructure as Code
│   └── main.tf             # AWS EKS + RDS + S3
│
├── monitoring/             # Observability
│   ├── prometheus-values.yaml
│   ├── grafana-dashboard.json
│   └── alerts.yaml
│
├── scripts/                # Operations
│   ├── deploy.sh           # Full deployment
│   ├── backup.sh           # Daily backups
│   └── restore.sh          # Disaster recovery
│
├── .github/workflows/
│   └── ci-cd.yaml          # GitHub Actions pipeline
│
└── init/
    └── postgres/
        └── 01-init.sql     # Database schema
```

---

## Deployment Steps

### 1. Prerequisites

```bash
# Install tools
brew install kubectl helm terraform awscli docker

# Configure AWS
aws configure
# Region: eu-central-1
# Output: json
```

### 2. Provision Infrastructure

```bash
cd terraform

# Initialize
terraform init

# Review plan
terraform plan -var="environment=production"

# Deploy (takes ~15-20 minutes)
terraform apply -var="environment=production"
```

### 3. Deploy Application

```bash
# Configure kubectl
aws eks update-kubeconfig --name vault-cluster-production --region eu-central-1

# Deploy everything
./scripts/deploy.sh production
```

### 4. Configure DNS

Point these records to the Load Balancer:
- `api.0711.io` → ALB
- `ws.0711.io` → ALB
- `storage.0711.io` → ALB

### 5. Verify

```bash
# Check pods
kubectl get pods -n vault-0711

# Check health
curl https://api.0711.io/health

# View logs
kubectl logs -f deployment/vault-api -n vault-0711
```

---

## Operations

### Scaling

```bash
# Manual scale
kubectl scale deployment vault-api --replicas=5 -n vault-0711

# HPA handles auto-scaling based on CPU/memory
kubectl get hpa -n vault-0711
```

### Backups

```bash
# Manual backup
./scripts/backup.sh

# Backups run automatically via CronJob at 3 AM UTC
kubectl get cronjobs -n vault-0711
```

### Restore

```bash
# List available backups
aws s3 ls s3://0711-vault-backups/backups/

# Restore from specific backup
./scripts/restore.sh 20240129-030000
```

### Rollback

```bash
# View history
kubectl rollout history deployment/vault-api -n vault-0711

# Rollback to previous
kubectl rollout undo deployment/vault-api -n vault-0711

# Rollback to specific revision
kubectl rollout undo deployment/vault-api --to-revision=2 -n vault-0711
```

### Monitoring

```bash
# Port-forward Grafana
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring

# Open http://localhost:3000
# Default: admin / (from prometheus-values.yaml)
```

---

## Security Checklist

- [ ] All secrets in AWS Secrets Manager
- [ ] TLS certificates via cert-manager
- [ ] Network policies enabled
- [ ] Pod security policies applied
- [ ] RBAC configured
- [ ] Audit logging enabled
- [ ] Encryption at rest (RDS, S3)
- [ ] VPC with private subnets
- [ ] WAF in front of ALB
- [ ] Regular security scans (Trivy)

---

## Costs Estimate (AWS)

| Service | Staging | Production |
|---------|---------|------------|
| EKS Control Plane | $73/mo | $73/mo |
| EC2 Nodes (3x t3.large) | $180/mo | $360/mo |
| RDS (db.t3.medium) | $50/mo | $200/mo |
| ElastiCache | $40/mo | $150/mo |
| S3 (100GB) | $3/mo | $10/mo |
| Data Transfer | $10/mo | $50/mo |
| **Total** | **~$360/mo** | **~$850/mo** |

---

## Troubleshooting

### Pods not starting

```bash
kubectl describe pod <pod-name> -n vault-0711
kubectl logs <pod-name> -n vault-0711 --previous
```

### Database connection issues

```bash
# Test from within cluster
kubectl run -it --rm debug --image=postgres:16 --restart=Never -- \
  psql postgresql://vault:$PASSWORD@postgres:5432/vault
```

### Certificate not issuing

```bash
kubectl describe certificate vault-tls -n vault-0711
kubectl logs -l app=cert-manager -n cert-manager
```

---

## Support

- Documentation: https://docs.0711.io
- Issues: https://github.com/0711/vault/issues
- Email: support@0711.io
