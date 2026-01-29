# 0711 Architecture Summary

## Core Insight

> **The data is already exposed to Apple/Google.**  
> We're not adding risk - we're **removing** it by processing once, then moving to user-controlled storage.

---

## Product Tiers

### Tier 1: Cloud Onboarding (SaaS)
**"Free your data"**

```
User's iCloud/Google → 0711 Cloud → Process → Train → User's Vault
```

- €49-199 one-time onboarding fee
- €4.99-19.99/mo cloud vault subscription
- No local setup required

### Tier 2: Local Vault (License)
**"Own your AI"**

```
0711 Cloud Vault → Sync to Local Albert → Fully Offline
```

- €199 perpetual license
- Runs on Mac/Linux/NAS
- Full sovereignty achieved

### Tier 3: Enterprise
**"White-label sovereignty"**

- Custom deployments
- API access
- Compliance features

---

## The Flywheel (Our Moat)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  User onboards → Corrects AI → We learn patterns    │
│       ↑                              ↓              │
│       │                              │              │
│  Better suggestions ← Improved model ←              │
│       ↓                                             │
│  More users (word of mouth) ──────────────────────► │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### What We Learn (Aggregated, Anonymous)
- "Beach + Dog = Vacation context"
- "Same face, different ages = Family member"
- "Document with € amounts = Financial"
- Scene → Category mappings
- Layout → Document type patterns

### What We DON'T Learn (Stays Private)
- Actual faces/identities
- Specific locations
- Personal names
- Document contents
- Individual user data

---

## Technical Components

### Cloud Service (`cloud-service/`)
```
src/
├── connectors/
│   ├── apple-connector.js    # Sign in with Apple + upload
│   └── google-connector.js   # Full Photos/Drive API
├── pipeline/
│   └── onboarding-pipeline.js # AI processing + clustering
├── training/
│   └── federated-learning.js  # Privacy-preserving aggregation
└── api/
    └── routes.js              # REST API
```

### Local Client (`albert-mac/`)
```
src/
├── brain/
│   ├── knowledge-graph.js    # SQLite knowledge base
│   ├── image-processor.js    # Ollama vision AI
│   └── document-processor.js # Text extraction + AI
├── images/
│   ├── secure-share.js       # E2E encrypted sharing
│   └── vault-picker.js       # Controlled app access
└── apple/
    └── migration-service.js  # Direct Apple data migration
```

### Shared Models (Future)
```
models/
├── face-clustering/          # Trained on aggregated patterns
├── document-classifier/      # Invoice, contract, etc.
├── scene-understanding/      # Context from images
└── personal-llm/             # User-specific fine-tuning
```

---

## Data Flow

```
                    ┌──────────────────────────────────────┐
                    │         USER'S CLOUD DATA            │
                    │  (Apple Photos, Google Drive, etc.)  │
                    └──────────────────┬───────────────────┘
                                       │
                                       │ OAuth + Pull
                                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        0711 CLOUD BRIDGE                             │
│                                                                      │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                │
│  │  Ingestion  │ → │  AI Process │ → │  Clustering │                │
│  │  Queue      │   │  (Vision,   │   │  (Faces,    │                │
│  │             │   │   Embed)    │   │   Places)   │                │
│  └─────────────┘   └─────────────┘   └──────┬──────┘                │
│                                             │                        │
│                          ┌──────────────────┴─────────────────┐      │
│                          ▼                                    ▼      │
│                 ┌─────────────────┐              ┌─────────────────┐ │
│                 │  User Training  │              │    Federated    │ │
│                 │  UI (Label      │──patterns───▶│    Learning     │ │
│                 │   Faces/Places) │              │    (Anonymous)  │ │
│                 └────────┬────────┘              └─────────────────┘ │
│                          │                                           │
└──────────────────────────┼───────────────────────────────────────────┘
                           │
                           │ Processed + Embedded Data
                           ▼
         ┌─────────────────────────────────────────┐
         │           USER'S VAULT                  │
         │                                         │
         │  ┌───────────────────────────────────┐  │
         │  │  Option A: 0711 Cloud Vault       │  │
         │  │  (Encrypted, User Keys)           │  │
         │  └───────────────────────────────────┘  │
         │                  OR                     │
         │  ┌───────────────────────────────────┐  │
         │  │  Option B: Local Albert           │  │
         │  │  (Mac/NAS, Fully Offline)         │  │
         │  └───────────────────────────────────┘  │
         │                                         │
         └─────────────────────────────────────────┘
```

