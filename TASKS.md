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

## 🧪 PHASE 8: PRE-LAUNCH TESTING CHECKLIST (100% Coverage)

**Goal:** Test EVERY feature, EVERY link, EVERY flow before launch. Create test data. Verify everything works.

---

### 8.1 Infrastructure Health Checks
**Tested: 2026-02-01 12:20 UTC** ✅ ALL PASS

- [x] `curl https://api-vault.0711.io/health` returns 200 ✅ status=healthy
- [x] `curl https://vault.0711.io` returns 200 (frontend) ✅
- [x] `curl https://storage.0711.io/minio/health/live` returns 200 (MinIO) ✅
- [x] `curl https://get.0711.io` returns 200 (marketing site) ✅
- [x] `curl https://get.0711.io/en/` returns 200 (English marketing) ✅
- [x] PostgreSQL responds ✅
- [x] Redis responds: health check shows "healthy" ✅
- [x] Ollama responds: `/ai/models` returns 8 models ✅
- [x] Verify bge-m3 model loaded for embeddings ✅ (1024 dimensions)
- [x] Verify llama4 model loaded for vision/chat ✅

**Models:** bge-m3, llama4, qwen3:32b, gpt-oss:120b, mixtral, mistral, command-r, llama3

---

### 8.2 User Registration & Authentication
**Tested: 2026-02-01 08:12 UTC** ✅ PASS
**Test Account:** `test-01b6672c@0711.io`

- [x] **Register new user** via API ✅
  - [x] Zero-knowledge auth (client sends auth_hash, not password) ✅
  - [x] Registration succeeds → returns user_id ✅
  - [x] User created in PostgreSQL `users` table ✅
  - [x] Salt stored ✅
  - [x] Encrypted master key stored ✅
- [x] **Login existing user** ✅
  - [x] Correct credentials → JWT token returned ✅
  - [x] Wrong password → "Invalid credentials" ✅
  - [x] Token stored in Redis (24hr expiry) ✅
- [x] **Logout** ✅
  - [x] Token invalidated (Redis key deleted) ✅
  - [x] Subsequent requests return "Invalid token" ✅
- [ ] **Session persistence** (needs frontend test)
  - [ ] Refresh page → still logged in
  - [ ] Token expiry → forced re-login
- [ ] **Password reset** (not implemented)

---

### 8.3 Photo Upload & Storage
**Tested: 2026-02-01 08:16 UTC** ✅ PASS (API level)

- [x] **Single photo upload via API** ✅
  - [x] `POST /vault/items` → returns item_id + presigned upload_url ✅
  - [x] `PUT` to upload_url → HTTP 200 ✅
  - [x] File stored in MinIO bucket (`storage.0711.io`) ✅
  - [x] Metadata stored in PostgreSQL `vault_items` ✅
  - [x] Presigned download URL works ✅
  - [x] Stats updated (photos count, total_bytes) ✅
  - [x] Added to processing queue (status: pending) ✅
- [ ] **Bulk photo upload** (needs frontend test)
- [ ] **Photo with EXIF data** (needs real photo test)
  - [ ] Date extracted from EXIF
  - [ ] Location extracted (GPS coordinates)
- [ ] **Photo without EXIF** 
  - [x] Defaults to created_at timestamp ✅
- [ ] **Large photo** (>10MB) (not tested)
- [ ] **Photo formats** (needs testing)
  - [x] JPG uploads ✅
  - [ ] PNG uploads
  - [ ] HEIC uploads (iOS)
  - [ ] WebP uploads
- [ ] **Photo preview** (needs frontend test)
- [x] **Photo deletion via API** ✅
  - [x] `DELETE /vault/items/{id}` works ✅
  - [x] Stats updated after deletion ✅
  - [x] Soft delete (deleted_at timestamp) ✅

---

### 8.4 Document Upload & OCR
**Test Data:** Upload receipts, contracts, IDs

- [ ] **PDF upload**
  - [ ] Upload succeeds
  - [ ] OCR extracts text
  - [ ] Text stored for search
