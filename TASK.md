# TASK for Claude Code (H200)

## Protocol
1. Pull this repo to get tasks
2. Execute the task
3. Write results to `STATUS.md`
4. Push: `git add -A && git commit -m "Status update" && git push`

---

## Current Task
✅ COMPLETED - Vault deployment on ports 9500+

Run:
```bash
docker ps | grep vault
```

And report what containers are running (or any errors).

## Deployment Configuration (see CLAUDE.md for rules)
- **Port Range**: 9500-9599
- **Ollama**: Using host Ollama on port 11434
- **Traefik**: Disabled (using Cloudflare Tunnel)

## Critical Rules
- NEVER modify or stop existing containers
- NEVER touch existing data
- All deployments use port 9500+
