# TASK: Finish Vault 0711 Deployment

## 1. Update Cloudflare Tunnel Config

Edit `~/.cloudflared/config.yml` and update the vault entries to use new ports:

```yaml
  # Vault (new ports)
  - hostname: vault.0711.io
    service: http://localhost:9508
  - hostname: api.vault.0711.io
    service: http://localhost:9506
  - hostname: app.vault.0711.io
    service: http://localhost:9508
```

Then restart the tunnel (find the running cloudflared process and restart it).

## 2. Fix MediaPipe Issue in ai-service

Edit `~/0711-Intelligence/0711-Intelligence/backend/services/ai-service/requirements.txt`:
- Pin mediapipe: `mediapipe==0.10.9`

Then rebuild:
```bash
cd ~/0711-Intelligence/0711-Intelligence/backend
docker compose build ai-service
docker compose up -d ai-service
```

## 3. Test Endpoints

```bash
# Test API health
curl http://localhost:9506/health

# Test frontend
curl -I http://localhost:9508

# Test from outside (after tunnel restart)
curl https://vault.0711.io
curl https://api.vault.0711.io/health
```

## 4. Report Results

Update STATUS.md with:
- Cloudflare tunnel status
- ai-service fix result
- Endpoint test results
- Public URLs working or not

Then push:
```bash
git add -A && git commit -m "Vault deployment complete" && git push
```
