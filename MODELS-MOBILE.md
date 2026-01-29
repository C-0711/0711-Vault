# 0711 — Mobile LLM Auswahl

> 🎯 Ziel: Maximale Intelligenz bei minimaler Größe. Läuft auf dem Handy.

---

## 📱 Top Kandidaten für On-Device

| Model | Parameter | RAM | Größe (Q4) | Deutsch | Speed | Intelligenz |
|-------|-----------|-----|------------|---------|-------|-------------|
| **Phi-3.5 Mini** | 3.8B | 3GB | 2.2GB | ⭐⭐⭐ | 🚀🚀🚀 | ⭐⭐⭐⭐⭐ |
| **Gemma 2 2B** | 2B | 2GB | 1.4GB | ⭐⭐⭐ | 🚀🚀🚀🚀 | ⭐⭐⭐⭐ |
| **Qwen2.5 1.5B** | 1.5B | 1.5GB | 1.1GB | ⭐⭐⭐⭐ | 🚀🚀🚀🚀 | ⭐⭐⭐⭐ |
| **Llama 3.2 3B** | 3B | 2.5GB | 1.8GB | ⭐⭐⭐ | 🚀🚀🚀 | ⭐⭐⭐⭐ |
| **Llama 3.2 1B** | 1B | 1GB | 0.7GB | ⭐⭐ | 🚀🚀🚀🚀🚀 | ⭐⭐⭐ |
| **SmolLM2 1.7B** | 1.7B | 1.5GB | 1.0GB | ⭐⭐ | 🚀🚀🚀🚀 | ⭐⭐⭐⭐ |

---

## 🏆 Meine Empfehlung: **Qwen2.5 3B**

### Warum Qwen2.5?

```
✅ Beste Deutsch-Unterstützung unter den kleinen Models
✅ 3B passt aufs Handy (iPhone 12+, moderne Androids)
✅ Alibaba = Keine US Big Tech Abhängigkeit
✅ Apache 2.0 Lizenz = Volle Freiheit
✅ Extrem gutes Reasoning für die Größe
✅ 128K Context Window (!)
```

### Benchmarks (vs GPT-3.5)

| Task | Qwen2.5 3B | GPT-3.5 | Phi-3 Mini |
|------|------------|---------|------------|
| MMLU | 65.6 | 70.0 | 68.8 |
| HumanEval | 61.6 | 48.1 | 58.5 |
| GSM8K (Math) | 79.1 | 57.1 | 75.5 |
| **Deutsch** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

**Qwen2.5 3B schlägt GPT-3.5 in Math und Code!**

---

## 📊 Detailvergleich Top 3

### 1. Qwen2.5 3B (👑 Empfehlung)

```yaml
Name: Qwen2.5-3B-Instruct
Parameter: 3 Milliarden
Kontext: 128K tokens (!)
Größe: 1.9GB (Q4_K_M)
RAM: 2.5GB
Lizenz: Apache 2.0
Hersteller: Alibaba (China)

Stärken:
  - Bestes Deutsch unter Small Models
  - Riesiger Kontext (128K)
  - Sehr gutes Reasoning
  - Guter Code

Schwächen:
  - Etwas langsamer als 1.5B
  - Braucht iPhone 12+ / 4GB RAM Android
```

### 2. Phi-3.5 Mini (🥈 Alternative)

```yaml
Name: Phi-3.5-mini-instruct
Parameter: 3.8 Milliarden
Kontext: 128K tokens
Größe: 2.2GB (Q4_K_M)
RAM: 3GB
Lizenz: MIT
Hersteller: Microsoft

Stärken:
  - Höchste Benchmark-Scores
  - Sehr gutes Reasoning
  - MIT Lizenz (maximal frei)

Schwächen:
  - Microsoft = US Big Tech
  - Deutsch etwas schwächer
  - Braucht mehr RAM
```

### 3. Gemma 2 2B (🥉 Wenn kleiner sein muss)

```yaml
Name: Gemma-2-2B-Instruct
Parameter: 2 Milliarden
Kontext: 8K tokens
Größe: 1.4GB (Q4_K_M)
RAM: 2GB
Lizenz: Gemma License (eingeschränkt)
Hersteller: Google

Stärken:
  - Kleinste Größe
  - Läuft auf älteren Geräten
  - Schnellste Inferenz

Schwächen:
  - Google = Big Brother
  - Nur 8K Kontext
  - Lizenz hat Einschränkungen
```

---

## 🛠️ Integration in 0711

### Architektur: Hybrid Intelligence

