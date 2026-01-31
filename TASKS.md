# 0711-Vault - FOCUSED PROJECT SCOPE

## IMPORTANT: Project Boundaries

**THIS IS 0711-Vault - A STANDALONE PHOTO/DOCUMENT VAULT APP**

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

Those features belong in `/Users/m1/clawd/0711-Intelligence` - the umbrella project.

---

## What 0711-Vault IS

A **privacy-first personal photo & document vault** with:

1. **iOS App** (`Vault0711/`) - SwiftUI app with Face ID, encrypted storage
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
| Service | Port | Status |
|---------|------|--------|
| vault-postgres | 9500 | ✅ Running |
| vault-redis | 9501 | ✅ Running |
| vault-neo4j | 9502/9503 | ✅ Running |
| vault-minio | 9504/9505 | ✅ Running |
| vault-api | 9506 | ✅ Running |
| vault-ai | 8001 | ✅ Running |
| vault-frontend | 9508 | ✅ Running |
| Ollama (docker) | 11434 | ✅ Running |

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

### Phase 2: iOS App ✅
- [x] Open `Vault0711/Vault0711.xcodeproj` in Xcode
- [x] Configure signing (team signed)
- [x] Regenerated project with XcodeGen (fixed missing Services files)
- [x] Build and run on iPhone 16 Pro simulator
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

**FIXED - Needs Deploy:**
- [x] **Embedding model mismatch** - Config expected `nomic-embed-text` but server has `bge-m3:latest`
  - Updated: docker-compose.yml, docker-compose.override.yml, docker-compose.local.yml
  - Updated: config.py defaults, ai-service/main.py (now uses env vars)
  - **Deploy:** Rebuild containers on server: `cd backend && docker compose up -d --build`

**Verified Working:**
- ✅ Health endpoint returns healthy
- ✅ User registration works
- ✅ User login returns JWT token

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
- [ ] **API Endpoint** - `POST /assistant/chat` with conversation memory
- [ ] **Web Chat Panel** - Slide-out chat in vault frontend
- [ ] **Conversation History** - Store chat sessions in PostgreSQL
- [ ] **Streaming Responses** - SSE for real-time typing effect

### 6.4 Query Capabilities
The assistant should handle:
- "When did I last see [person]?" → Graph query + photo timestamps
- "Show me photos from [place/event]" → Semantic + location search
- "What was that restaurant in Berlin?" → OCR + location + time context
- "Find my insurance documents" → Document category search
- "Who was at [event]?" → Face recognition + event clustering
- "What did I do last Christmas?" → Timeline + event detection

### 6.5 Proactive Intelligence
- [ ] **"On This Day"** - Surface memories from 1/2/3+ years ago
- [ ] **Birthday Detection** - Parse dates from photos, remind about people's birthdays
- [ ] **Smart Albums** - Auto-generate albums: "Best of 2024", "Summer Adventures", "Family Moments"
- [ ] **Backup Reminders** - "You haven't uploaded photos in 2 weeks"
- [ ] **Memory Highlights** - Weekly digest of interesting rediscovered photos

---

## 📱 PHASE 7: iOS Assistant Integration

### 7.1 Chat in iOS App
- [ ] Chat view in SwiftUI (matches web design)
- [ ] Offline mode with local LLM fallback (stretch goal)
- [ ] Voice input for queries

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

### 9.1 App Store
- [ ] App screenshots (real, not mockups)
- [ ] App Store description + keywords
- [ ] Privacy policy (emphasize local-first)
- [ ] Submit to TestFlight → App Store

### 9.2 Website
- [ ] Download page with App Store badge
- [ ] Demo video showing privacy features
- [ ] "Why not Google Photos" comparison page

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

## Files to IGNORE (belong in 0711-Intelligence)

These files are in this repo but are NOT part of 0711-Vault scope:
- `ROADMAP.md` - describes the broader 0711 AI assistant ecosystem
- `ARCHITECTURE-SUMMARY.md` - describes SaaS tiers, federated learning
- `CLOUD-ONBOARDING.md` - cloud migration service (different product)
- `FLOW.md` - AI assistant conversation flows
- `CONTENT-PLAN.md` - marketing for the ecosystem

Focus ONLY on:
- `README.md` - project overview (vault only)
- `CLAUDE.md` - deployment rules
- `STATUS.md` - current deployment status
- `LAUNCH-CHECKLIST.md` - feature completion for vault
- Code in `backend/`, `frontend/`, `Vault0711/`, `website/`

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

*Last updated: 2026-01-31 18:25*
*Focus: Photo Vault App ONLY - not the 0711 AI ecosystem*
