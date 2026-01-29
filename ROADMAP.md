# 0711 — Roadmap zur Markteinführung

> Proaktiver AI-Assistent für den Alltag. Dein persönlicher Co-Worker auf dem Smartphone.

---

## 🎯 Vision

**0711** ist ein selbstgehosteter, proaktiver AI-Assistent, der:
- Eigenständig handelt (nicht nur antwortet)
- In bestehende Tools integriert (Email, Kalender, Smart Home)
- Über Messenger erreichbar ist (WhatsApp, Telegram, iMessage)
- Deine Privatsphäre respektiert (lokale Ausführung, deine Daten)

---

## 📅 Timeline Overview

| Phase | Zeitraum | Fokus |
|-------|----------|-------|
| **Phase 1** | Woche 1-2 | Foundation & Core UI |
| **Phase 2** | Woche 3-4 | Integrationen |
| **Phase 3** | Woche 5-6 | Proaktive Intelligence |
| **Phase 4** | Woche 7-8 | Beta & Polish |
| **Phase 5** | Woche 9-10 | Launch Prep |
| **🚀 Launch** | Woche 11 | Markteinführung |

---

## Phase 1: Foundation (Woche 1-2)

### 🏗️ Core App Structure
- [ ] **Tech Stack festlegen**
  - [ ] React Native vs. Flutter vs. PWA
  - [ ] Backend: Node.js + Moltbot Gateway
  - [ ] Database: SQLite (lokal) + optional Sync
- [ ] **Projekt Setup**
  - [ ] Monorepo (Turborepo/Nx)
  - [ ] CI/CD Pipeline (GitHub Actions)
  - [ ] Deployment Strategy

### 📱 Core UI Components
- [ ] **Navigation**
  - [ ] Bottom Tab Navigation
  - [ ] Stack Navigation
  - [ ] Gesture-based interactions
- [ ] **Design System**
  - [ ] Color tokens (dark/light mode)
  - [ ] Typography scale
  - [ ] Component library (Buttons, Cards, Inputs)
  - [ ] Animation primitives
- [ ] **Screens**
  - [ ] Home Dashboard ✅ (Prototyp fertig)
  - [ ] Chat Interface
  - [ ] Task List
  - [ ] Settings
  - [ ] Onboarding Flow

### 🔐 Auth & Security
- [ ] Local-first authentication
- [ ] Biometric unlock (Face ID / Touch ID)
- [ ] Secure credential storage (Keychain/Keystore)
- [ ] E2E encryption für Sync

---

## Phase 2: Integrationen (Woche 3-4)

### 📧 Email Integration
- [ ] **Gmail API**
  - [ ] OAuth2 Flow
  - [ ] Inbox fetch & parse
  - [ ] Send/Reply/Forward
  - [ ] Smart categorization
- [ ] **Outlook/IMAP** (optional)
  - [ ] IMAP/SMTP fallback
  - [ ] Microsoft Graph API

### 📅 Kalender Integration
- [ ] **Google Calendar**
  - [ ] Events lesen/schreiben
  - [ ] Verfügbarkeit prüfen
  - [ ] Meeting-Vorschläge
- [ ] **Apple Calendar** (CalDAV)
- [ ] **Outlook Calendar**

### ✈️ Travel & Booking
- [ ] **Flight Check-in**
  - [ ] Lufthansa API
  - [ ] Andere Airlines (Scraping fallback)
- [ ] **Boarding Pass** Integration
  - [ ] Wallet/PassKit

### 🏠 Smart Home
- [ ] **HomeKit** (iOS)
- [ ] **Home Assistant** API
- [ ] **Google Home** (optional)

### 💬 Messaging Bridges
- [ ] WhatsApp (via Moltbot)
- [ ] Telegram Bot
- [ ] iMessage (BlueBubbles)
- [ ] Signal (optional)

---

## Phase 3: Proaktive Intelligence (Woche 5-6)

### 🧠 AI Core
- [ ] **LLM Integration**
  - [ ] Claude API (primär)
  - [ ] GPT-4 fallback
  - [ ] Lokale Modelle (Ollama) für Privacy
- [ ] **Context Engine**
  - [ ] User Preferences lernen
  - [ ] Tagesablauf-Muster erkennen
  - [ ] Prioritäten verstehen

### ⚡ Proaktive Features
- [ ] **Smart Notifications**
  - [ ] "Du solltest jetzt los für dein Meeting"
  - [ ] "Email von Chef - sieht wichtig aus"
  - [ ] "Dein Flug hat 30 Min Verspätung"
- [ ] **Auto-Actions**
  - [ ] Flight Check-in (24h vorher)
  - [ ] Meeting-Reminder mit Context
  - [ ] Smart Home Automation
- [ ] **Draft Generation**
  - [ ] Email-Antworten vorschlagen
  - [ ] Meeting-Notes zusammenfassen
  - [ ] Todo-Listen aus Gesprächen

### 📊 Activity Feed
- [ ] "Was hat 0711 heute für dich getan?"
- [ ] Transparenz über alle Auto-Actions
- [ ] Undo/Feedback Möglichkeit

---

## Phase 4: Beta & Polish (Woche 7-8)

