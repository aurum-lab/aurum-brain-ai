# 🧠 Aurum Brain AI

> **AI buatan Indonesia** — fine-tuned dari **Qwen2.5-1.5B-Instruct** untuk **Bahasa Indonesia native**, **coding expert**, dan **percakapan pintar**.
> 
> Output: **GGUF Q4_K_M** (~1.2GB) — siap pakai di **PocketPal (HP)**, **Ollama**, **LM Studio**, **llama.cpp** — **100% offline**, gratis selamanya.

![Model](https://img.shields.io/badge/Base-Qwen2.5--1.5B--Instruct-blue)
![Fine-tune](https://img.shields.io/badge/Method-LoRA%20(r%3D16%2C%20alpha%3D32)-purple)
![Format](https://img.shields.io/badge/Format-GGUF%20Q4_K__M-green)
![Size](https://img.shields.io/badge/Size-~1.2GB-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Auto Train](https://img.shields.io/badge/Auto_Train-Daily%20(NVIDIA--style)-red)

---

## 🎯 Apa Ini?

**Aurum Brain AI** adalah model bahasa custom yang di-fine-tune dari **Qwen2.5-1.5B-Instruct** menggunakan dataset Bahasa Indonesia berkualitas tinggi (39+ percakapan, terus bertambah via auto-expansion).

**Kelebihan:**
- 🇮🇩 **Bahasa Indonesia native** — bukan terjemahan, tapi natural & santai
- 💻 **Coding expert** — Python, JS/TS, Rust, Go, SQL, dan 25+ bahasa
- 🧠 **Problem solver** — debugging, arsitektur, optimasi, best practice
- 💬 **Percakapan pintar** — tech, sains, bisnis, edukasi, daily life
- 🔒 **100% Privasi** — jalan offline di device Anda, zero data keluar
- 💰 **Gratis selamanya** — no subscription, no API key, no server

---

## 📥 Download Model

**GitHub Releases (terbaru):**
👉 **[https://github.com/aurum-lab/aurum-brain-ai/releases/latest](https://github.com/aurum-lab/aurum-brain-ai/releases/latest)**

**Hugging Face Hub:**
👉 **[arissuga/aurum-brain-ai](https://huggingface.co/arissuga/aurum-brain-ai)** — `aurum-brain-q4_k_m.gguf` + `system_prompt.txt`

**File wajib:**
| File | Ukuran | Fungsi |
|------|--------|--------|
| `aurum-brain-q4_k_m.gguf` | ~1.2GB | Model utama (quantized Q4_K_M) |
| `system_prompt.txt` | ~4KB | **WAJIB** — personality AI (set di PocketPal/Ollama/LM Studio) |

---

## 📱 Cara Pakai (Pilih Satu)

### 1. PocketPal (Android/iOS — Offline HP) ⭐ **Recommended**
> Paling gampang untuk HP, UI bagus, support system prompt.
1. Install **PocketPal** (Play Store / GitHub / F-Droid)
2. **Models** → **Add Model** → pilih `aurum-brain-q4_k_m.gguf`
3. **Settings** → **System Prompt** → paste isi `system_prompt.txt`
4. Chat! 🎉

📖 Detail: **[docs/POCKETPAL.md](docs/POCKETPAL.md)**

---

### 2. Ollama (Mac/Linux/Windows — CLI + API)
```bash
# Buat modelfile (sudah ada di repo)
ollama create aurum-brain -f modelfile

# Atau manual import GGUF
ollama create aurum-brain -f ./Modelfile
# Modelfile isi:
# FROM ./aurum-brain-q4_k_m.gguf
# SYSTEM """$(cat system_prompt.txt)"""
# PARAMETER temperature 0.7
# PARAMETER top_p 0.9
# PARAMETER num_ctx 4096

# Jalankan
ollama run aurum-brain "Halo, siapa kamu?"
```

📖 Detail: **[docs/OLLAMA.md](docs/OLLAMA.md)**

---

### 3. LM Studio (GUI — Desktop)
1. Buka LM Studio → **Models** → **Add Model** → drag `aurum-brain-q4_k_m.gguf`
2. **Settings** (⚙️) → **System Prompt** → paste `system_prompt.txt`
4. **Chat** tab → pilih model → mulai chat
5. Bisa juga **Local Server** (OpenAI-compatible) → `http://localhost:1234/v1`

📖 Detail: **[docs/LMSTUDIO.md](docs/LMSTUDIO.md)**

---

### 4. llama.cpp (CLI — Minimal)
```bash
# Build llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp && make -j

# Chat
./main -m aurum-brain-q4_k_m.gguf -p "Halo, siapa kamu?" -n 200 -c 4096 --temp 0.7

# Server mode (OpenAI-compatible)
./server -m aurum-brain-q4_k_m.gguf -c 4096 --port 8080
# Lalu pakai curl / OpenAI SDK ke http://localhost:8080/v1
```

---

### 5. Web Chat (Browser) 🆕

> **[chat/](chat/)** — Interface web untuk chat langsung via browser, koneksi ke Ollama.

```bash
# Pastikan Ollama running
ollama serve

# Buka chat/index.html di browser
# Atau akses via GitHub Pages
```

Fitur:
- 💬 Real-time streaming chat
- 🎛️ Configurable temperature & max tokens
- 📝 Custom system prompt
- 📱 Responsive (bisa di HP)
- 🌙 Dark theme

📖 Detail: **[chat/README.md](chat/README.md)**

---

## 🏗️ Struktur Repo

```
aurum-brain-ai/
├── chat/                        # Web chat interface (connect ke Ollama)
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── README.md
├── data/
│   ├── system_prompt.txt          # Personality AI (IQ tinggi, jago coding, Bahasa Indonesia native)
│   ├── conversations_source.json  # 39+ percakapan source (manual curated)
│   ├── train.jsonl                # Dataset ChatML format (auto-generated dari source)
│   └── expansion_log.json         # Log auto-expansion dataset harian
├── scripts/
│   ├── generate_source.js         # Generator variasi dataset (Node.js)
│   ├── build_dataset.py           # Build train.jsonl dari conversations_source.json
│   ├── expand_dataset.py          # Auto-expand dataset harian (template-based)
│   ├── expand_agent_dataset.py    # Multi-domain + Agent AI expansion
│   ├── train.py                   # LoRA fine-tuning script (Transformers + PEFT)
│   ├── distill_dataset.py         # Dataset distillation (opsional)
│   └── upload_to_hf.py            # Upload merged model ke Hugging Face Hub
├── .github/workflows/
│   ├── train.yml                  # Manual trigger: train + release GGUF
│   ├── daily-train.yml            # Scheduled daily: expand dataset → train → release
│   └── starter-release.yml        # Quick release base model (Qwen2.5-3B)
├── docs/
│   ├── POCKETPAL.md               # Panduan PocketPal
│   ├── OLLAMA.md                  # Panduan Ollama
│   ├── LMSTUDIO.md                # Panduan LM Studio
│   └── CUSTOMIZE.md               # Cara kustomisasi dataset/prompt
├── modelfile                      # Ollama modelfile template
└── README.md
```

---

## 🧬 Spesifikasi Model Teknis

| **Base model** | Qwen/Qwen2.5-1.5B-Instruct |
| **Fine-tune method** | LoRA (Low-Rank Adaptation) |
| **LoRA rank (r)** | 16 |
| **LoRA alpha** | 32 |
| **LoRA dropout** | 0.05 |
| **Target modules** | q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj |
| **Training epochs** | 2 (per run) / 1 (daily auto) |
| **Batch size** | 1 |
| **Gradient accumulation** | 4 |
| **Max sequence length** | 768 tokens (manual) / 512 (daily auto) |
| **Learning rate** | 2e-4 |
| **Optimizer** | AdamW |
| **Quantization** | Q4_K_M (llama.cpp k-quant) |
| **Output format** | GGUF (llama.cpp compatible) |
| **File size** | ~1.2 GB |
| **Context window** | 4096 tokens (~3000 kata) |
| **Min RAM** | 3 GB (mobile), 6 GB (desktop) |
| **License** | MIT (base model: Tongyi Qianwen License) |

---

## 🎨 Personality AI (System Prompt)

AI dirancang dengan karakter konsisten via `system_prompt.txt`:

- **Percaya diri & to the point** — tidak ragu, tidak bertele-tele
- **Expert teknis** — coding, software engineering, debugging, arsitektur
- **Bahasa Indonesia native** — formal tapi santai, natural, tidak kaku terjemahan
- **Anti-emoji berlebihan** — max 1-2 emoji per response
- **Tidak robotic** — tidak mulai dengan "Baik,", "Tentu,", "Berikut adalah"
- **Jujur** — kalau tidak yakin, bilang tidak yakin; tidak halusinasi
- **Proactive** — tawarkan alternatif, kasih best practice, explain *why*

📄 **Lihat lengkap:** `data/system_prompt.txt` (copy-paste ke PocketPal/Ollama/LM Studio)

---

## 📊 Dataset Training

**39+ percakapan Bahasa Indonesia berkualitas tinggi**, categories:

| Kategori | Contoh Topik |
|----------|--------------|
| **Python** | list/tuple/set, decorator, performance opt, async |
| **JavaScript/TypeScript** | var/let/const, debounce, async/await, React hooks |
| **Rust** | ownership, borrowing, lifetimes |
| **Go** | goroutine, channel, error handling |
| **SQL** | index, query optimization, EXPLAIN ANALYZE |
| **Web Dev** | landing page, form validation, Next.js API, dark mode, carousel |
| **Software Eng** | debugging, microservices vs monolith, Git, Docker, security, testing |
| **General** | siapa kamu, belajar programming, problem solving |
| **Agent AI** | function calling, tool use, autonomous task, multi-step reasoning |
| **Multi-domain** | science, business, health, finance, legal, creative |
| **Real-world scenarios** | business plan, technical docs, code review, architecture design |

**Auto-expansion harian** (mirip NVIDIA Nemotron):
- Setiap hari jam **10:00 WIB** (03:00 UTC) via `daily-train.yml`
- Dataset di-expand: paraphrasing, variasi kode baru, konteks tambahan
- LoRA re-train dari checkpoint terbaru
- Release GGUF baru otomatis ke GitHub Releases + HF Hub
- Cleanup release lama (keep 8 terbaru = 2 hari)
- Tracking: `data/expansion_log.json`

---

## 🔄 Auto-Training & Release Pipeline

### Manual Trigger (kapan saja)
```bash
# Trigger training + release GGUF
gh workflow run train.yml -R aurum-lab/aurum-brain-ai

# Trigger daily-style expansion + train
gh workflow run daily-train.yml -R aurum-lab/aurum-brain-ai

# Quick starter release (base model only)
gh workflow run starter-release.yml -R aurum-lab/aurum-brain-ai
```

### Scheduled (Otomatis)
| Workflow | Schedule | Aksi |
|----------|----------|------|
| `daily-train.yml` | Daily 03:00 UTC (10:00 WIB) | Expand dataset → LoRA train → GGUF → Release |
| `train.yml` | On push `data/`, `scripts/` | Build dataset → Train → Release |

### Release Output
Setiap release berisi:
- `aurum-brain-q4_k_m.gguf` — model quantized siap pakai
- `system_prompt.txt` — personality (WAJIB di-set di client)
- `merged/` (opsional) — fused LoRA weights untuk training lanjut

---

## 📈 Monitoring & Progress

```bash
# Cek workflow runs (status training)
gh run list -R aurum-lab/aurum-brain-ai --limit 10

# Cek release history
gh release list -R aurum-lab/aurum-brain-ai --limit 10

# Lihat expansion log (dataset growth)
curl -s https://raw.githubusercontent.com/aurum-lab/aurum-brain-ai/main/data/expansion_log.json | jq .

# Lihat dataset source terkini
curl -s https://raw.githubusercontent.com/aurum-lab/aurum-brain-ai/main/data/conversations_source.json | jq length
```

---

## 🆚 Perbandingan

| Aspek | Aurum Brain AI | ChatGPT/Claude/Gemini | Llama 3.2 1B/3B (base) |
|-------|----------------|------------------------|---------------------|
| **Bahasa Indonesia** | ✅ Native fine-tuned | 🌐 Multilingual (biasa) | 🌐 Multilingual (biasa) |
| **Coding** | ✅ Good (dataset fokus) | ✅ Excellent | ✅ Good |
| **Privasi** | ✅ 100% Lokal | ❌ Cloud (data dikirim) | ✅ 100% Lokal |
| **Biaya** | ✅ Gratis selamanya | 💰 Subscription | ✅ Gratis |
| **Offline** | ✅ Ya | ❌ Tidak | ✅ Ya |
| **Customizable** | ✅ Bisa retrain | ❌ Tidak | ✅ Bisa retrain |
| **Ukuran** | 1.2 GB (Q4) | Cloud (100B+) | 1-2 GB (Q4) |
| **System Prompt** | ✅ Custom (wajib) | ⚠️ Limited | ⚠️ Manual |

---

## 🗺️ Roadmap

- [x] **v1.0** — Base release 28 percakapan
- [x] **v1.1** — 39+ percakapan, daily auto-train pipeline (default 1.5B model for GH Actions)
- [ ] **v1.2** — Variant Q5_K_M / Q8_0 untuk quality lebih tinggi
- [ ] **v1.3** — Base model upgrade ke Qwen2.5-7B (HP flagship)
- [ ] **v2.0** — Multi-modal (text + image input via LLaVA)
- [ ] **v2.1** — Function calling / tool use support
- [ ] **v3.0** — RAG integration (local knowledge base)

---

## ⚠️ Disclaimer & Batasan

- ❌ **Bukan saran finansial/legal/medis** — konsultasi profesional
- ⚠️ **Bisa halusinasi** — verify info kritis dari sumber terpercaya
- 📊 **Dataset relatif kecil** (39+ contoh) — kualitas terbatas vs model 100B+
- 🧪 **Fine-tune LoRA** — bukan full fine-tune, base knowledge dari Qwen2.5
- 📱 **Mobile (4GB RAM)** — jalan tapi lambat; rekomendasi 6GB+
- 🔧 **Untuk task kritis** — pakai model cloud (Claude, GPT-4o, Gemini)

---

## 📜 License

**MIT License** — bebas pakai, modifikasi, distribusi, komersial.
Atribusi dihargai tapi tidak wajib.

**Base model:** Qwen2.5-1.5B-Instruct — [Tongyi Qianwen License](https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct/blob/main/LICENSE)

---

## 🙏 Credits

- **Base model:** [Qwen2.5-1.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct) oleh **Alibaba Cloud**
- **Training framework:** [Transformers](https://github.com/huggingface/transformers) + [PEFT](https://github.com/huggingface/peft) oleh **Hugging Face**
- **Quantization/GGUF:** [llama.cpp](https://github.com/ggerganov/llama.cpp) oleh **Georgi Gerganov**
- **Dataset & Fine-tune:** **Aurum Lab** (curated manual + auto-expansion)
- **Infrastructure:** GitHub Actions (free runners), Hugging Face Hub (model hosting)

---

**Made with 🧠 by [Aurum Lab](https://github.com/aurum-lab)**

> *"AI yang paham Bahasa Indonesia, bukan cuma terjemahan."*
