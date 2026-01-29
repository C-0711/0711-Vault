# 0711 Vault Backend

Privacy-focused, zero-knowledge encrypted storage platform.

## Quick Start

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env with secure passwords
nano .env

# 3. Start core services
docker compose up -d postgres neo4j redis minio ollama

# 4. Wait for Ollama to download models (first run only)
docker compose logs -f ollama-init

# 5. Start application services
docker compose up -d vault-api ai-service

# 6. (Optional) Start monitoring
docker compose --profile monitoring up -d
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENTS                                  │
│   iOS App  │  Android  │  Web  │  Mac Desktop                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Traefik   │  API Gateway, SSL, Rate Limiting
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   ┌──────────┐     ┌──────────┐     ┌──────────┐
   │ Auth API │     │ Vault API│     │ AI API   │
   │(Keycloak)│     │ (FastAPI)│     │ (FastAPI)│
   └──────────┘     └────┬─────┘     └────┬─────┘
                         │                 │
    ┌────────────────────┼─────────────────┼────────────────┐
    ▼            ▼       ▼       ▼         ▼                ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Postgres│ │ Neo4j  │ │ Redis  │ │ MinIO  │ │ Ollama │
│+vector │ │        │ │        │ │  (S3)  │ │ (LLM)  │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Traefik | 80, 443, 8080 | API Gateway + Dashboard |
| Vault API | 8000 | Main application API |
| AI Service | 8001 | Embeddings, OCR, Analysis |
| Keycloak | 8180 | Authentication |
| PostgreSQL | 5432 | Primary database + vectors |
| Neo4j | 7474, 7687 | Graph database |
| Redis | 6379 | Cache + Pub/Sub |
| MinIO | 9000, 9001 | Object storage |
| Ollama | 11434 | Local LLM inference |

## Security

### Zero-Knowledge Architecture

The server **never** sees:
- User passwords
- Encryption keys
- Plaintext data

All encryption happens client-side before upload.

### Encryption Flow

```
User Password
     │
     ├─── PBKDF2 ───► Auth Key (for login)
     │
     └─── PBKDF2 ───► Encryption Key
                           │
                           ▼
                    ┌─────────────┐
                    │ Master Key  │ (random, per-user)
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         ┌────────┐  ┌────────┐  ┌────────┐
         │ Photos │  │  Docs  │  │Messages│
         └────────┘  └────────┘  └────────┘
```

## API Endpoints

### Authentication
```
POST /auth/register     - Create account
POST /auth/login        - Get tokens
POST /auth/refresh      - Refresh token
GET  /auth/salt/{email} - Get salt for key derivation
```

### Vault
```
POST   /vault/items           - Create item + get upload URL
GET    /vault/items           - List items
GET    /vault/items/{id}      - Get item metadata
DELETE /vault/items/{id}      - Delete item
```

### Search
```
POST /search/semantic   - Vector similarity search
POST /search/graph      - Neo4j graph queries
```

### Sync
```
POST /sync/pull    - Get changes since last sync
POST /sync/push    - Upload local changes
GET  /sync/status  - Check sync status
```

## Development

### Run locally without Docker

```bash
# Terminal 1: PostgreSQL
docker run -d --name pg -p 5432:5432 \
  -e POSTGRES_USER=vault \
  -e POSTGRES_PASSWORD=vault \
  pgvector/pgvector:pg16

# Terminal 2: Ollama
ollama serve

# Terminal 3: API
cd services/vault-api
pip install -r requirements.txt
uvicorn main:app --reload
```

### Database Migrations

```bash
cd services/vault-api
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Models (Ollama)

| Model | Size | Use Case |
|-------|------|----------|
| nomic-embed-text | 274MB | Text embeddings (768 dim) |
| llava:7b | 4.7GB | Image description |
| llama3.2:3b | 2GB | Text generation |

To add more models:
```bash
docker exec -it 0711-ollama ollama pull <model>
```

## Backup

### PostgreSQL
```bash
docker exec 0711-postgres pg_dump -U vault vault > backup.sql
```

### Neo4j
```bash
docker exec 0711-neo4j neo4j-admin dump --database=neo4j --to=/backup/neo4j.dump
```

### MinIO
```bash
docker run --rm -v minio-data:/data alpine tar -czvf - /data > minio-backup.tar.gz
```

## Production Deployment

1. Use proper SSL certificates (Let's Encrypt via Traefik)
2. Set strong passwords in `.env`
3. Enable rate limiting
4. Set up monitoring (Prometheus + Grafana)
5. Configure backups
6. Use external managed databases if needed

## License

Proprietary - 0711