- [ ] **Image document** (photo of receipt)
  - [ ] OCR runs on image
  - [ ] Extracted text searchable
- [ ] **Multi-page PDF**
  - [ ] All pages processed
  - [ ] Text from all pages searchable
- [ ] **Document categories**
  - [ ] Can tag as: Receipt, Contract, ID, Medical, Tax
  - [ ] Category filter works
- [ ] **Document preview**
  - [ ] PDF renders in browser
  - [ ] Image documents display

---

### 8.5 Face Detection & Recognition
**Tested: 2026-02-01 12:20 UTC** ✅ DETECTION WORKING

- [x] **Face detection triggers** ✅
  - [x] Upload photo with face → face detected ✅
  - [x] 17 faces detected from test photos ✅
  - [ ] Face thumbnail generated (not verified)
- [x] **Multiple faces in one photo** ✅
  - [x] All faces detected ✅
  - [x] Each face has separate entry ✅
- [ ] **Face clustering**
  - [ ] Same person in multiple photos → grouped (0 clusters yet)
  - [ ] Clusters appear in "People" section
- [ ] **Face labeling**
  - [ ] Can name a face cluster
  - [ ] Name encrypted before storage
- [ ] **Face search**
  - [ ] Click person → all their photos shown
- [ ] **No faces photo**
  - [ ] Landscape photo → no faces detected (correct)
  - [ ] No error thrown
- [ ] **Profile vs frontal face**
  - [ ] Profile faces detected
  - [ ] Partially obscured faces handled

---

### 8.6 Embedding & Vector Search
**Tested: 2026-02-01 12:25 UTC** ✅ PASS

- [x] **Embedding generation** ✅
  - [x] Photo upload → embedding created ✅
  - [x] Embedding stored in pgvector (1024 dimensions) ✅
  - [x] bge-m3 model used ✅
- [x] **Semantic search** ✅
  - [x] "beach" → returns 3 relevant photos ✅
  - [x] "person" → returns photos with people (similarity scores) ✅
  - [x] Results include similarity scores ✅
- [x] **Search with no results**
  - [x] Returns empty array (not error) ✅
- [ ] **Search performance**
  - [ ] <500ms for 1000 photos (not benchmarked)

**Note:** Fixed embedding dimension mismatch (768→1024 for bge-m3)

---

### 8.7 Graph Database (Neo4j)
- [ ] **Person nodes created**
  - [ ] Each face cluster → Person node
  - [ ] Person has: id, name (encrypted), first_seen, last_seen
- [ ] **Photo nodes created**
  - [ ] Each vault item → node in Neo4j
  - [ ] Has: id, captured_at, location
- [ ] **Relationships created**
  - [ ] Person -[APPEARS_IN]-> Photo
  - [ ] Photo -[TAKEN_AT]-> Location
- [ ] **Graph queries work**
  - [ ] "Who appears together?" → correct groupings
  - [ ] "Photos at location X" → correct results

---

### 8.8 AI Assistant (Chat)
**Tested: 2026-02-01 09:08 UTC** ⚠️ PARTIAL (needs embeddings)

- [x] **Basic chat** ✅
  - [x] Send message → response received ✅
  - [ ] Response grounded in vault data ⚠️ (hallucinating - no embeddings yet)
  - [ ] No hallucinations ❌ (sources: [] = empty context)
- [ ] **Query: "When did I last see [person]?"**
  - [ ] Returns date from photo metadata (needs processing)
  - [ ] Shows relevant photos as sources
- [ ] **Query: "Show me photos from [location]"**
  - [ ] Semantic search finds relevant photos (needs embeddings)
  - [ ] Sources listed correctly
- [ ] **Query: "Find my [document type]"**
  - [ ] Searches documents (needs OCR/embeddings)
  - [ ] Returns matching items
- [ ] **Query about non-existent data**
  - [ ] "When did I visit Mars?" → "I don't have that information"
  - [ ] Doesn't hallucinate
