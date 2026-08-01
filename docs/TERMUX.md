# Install Aurum Brain AI di Termux (HP Android)

**Tujuan:** Jalanin AI lokal di HP Android 100% offline. Bisa dipakai sebagai **custom provider** untuk OpenClaw, Open WebUI, Cherry Studio, atau app lain yang support OpenAI API.

## 📋 Persyaratan

- **HP Android** dengan ARM64 (hampir semua HP jaman sekarang)
- **RAM minimal 4GB** (recommended 6GB+)
- **Storage 4GB free** (untuk model + build artifacts)
- **Android 8.0+**
- **Internet** untuk download (sekali saja, setelah itu offline)

## 🚀 Quick Install

### 1. Install Termux

**PENTING:** Jangan install dari Play Store (versi lama, tidak terupdate). Install dari sumber resmi:

- **F-Droid** (recommended): https://f-droid.org/packages/com.termux/
- **GitHub Releases**: https://github.com/termux/termux-app/releases

### 2. Install Aurum Brain AI

Buka Termux, jalankan satu command:

```bash
# Download installer
curl -sL https://raw.githubusercontent.com/aurum-lab/aurum-brain-ai/main/scripts/install-termux.sh -o install-aurum.sh

# Jalankan installer
bash install-aurum.sh
```

Installer akan otomatis:
1. Update Termux packages
2. Install dependencies (clang, cmake, git, python)
3. Build llama.cpp untuk Android ARM64 (~5-10 menit)
4. Download model GGUF (1GB starter atau 2GB full)
5. Bikin start/stop scripts
6. Test model dengan prompt singkat

### 3. Pilih Model

Saat installer jalan, Anda akan ditanya:

```
Pilih model:
  1) Starter - Qwen2.5-1.5B Q4 (~1GB, lebih cepat di HP)     ← RECOMMENDED untuk HP biasa
  2) Full    - Qwen2.5-3B Q4 (~2GB, lebih pintar, fine-tuned)  ← Untuk HP flagship
  3) Skip download (kalau sudah punya GGUF sendiri)
```

**Saran:**
- HP dengan RAM 4-6GB → pilih **1** (Starter)
- HP flagship (Snapdragon 8+, 8GB+ RAM) → pilih **2** (Full)
- HP low-end (RAM 3GB) → pakai model lebih kecil lagi (Q2_K ~700MB)

## 🏃 Cara Pakai

### Start Server (Background)

```bash
~/aurum-brain-ai/start.sh
```

Output:
```
============================================
  Aurum Brain AI - Local Server
============================================
  Model: aurum-brain-starter-q4_k_m.gguf
  URL:   http://localhost:8080
  API:   http://localhost:8080/v1/chat/completions
============================================

Tekan Ctrl+C untuk stop
```

Server jalan di background. **Biarkan Termux terbuka**, atau pakai `termux-wake-lock` supaya tidak mati saat layar off.

### Quick Chat (CLI)

```bash
~/aurum-brain-ai/chat.sh "Halo, siapa kamu?"
```

Output (sekitar 10-30 detik):
```
Halo! Saya Aurum Brain AI, asisten AI buatan Aurum Lab. Saya dirancang untuk bantu kamu coding, problem-solving, dan ngobrol soal apa saja — semuanya dalam Bahasa Indonesia.
```

### Stop Server

```bash
~/aurum-brain-ai/stop.sh
```

## 🔌 Setup Custom Provider

### OpenClaw

OpenClaw adalah app AI client yang support OpenAI-compatible API. Setup:

1. Install OpenClaw dari Play Store / GitHub
2. Buka Settings → **Custom Provider** atau **Model Provider**
3. Tambah provider baru:
   - **Name**: `Aurum Brain AI (Local)`
   - **Base URL**: `http://localhost:8080/v1`
   - **API Key**: `sk-not-needed` (kosongkan, lokal tidak butuh)
   - **Model**: `aurum-brain` (atau apa pun, server ignore)
4. Save → pilih provider ini → mulai chat

**Alternatif:** kalau HP tidak bisa akses `localhost` (masalah Android), pakai IP HP:
```bash
# Cek IP HP di WiFi
ip addr show wlan0 | grep inet
# Atau
ifconfig wlan0
# Contoh: 192.168.1.100
```
Pakai: `http://192.168.1.100:8080/v1`

### Open WebUI (Web Interface)

Open WebUI adalah UI seperti ChatGPT untuk model lokal.

```bash
# Install di Termux (butuh Node.js)
pkg install nodejs
npm install -g open-webui

# Run (port 3000)
open-webui --port 3000 --host 0.0.0.0 &

# Atau pakai Ollama binding:
open-webui --ollama-base-url http://localhost:8080
```

Akses di browser HP: `http://localhost:3000`

### Cherry Studio

Cherry Studio adalah desktop client (Windows/Mac/Linux) yang support OpenAI API.