```
┌─────────────────────────────────────────────────────────────┐
│                     0711 AI ROUTING                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   USER INPUT                                                │
│       │                                                     │
│       ▼                                                     │
│   ┌───────────────┐                                        │
│   │ Task Router   │ ◄── Welcher Task? Wie komplex?         │
│   └───────┬───────┘                                        │
│           │                                                 │
│     ┌─────┴─────┬──────────────┐                           │
│     ▼           ▼              ▼                           │
│ ┌───────┐  ┌────────┐    ┌──────────┐                     │
│ │ PHONE │  │ HOME   │    │ HYBRID   │                     │
│ │       │  │ SERVER │    │          │                     │
│ │Qwen2.5│  │        │    │ Phone    │                     │
│ │  3B   │  │Llama   │    │ starts,  │                     │
│ │       │  │3.2 70B │    │ Server   │                     │
│ │<100ms │  │        │    │ refines  │                     │
│ │       │  │ <2s    │    │          │                     │
│ └───────┘  └────────┘    └──────────┘                     │
│                                                             │
│ Use Cases:                                                  │
│ • Quick Q&A     • Complex          • Start typing,         │
│ • Translate       analysis           better answer         │
│ • Simple math   • Long docs          comes later           │
│ • Offline       • Multi-step       • Best of both          │
│                   reasoning                                 │
└─────────────────────────────────────────────────────────────┘
```

### Task Routing Logic

```typescript
function routeTask(input: string, context: Context): AITarget {
  // Immer lokal wenn offline
  if (!context.hasNetwork) return 'phone'
  
  // Einfache Tasks → Phone
  if (isSimpleQuery(input)) return 'phone'
  if (input.length < 100) return 'phone'
  
  // Komplexe Tasks → Home Server
  if (needsLongContext(input)) return 'server'
  if (isMultiStep(input)) return 'server'
  if (needsRAG(input)) return 'server'
  
  // Default: Hybrid (schnelle Antwort + Verbesserung)
  return 'hybrid'
}

// Beispiele:
// "Wie spät ist es?" → phone (instant)
// "Fasse diese 50-Seiten PDF zusammen" → server
// "Schreib eine Email an..." → hybrid (Draft sofort, Polish vom Server)
```

---

## 📲 Installation auf dem Handy

### iOS (MLX / llama.cpp)

```swift
// Mit llama.cpp Swift bindings
import LlamaCpp

let model = try LlamaModel(
    path: "qwen2.5-3b-instruct-q4_k_m.gguf",
    contextSize: 4096,
    gpuLayers: 99  // Alles auf GPU (Metal)
)

let response = try model.complete(
    prompt: "Du bist 0711, ein hilfreicher Assistent. User: Hallo!",
    maxTokens: 256
)
```

### Android (llama.cpp / MLC-LLM)

```kotlin
// Mit llama.android
val model = LlamaModel.load(
    context = applicationContext,
    modelPath = "qwen2.5-3b-instruct-q4_k_m.gguf",
    params = LlamaParams(
        contextSize = 4096,
        gpuLayers = 99  // Vulkan/OpenCL
    )
)

val response = model.generate("Hallo, wie geht's?")
```

---

## 🧪 Schnelltest: Qwen2.5 3B lokal

```bash
# 1. Ollama (für Desktop-Test)
ollama pull qwen2.5:3b

# 2. Testen
ollama run qwen2.5:3b "Erkläre mir Stuttgart in 3 Sätzen auf Deutsch."

# 3. Performance messen
time ollama run qwen2.5:3b "Was ist 0711?" --verbose
```

### Erwartete Performance

| Device | Tokens/Sec | Antwortzeit |
|--------|------------|-------------|
| iPhone 15 Pro | ~25 tok/s | <1s |
| iPhone 13 | ~15 tok/s | ~2s |
| Pixel 8 | ~20 tok/s | ~1.5s |
| Samsung S24 | ~22 tok/s | ~1.2s |
| Mac Mini M4 | ~80 tok/s | <0.5s |

---

## 📥 Model Download

### GGUF Format (für llama.cpp)

```bash
# Hugging Face
huggingface-cli download \
  Qwen/Qwen2.5-3B-Instruct-GGUF \
  qwen2.5-3b-instruct-q4_k_m.gguf \
  --local-dir ./models

# Größe: ~1.9GB
```

### MLX Format (für Apple Silicon)

```bash
pip install mlx-lm
mlx_lm.convert \
  --hf-path Qwen/Qwen2.5-3B-Instruct \
  --mlx-path ./models/qwen2.5-3b-mlx \
  -q  # 4-bit quantization
```

---

## 🎯 Fazit

### Für 0711 empfehle ich:

| Komponente | Model | Warum |
|------------|-------|-------|
| **Phone (Primary)** | Qwen2.5 3B | Beste Balance Größe/Intelligenz/Deutsch |
| **Phone (Fallback)** | Qwen2.5 1.5B | Für ältere Geräte |
| **Home Server** | Qwen2.5 72B | Gleiche Familie, maximale Power |
| **Embeddings** | nomic-embed-text | Klein, schnell, gut |

### Warum Qwen-Familie?

```
1. Konsistenz — Gleiches "Denken" auf allen Geräten
2. Deutsch — Beste kleine Modelle für Deutsch
3. Lizenz — Apache 2.0 = Volle Freiheit
4. Kein US Big Tech — Alibaba (China)
5. Context — 128K tokens (konkurrenzlos)
6. Benchmarks — Schlägt GPT-3.5 in vielen Tasks
```

---

## 🚀 Nächster Schritt

```bash
# Jetzt testen?
ollama pull qwen2.5:3b
ollama run qwen2.5:3b
```

Soll ich das Model direkt auf deinem Mac installieren und einen ersten Test machen? 🔥