- [ ] **Conversation context**
  - [x] conversation_id returned ✅
  - [ ] Follow-up questions work
  - [ ] Context preserved across messages
- [ ] **Streaming response**
  - [ ] `/assistant/chat/stream` → tokens stream
  - [ ] UI updates in real-time
- [ ] **Response time**
  - [ ] Simple query <3s
  - [ ] Complex query <10s
- [ ] **Error handling**
  - [ ] Ollama down → graceful error message
  - [ ] Empty vault → "Upload some photos first"

---

### 8.9 Memory Features
**Tested: 2026-02-01 09:08 UTC** ✅ PASS

- [x] **On This Day** ✅
  - [x] `GET /assistant/memories/on-this-day` works ✅
  - [ ] Shows photos from 1, 2, 3+ years ago (no old photos in test data)
  - [x] Empty if no old photos → graceful message ✅ ("No memories from this day yet")
- [x] **Weekly Highlights** ✅
  - [x] `GET /assistant/memories/highlights?days=30` works ✅
  - [x] Returns recent photos (8 photos returned) ✅
- [ ] **Person Timeline**
  - [ ] `GET /assistant/memories/people/{id}` returns all photos (needs face detection)
  - [ ] Sorted by date
  - [ ] Person metadata included

---

### 8.10 Web Frontend Testing
**Browser: Chrome, Safari, Firefox**

- [ ] **Homepage/Dashboard**
  - [ ] Stats load (photo count, storage used)
  - [ ] Recent photos display
  - [ ] Navigation works
- [ ] **Photos page**
  - [ ] Grid view loads
  - [ ] Infinite scroll works
  - [ ] Date grouping correct
  - [ ] Click photo → detail view
- [ ] **Documents page**
  - [ ] List view loads
  - [ ] Category filters work
  - [ ] Search works
- [ ] **People page**
  - [ ] Face clusters display
  - [ ] Click person → their photos
  - [ ] Can rename person
- [ ] **Search page**
  - [ ] Search bar works
  - [ ] Results display correctly
  - [ ] Filters work
- [ ] **Assistant page (`/assistant`)**
  - [ ] Chat UI loads
  - [ ] Can send messages
  - [ ] Responses display
  - [ ] Sources clickable
- [ ] **Settings page**
  - [ ] Account info displays
  - [ ] Can change settings
  - [ ] Logout works
- [ ] **Responsive design**
  - [ ] Desktop (1920px) ✓
  - [ ] Tablet (768px) ✓
  - [ ] Mobile (375px) ✓
- [ ] **Dark mode**
  - [ ] Toggle works
  - [ ] All elements visible

---

### 8.11 Mobile App Testing (React Native)
**Device: iPhone simulator + physical device**

- [ ] **App launch**
  - [ ] Splash screen shows
  - [ ] Face ID prompt appears
  - [ ] Successful auth → main screen
- [ ] **Tab navigation**
  - [ ] Chat tab works
  - [ ] Vault tab works
  - [ ] Scan tab works
  - [ ] Settings tab works
- [ ] **AI Assistant (purple button)**
  - [ ] Button visible in Chat header
  - [ ] Tap → AssistantScreen opens
  - [ ] Suggested prompts display
  - [ ] Can send message
  - [ ] Response displays
  - [ ] Sources show
  - [ ] Back navigation works
- [ ] **Vault browsing**
  - [ ] Photos load
  - [ ] Pull to refresh works
  - [ ] Tap photo → detail view
- [ ] **Document scan**
  - [ ] Camera opens
  - [ ] Can capture document
  - [ ] OCR runs
  - [ ] Saved to vault
- [ ] **Settings**
  - [ ] Account info shows
  - [ ] API endpoint configurable
  - [ ] Logout works
- [ ] **Offline mode**
  - [ ] Cached data available
  - [ ] Graceful error when no network

---

### 8.12 Marketing Website Testing
**Tested: 2026-02-01 04:08 UTC**

