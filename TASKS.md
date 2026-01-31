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

**Note:** Using `api-vault.0711.io` (not `api.vault.0711.io`) due to SSL wildcard limitation.

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
| Ollama (host) | 11434 | ⚠️ Unavailable |

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
- [x] Verify Ollama models: `ollama list` (nomic-embed-text ✓, llava:7b ✓)
- [x] Fix vault-api → Ollama connectivity (local works via docker-compose.local.yml)
- [x] E2E testing: Registration, Login, Stats, Create Item ✓
- [ ] **Fix production Ollama** - semantic search fails (Ollama not reachable from prod container)
- [ ] **Fix MinIO external URL** - upload URLs return internal `minio:9000`, need public URL

### Known Issues (Production)
1. **Ollama unavailable** - API health shows `"ollama": "unavailable"` on prod
2. **MinIO internal URLs** - Upload URLs point to `minio:9000` instead of public endpoint

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

*Last updated: 2026-01-31 16:45*
*Focus: Photo Vault App ONLY - not the 0711 AI ecosystem*