### 🧪 Testing
- [ ] **Internal Alpha**
  - [ ] Dogfooding (eigene Nutzung)
  - [ ] Bug Tracking (Linear/GitHub Issues)
- [ ] **Closed Beta**
  - [ ] 20-50 Tester rekrutieren
  - [ ] Feedback-Loop einrichten
  - [ ] Analytics (privacy-respecting)

### ✨ Polish
- [ ] **Performance**
  - [ ] App Startup < 1s
  - [ ] Smooth 60fps Animations
  - [ ] Offline-Fähigkeit
- [ ] **UX Refinement**
  - [ ] Micro-interactions
  - [ ] Haptic Feedback
  - [ ] Sound Design (optional)
- [ ] **Edge Cases**
  - [ ] Error States
  - [ ] Empty States
  - [ ] Loading States

### 🌍 Localization
- [ ] Deutsch (primär)
- [ ] Englisch
- [ ] Weitere Sprachen (später)

---

## Phase 5: Launch Prep (Woche 9-10)

### 📝 Legal & Compliance
- [ ] **Datenschutz**
  - [ ] DSGVO-Konformität
  - [ ] Privacy Policy
  - [ ] Terms of Service
- [ ] **App Store**
  - [ ] Apple Developer Account
  - [ ] Google Play Console
  - [ ] App Store Guidelines Review

### 🎨 Marketing Assets
- [ ] **Branding**
  - [ ] Logo (finalisiert)
  - [ ] App Icon (1024x1024)
  - [ ] Brand Guidelines
- [ ] **Website**
  - [ ] Landing Page (0711.io?)
  - [ ] Dokumentation
  - [ ] Blog
- [ ] **App Store**
  - [ ] Screenshots (6.7", 6.5", 5.5")
  - [ ] App Preview Video
  - [ ] Beschreibungstexte

### 📣 Pre-Launch Marketing
- [ ] **Waitlist**
  - [ ] Landing Page mit Email-Signup
  - [ ] Early Access Incentives
- [ ] **Content**
  - [ ] Launch-Announcement vorbereiten
  - [ ] Demo-Video produzieren
  - [ ] Press Kit
- [ ] **Community**
  - [ ] Discord Server
  - [ ] Twitter/X Account
  - [ ] Product Hunt vorbereiten

---

## 🚀 Launch (Woche 11)

### D-Day Checklist
- [ ] App Store Release (iOS)
- [ ] Play Store Release (Android)
- [ ] Website Live
- [ ] Product Hunt Launch
- [ ] Social Media Announcement
- [ ] Press Outreach
- [ ] Community Notification

### Post-Launch
- [ ] Monitoring & Hotfixes
- [ ] User Feedback sammeln
- [ ] Erste Updates planen
- [ ] Metriken tracken

---

## 💰 Business Model

### 🏴 Open Source First

**Core App: 100% Open Source (AGPL-3.0)**
- Jeder kann es nutzen, forken, verbessern
- Community-getrieben
- Keine Vendor Lock-in

**Revenue Streams (optional):**
1. **Hardware Bundles**
   - Vorkonfigurierter Mac Mini mit 0711
   - "0711 Box" — Plug & Play Home Server
   
2. **Support & Consulting**
   - Setup-Service für nicht-technische User
   - Enterprise Support

3. **Premium Integrations**
   - Spezielle Airline-APIs
   - Banking-Integrationen
   - (auch Open Source, aber maintained)

4. **Donations / Sponsoring**
   - GitHub Sponsors
   - Open Collective
   - Patreon für Community

---

## 🛠️ Tech Stack (100% Local / Self-Hosted)

```
Frontend:
├── React Native (Expo)
├── TypeScript
├── Zustand (State)
├── React Query (Data)
├── Reanimated (Animations)
└── On-Device: MLX (iOS) / TFLite (Android)

Backend (Home Server):
├── Moltbot Gateway
├── SQLite (Storage)
├── ChromaDB (Embeddings/RAG)
└── Home Assistant (Smart Home)

AI Stack (100% Local):
├── Ollama (LLM Gateway)
│   ├── Llama 3.2 8B/70B (General)
│   ├── LeoLM 13B (Deutsch)
│   ├── DeepSeek Coder (Code)
│   └── Phi-3 (Schnelle Tasks)
├── Whisper.cpp (Speech-to-Text)
├── Piper (Text-to-Speech, Deutsch)
└── nomic-embed-text (Embeddings)

Infra (Self-Hosted):
├── Gitea oder Forgejo (Code)
├── Eigener Server (keine Cloud)
├── Tailscale/WireGuard (VPN)
└── Eigenes Error Tracking

Hardware:
├── Mac Mini M4 (Pro) — Home Server
├── iPhone/Android — Mobile Clients
└── Raspberry Pi (optional, Edge)
```

> 🏴 **Zero Cloud Dependencies.** Keine API-Keys von Big Tech nötig.

---

## 📞 Nächste Schritte

1. **Heute**: Tech Stack Decision
2. **Diese Woche**: Projekt Setup + Onboarding UI
3. **Nächste Woche**: Email + Calendar Integration

---

*Letzte Aktualisierung: Januar 2026*
