# 0711 Vault - Hosting & Kosten

## 🇩🇪 Warum deutsches Hosting?

1. **DSGVO-Konformität** - Personenbezogene Daten bleiben in der EU
2. **Kein US Cloud Act** - Keine Herausgabepflicht an US-Behörden
3. **Vertrauen** - Deutsches Hosting = Verkaufsargument für Privacy-App
4. **Latenz** - Schnellere Verbindungen für DACH-Markt

---

## Kostenvergleich

### Staging Environment

| Komponente | Hetzner | AWS Frankfurt | Azure DE |
|------------|---------|---------------|----------|
| K8s Control Plane | €17/mo (cpx31) | €73/mo (EKS) | €80/mo (AKS) |
| Worker Nodes (2x) | €34/mo (2x cpx31) | €120/mo (2x t3.large) | €140/mo |
| Datenbank | €0 (self-hosted) | €50/mo (RDS) | €60/mo |
| Redis | €0 (self-hosted) | €40/mo (ElastiCache) | €45/mo |
| Storage (100GB) | €5/mo | €10/mo (S3+EBS) | €12/mo |
| Load Balancer | €6/mo | €20/mo (ALB) | €25/mo |
| Traffic (5TB) | €0 (inkl.) | €50/mo | €50/mo |
| **Total** | **~€62/mo** | **~€363/mo** | **~€412/mo** |

### Production Environment

| Komponente | Hetzner | AWS Frankfurt | Azure DE |
|------------|---------|---------------|----------|
| K8s Control Plane | €32/mo (cpx41) | €73/mo (EKS) | €80/mo |
| Worker Nodes (3x) | €96/mo (3x cpx41) | €270/mo (3x t3.xlarge) | €300/mo |
| Datenbank | €55/mo (ccx33) | €200/mo (RDS r6g) | €220/mo |
| Redis | €17/mo (cpx31) | €150/mo (ElastiCache) | €160/mo |
| Storage (500GB) | €26/mo | €50/mo | €55/mo |
| Load Balancer | €12/mo | €30/mo | €35/mo |
| Backup Storage | €5/mo | €20/mo | €25/mo |
| Traffic (20TB) | €0 (inkl.) | €200/mo | €200/mo |
| **Total** | **~€243/mo** | **~€993/mo** | **~€1075/mo** |

### Ersparnis mit Hetzner

| | Staging | Production |
|--|---------|------------|
| vs AWS | **83% günstiger** | **76% günstiger** |
| vs Azure | **85% günstiger** | **77% günstiger** |
| Jahresersparnis | ~€3.600 | ~€9.000 |

---

## Hetzner Setup

### Server-Typen für 0711 Vault

```
Empfohlenes Setup (Production):

┌─────────────────────────────────────────────────────────────┐
│                    Control Plane                             │
│                    cpx41 (€32/mo)                           │
│                    8 vCPU, 16GB RAM                         │
└─────────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    Worker 1     │ │    Worker 2     │ │    Worker 3     │
│  cpx41 (€32/mo) │ │  cpx41 (€32/mo) │ │  cpx41 (€32/mo) │
│  8 vCPU, 16GB   │ │  8 vCPU, 16GB   │ │  8 vCPU, 16GB   │
│                 │ │                 │ │                 │
│  • Vault API    │ │  • Vault API    │ │  • PostgreSQL   │
│  • AI Service   │ │  • AI Service   │ │  • Neo4j        │
│  • Redis        │ │  • MinIO        │ │  • Ollama       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Volumes

| Dienst | Größe | Kosten |
|--------|-------|--------|
| PostgreSQL | 100 GB | €5.20/mo |
| Neo4j | 50 GB | €2.60/mo |
| MinIO | 500 GB | €26.00/mo |
| Ollama Models | 50 GB | €2.60/mo |
| **Total** | 700 GB | €36.40/mo |

### Netzwerk

- **Private Network**: €0 (kostenlos)
- **Load Balancer**: €12.49/mo (lb21)
- **Traffic**: 20 TB inklusive pro Server!
- **Zusätzlicher Traffic**: €1/TB

---

## Deployment auf Hetzner

### 1. Hetzner Account

```bash
# 1. Account erstellen: https://console.hetzner.cloud
# 2. Projekt anlegen
# 3. API Token generieren (Read & Write)
```

### 2. SSH Key hochladen

```bash
# Lokalen Key generieren (falls nicht vorhanden)
ssh-keygen -t ed25519 -C "vault@0711.io"

