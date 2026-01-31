# Self-Hosting 0711 Vault

Run your own private photo vault. Your server, your data, your rules.

## Quick Start (5 minutes)

### Requirements
- Docker & Docker Compose
- 4GB RAM minimum (8GB recommended for AI features)
- 20GB disk space (plus storage for your photos)
- Linux, macOS, or Windows with WSL2

### One-Command Install

```bash
# Clone the repository
git clone https://github.com/christoph-ui/0711-Vault.git
cd 0711-Vault/backend

# Start all services
docker compose up -d

# Check status
docker compose ps
```

That's it. Your vault is running at `http://localhost:9508`

---

## What Gets Deployed

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 9508 | React web app |
| API | 9506 | FastAPI backend |
| AI Service | 9507 | Face detection, OCR, embeddings |
| PostgreSQL | 9500 | User data, metadata |
| Redis | 9501 | Sessions, cache |
| Neo4j | 9502/9503 | Graph relationships |
| MinIO | 9504/9505 | Photo/document storage |

---

## Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database
POSTGRES_USER=vault
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=vault

# MinIO (S3-compatible storage)
MINIO_ACCESS_KEY=your_minio_key
MINIO_SECRET_KEY=your_minio_secret

# JWT Secret (generate with: openssl rand -hex 32)
JWT_SECRET=your_jwt_secret_here

# Neo4j
NEO4J_PASSWORD=your_neo4j_password

# Optional: External URL for presigned URLs
MINIO_EXTERNAL_ENDPOINT=storage.yourdomain.com
MINIO_SECURE=true

# Optional: Stripe (for paid tiers)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### AI Models (Ollama)

The vault uses Ollama for local AI. Models are pulled automatically:

- **bge-m3** - Text embeddings for semantic search
- **llama4** - Vision model for image understanding (if available)

To use a different model:
```env
EMBEDDING_MODEL=nomic-embed-text
VISION_MODEL=llava:7b
```

---

## Hardware Recommendations

### Minimum (Basic features)
- **CPU:** 2 cores
- **RAM:** 4GB
- **Storage:** 20GB + photos
- **AI:** CPU-only (slower face detection)

### Recommended (Full AI features)
- **CPU:** 4+ cores
- **RAM:** 8GB
- **Storage:** SSD recommended
- **GPU:** Optional but speeds up AI

### Raspberry Pi 5
Yes, it works! Use the CPU-only configuration:
```yaml
# docker-compose.override.yml
services:
  ollama:
    profiles: ["disabled"]  # Disable GPU-dependent Ollama
```

Face detection and OCR still work via the AI service.

---

## Exposing to the Internet

### Option 1: Cloudflare Tunnel (Recommended)

No port forwarding required. Free.

```bash
# Install cloudflared
brew install cloudflare/cloudflare/cloudflared  # macOS
# or
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared

# Login
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create vault

# Configure
cat > ~/.cloudflared/config.yml << EOF
tunnel: YOUR_TUNNEL_ID
credentials-file: /root/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: vault.yourdomain.com
    service: http://localhost:9508
  - hostname: api.vault.yourdomain.com
    service: http://localhost:9506
  - hostname: storage.vault.yourdomain.com
    service: http://localhost:9504
  - service: http_status:404
EOF

# Run
cloudflared tunnel run vault
```

### Option 2: Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl http2;
    server_name vault.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/vault.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vault.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:9508;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:9506/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Option 3: Tailscale

Private network access without exposing to internet:

```bash
# Install Tailscale on server
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Access from any device on your Tailnet
# http://your-server-tailscale-ip:9508
```

---

## Backup & Restore

### Backup

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/vault-$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Stop services
cd /path/to/0711-Vault/backend
docker compose stop

# Backup volumes
docker run --rm -v backend_postgres-data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/postgres.tar.gz /data
docker run --rm -v backend_minio-data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/minio.tar.gz /data
docker run --rm -v backend_neo4j-data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/neo4j.tar.gz /data

# Restart
docker compose start

echo "Backup complete: $BACKUP_DIR"
```

### Restore

```bash
#!/bin/bash
# restore.sh

BACKUP_DIR=$1

if [ -z "$BACKUP_DIR" ]; then
    echo "Usage: ./restore.sh /path/to/backup"
    exit 1
fi

cd /path/to/0711-Vault/backend
docker compose down

# Restore volumes
docker run --rm -v backend_postgres-data:/data -v $BACKUP_DIR:/backup alpine sh -c "rm -rf /data/* && tar xzf /backup/postgres.tar.gz -C /"
docker run --rm -v backend_minio-data:/data -v $BACKUP_DIR:/backup alpine sh -c "rm -rf /data/* && tar xzf /backup/minio.tar.gz -C /"
docker run --rm -v backend_neo4j-data:/data -v $BACKUP_DIR:/backup alpine sh -c "rm -rf /data/* && tar xzf /backup/neo4j.tar.gz -C /"

docker compose up -d

echo "Restore complete"
```

### Automated Backups (Cron)

```bash
# Add to crontab
0 3 * * * /path/to/backup.sh >> /var/log/vault-backup.log 2>&1
```

---

## Updating

```bash
cd /path/to/0711-Vault

# Pull latest
git pull origin main

# Rebuild and restart
cd backend
docker compose down
docker compose up -d --build

# Check logs
docker compose logs -f --tail=100
```

---

## Troubleshooting

### Services won't start
```bash
# Check logs
docker compose logs vault-api
docker compose logs vault-ai-service

# Common fix: rebuild
docker compose down
docker compose up -d --build
```

### Database connection errors
```bash
# Check if postgres is healthy
docker compose ps
docker compose logs vault-postgres

# Reset database (WARNING: deletes data)
docker compose down -v
docker compose up -d
```

### AI features not working
```bash
# Check Ollama
curl http://localhost:11434/api/tags

# Pull models manually
docker exec -it ollama ollama pull bge-m3
```

### Out of disk space
```bash
# Check Docker disk usage
docker system df

# Clean up
docker system prune -a
```

---

## Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Generate strong JWT secret: `openssl rand -hex 32`
- [ ] Use HTTPS (Cloudflare Tunnel or Let's Encrypt)
- [ ] Enable firewall, only expose necessary ports
- [ ] Regular backups to separate location
- [ ] Keep Docker and host OS updated

---

## Support

- **GitHub Issues:** https://github.com/christoph-ui/0711-Vault/issues
- **Documentation:** https://vault.0711.io/docs
- **Community:** Discord (coming soon)

---

*Your data, your server, your rules. Welcome to freedom.*
