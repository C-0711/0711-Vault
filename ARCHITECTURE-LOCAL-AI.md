# 0711 — Local AI Architecture

> 🏴 **Digitale Souveränität.** Keine Cloud-APIs. Keine Big Brother. Alles lokal.

---

## 🎯 Prinzipien

1. **100% Self-Hosted** — Kein Byte verlässt dein Netzwerk
2. **Open Source Models** — Keine proprietären APIs
3. **Privacy by Design** — Daten bleiben auf deiner Hardware
4. **Offline-fähig** — Funktioniert ohne Internet
5. **Dezentral** — Kein Single Point of Failure

---

## 🧠 Local LLM Stack

### Option A: Ollama (Empfohlen für Start)

```bash
# Installation
curl -fsSL https://ollama.ai/install.sh | sh

# Models pullen
ollama pull llama3.2:8b          # General purpose
ollama pull mistral:7b           # Schnell & gut
ollama pull deepseek-coder:6.7b  # Für Code
ollama pull phi3:14b             # Microsoft, effizient
```

**Vorteile:**
- Einfachste Installation
- OpenAI-kompatible API
- Gute Model-Library
- Läuft auf M1/M2/M3/M4 Macs perfekt

**API Endpoint:**
```
http://localhost:11434/api/generate
http://localhost:11434/v1/chat/completions  # OpenAI-kompatibel
```

---

### Option B: llama.cpp + GGUF (Maximum Performance)

```bash
# Build
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make -j LLAMA_METAL=1  # Apple Silicon

# Server starten
./llama-server -m models/llama-3.2-8b-q4_K_M.gguf \
  --host 0.0.0.0 --port 8080 \
  -ngl 99  # All layers on GPU
```

**Vorteile:**
- Maximale Performance
- Feinste Kontrolle
- Quantisierung (4-bit, 8-bit)

---

### Option C: LocalAI (Multi-Model Gateway)

```bash
docker run -p 8080:8080 \
  -v $PWD/models:/models \
  localai/localai:latest
```

**Vorteile:**
- OpenAI API 1:1 kompatibel
- Mehrere Models gleichzeitig
- Text + Image + Audio + Embeddings

---

## 📊 Model-Empfehlungen

### Für Mac Mini M4 (16GB+ RAM)

| Use Case | Model | Size | VRAM | Speed |
|----------|-------|------|------|-------|
| **General** | Llama 3.2 8B | 4.5GB | 8GB | ~40 tok/s |
| **Deutsch** | LeoLM 13B | 7.5GB | 12GB | ~25 tok/s |
| **Code** | DeepSeek Coder 6.7B | 4GB | 6GB | ~50 tok/s |
| **Fast** | Phi-3 Mini 3.8B | 2.3GB | 4GB | ~80 tok/s |
| **Beast** | Mixtral 8x7B | 26GB | 32GB | ~15 tok/s |

### Für Mobile (On-Device)

| Platform | Framework | Models |
|----------|-----------|--------|
| **iOS** | Core ML / MLX | Phi-3 Mini, Gemma 2B |
| **Android** | TensorFlow Lite | Gemma 2B, Phi-3 Mini |
| **Both** | ONNX Runtime | Phi-3, Qwen2 1.5B |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        0711 ECOSYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐ │
│  │   iPhone     │     │   Android    │     │   Desktop    │ │
│  │   0711 App   │     │   0711 App   │     │   0711 Web   │ │
│  │              │     │              │     │              │ │
│  │ ┌──────────┐ │     │ ┌──────────┐ │     └──────┬───────┘ │
│  │ │ Phi-3    │ │     │ │ Gemma 2B │ │            │         │
│  │ │ On-Device│ │     │ │ On-Device│ │            │         │
│  │ └──────────┘ │     │ └──────────┘ │            │         │
│  └──────┬───────┘     └──────┬───────┘            │         │
│         │                    │                     │         │
│         └────────────────────┼─────────────────────┘         │
│                              │                               │
│                              ▼                               │
│         ┌─────────────────────────────────────┐             │
│         │         LOCAL NETWORK (LAN)          │             │
│         └─────────────────────────────────────┘             │
│                              │                               │
│                              ▼                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   HOME SERVER                          │  │
│  │                   (Mac Mini M4)                        │  │
│  │                                                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │   Ollama    │  │  Moltbot    │  │  Whisper    │   │  │
│  │  │             │  │  Gateway    │  │  (STT)      │   │  │
│  │  │ ┌─────────┐ │  │             │  │             │   │  │
│  │  │ │Llama 3.2│ │  │ Proactive   │  └─────────────┘   │  │
│  │  │ │Mistral  │ │  │ Engine      │                     │  │
│  │  │ │DeepSeek │ │  │             │  ┌─────────────┐   │  │
│  │  │ └─────────┘ │  │ Integrations│  │  Piper TTS  │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  │                                                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │  ChromaDB   │  │   SQLite    │  │ Home Asst.  │   │  │
│  │  │ (Embeddings)│  │  (Storage)  │  │ (Smart Home)│   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Komponenten

### 1. LLM Inference (Ollama)

```yaml
# docker-compose.yml
services:
  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "11434:11434"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
```

### 2. Embeddings & RAG (ChromaDB)

```yaml
  chromadb:
    image: chromadb/chroma:latest
    volumes:
      - chroma_data:/chroma/chroma
    ports:
      - "8000:8000"
```

