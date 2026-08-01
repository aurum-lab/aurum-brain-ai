# 🧠 Aurum Brain AI

> AI buatan sendiri — fine-tuned dari Qwen2.5-3B-Instruct untuk **Bahasa Indonesia**, **coding expert**, dan **percakapan pintar**.
> 
> Output format: GGUF (siap import ke **PocketPal**, **Ollama**, **LM Studio**, **llama.cpp**).

[![Train & Release](https://github.com/aurum-lab/aurum-brain-ai/actions/workflows/train.yml/badge.svg)](https://github.com/aurum-lab/aurum-brain-ai/actions/workflows/train.yml)
[![Download GGUF](https://img.shields.io/badge/Download-GGUF-2GB-yellow.svg)](https://github.com/aurum-lab/aurum-brain-ai/releases)

## 🎯 Apa Ini?

**Aurum Brain AI** adalah model AI custom yang di-fine-tune dari Qwen2.5-3B-Instruct dengan dataset Bahasa Indonesia berkualitas. Dirancang untuk:

- 🇮🇩 **Bahasa Indonesia natural** — bukan terjemahan, tapi native
- 💻 **Coding expert** — Python, JS/TS, Rust, Go, SQL, dan 25+ bahasa lainnya
- 🧠 **Problem solver** — debugging, arsitektur, optimasi, best practice
- 💬 **Percakapan pintar** — teknologi, sains, bisnis, edukasi

Model ini berjalan **100% offline** di HP atau komputer Anda. Tidak ada data yang dikirim ke server. Tidak butuh internet. Gratis selamanya.

## 📥 Download

**Langsung dari GitHub Releases:**
👉 **https://github.com/aurum-lab/aurum-brain-ai/releases/latest**

File yang dibutuhkan:
- `aurum-brain-q4_k_m.gguf` (~2GB) — model utama
- `system_prompt.txt` (~4KB) — personality AI (WAJIB set di PocketPal)

## 📱 Cara Pakai

### Termux (HP Android) — AI lokal dengan custom provider
Installer & tools Termux sudah dipindah ke repo terpisah:

👉 **https://github.com/aurum-lab/aurum-termux**

Quick install:
```bash
# Di Termux (install dari F-Droid, bukan Play Store)
curl -sL https://raw.githubusercontent.com/aurum-lab/aurum-termux/main/install.sh | bash
```

Setelah install, AI jalan sebagai **server lokal** di `http://localhost:8080` dengan API OpenAI-compatible. Bisa dipakai sebagai:
- **Custom provider di OpenClaw** — chat di app Android
- **Open WebUI** — UI web seperti ChatGPT
- **Cherry Studio** — desktop client (Windows/Mac/Linux)
- **VSCode Continue** — AI coding assistant di editor
- **App lain** yang support OpenAI API

### PocketPal (HP — paling gampang)
Lihat **[docs/POCKETPAL.md](docs/POCKETPAL.md)** untuk panduan lengkap.

### Ollama (Mac/Linux/Windows)
Lihat **[docs/OLLAMA.md](docs/OLLAMA.md)**.

### LM Studio (GUI)
Lihat **[docs/LMSTUDIO.md](docs/LMSTUDIO.md)**.

### llama.cpp (CLI)
```bash
./main -m aurum-brain-q4_k_m.gguf -p "Halo, siapa kamu?" -n 200
```

## 🏗️ Arsitektur

```
aurum-brain-ai/
├── data/
│   ├── system_prompt.txt              # Personality AI (IQ tinggi, jago coding)
│   ├── conversations_source.json      # 39 percakapan Bahasa Indonesia
│   └── train.jsonl                    # Dataset format ChatML (auto-generated)
├── scripts/
│   ├── generate_source.js             # Generator dataset (Node.js)
│   ├── build_dataset.py               # Builder JSONL dari source
│   └── train.py                       # LoRA fine-tuning script
├── .github/workflows/
│   ├── train.yml                      # Auto-train + release GGUF
│   └── starter-release.yml            # Starter model (Qwen2.5-1.5B) cepat
├── docs/
│   ├── POCKETPAL.md                   # Import ke PocketPal (HP)
│   ├── OLLAMA.md                      # Pakai dengan Ollama
│   ├── LMSTUDIO.md                    # Pakai dengan LM Studio
│   └── CUSTOMIZE.md                   # Cara kustomisasi AI
├── modelfile                          # Ollama modelfile
└── README.md
```

**Note:** Untuk install di Termux (HP Android), lihat repo terpisah:
**[aurum-lab/aurum-termux](https://github.com/aurum-lab/aurum-termux)**

## 🧬 Spesifikasi Model

| Aspek | Detail |
|-------|--------|
| **Base model** | Qwen/Qwen2.5-3B-Instruct |
| **Fine-tune method** | LoRA (Low-Rank Adaptation) |
| **LoRA rank** | r=32, alpha=64 |
| **Target modules** | q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj |
| **Training epochs** | 3 |
| **Quantization** | Q4_K_M |
| **Output format** | GGUF (llama.cpp compatible) |
| **File size** | ~2GB |
| **Context length** | 4096 tokens (~3000 kata) |
| **Min RAM** | 4GB (mobile), 8GB (desktop) |

## 🎨 Personality AI

AI dirancang dengan karakter:

- **Percaya diri** — jawaban to the point, tidak ragu
- **Expert** — ahli di coding, software engineering, problem solving
- **Bahasa Indonesia** — formal tapi santai, jangan kaku
- **Anti-emoji berlebihan** — maksimal 1-2 emoji per response
- **Tidak mulai dengan "Baik," atau "Tentu,"** — langsung ke substansi
- **Jujur kalau tidak yakin** — tidak halusinasi

Detail lengkap di **[data/system_prompt.txt](data/system_prompt.txt)**.

## 📊 Dataset Training

39 percakapan Bahasa Indonesia berkualitas tinggi, mencakup:

**Programming Languages:**
- **Python**: list/tuple/set, decorator, performance optimization
- **JavaScript/TypeScript**: var/let/const, debounce, async/await
- **Rust**: ownership, borrowing
- **Go**: goroutine, channel
- **SQL**: index, query optimization

**Web Development (khusus untuk bikin website):**
- Landing page HTML/CSS responsive
- Form login dengan validation (React + Zod)
- Next.js API route untuk upload file ke S3
- Navbar responsive dengan hamburger menu
- Carousel/slider image tanpa library
- Dark mode toggle di Next.js + Tailwind
- Modal/dialog dengan aksesibilitas (focus trap, ARIA)
- Tailwind vs CSS biasa comparison
- Deploy Next.js ke Vercel
- Loading skeleton dengan shimmer effect
- Infinite scroll dengan IntersectionObserver

**Software Engineering:**
- Debugging: NoneType error, common pitfalls
- Architecture: microservices vs monolith
- Database: SQL vs NoSQL
- Git: rebase vs merge
- DevOps: Docker compose
- Security: password hashing
- Algorithm: Big O, hash table
- API Design: REST best practices
- Testing: unit vs integration test

**Percakapan Umum:**
- Siapa kamu, makna hidup, belajar programming

Tambah data Anda sendiri di **`scripts/generate_source.js`**.

## 🔄 Auto-Update

Setiap kali ada perubahan di `data/` atau `scripts/`, GitHub Actions akan:

1. Build dataset baru
2. Train model dari awal (LoRA fine-tuning, ~30 menit)
3. Convert ke GGUF Q4_K_M
4. Upload sebagai artifact
5. Create GitHub Release baru dengan GGUF siap download

Manual trigger:
```bash
gh workflow run train.yml -R aurum-lab/aurum-brain-ai
```

## 🆚 Perbandingan dengan AI Lain

| Aspek | Aurum Brain AI | ChatGPT/Gemini | Llama 3.2 (3B) |
|-------|----------------|----------------|----------------|
| Bahasa Indonesia | Native fine-tuned | Multilingual default | Multilingual default |
| Coding ability | Good (dataset fokus) | Excellent | Good |
| Privacy | 100% lokal | Cloud (data dikirim) | 100% lokal |
| Cost | Gratis selamanya | Berlangganan | Gratis |
| Offline | Ya | Tidak | Ya |
| Customizable | Bisa retrain | Tidak | Bisa retrain |
| Size | 2GB (Q4) | Cloud (100B+) | 2GB (Q4) |

## 📈 Roadmap

- [x] v1.0 — Base release dengan 28 percakapan
- [ ] v1.1 — Tambah 50+ percakapan (mobile dev, ML, devops)
- [ ] v1.2 — Variant Q5_K_M untuk quality lebih tinggi
- [ ] v1.3 — Base model Qwen2.5-7B (HP flagship only)
- [ ] v2.0 — Multi-modal (text + image input)
- [ ] v2.1 — Function calling support

## ⚠️ Disclaimer

- **Bukan saran finansial/legal/medis** — selalu konsultasi professional
- Model bisa **halusinasi** — verify info penting dari sumber terpercaya
- Fine-tune pada dataset kecil (28 contoh) — kualitas terbatas dibanding model 100B+
- Untuk task critical, pakai model cloud (ChatGPT/Claude/Gemini)

## 📜 License

MIT — bebas pakai, modifikasi, distribusi. Atribusi dihargai tapi tidak wajib.

## 🙏 Credits

- **Base model**: [Qwen2.5-3B-Instruct](https://huggingface.co/Qwen/Qwen2.5-3B-Instruct) by Alibaba
- **Training framework**: [Transformers](https://github.com/huggingface/transformers) + [PEFT](https://github.com/huggingface/peft)
- **GGUF conversion**: [llama.cpp](https://github.com/ggerganov/llama.cpp)
- **Dataset**: Curated oleh Aurum Lab

---

**Made with 🧠 by [Aurum Lab](https://github.com/aurum-lab)**