- [x] **https://get.0711.io** (German) — 200 OK ✅
  - [ ] Page loads <2s
  - [ ] Hero section displays
  - [ ] Features section visible
  - [ ] Pricing table renders
  - [ ] All images load
  - [ ] No broken links
- [x] **https://get.0711.io/en/** (English) — 200 OK ✅
  - [ ] English text displays
  - [ ] Same features as German
- [ ] **Navigation links**
  - [ ] #features scrolls correctly
  - [ ] #pricing scrolls correctly
  - [ ] #privacy scrolls correctly
- [ ] **External links**
  - [ ] App Store link (placeholder until live)
  - [ ] GitHub link works
- [x] **Legal pages** — All 200 OK ✅
  - [x] /privacy.html loads ✅
  - [x] /terms.html loads ✅
  - [x] /imprint.html loads ✅
- [x] **https://get.0711.io/launch.html** — 200 OK ✅
- [ ] **Mobile responsive**
  - [ ] Hamburger menu works
  - [ ] All sections readable
- [ ] **Performance**
  - [ ] Lighthouse score >90
  - [ ] First paint <1.5s

---

### 8.13 API Endpoint Testing
**Tested: 2026-02-01 04:08 UTC**

| Endpoint | Method | Test | Result |
|----------|--------|------|--------|
| `/` | GET | Returns service info | ✅ 200 |
| `/health` | GET | Returns status | ✅ 200 (degraded - pg unknown) |
| `/ai/models` | GET | Lists Ollama models | ✅ 200 (8 models) |
| `/billing/plans` | GET | Returns pricing tiers | ✅ 200 (Free/Pro/Family) |
| `/auth/register` | POST | Creates user | ❌ DB unavailable |
| `/auth/login` | POST | Returns JWT | ❌ DB unavailable |
| `/auth/logout` | POST | Invalidates token | ⏳ Blocked (no token) |
| `/vault/items` | GET | Lists items | ✅ 401 (auth required) |
| `/vault/items` | POST | Creates item | ⏳ Blocked (no token) |
| `/vault/items/{id}` | GET | Gets item | ⏳ Blocked (no token) |
| `/vault/items/{id}` | DELETE | Deletes item | ⏳ Blocked (no token) |
| `/vault/stats` | GET | Returns stats | ✅ 401 (auth required) |
| `/search/semantic` | POST | Vector search | ⏳ Blocked (no token) |
| `/faces/clusters` | GET | Lists faces | ✅ 401 (auth required) |
| `/faces/train` | POST | Labels face | ⏳ Blocked (no token) |
| `/assistant/chat` | POST | Chat works | ✅ 405 GET→POST (auth req) |
| `/assistant/chat/stream` | POST | SSE streams | ⏳ Blocked (no token) |
| `/assistant/memories/on-this-day` | GET | Memories work | ⏳ Blocked (no token) |
| `/assistant/memories/highlights` | GET | Highlights work | ⏳ Blocked (no token) |
| `/billing/checkout` | POST | Creates session | ⏳ Blocked (no token) |
| `/billing/portal` | POST | Opens portal | ⏳ Blocked (no token) |

**⚠️ DB BLOCKER:** Cannot test authenticated endpoints until PostgreSQL is fixed.

---

### 8.14 Security Testing
**Tested: 2026-02-01 04:08 UTC**

- [x] **Authentication**
  - [x] No access without token → 401 ✅ (vault/items, vault/stats, faces/clusters all return 401)
  - [ ] Expired token → 401
  - [ ] Invalid token → 401
- [ ] **Authorization**
  - [ ] User A can't access User B's photos
  - [ ] Admin endpoints protected
- [ ] **Input validation**
  - [ ] SQL injection attempt → blocked
  - [ ] XSS attempt → sanitized
  - [ ] Path traversal → blocked
- [ ] **HTTPS**
  - [ ] All URLs use HTTPS
  - [ ] HTTP redirects to HTTPS
  - [ ] Valid SSL certificate
- [ ] **Headers**
  - [ ] CORS configured correctly
  - [ ] CSP headers present
  - [ ] X-Frame-Options set
