# Claude Code Deployment Rules

## Critical Rules - NEVER VIOLATE

1. **NEVER cut off existing ports** - Do not stop, remove, or modify any existing running containers
2. **NEVER touch existing data** - Do not modify volumes, databases, or any existing data stores
3. **All new deployments start at port 9500+** - Use port range 9500-9599 for all Vault backend services

## Vault Backend Port Assignments

- **vault-postgres**: 9500 (container 5432)
- **vault-redis**: 9501 (container 6379)
- **vault-neo4j**: 9502 (HTTP), 9503 (Bolt)
- **vault-minio**: 9504 (API), 9505 (Console)
- **vault-api**: 9506
- **vault-ai-service**: 9507
- **vault-frontend**: 9508

## Deployment Process

1. Always check existing ports with `docker ps --format "table {{.Names}}\t{{.Ports}}"`
2. Use docker-compose.override.yml for port customization
3. Deploy with `docker compose up -d`
4. Verify with `docker ps | grep vault`
5. Update STATUS.md with results
