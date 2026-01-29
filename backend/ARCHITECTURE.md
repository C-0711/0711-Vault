# 0711 Vault - Backend Architektur

## Übersicht

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CLIENTS                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │ iOS App  │  │ Android  │  │   Web    │  │   Mac    │                │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘                │
└───────┼─────────────┼─────────────┼─────────────┼───────────────────────┘
        │             │             │             │
        └─────────────┴──────┬──────┴─────────────┘
                             │ HTTPS/WSS
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY (Traefik)                           │
│                    Rate Limiting, SSL, Load Balancing                    │
└─────────────────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   AUTH API    │  │   VAULT API   │  │   AI API      │
│   (Keycloak)  │  │   (FastAPI)   │  │   (FastAPI)   │
│               │  │               │  │               │
│ • Login/2FA   │  │ • CRUD Ops    │  │ • Embeddings  │
│ • OAuth2      │  │ • Sync        │  │ • OCR         │
│ • Tokens      │  │ • Sharing     │  │ • Tagging     │
└───────────────┘  └───────┬───────┘  └───────┬───────┘
                           │                   │
        ┌──────────────────┴───────────────────┴──────────────────┐
        │                                                          │
        ▼                    ▼                    ▼                ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  PostgreSQL   │  │    Neo4j      │  │    MinIO      │  │    Ollama     │
│  + pgvector   │  │               │  │   (S3 API)    │  │   (Local LLM) │
│               │  │               │  │               │  │               │
│ • Users       │  │ • People      │  │ • Encrypted   │  │ • llama3      │
│ • Metadata    │  │ • Locations   │  │   Files       │  │ • mistral     │
│ • Embeddings  │  │ • Events      │  │ • Thumbnails  │  │ • nomic-embed │
│ • Messages    │  │ • Connections │  │               │  │               │
└───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘
```

## Warum diese Komponenten?

### PostgreSQL + pgvector
- **Hauptdatenbank** für strukturierte Daten
- **pgvector** für semantische Suche ("Fotos vom Strand 2023")
- ACID-compliant, bewährt, skalierbar

### Neo4j
- **Graph-Beziehungen** zwischen Entitäten
- "Wer ist auf diesem Foto?" → Personen-Graph
- "Welche Dokumente gehören zusammen?" → Dokument-Cluster
- Zeitlinien, Orte, Events

### MinIO
- **S3-kompatibel**, self-hosted
- Verschlüsselte Dateien (Client-seitig!)
- Thumbnails, Previews
- Einfache Backups

### Ollama (Local LLM)
- **100% lokal** = maximale Privatsphäre
- Embeddings für Vektorsuche
- OCR + Dokumentenanalyse
- Optional: Cloud-LLM Fallback

## Datenfluss: Foto-Import

```
[iOS App]
    │
    │ 1. Foto auswählen (PHPicker)
    │
    ▼
[Client-Side Encryption]
    │
    │ 2. AES-256 verschlüsseln
    │    Key = User Master Key
    │
    ▼
[Upload API]
    │
    │ 3. Encrypted Blob → MinIO
    │    Metadata → PostgreSQL
    │
    ▼
[AI Service] (async)
    │
    │ 4. Thumbnail generieren (encrypted)
    │    Embedding erstellen (Ollama)
    │    → pgvector speichern
    │
    ▼
[Neo4j Update]
    │
    │ 5. Gesichtserkennung → Person-Nodes
    │    Ort → Location-Node
    │    Datum → Event-Node
    │
    ▼
[Sync to Other Devices]
```

## Sicherheitskonzept

### Zero-Knowledge Architektur
```
┌─────────────────────────────────────────────┐
│                  CLIENT                      │
│  ┌─────────────────────────────────────┐    │
│  │         Master Password              │    │
│  │              ↓                        │    │
│  │     PBKDF2 (100k iterations)        │    │
│  │              ↓                        │    │
│  │       Master Key (AES-256)          │    │
│  │              ↓                        │    │
│  │    ┌────────┴────────┐              │    │
│  │    ↓                 ↓              │    │
│  │ Encryption Key   Auth Key           │    │
│  │ (für Daten)      (für Login)        │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
                    │
                    │ Nur Auth Key + 
                    │ Encrypted Data
                    ▼
┌─────────────────────────────────────────────┐
│                  SERVER                      │
│                                              │
│  ✗ Kein Zugriff auf Master Password         │
│  ✗ Kein Zugriff auf Encryption Key          │
│  ✗ Kein Zugriff auf Plaintext-Daten         │
│                                              │
│  ✓ Speichert nur verschlüsselte Blobs       │
│  ✓ Kann Auth verifizieren                    │
│  ✓ Kann Sync koordinieren                    │
└─────────────────────────────────────────────┘
```

## API Endpoints (Vault API)

```
POST   /auth/register          # Account erstellen
POST   /auth/login             # Login + Token
POST   /auth/2fa/setup         # 2FA aktivieren

GET    /vault/sync             # Änderungen seit Timestamp
POST   /vault/sync             # Änderungen hochladen

POST   /photos/upload          # Encrypted Foto hochladen
GET    /photos/{id}            # Encrypted Foto abrufen
GET    /photos/{id}/thumb      # Encrypted Thumbnail
DELETE /photos/{id}            # Foto löschen

POST   /search/semantic        # Vektor-Suche
POST   /search/graph           # Graph-Query (Neo4j)

GET    /messages/threads       # Alle Chats
GET    /messages/{thread_id}   # Chat-Nachrichten
POST   /messages/send          # Nachricht senden (E2E)

WS     /realtime               # WebSocket für Sync/Chat
```

## Deployment Optionen

### Option A: Self-Hosted (Maximum Privacy)
- User hostet selbst auf eigenem Server
- Alles lokal, keine Cloud
- Für technisch versierte User

### Option B: Managed (0711 Cloud)
- 0711 betreibt Server
- Zero-Knowledge: Wir sehen keine Daten
- Einfacher für normale User

### Option C: Hybrid
- Auth + Sync über 0711 Cloud
- Dateien auf eigenem NAS/Cloud
- Beste Balance