---

## Revenue Model

| Stream | Price | Margin | Notes |
|--------|-------|--------|-------|
| **Onboarding** | €49-199 | 80%+ | One-time, high margin |
| **Cloud Vault** | €4.99-19.99/mo | 60% | Recurring, storage costs |
| **Local License** | €199 | 95% | One-time, no infra |
| **API Access** | Usage-based | 70% | B2B, enterprise |

---

## Go-To-Market Phases

### Phase 1 (Months 1-3): "Escape iCloud"
- Target: Privacy-conscious Apple users
- Hook: "Your photos are hostage. We'll free them."
- Product: Cloud onboarding + export

### Phase 2 (Months 4-6): "Personal AI"  
- Target: Tech enthusiasts
- Hook: "Train your own AI on YOUR life"
- Product: Full onboarding + training + vault

### Phase 3 (Months 7-12): "Family Memories"
- Target: Mainstream families
- Hook: "Your family photos deserve better"
- Product: Family plans, shared vaults

### Phase 4 (Year 2): "Enterprise"
- Target: Businesses
- Hook: "AI-powered document intelligence"
- Product: White-label, compliance, API

---

## Competitive Positioning

|  | Apple | Google | 0711 |
|--|-------|--------|------|
| AI Search | ✓ | ✓ | ✓ |
| Face Recognition | ✓ | ✓ | ✓ |
| Cross-Platform | ✗ | ✓ | ✓ |
| **Export All Data** | Limited | Limited | **✓** |
| **User Owns Data** | ✗ | ✗ | **✓** |
| **Local/Offline** | ✗ | ✗ | **✓** |
| **Train Your AI** | ✗ | ✗ | **✓** |
| **No Ad Mining** | Partial | ✗ | **✓** |
| **Document AI** | Basic | ✓ | **✓** |
| **Personal LLM** | ✗ | ✗ | **✓** |

---

## Key Differentiators

1. **True Data Ownership** - User has keys, can export/delete anytime
2. **Privacy-First AI** - Learn patterns, not personal data
3. **Path to Full Sovereignty** - Start cloud, go local when ready
4. **Collective Intelligence** - Better AI from aggregated (anonymous) learnings
5. **Document + Photos** - Unified personal knowledge system

---

## Files Created

```
canvas/0711/
├── CLOUD-ONBOARDING.md          # Business model + architecture
├── ARCHITECTURE-SUMMARY.md      # This file
├── cloud-service/
│   ├── src/
│   │   ├── connectors/
│   │   │   ├── apple-connector.js
│   │   │   └── google-connector.js
│   │   └── pipeline/
│   │       └── onboarding-pipeline.js
│   └── public/
│       └── training-ui.html     # User training interface
├── albert-mac/
│   └── src/
│       ├── brain/
│       │   ├── knowledge-graph.js
│       │   ├── image-processor.js
│       │   └── document-processor.js
│       ├── images/
│       │   ├── secure-share.js
│       │   └── vault-picker.js
│       └── apple/
│           ├── migration-service.js
│           └── routes.js
├── instagram/
│   ├── memory-quote-v3.png      # "Memories vs Ads"
│   ├── photo-access-v1.png      # "Stop Full Access"
│   └── vault-picker-v1.png      # "Share One, Keep Rest"
└── website/
    └── index.html               # Landing page
```

---

## Next Steps

1. [ ] Set up Google Cloud project + OAuth
2. [ ] Deploy cloud service (Railway/Fly.io)
3. [ ] Build macOS native app for PhotoKit access
4. [ ] Implement federated learning backend
5. [ ] Launch landing page + waitlist
6. [ ] Instagram campaign with created posts
