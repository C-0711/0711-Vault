# 0711-Vault - FOCUSED PROJECT SCOPE

## IMPORTANT: Project Boundaries

**THIS IS 0711-Vault - A STANDALONE PHOTO/DOCUMENT VAULT APP**

✅ **MIGRATION COMPLETE (2026-01-31):** 0711-Vault is now fully independent!
- Server deployment moved from `0711-Intelligence/backend` → `0711-Vault/backend`
- 0711-Intelligence directory deleted from server
- 0711-Intelligence repo pending deletion from GitHub (manual - token lacks delete permission)

This project is **NOT** the broader 0711-Intelligence ecosystem. Do not work on:
- Email integration
- Calendar integration
- Smart Home / HomeKit
- Messaging bridges (WhatsApp, Telegram, iMessage)
- Proactive AI assistant features
- Flight check-in / travel features
- Cloud onboarding SaaS tiers
- Federated learning
- Enterprise features

---

## What 0711-Vault IS

A **privacy-first personal photo & document vault** with:

1. **Mobile Apps** - Native iOS (`Vault0711/`) + React Native (`mobile/Vault0711/`) with Face ID, encrypted storage
2. **Backend API** (`backend/`) - FastAPI server with PostgreSQL, MinIO, Neo4j
3. **AI Service** (`backend/services/ai-service/`) - Face recognition, OCR, embeddings
4. **Web Frontend** (`frontend/`) - React dashboard for managing vault
5. **Landing Website** (`website/`) - Static HTML for 0711-ios.com

