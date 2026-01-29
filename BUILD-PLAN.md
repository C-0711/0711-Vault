# 0711.io - Build Plan bis 8:00 Uhr

## Vision: Menschen schützen durch lokale AI

**Deadline:** 30. Januar 2026, 08:00 Uhr

---

## 1. 🌐 Website (0711.io)

### Landing Page
- Hero: "Deine Daten. Dein AI. Deine Souveränität."
- Problem: Big Tech sammelt alles
- Lösung: 0711 - 100% lokal
- Features showcase
- Download/Waitlist CTA

### Tech Stack
- Static HTML/CSS/JS (schnell, kein Tracking)
- Hosted auf eigener Infrastruktur
- No cookies, no analytics, no third parties

---

## 2. 📧 Secure Email Client (Albert Mail)

### Konzept
- Email-Client wo Albert (lokales LLM) drauf sitzt
- **Keine Cloud-AI** hat Zugriff auf deine Mails
- AI kann:
  - Mails zusammenfassen
  - Antworten vorschlagen
  - Spam/Phishing erkennen
  - Prioritäten setzen
  - Termine extrahieren

### Security
- IMAP/SMTP direkt (kein Proxy)
- Lokale Verschlüsselung aller Mails
- PGP/GPG Integration
- Zero-Knowledge Design

### Tech
- Node.js + better-imap
- SQLite für lokalen Index
- Ollama für AI-Features

---

## 3. 📁 Secure Document Management

### Features
- Verschlüsselte lokale Speicherung
- AI-powered Search (semantic)
- OCR für gescannte Dokumente
- Auto-Kategorisierung
- Version History

### Security
- ChaCha20-Poly1305 Encryption
- Biometric unlock
- Kein Cloud-Sync (außer zu eigenen Geräten)
- Audit Trail

### Tech
- ChromaDB für Vector Search
- Tesseract.js für OCR
- PDF.js für Rendering

---

## 4. 🖼️ Secure Image Exchange

### Konzept
- Bilder teilen ohne Big Tech
- E2E verschlüsselt
- Selbst-löschend (optional)
- Kein Metadaten-Leak

### Features
- EXIF stripping
- Verschlüsselter Transfer
- Ablaufdatum für geteilte Bilder
- Screenshot-Warnung

### Tech
- Sharp.js für Image Processing
- Custom P2P Protocol
- WebRTC für direkten Transfer

---

## 5. 🧠 AI Training / Fine-Tuning

### Lokales Training
- **TensorFlow.js** für Browser-basiertes Training
- **MLX** (Apple Silicon) für Mac
- **ONNX** für Cross-Platform

### Was trainiert wird
- Persönliche Präferenzen lernen
- Schreibstil anpassen
- Domain-spezifisches Wissen
- Niemals Daten nach außen

### Privacy-First ML
```
User Data → Local Model → Better Predictions
    ↑                           ↓
    └───── Feedback Loop ───────┘
    
    ❌ NEVER leaves device
```

### Federated Learning Option
- Mehrere Geräte können gemeinsam lernen
- Nur Gradienten werden geteilt (nicht Daten)
- Differential Privacy

---

## 6. 🛡️ Core Security Principles

### Data Protection
1. **Encryption at Rest** - Alles verschlüsselt gespeichert
2. **Encryption in Transit** - E2E für alle Kommunikation
3. **Zero Knowledge** - Wir wissen nichts über deine Daten
4. **Local First** - Alles läuft auf deinem Gerät
5. **Open Source** - Code ist verifizierbar

### Against Surveillance
1. **No Telemetry** - Keine Nutzungsdaten
2. **No Cloud AI** - Kein ChatGPT/Gemini hat Zugriff
3. **No Metadata** - Auch Metadaten sind geschützt
4. **Anti-Fingerprinting** - Browser fingerprinting blockiert
5. **Tor Support** - Anonyme Kommunikation möglich

### User Control
1. **Data Export** - Jederzeit alles exportieren
2. **Data Delete** - Echtes Löschen, nicht nur markieren
3. **Audit Log** - Sehen was passiert ist
4. **Granular Permissions** - Feinkontrolle über alles

---

## 7. 📱 Components to Build

### Tonight (bis 08:00):

| Component | Priority | Est. Time |
|-----------|----------|-----------|
| Website Landing Page | 🔴 HIGH | 2h |
| Email Client UI | 🔴 HIGH | 3h |
| Email IMAP Integration | 🟡 MED | 2h |
| Document Vault UI | 🟡 MED | 2h |
| Image Secure Share | 🟡 MED | 2h |
| TensorFlow.js Setup | 🟢 LOW | 1h |

### File Structure
```
canvas/0711/
├── website/              # Landing page
│   ├── index.html
│   ├── style.css
│   └── assets/
├── albert-mac/           # Main app (existing)
│   ├── src/
│   │   ├── index.js
│   │   ├── crypto.js
│   │   ├── email/        # NEW: Email client
│   │   ├── documents/    # NEW: Doc vault
│   │   ├── images/       # NEW: Secure share
│   │   └── ml/           # NEW: Local training
│   └── public/
│       ├── index.html    # Main app UI
│       ├── email.html    # Email client UI
│       └── docs.html     # Document vault UI
└── BUILD-PLAN.md
```

---

## 8. 💡 Konzepte zum Schutz von Menschen

### Problem: AI Surveillance
- ChatGPT liest alle deine Gespräche
- Gmail AI scannt alle Mails
- Google Fotos analysiert alle Bilder
- Alexa hört immer zu

### Unsere Lösung: Lokale Souveränität

**"Dein AI arbeitet FÜR dich, nicht für Konzerne."**

1. **Private AI Assistant**
   - Gleiche Funktionen wie ChatGPT
   - Aber läuft auf DEINEM Gerät
   - Niemand sonst sieht deine Fragen

2. **Private Email Intelligence**
   - AI hilft bei Mails
   - Aber nur DEIN AI sieht sie
   - Google/Microsoft haben keinen Zugriff

3. **Private Photo AI**
   - Gesichtserkennung für DICH
   - Nicht für Werbekonzerne
   - Bilder verlassen nie dein Gerät

4. **Private Document Search**
   - Semantic Search über alle Dokumente
   - Ohne Cloud-Upload
   - Deine Verträge bleiben privat

### Zielgruppen
- **Journalisten** - Quellenschutz
- **Anwälte** - Mandantengeheimnis
- **Ärzte** - Patientendaten
- **Aktivisten** - Schutz vor Überwachung
- **Normale Menschen** - Digitale Selbstbestimmung

---

## Start Building! 🚀
