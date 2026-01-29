# TASK for Claude Code on H200

## Current Task
Deploy the Vault backend services.

## Steps
1. `cd ~/0711-Intelligence/0711-Intelligence/backend`
2. `git pull`
3. `docker compose up -d`
4. `docker ps | grep vault`
5. Report status in `STATUS.md`

## Context
- Using existing Ollama on host (port 11434)
- Traefik disabled (using Cloudflare Tunnel)
- Ports: postgres:5440, redis:6380, neo4j:7476, minio:4052, api:8000, frontend:3000

## When Done
Update `STATUS.md` with results, then:
```bash
git add STATUS.md && git commit -m "Status update from H200" && git push
```
