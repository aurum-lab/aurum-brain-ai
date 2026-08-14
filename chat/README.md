# 🧠 Aurum Brain AI — Chat Interface

Web interface untuk chat langsung dengan **Aurum Brain AI** via Ollama.

## 🚀 Cara Pakai

### 1. Install Ollama

```bash
# Linux/Mac
curl -fsSL https://ollama.com/install.sh | sh

# Windows: download di https://ollama.com
```

### 2. Download Model

```bash
# Buat modelfile
cat > Modelfile << 'EOF'
FROM ./aurum-brain-q4_k_m.gguf
SYSTEM """$(cat data/system_prompt.txt)"""
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_ctx 4096
EOF

# Build model di Ollama
ollama create aurum-brain -f Modelfile
```

### 3. Jalankan Server

```bash
ollama serve
```

### 4. Buka Chat

Buka `chat/index.html` di browser, atau akses via GitHub Pages.

## ⚙️ Konfigurasi

| Setting | Default | Deskripsi |
|---------|---------|-----------|
| Server URL | `http://localhost:11434` | URL Ollama server |
| Model | `aurum-brain` | Nama model di Ollama |
| Temperature | `0.7` | Kreativitas (0-2) |
| Max Tokens | `2048` | Panjang max response |

## 🔗 Remote Server

Untuk akses dari HP/设备 lain:

```bash
# Jalankan Ollama dengan bind ke semua interface
OLLAMA_HOST=0.0.0.0 ollama serve
```

Lalu di chat, ganti Server URL ke `http://IP_LAPTOP:11434`.

## 📱 Fitur

- 💬 Real-time streaming chat
- 🎛️ Configurable temperature & max tokens
- 📝 Custom system prompt
- 💾 Settings tersimpan di localStorage
- 📦 Export chat history
- 📱 Responsive design (mobile-friendly)
- 🌙 Dark theme
