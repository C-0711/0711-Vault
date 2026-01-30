# TASK: Finish Vault 0711 - Core Only

**Skip AI service for now. Just get frontend + API working.**

## 1. Update Cloudflare Tunnel Config

Edit `~/.cloudflared/config.yml`:

Add/update these entries (keep existing 0711.io entries):
```yaml
  - hostname: vault.0711.io
    service: http://localhost:9508
  - hostname: api.vault.0711.io
    service: http://localhost:9506
```

## 2. Restart Tunnel

```bash
pkill cloudflared
./cloudflared tunnel run &
```

## 3. Test

```bash
curl -I http://localhost:9508
curl http://localhost:9506/health
curl -I https://vault.0711.io
curl https://api.vault.0711.io/health
```

## 4. Report

Update STATUS.md with results, then push.

---

**Ignore ai-service for now** - will integrate later.