Für lokale Embeddings:
```bash
ollama pull nomic-embed-text
# oder
ollama pull mxbai-embed-large
```

### 3. Speech-to-Text (Whisper)

```bash
# Whisper.cpp für Apple Silicon
git clone https://github.com/ggerganov/whisper.cpp
cd whisper.cpp
make -j WHISPER_METAL=1

# Model laden
./models/download-ggml-model.sh large-v3
```

### 4. Text-to-Speech (Piper)

```bash
# Deutsche Stimme
docker run -p 5002:5002 \
  rhasspy/piper \
  --voice de_DE-thorsten-high
```

---

## 🇩🇪 Deutsche Sprachmodelle

### LeoLM (Beste deutsche Performance)
```bash
# Via Ollama (custom Modelfile)
ollama pull leolm/leo-mistral-hessianai-7b
```

### German Mistral
```bash
ollama pull LeoLM/leo-hessianai-13b-chat
```

### Multilingual mit Deutsch-Fokus
- **Qwen 2.5** — Sehr gut für Deutsch
- **Mixtral** — Multilinguale Stärke
- **Llama 3.2** — Solide Deutsch-Unterstützung

---

## 📱 On-Device Inference (Mobile)

### iOS (MLX / Core ML)

```swift
// Swift mit MLX
import MLX

let model = try await LLM.load("mlx-community/Phi-3-mini-4k-instruct-4bit")
let response = try await model.generate("Hallo, wie geht's?")
```

### Android (TensorFlow Lite)

```kotlin
// Kotlin mit TFLite
val model = GemmaModel.load(context, "gemma-2b-it-q4")
val response = model.generate("Hallo, wie geht's?")
```

### Hybrid Approach (Empfohlen)

```
Mobile Device                    Home Server
┌─────────────────┐             ┌─────────────────┐
│                 │             │                 │
│  Phi-3 Mini     │────WiFi────▶│  Llama 3.2 70B  │
│  (schnelle      │             │  (komplexe      │
│   Antworten)    │◀────────────│   Aufgaben)     │
│                 │             │                 │
└─────────────────┘             └─────────────────┘

Strategie:
- Einfache Queries → On-Device (< 100ms)
- Komplexe Tasks → Home Server (< 2s)
- Offline → Always On-Device
```

---

## 🛡️ Privacy & Security

### Netzwerk-Isolation

```bash
# Firewall: Nur LAN-Zugriff
ufw default deny incoming
ufw allow from 192.168.0.0/16 to any port 11434  # Ollama
ufw allow from 192.168.0.0/16 to any port 8080   # 0711 Gateway
```

### Verschlüsselung

```yaml
# Traefik für HTTPS im LAN
services:
  traefik:
    image: traefik:latest
    command:
      - --providers.docker=true
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.local.acme.tlschallenge=true
```

### Zero-Knowledge Sync

Falls Multi-Device Sync gewünscht:
```
Device A ──encrypt──▶ Encrypted Blob ──▶ Device B ──decrypt──▶
                            │
                      (kann auf eigenem
                       Server liegen)
```

---

## 📊 Hardware-Empfehlungen

### Minimum (Für Entwicklung)
- **Mac Mini M2** (16GB RAM)
- Läuft: Llama 3.2 8B, Mistral 7B
- ~30-40 tokens/sec

### Empfohlen (Production)
- **Mac Mini M4 Pro** (48GB RAM)
- Läuft: Llama 3.2 70B, Mixtral 8x7B
- ~20-30 tokens/sec für große Models

### Beast Mode
- **Mac Studio M2 Ultra** (192GB RAM)
- Läuft: Alles, mehrere Models parallel
- Oder: Custom Linux Server mit 2x RTX 4090

### Budget Option
- **Gebrauchter Mac Mini M1** (~400€)
- Läuft: 7B Models gut
- Perfekt für den Einstieg

---

## 🚀 Quick Start

```bash
# 1. Ollama installieren
curl -fsSL https://ollama.ai/install.sh | sh

# 2. Models laden
ollama pull llama3.2:8b
ollama pull nomic-embed-text

# 3. Testen
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2:8b",
  "prompt": "Was ist 0711?",
  "stream": false
}'

# 4. In 0711 integrieren
export OLLAMA_HOST=http://localhost:11434
```

---

## 🔄 Migration von Cloud → Local

### Phase 1: Hybrid
- Cloud API für komplexe Tasks
- Local für einfache Queries
- Metriken sammeln

### Phase 2: Local-First
- Local als Primary
- Cloud nur als Fallback
- Performance optimieren

### Phase 3: Full Local
- Cloud komplett aus
- 100% Self-Hosted
- 🏴 Mission accomplished

---

## 📚 Ressourcen

- [Ollama](https://ollama.ai/)
- [llama.cpp](https://github.com/ggerganov/llama.cpp)
- [LocalAI](https://localai.io/)
- [MLX](https://github.com/ml-explore/mlx)
- [LeoLM](https://huggingface.co/LeoLM)
- [Whisper.cpp](https://github.com/ggerganov/whisper.cpp)
- [Piper TTS](https://github.com/rhasspy/piper)
- [ChromaDB](https://www.trychroma.com/)

---

*Keine Cloud. Keine Konzerne. Keine Kompromisse.* 🏴