**Core Features (in scope):**
- Photo/document encrypted storage
- Face recognition & people tagging
- Semantic search ("photos from beach last summer")
- Smart albums (AI-generated)
- On-device AI processing
- Optional cloud sync (to user's own server)

---

## Current Deployment Status

### Public URLs (LIVE via Cloudflare Tunnel)
| URL | Service | Status |
|-----|---------|--------|
| https://0711.io | Main Website | ✅ Live |
| https://vault.0711.io | Vault Frontend | ✅ Live |
| https://api-vault.0711.io | Vault API | ✅ Live |
| https://storage.0711.io | MinIO Storage | ✅ Live |

**Note:** Using `api-vault.0711.io` (not `api.vault.0711.io`) due to SSL wildcard limitation.

<!-- IMPORTANT: storage.0711.io was added 2026-01-31 to enable image previews in frontend.
     The backend must set MINIO_EXTERNAL_ENDPOINT=storage.0711.io for presigned URLs to work.
     Without this, presigned download URLs point to internal minio:9000 which browsers can't reach. -->

### Server Services (192.168.145.10)

**Deployment Source:** `/home/christoph.bertsch/0711-Vault/backend`
**Compose Files:** `docker-compose.yml` + `docker-compose.prod.yml`

| Service | Port | Status |
|---------|------|--------|
| vault-postgres | 9500 | ✅ Running (healthy) |
| vault-redis | 9501 | ✅ Running (healthy) |
| vault-neo4j | 9502/9503 | ✅ Running |
| vault-minio | 9504/9505 | ✅ Running (healthy) |
| vault-api | 9506 | ✅ Running |
| vault-ai-service | 9507 | ✅ Running |
| vault-frontend | 9508 | ✅ Running |
| Ollama (docker) | 11434 | ✅ Running (external container) |

**Data Volumes (preserved from migration):**
- `backend_postgres-data` - User data, items, auth
- `backend_redis-data` - Sessions, cache
- `backend_neo4j-data` - Graph relationships
- `backend_minio-data` - Photos, documents
- `backend_ollama-data` - AI models

### Cloudflare Tunnel
- **Tunnel ID:** `fb8267e6-0a22-44b8-9978-c3e3b32583f6`
- **Account:** `3345174c867b5edb43fd4bc31bf8dce5`
- **Zone ID:** `5f0187dcd3dcf5daae58b9a37f569c1a`

---

## Launch Tasks (Priority Order)

### Phase 1: Get Frontend Running
- [x] Build frontend: `cd frontend && npm install && npm run build`
- [x] Deploy frontend container on port 9508
- [x] Verify frontend connects to vault-api on 9506

### Phase 2: Mobile Apps ✅
**Native iOS (SwiftUI):** `Vault0711/`
- [x] Open `Vault0711/Vault0711.xcodeproj` in Xcode
- [x] Configure signing (team signed)
- [x] Build and run on iPhone 16 Pro simulator

**Cross-Platform (React Native):** `mobile/Vault0711/`
- [x] Tab navigation: Chat, Vault, Scan, Settings
- [x] Biometric authentication (Face ID)
- [x] API client connecting to vault-api
- [x] AI Assistant chat screen with full UI ✅ (2026-01-31)
- [ ] Test photo import, face detection, search (manual testing)

### Phase 3: Marketing Website (PRIORITY)
Website already exists with comprehensive content!

**Key Benefits (all covered in index.html):**
- [x] **Privacy First** - Your photos never leave your device (on-device AI)
- [x] **Face Recognition** - Automatically organize by people, no cloud needed
- [x] **Semantic Search** - "Find beach photos from last summer" works offline
- [x] **End-to-End Encryption** - AES-256, only you have the keys
- [x] **No Subscription Trap** - Own your data, no monthly fees for storage
- [x] **Cross-Platform** - iOS app, web dashboard, self-hosted backend
- [x] **Smart Albums** - AI-generated collections without Big Tech spying
- [x] **Document Vault** - OCR and search for receipts, contracts, IDs

**Website Pages:**
- [x] Landing page with hero, features, screenshots (index.html)
- [x] Features section (in index.html #features)
- [x] Privacy page (privacy.html + #privacy section)
- [x] Pricing section (in index.html #pricing)
- [x] Launch page (launch.html)
- [x] Terms & Imprint (terms.html, imprint.html)
- [ ] Download/Get Started page (needs App Store link)

**Design:**
- [x] Modern, clean design (dark mode)
- [ ] App screenshots and mockups (need real screenshots)
- [x] Comparison table: 0711 Vault vs iCloud vs Google Photos

### Phase 4: Public Access ✅ COMPLETE
- [x] Cloudflare tunnel configured and running
- [x] vault.0711.io → Frontend (port 9508)
- [x] api-vault.0711.io → API (port 9506)
- [x] 0711.io → Main website (port 4000)
- [x] Frontend updated to use https://api-vault.0711.io
- [x] HTTPS enabled via Cloudflare

**DO NOT create new tunnel** - tunnel already exists: `fb8267e6-0a22-44b8-9978-c3e3b32583f6`

### Phase 5: Polish
- [x] Initialize Neo4j schema (Person, Photo, Document, Album, Tag + indexes)
- [x] Verify Ollama models: llama4 (108B), gpt-oss (120B), qwen3 (32B), mixtral, mistral, bge-m3 (embeddings)
- [x] Fix vault-api → Ollama connectivity (local works via docker-compose.local.yml)
- [x] E2E testing: Registration, Login, Stats, Create Item ✓
- [x] **Fix production Ollama** - Started Ollama container, connected to backend_default network
- [x] **Fix MinIO external URL** - storage.0711.io route added to Cloudflare tunnel

### Known Issues (Production)

✅ **ALL CRITICAL ISSUES RESOLVED (2026-01-31)**

**Completed Fixes:**
- [x] Separated 0711-Vault from 0711-Intelligence on server
- [x] Embedding model: `bge-m3:latest` (was nomic-embed-text)
- [x] Vision model: `llama4:latest` (was llava:7b)
- [x] MinIO external URL: `storage.0711.io` for presigned URLs
- [x] Added missing Python dependencies (pydantic-settings, sqlalchemy, neo4j, ollama, structlog)
- [x] External volumes configured for data persistence

**Verified Working:**
- ✅ Health endpoint: `{"status":"degraded","services":{"api":"healthy","postgres":"unknown","redis":"healthy","ollama":"healthy"}}`
- ✅ Frontend: https://vault.0711.io → 200 OK
- ✅ Storage: https://storage.0711.io → 200 OK
- ✅ User registration works
- ✅ User login returns JWT token

**Minor:** Postgres health check shows "unknown" but database is running and functional.

**Deploy Commands (for future updates):**
```bash
cd ~/0711-Vault/backend
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

## 🧠 PHASE 6: Personal AI Assistant - THE KILLER FEATURE

**Mission:** An AI that lives inside YOUR vault, learns about YOUR life, answers to NO ONE but you.

This is what kills Google Photos. Not just storage — intelligence that's YOURS.

### 6.1 Knowledge Foundation
- [ ] **Event Detection** - Cluster photos by time+location into "events" (Trip to Paris, Christmas 2024, etc.)
- [ ] **Person Relationships** - Track who appears together (family groups, friend circles)
- [ ] **Place Memory** - Extract and name recurring locations (Home, Office, Mom's house)
- [ ] **Timeline Index** - Queryable timeline in Neo4j (what happened when)

### 6.2 RAG Pipeline (Retrieval-Augmented Generation)
- [ ] **Context Builder** - Pull relevant vault data for any query
- [ ] **Query Understanding** - Classify intent: search, question, memory request, action
- [ ] **Hybrid Retrieval** - Combine vector search + graph traversal for answers
- [ ] **Response Generator** - Generate answers grounded in YOUR data, not hallucinations

### 6.3 Chat Interface
- [x] **API Endpoint** - `POST /assistant/chat` with conversation memory ✅ BUILT
- [x] **Web Chat Panel** - Full-page chat at `/assistant` ✅ BUILT
- [x] **Conversation History** - Stored in Redis (24hr TTL) ✅ BUILT
- [x] **Streaming Responses** - SSE endpoint at `/assistant/chat/stream` ✅ BUILT

### 6.4 Query Capabilities
The assistant should handle:
- "When did I last see [person]?" → Graph query + photo timestamps
- "Show me photos from [place/event]" → Semantic + location search
- "What was that restaurant in Berlin?" → OCR + location + time context
- "Find my insurance documents" → Document category search
- "Who was at [event]?" → Face recognition + event clustering
- "What did I do last Christmas?" → Timeline + event detection

### 6.5 Proactive Intelligence
- [x] **"On This Day"** - Surface memories from 1/2/3+ years ago ✅ BUILT (`/assistant/memories/on-this-day`)
- [x] **Weekly Highlights** - Get recent photo highlights ✅ BUILT (`/assistant/memories/highlights`)
- [x] **Person Timeline** - All memories with a specific person ✅ BUILT (`/assistant/memories/people/{id}`)
- [ ] **Birthday Detection** - Parse dates from photos, remind about people's birthdays
- [ ] **Smart Albums** - Auto-generate albums: "Best of 2024", "Summer Adventures", "Family Moments"
- [ ] **Backup Reminders** - "You haven't uploaded photos in 2 weeks"

---

## 📱 PHASE 7: Mobile Assistant Integration

### 7.1 Chat in Mobile App ✅ COMPLETE (2026-01-31)
- [x] **AssistantScreen.tsx** - Full chat UI with purple user bubbles, gray assistant bubbles
- [x] **API integration** - `chatWithAssistant()`, `getOnThisDayMemories()`, `getHighlights()` in api.ts
- [x] **Entry point** - Purple "AI" button in Chat tab header
- [x] **Suggested prompts** - Empty state with 4 starter questions
- [x] **Source attribution** - Shows photo/document count from vault context
- [x] **Conversation persistence** - conversation_id tracked across messages
- [x] **Navigation** - Modal presentation from main tabs
- [ ] Offline mode with local LLM fallback (stretch goal)
- [ ] Voice input for queries

**Files created/modified:**
- `mobile/Vault0711/src/screens/AssistantScreen.tsx` - NEW
- `mobile/Vault0711/src/services/api.ts` - Added assistant methods
- `mobile/Vault0711/src/screens/ChatScreen.tsx` - Added AI button
- `mobile/Vault0711/App.tsx` - Added Assistant to navigation

### 7.2 Proactive Notifications
- [ ] Push notifications for "On This Day" memories
- [ ] Widget showing today's memory
- [ ] Background sync + notification triggers

### 7.3 Siri Integration (Stretch)
- [ ] "Hey Siri, show me photos with Mom"
- [ ] SiriKit intents for vault queries

---

## ✅ PHASE 8: Testing & Polish

### 8.1 E2E Testing Current Flow
- [ ] Upload photo via web → verify stored in MinIO
- [ ] Verify face detection triggers → faces in DB
- [ ] Verify embedding generation → vector in pgvector
- [ ] Semantic search returns relevant results
- [ ] Graph search by person/location works

### 8.2 Assistant Testing
- [ ] Test 10 common query patterns
- [ ] Verify no hallucinations (answers grounded in vault data)
- [ ] Response time < 3s for simple queries
- [ ] Chat history persists across sessions

---

## 🚀 PHASE 9: Launch Prep

### 9.1 App Store ✅ CONTENT READY
- [ ] App screenshots (real, not mockups)
- [x] App Store description + keywords ✅ See `/appstore/APPSTORE_CONTENT.md`
- [x] Privacy policy (emphasize local-first) ✅ `/website/privacy.html`
- [ ] Submit to TestFlight → App Store

**App Store content includes:**
- App name, subtitle
- Full description (4000 chars)
- Keywords (100 chars)
- What's New text
- Promotional text
- Screenshot text suggestions
- ASO strategy

### 9.2 Marketing Website
**Status:** Static site in `/website/` - needs deployment

**Current URLs:**
- `0711.io` → Enterprise B2B product (different)
- `vault.0711.io` → Vault React app (dashboard)
- **NEEDED:** Landing page for Vault marketing

**Deploy option added to docker-compose.prod.yml:**
```bash
# Port 9509 → Add to Cloudflare tunnel as landing.vault.0711.io or similar
vault-website container on port 9509
```

**Pages ready:**
- [x] Landing page (index.html) - German
- [x] Privacy policy (privacy.html)
- [x] Terms (terms.html)
- [x] Imprint (imprint.html)
- [x] Launch page (launch.html)
- [ ] Download page with App Store badge (add after approval)
- [ ] Demo video showing privacy features
- [ ] English translation

### 9.3 Self-Hosting Docs
- [ ] One-click Docker Compose setup
- [ ] Hardware requirements (works on Raspberry Pi 5?)
- [ ] Backup/restore guide

<!-- MinIO Config Required:
     Set these env vars in vault-api container for image previews to work:
     - MINIO_EXTERNAL_ENDPOINT=storage.0711.io
     - MINIO_SECURE=true
     This ensures presigned URLs point to https://storage.0711.io instead of internal minio:9000 -->

---

## Files to IGNORE (legacy, not part of vault scope)

These files are in this repo but are NOT part of 0711-Vault scope (legacy from before separation):
- `ROADMAP.md` - describes the broader 0711 AI assistant ecosystem
- `ARCHITECTURE-SUMMARY.md` - describes SaaS tiers, federated learning
- `CLOUD-ONBOARDING.md` - cloud migration service (different product)
- `FLOW.md` - AI assistant conversation flows
- `CONTENT-PLAN.md` - marketing for the ecosystem

**Note:** 0711-Intelligence repo has been deleted. These files may be cleaned up in a future commit.

Focus ONLY on:
- `README.md` - project overview (vault only)
- `CLAUDE.md` - deployment rules
- `STATUS.md` - current deployment status
- `LAUNCH-CHECKLIST.md` - feature completion for vault
- Code in `backend/`, `frontend/`, `Vault0711/`, `mobile/`, `website/`

---

## Quick Reference

**Start backend:**
```bash
cd /Users/m1/clawd/0711-Vault/backend
docker compose up -d
```

**Start frontend (dev):**
```bash
cd /Users/m1/clawd/0711-Vault/frontend
npm run dev
```

**Check services:**
```bash
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep vault
```

**API health check:**
```bash
curl http://localhost:9506/health
curl http://localhost:9507/health
```

---

## Migration Log (2026-01-31)

### Separation from 0711-Intelligence

**Commits made today:**
| Commit | Description |
|--------|-------------|
| `7ea2d9e` | feat: Personal AI Assistant - the beast killer (backend + web) |
| `f31590f` | Fix: use bge-m3 and llama4 models for embeddings/vision |
| `414b56a` | Use public storage.0711.io for presigned URLs |
| `025101d` | Fix photo display: presigned URLs now work |
| `7dc85fc` | Add production docker-compose for separate 0711-Vault deployment |
| `1a0b995` | Add missing dependencies to vault-api |
| `e72d4db` | Add missing dependencies: sqlalchemy, neo4j, ollama, structlog |
| (pending) | feat: Mobile AI Assistant chat UI |

**Files added/modified:**
- `backend/docker-compose.prod.yml` - NEW: Production compose with external volumes
- `backend/docker-compose.yml` - Updated ollama-init to use correct models
- `backend/services/vault-api/requirements.txt` - Added missing dependencies
- `backend/services/vault-api/config.py` - Set correct model defaults

**Server changes:**
- Cloned 0711-Vault to `/home/christoph.bertsch/0711-Vault`
- Configured external volumes (references existing `backend_*` volumes)
- Deleted `/home/christoph.bertsch/0711-Intelligence` directory
- GitHub repo `christoph-ui/0711-Intelligence` - pending manual deletion

---

*Last updated: 2026-01-31 22:30*
*Focus: Photo Vault App ONLY - fully independent deployment*