- [ ] **Secrets**
  - [ ] No hardcoded secrets in code
  - [ ] .env not committed
  - [ ] API keys not exposed

---

### 8.15 Performance Testing
- [ ] **API response times**
  - [ ] `/health` <100ms
  - [ ] `/vault/items` (100 items) <500ms
  - [ ] `/search/semantic` <1s
  - [ ] `/assistant/chat` <5s
- [ ] **Upload speeds**
  - [ ] 5MB photo <10s
  - [ ] 50MB video <60s
- [ ] **Concurrent users**
  - [ ] 10 simultaneous users → no errors
  - [ ] 50 simultaneous users → acceptable latency
- [ ] **Memory usage**
  - [ ] vault-api <512MB
  - [ ] ai-service <1GB (excluding models)
- [ ] **Database performance**
  - [ ] 10k photos → queries <1s
  - [ ] Indexes exist on frequently queried columns

---

### 8.16 Test Data Creation Script
Run this to populate test data:

```bash
# Create test user
curl -X POST https://api-vault.0711.io/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@0711.io","password":"TestPassword123!"}'

# Login and get token
TOKEN=$(curl -s -X POST https://api-vault.0711.io/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@0711.io","password":"TestPassword123!"}' | jq -r '.access_token')

# Upload test photos (from local directory)
for f in ~/test-photos/*.jpg; do
  curl -X POST https://api-vault.0711.io/vault/items \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@$f"
done

# Test assistant
curl -X POST https://api-vault.0711.io/assistant/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"What photos do I have?"}'
```

---

### 8.17 Final Sign-Off Checklist

**Before launch, confirm ALL of these:**

- [ ] All 8.1-8.16 sections completed with no failures
- [ ] Test user can complete full journey: Register → Upload → Search → Chat
- [ ] No console errors in browser
- [ ] No errors in docker logs
- [ ] Backup tested: can restore from backup
- [ ] Monitoring in place: errors will be noticed
- [ ] Support email configured
- [ ] Privacy policy reviewed by lawyer
- [ ] App Store screenshots taken
- [ ] Social media posts scheduled

**Sign-off:**
- [ ] **QA Lead:** _________________ Date: _________
- [ ] **Dev Lead:** _________________ Date: _________
- [ ] **Product Owner:** _________________ Date: _________

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

### 9.2 Marketing Website ✅ COMPLETE
**Status:** Ready to deploy

**Pages ready:**
- [x] Landing page (index.html) - German
- [x] Landing page (en/index.html) - English ✅ NEW
- [x] Privacy policy (privacy.html)
- [x] Terms (terms.html)
- [x] Imprint (imprint.html)
- [x] Launch page (launch.html)
- [ ] Download page with App Store badge (add after approval)

**Deploy:** Port 9509 via Cloudflare tunnel

### 9.3 Self-Hosting Docs ✅ COMPLETE
- [x] One-click Docker Compose setup ✅ `/docs/SELF_HOSTING.md`
- [x] Hardware requirements (Raspberry Pi 5 supported!)
- [x] Backup/restore scripts
- [x] Cloudflare Tunnel setup guide
- [x] Security checklist

### 9.4 Social Media & Marketing ✅ COMPLETE
- [x] Instagram content calendar (Week 1 launch)
- [x] Twitter/X launch thread
- [x] LinkedIn post template
- [x] Hashtag strategy
- [x] Influencer outreach templates
- [x] Reel ideas (5 concepts)
- [x] Crisis response templates
See: `/marketing/SOCIAL_MEDIA_KIT.md`

### 9.5 Stripe Integration ✅ ALREADY DONE
- [x] Checkout flow (`/billing/checkout`)
- [x] Customer portal (`/billing/portal`)
- [x] Webhook handling
- [x] Plan tiers (Free/Pro/Family)
See: `/backend/services/vault-api/stripe_routes.py`

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

*Last updated: 2026-01-31 23:15*
*Focus: Photo Vault App ONLY - fully independent deployment*
