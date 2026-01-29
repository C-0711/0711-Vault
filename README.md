# 0711 Intelligence - Personal AI Vault

🔐 **Your memories, your AI, your control.**

A privacy-first personal photo & document vault with on-device AI for intelligent organization, face recognition, and semantic search.

---

## 🌐 Domain: [0711-ios.com](https://0711-ios.com)

---

## Features

- 📸 **Photo Vault** - Encrypted storage with Face ID protection
- 🧠 **On-Device AI** - Face recognition, object detection, OCR
- 🔍 **Semantic Search** - "Find photos from last summer at the beach"
- 👤 **People Recognition** - Auto-organize by faces
- 📁 **Smart Albums** - AI-generated collections
- 🔒 **Zero-Knowledge** - Your data never leaves your device (optional cloud sync)
- 💬 **Albert AI** - Your personal AI assistant

---

## Project Structure

```
0711-Intelligence/
├── Vault0711/          # iOS App (SwiftUI)
├── backend/            # API Server (FastAPI + PostgreSQL)
├── frontend/           # Web Dashboard (React)
├── website/            # Landing Page
└── docs/               # Documentation
```

---

## Quick Start

### iOS App
```bash
cd Vault0711
open Vault0711.xcodeproj
# Build & Run in Xcode
```

### Backend
```bash
cd backend
cp .env.example .env
docker compose up -d
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     📱 iOS App                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Photo Vault │  │ Face Recog  │  │ Albert Chat │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│              │           │              │                   │
│              ▼           ▼              ▼                   │
│  ┌───────────────────────────────────────────────┐         │
│  │           On-Device AI (Core ML)              │         │
│  │  • MobileNet (Objects)                        │         │
│  │  • FaceNet (Recognition)                      │         │
│  │  • CLIP (Semantic Search)                     │         │
│  └───────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                           │
                    (Optional Sync)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   ☁️ Cloud Backend                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Vault API  │  │  AI Service │  │  PostgreSQL │         │
│  │  (FastAPI)  │  │   (Ollama)  │  │  + pgvector │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **iOS** | SwiftUI, Core ML, Vision, CryptoKit |
| **Backend** | FastAPI, PostgreSQL, pgvector, MinIO |
| **AI** | Ollama (Llama 3.2), CLIP, FaceNet |
| **Frontend** | React, TypeScript, Tailwind |

---

## Privacy First

- 🔐 **End-to-end encryption** - AES-256-GCM
- 🧠 **On-device AI** - No cloud processing required
- 🚫 **No tracking** - Zero analytics, zero telemetry
- 📍 **Your data, your server** - Self-host option

---

## Roadmap

- [x] iOS App MVP
- [x] Backend API
- [x] Face Recognition
- [ ] Mac App
- [ ] Android App
- [ ] Shared Albums
- [ ] Family Vault

---

## License

Private - All rights reserved

---

**Made with ❤️ in Stuttgart (0711)**
