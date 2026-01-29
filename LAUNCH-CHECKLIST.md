# 0711 Vault — Launch Checklist

**Goal:** Ship MVP  
**Status:** ✅ READY TO TEST

---

## Backend Core

- [x] PostgreSQL schema complete (users, vault_items, faces, places, embeddings)
- [x] Database migrations working
- [x] User registration with zero-knowledge auth
- [x] User login + JWT tokens
- [x] File upload endpoint (presigned URLs)
- [x] Photo processing pipeline (metadata, faces, embeddings)
- [x] Face clustering endpoint
- [x] Place clustering endpoint  
- [x] Semantic search endpoint
- [x] Training labels endpoint (save face/place names)

## AI Processing

- [x] Face detection working (MediaPipe/InsightFace)
- [x] Face embeddings generation
- [x] Image embeddings (CLIP via Ollama)
- [x] OCR for documents (Tesseract)
- [x] Auto-categorization working

## Web Frontend

- [x] Registration page with client-side key derivation
- [x] Login working
- [x] Dashboard shows stats
- [x] Photo upload with drag & drop
- [x] Photo grid view
- [x] Face training UI ("Who is this?")
- [x] Place training UI
- [x] Search bar working
- [x] Settings page functional

## iOS App

- [x] PhotoKit permission flow
- [x] Photo library browser
- [x] Select & upload photos
- [x] API client working
- [x] Face training view
- [x] Biometric unlock

## Infrastructure

- [x] Docker Compose runs full stack locally
- [x] All services healthy
- [x] Ollama models downloaded
- [x] MinIO accessible
- [x] Traefik routing working

## Integration Tests

- [x] Register → Login → Upload → Process → Search flow works
- [x] Face detection returns clusters
- [x] Labeling persists correctly
- [x] Search finds labeled content

---

## Progress Log

| Time | Task | Status |
|------|------|--------|
| Now | Database schema | ✅ |
| Now | Vault API (FastAPI) | ✅ |
| Now | AI Service (faces, embeddings, OCR) | ✅ |
| Now | Background worker | ✅ |
| Now | Web frontend (React) | ✅ |
| Now | iOS app (SwiftUI) | ✅ |
| Now | Docker Compose | ✅ |
| Now | Client-side encryption | ✅ |

---

## 🚀 To Launch

```bash
# 1. Start backend
cd canvas/0711/backend
./scripts/start-local.sh

# 2. Start frontend  
cd canvas/0711/frontend
npm install && npm run dev

# 3. Open http://localhost:3000
```

## 📱 iOS App

Open `canvas/0711/Vault0711/Vault0711.xcodeproj` in Xcode and run on simulator/device.

---

## ✅ Additional Features Built

### MinIO Presigned URLs
- [x] `storage.py` — Full MinIO/S3 integration
- [x] Secure upload URLs (1 hour expiry)
- [x] Secure download URLs (1 hour expiry)
- [x] User storage calculation

### Face Clustering (DBSCAN)
- [x] `clustering.py` — Full DBSCAN implementation
- [x] Automatic clustering of new faces
- [x] Assign new faces to existing clusters
- [x] Merge clusters endpoint
- [x] Split clusters endpoint
- [x] Centroid calculation and updates

### App Store Submission
- [x] `AppStore/metadata.json` — Full metadata (EN + DE)
- [x] `AppStore/generate-icons.py` — Icon generator
- [x] `AppStore/SUBMISSION-CHECKLIST.md` — Full checklist
- [x] `Info.plist` — All privacy permissions
- [x] Screenshot content defined
- [x] Review guidelines compliance checked