# Key in Hetzner Console hochladen
# Security → SSH Keys → Add SSH Key
```

### 3. Terraform ausführen

```bash
cd terraform/hetzner

# Konfiguration
cp terraform.tfvars.example terraform.tfvars
# Token und SSH Key ID eintragen

# K3s Token generieren
echo "k3s_token = \"$(openssl rand -hex 32)\"" >> terraform.tfvars

# Initialisieren
terraform init

# Plan prüfen
terraform plan

# Deployen (~5 Minuten)
terraform apply
```

### 4. Kubeconfig holen

```bash
# IP aus Output nehmen
CONTROL_PLANE_IP=$(terraform output -raw control_plane_ip)

# Kubeconfig herunterladen
ssh root@$CONTROL_PLANE_IP 'cat /etc/rancher/k3s/k3s.yaml' | \
  sed "s/127.0.0.1/$CONTROL_PLANE_IP/g" > kubeconfig.yaml

export KUBECONFIG=$(pwd)/kubeconfig.yaml

# Testen
kubectl get nodes
```

### 5. Anwendung deployen

```bash
# Namespace und Secrets
kubectl apply -f ../k8s/namespace.yaml
kubectl apply -f ../k8s/secrets.yaml

# Datenbanken
kubectl apply -f ../k8s/postgres.yaml
kubectl apply -f ../k8s/neo4j.yaml
kubectl apply -f ../k8s/redis.yaml
kubectl apply -f ../k8s/minio.yaml

# Anwendungen
kubectl apply -f ../k8s/vault-api.yaml
kubectl apply -f ../k8s/ai-service.yaml

# Ingress
kubectl apply -f ../k8s/ingress.yaml
```

### 6. DNS konfigurieren

```
A    api.0711.io      → <Load Balancer IP>
A    ws.0711.io       → <Load Balancer IP>
A    storage.0711.io  → <Load Balancer IP>
```

---

## Alternative: Managed Kubernetes (kube.hetzner.cloud)

Hetzner bietet auch managed K8s (Beta):

| | Self-hosted (K3s) | Managed |
|--|-------------------|---------|
| Control Plane | Self-managed | Hetzner managed |
| Preis | Nur Server-Kosten | +€0.01/Stunde |
| Aufwand | Mehr Setup | Weniger Setup |
| Flexibilität | Maximal | Eingeschränkt |

**Empfehlung**: K3s für mehr Kontrolle und geringere Kosten.

---

## Backup-Strategie

### Hetzner Snapshots

```bash
# Server Snapshot (manuell)
hcloud server create-image --type snapshot vault-worker-1-production

# Automatisch via Cron auf Server
0 3 * * * hcloud server create-image --type snapshot $(hostname)
```

### Volume Snapshots

```bash
# Volume Snapshot
hcloud volume create-from-volume --source-volume vault-postgres-production --name postgres-backup-$(date +%Y%m%d)
```

### Offsite Backup

```bash
# Zu externem S3-kompatiblen Storage
# (z.B. Hetzner Object Storage, Backblaze B2)
./scripts/backup.sh
```

---

## Support & SLA

| | Hetzner | AWS |
|--|---------|-----|
| Support | Email, 24/7 | Bezahlt |
| SLA | 99.9% | 99.99% (EKS) |
| Sprache | 🇩🇪 Deutsch | 🇬🇧 Englisch |
| Reaktionszeit | < 24h | < 1h (Business) |

Für 0711 Vault ist das Hetzner SLA ausreichend.

---

## Fazit

**Hetzner Cloud ist die beste Wahl für 0711 Vault:**

✅ Deutsches Unternehmen, deutsche Rechenzentren
✅ DSGVO-konform, kein US Cloud Act
✅ ~75-80% günstiger als AWS/Azure
✅ Großzügiges Traffic-Inklusiv (20TB/Server)
✅ Schneller deutscher Support
✅ Einfache Preisstruktur

**Gesamtkosten Production: ~€250/Monat**