1. Download dari https://cherry-ai.com
2. Settings → **Model Service**
3. Add → **OpenAI Compatible**
   - URL: `http://<IP-HP>:8080/v1`
   - Key: `sk-anything` (dummy)
4. Test koneksi → pakai

### VSCode (Continue extension)

Continue adalah extension VSCode untuk AI coding assistant.

1. Install VSCode + Continue extension
2. Buka `~/.continue/config.json`
3. Tambah:
```json
{
  "models": [{
    "title": "Aurum Brain AI (Local)",
    "provider": "openai",
    "model": "aurum-brain",
    "apiKey": "sk-anything",
    "apiBase": "http://localhost:8080/v1"
  }]
}
```

### Curl Test (Quick API Test)

```bash
# Test endpoint
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "aurum-brain",
    "messages": [{"role": "user", "content": "Halo, siapa kamu?"}]
  }'

# Streaming response
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "aurum-brain",
    "messages": [{"role": "user", "content": "Bikin function Python buat cek palindrome"}],
    "stream": true
  }'
```

### Python Client

```python
import requests

response = requests.post(
    "http://localhost:8080/v1/chat/completions",
    json={
        "model": "aurum-brain",
        "messages": [
            {"role": "system", "content": "Kamu adalah Aurum Brain AI..."},
            {"role": "user", "content": "Bikin landing page HTML sederhana"}
        ],
        "temperature": 0.7,
        "max_tokens": 1000,
    },
    stream=False,
)

print(response.json()["choices"][0]["message"]["content"])
```

### JavaScript Client

```javascript
const response = await fetch('http://localhost:8080/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'aurum-brain',
    messages: [
      { role: 'user', content: 'Bikin komponen React untuk button' }
    ],
  }),
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

## 🌐 Akses dari Device Lain

Server jalan di port 8080, bisa diakses dari device lain di jaringan WiFi yang sama.

1. **Cek IP HP:**
   ```bash
   ip addr show wlan0 | grep "inet "
   # Contoh: inet 192.168.1.100/24
   ```

2. **Akses dari device lain:**
   - Browser di PC/laptop: `http://192.168.1.100:8080`
   - Postman: `http://192.168.1.100:8080/v1/chat/completions`
   - App AI client di HP lain: pakai URL di atas

3. **Port forwarding (kalau mau akses dari internet):**
   - Setup di router: forward port 8080 ke IP HP
   - Atau pakai ngrok / cloudflared untuk tunnel

## 🔧 Optimasi Performance

### Termux Wake Lock (penting!)

Tanpa wake lock, Android akan kill server saat layar off:

```bash
# Aktifkan wake lock
termux-wake-lock

# Disable (saat tidak dipakai)
termux-wake-unlock
```

**Tip:** tambahkan ke `start.sh` supaya otomatis:
```bash
# Edit ~/aurum-brain-ai/start.sh, tambah di awal:
termux-wake-lock
```

### Performance Tips

```bash
# Cek spec HP (CPU, RAM)
nproc          # jumlah core
cat /proc/meminfo | head -3   # RAM total

# Sesuaikan threads di start.sh
# Edit baris: --threads $(nproc)
# jadi: --threads 4  (kalau HP punya 8 core, pakai 4 supaya tidak panas)
```

### Kurangi Memory Usage

Kalau OOM (out of memory), edit `start.sh`:

```bash
# Kurangi context size (default 4096)
--ctx-size 2048

# Atau pakai model lebih kecil
# Q2_K = ~700MB (untuk HP low-end)
```

### Battery Management

- **Pakai charger** saat sesi panjang
- **Hindari HP terlalu panas** (>45°C) — bisa throttle
- **Turunkan threads** kalau HP panas cepat

## 🔄 Update Model

Saat ada versi baru GGUF:

```bash
# Download ulang (akan replace yang lama)
cd ~/aurum-brain-ai
bash install-termux.sh  # pilih opsi download lagi

# Atau manual download ke ~/aurum-brain-ai/models/
curl -L -o ~/aurum-brain-ai/models/aurum-brain-q4_k_m.gguf \
  https://github.com/aurum-lab/aurum-brain-ai/releases/latest/download/aurum-brain-q4_k_m.gguf
```

Restart server setelah update.

## 🐛 Troubleshooting

### Build gagal

**Error:** `clang: not found`
```bash
pkg install clang
```

**Error:** `cmake: command not found`
```bash
pkg install cmake
```

**Error:** Out of memory saat build
```bash
# Kurangi threads
cmake --build . -j 2 --target llama-server
```

### Model gagal load

**Error:** `failed to load model`
- Cek file GGUF tidak corrupt: `ls -la ~/aurum-brain-ai/models/*.gguf`
- Cek size harus ~1GB atau ~2GB (tergantung pilihan)
- Re-download: `rm ~/aurum-brain-ai/models/*.gguf && bash install-termux.sh`

### Server tidak bisa diakses

