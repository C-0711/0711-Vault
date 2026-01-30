# 🚀 SUPERPOWER TASK LIST - 0711 Intelligence

**Goal:** Take 0711-Intelligence to production-ready superpower level

---

## Phase 1: Fix Infrastructure (URGENT)

### 1.1 Fix Cloudflare Tunnel Conflict
```bash
# Stop conflicting root tunnel
sudo systemctl stop cloudflared
sudo systemctl disable cloudflared

# Run user tunnel in background with proper config
nohup ./cloudflared tunnel run > ~/cloudflared.log 2>&1 &
```

### 1.2 Deploy Landing Page (website/)
```bash
# Create nginx container for landing page
cd ~/0711-Intelligence/0711-Intelligence

# Create website docker-compose
cat > website/docker-compose.yml << 'EOF'
services:
  website:
    image: nginx:alpine
    container_name: 0711-website
    ports:
      - "4000:80"
    volumes:
      - ./:/usr/share/nginx/html:ro
    restart: unless-stopped
EOF

cd website && docker compose up -d
```

### 1.3 Add DNS Route for API
```bash
./cloudflared tunnel route dns fb8267e6-0a22-44b8-9978-c3e3b32583f6 api.vault.0711.io
```

---

## Phase 2: Backend Enhancements

### 2.1 Connect to Host Ollama
Update `.env` in backend:
```bash
cd ~/0711-Intelligence/0711-Intelligence/backend
echo "OLLAMA_HOST=http://172.17.0.1:11434" >> .env
docker compose up -d vault-api ai-service
```

### 2.2 Initialize MinIO Bucket
```bash
docker exec -it vault-minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec -it vault-minio mc mb local/vault-photos
docker exec -it vault-minio mc mb local/vault-documents
```

### 2.3 Initialize PostgreSQL Schema
```bash
docker exec -it vault-postgres psql -U vault -d vault -c "
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
"
```

### 2.4 Seed Neo4j with Base Schema
```bash
docker exec -it vault-neo4j cypher-shell -u neo4j -p vault0711 "
CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT photo_id IF NOT EXISTS FOR (p:Photo) REQUIRE p.id IS UNIQUE;
CREATE INDEX person_name IF NOT EXISTS FOR (p:Person) ON (p.name);
"
```

---

## Phase 3: Frontend Polish

### 3.1 Update Frontend API URL
```bash
cd ~/0711-Intelligence/0711-Intelligence/frontend
sed -i 's|http://localhost:8000|https://api.vault.0711.io|g' src/config.ts || true
npm run build
docker compose up -d --build frontend
```

### 3.2 Add CORS for vault.0711.io
Update backend CORS settings:
```bash
# In vault-api, add vault.0711.io to allowed origins
```

---

## Phase 4: Security Hardening

### 4.1 Generate Production Secrets
```bash
cd ~/0711-Intelligence/0711-Intelligence/backend

# Generate secure JWT secret
JWT_SECRET=$(openssl rand -hex 32)
echo "JWT_SECRET=$JWT_SECRET" >> .env

# Generate API key
API_KEY=$(openssl rand -hex 24)
echo "API_KEY=$API_KEY" >> .env
```

### 4.2 Enable HTTPS-only
All traffic goes through Cloudflare Tunnel = automatic HTTPS ✅

---

## Phase 5: Monitoring & Health

### 5.1 Create Health Check Script
```bash
cat > ~/0711-health-check.sh << 'EOF'
#!/bin/bash
echo "=== 0711 Intelligence Health Check ==="
echo ""
echo "Services:"
curl -s http://localhost:9506/health | jq .
echo ""
echo "Containers:"
docker ps --filter "name=vault-" --format "table {{.Names}}\t{{.Status}}"
echo ""
echo "Public URLs:"
curl -sI https://0711.io 2>&1 | head -1
curl -sI https://vault.0711.io 2>&1 | head -1
curl -s https://api.vault.0711.io/health 2>&1 | head -1
EOF
chmod +x ~/0711-health-check.sh
```

### 5.2 Add to Cron (Optional)
```bash
# Health check every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * ~/0711-health-check.sh >> ~/0711-health.log 2>&1") | crontab -
```

---

## Phase 6: Documentation

### 6.1 Update STATUS.md with Final State
After all tasks complete, update STATUS.md with:
- All working URLs
- Service ports
- Credentials (redacted)
- Architecture diagram

---

## ✅ Success Criteria

- [ ] https://0711.io loads landing page
- [ ] https://vault.0711.io loads web dashboard  
- [ ] https://api.vault.0711.io/health returns healthy
- [ ] All 7 backend containers running
- [ ] Ollama connected and responding
- [ ] MinIO buckets created
- [ ] PostgreSQL extensions enabled
- [ ] Neo4j schema initialized

---

## 🎯 Execute Order

1. Phase 1 (Infrastructure) - FIRST
2. Phase 2 (Backend) 
3. Phase 3 (Frontend)
4. Phase 4 (Security)
5. Phase 5 (Monitoring)
6. Phase 6 (Documentation)

---

**When complete:** Update STATUS.md and push:
```bash
git add -A && git commit -m "🚀 Superpower deployment complete" && git push
```