**Dari HP sendiri (Termux):**
- Pastikan server jalan: `curl http://localhost:8080/health`
- Cek port: `netstat -tlnp | grep 8080`

**Dari device lain (WiFi):**
- Pastikan HP dan device lain di WiFi yang sama
- Cek firewall Android tidak block port
- Coba akses via IP: `http://<IP-HP>:8080`

### Response sangat lambat

- **Pakai model lebih kecil** (Q2_K atau Q3_K)
- **Turunkan context size**: `--ctx-size 1024`
- **Tambah threads** (kalau HP belum max): `--threads $(nproc)`
- **Tutup app lain** yang boros RAM
- **Restart HP** kalau sudah lama tidak restart

### Termux ditutup otomatis

- **Aktifkan wake lock**: `termux-wake-lock`
- **Disable battery optimization** untuk Termux di Settings Android
- **Pakai Termux:Boot** untuk autostart

### Out of memory (OOM)

- **Pakai model lebih kecil** (1.5B bukan 3B)
- **Kurangi context size** ke 2048 atau 1024
- **Tambah swap** (experimental):
  ```bash
  # Bikin swap file 2GB
  dd if=/dev/zero of=~/swap.img bs=1M count=2048
  # Note: swap di Android tidak ideal, sebaiknya upgrade model ke Q2_K
  ```

## 📱 Tips untuk HP Low-End

Kalau HP Anda RAM 3-4GB:

1. **Pakai model Q2_K** (~700MB) — download manual:
   ```bash
   python3 << 'EOF'
   from huggingface_hub import hf_hub_download
   import shutil
   path = hf_hub_download(repo_id="Qwen/Qwen2.5-1.5B-Instruct-GGUF", filename="qwen2.5-1.5b-instruct-q2_k.gguf")
   shutil.copy(path, "~/aurum-brain-ai/models/aurum-brain-q2_k.gguf")
   EOF
   ```

2. **Edit start.sh** pakai model Q2_K:
   ```bash
   # Edit baris GGUF_FILE:
   GGUF_FILE="$HOME/aurum-brain-ai/models/aurum-brain-q2_k.gguf"
   ```

3. **Kurangi context** ke 1024:
   ```bash
   --ctx-size 1024
   ```

## 🎯 Use Cases

### Coding Assistant (VSCode)

Setup Continue extension dengan Aurum Brain AI sebagai provider. Anda dapat:
- **Code completion** (real-time di editor)
- **Code explanation** (highlight kode → tanya AI)
- **Refactor suggestions**
- **Bug detection**

### Website Builder

Tanya AI untuk generate kode website:
- "Bikin landing page HTML untuk bisnis kopi"
- "Bikin komponen React untuk e-commerce product card"
- "Bikin CSS untuk efek parallax scroll"

AI kasih kode siap pakai, Anda copy ke project.

### Documentation Writer

- "Tulis README.md untuk project X dengan fitur A, B, C"
- "Bikin dokumentasi API dari kode ini: [paste kode]"
- "Generate changelog dari git log"

### Code Reviewer

- "Review kode ini untuk security issues: [paste kode]"
- "Apakah ada bug di function ini? [paste]"
- "Refactor kode ini supaya lebih clean: [paste]"

## 🆘 Bantuan

Kalau ada masalah:

1. **Cek log server** di Termux (error messages akan muncul di sana)
2. **Cek dokumentasi**: https://github.com/aurum-lab/aurum-brain-ai
3. **Open issue**: https://github.com/aurum-lab/aurum-brain-ai/issues
   - Sertakan: HP model, Android version, RAM, error log

## 📊 Spesifikasi Teknis

- **Backend**: llama.cpp (build native Android ARM64)
- **API**: OpenAI-compatible (`/v1/chat/completions`)
- **Protocol**: HTTP/1.1, JSON
- **Default port**: 8080
- **Max context**: 4096 tokens (~3000 kata)
- **Concurrency**: 1 request (sequential)
- **Memory usage**: 1.5-3GB saat active

## 🆚 Perbandingan dengan Cloud AI

| Aspek | Aurum Brain AI (Termux) | ChatGPT/Gemini |
|-------|------------------------|----------------|
| Privacy | 100% lokal | Data ke server |
| Internet | Tidak butuh | Wajib |
| Cost | Gratis | Berlangganan |
| Speed | 5-30 detik | 1-3 detik |
| Bahasa Indonesia | Fine-tuned | Multilingual default |
| Customizable | Ya (retrain) | Tidak |
| Battery | Boros saat active | Hemat (cloud) |
| Offline | Ya | Tidak |

## 🎓 Kesimpulan

Termux + Aurum Brain AI = **AI coding assistant gratis di saku Anda**. Cocok untuk:
- Developer yang privacy-conscious
- Yang sering offline (commuter, travel)
- Belajar AI tanpa biaya cloud
- Eksperimen dengan model lokal
