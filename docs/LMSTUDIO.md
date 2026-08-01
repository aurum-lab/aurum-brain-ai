# Pakai Aurum Brain AI dengan LM Studio

**LM Studio** adalah GUI app untuk jalanin AI model lokal di Mac/Windows/Linux. Lebih user-friendly daripada Ollama untuk yang baru mulai.

## Install

Download dari **https://lmstudio.ai/**:

- **Mac**: LM Studio untuk macOS (Apple Silicon atau Intel)
- **Windows**: LM Studio untuk Windows 10/11
- **Linux**: AppImage atau .deb

## Setup

### 1. Download GGUF

Dari https://github.com/aurum-lab/aurum-brain-ai/releases → download `aurum-brain-q4_k_m.gguf`

### 2. Pindahkan ke folder LM Studio

```bash
# Mac default path
~/Library/Application Support/LM Studio/models/aurum-brain/

# Windows default path
C:\Users\<username>\.lmstudio\models\aurum-brain\

# Linux
~/.lmstudio/models/aurum-brain/
```

Bikin folder `aurum-brain` dulu, lalu pindahkan GGUF ke sana:

```bash
mkdir -p ~/.lmstudio/models/aurum-brain
mv aurum-brain-q4_k_m.gguf ~/.lmstudio/models/aurum-brain/
```

### 3. Buka LM Studio

- Buka app LM Studio
- Di sidebar kiri, klik icon folder (Local Models)
- Model `aurum-brain-q4_k_m` harus muncul di list
- Klik model → "Load Model"

### 4. Set System Prompt

- Buka tab **Chat** (icon bubble di sidebar)
- Klik **Settings** (gear icon di kanan atas)
- Scroll ke **System Prompt**
- Paste isi dari `data/system_prompt.txt` (download dari repo)
- Save

### 5. Setting Inference Parameters

Di Settings yang sama:

```
Temperature: 0.7
Top P: 0.9
Top K: 40
Context Length: 4096
Repeat Penalty: 1.1
Max Tokens: 1024
```

### 6. Mulai Chat!

Ketik di input box: `Halo, siapa kamu?`

## Fitur LM Studio yang Berguna

### Local Server (API)
LM Studio bisa jadi server API kompatibel dengan OpenAI:

1. Klik tab **Local Server** (icon server)
2. Klik **Start Server**
3. Default URL: `http://localhost:1234/v1`

Sekarang bisa dipakai dengan library OpenAI:

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:1234/v1",
    api_key="not-needed",
)

response = client.chat.completions.create(
    model="aurum-brain",
    messages=[
        {"role": "system", "content": "Kamu adalah Aurum Brain AI..."},
        {"role": "user", "content": "Halo!"},
    ],
)

print(response.choices[0].message.content)
```

### Multiple Models
Bisa load multiple model sekaligus. Switch antara model dengan dropdown di chat.

### Hardware Info
Klik icon **Hardware** untuk lihat:
- VRAM usage
- CPU/GPU usage
- Tokens per second

### Model Browser
Bisa download model lain dari HuggingFace langsung di app (tab search).

## Tips Performance

- **Mac M-series**: pastikan "Metal" di-enable di Settings
- **GPU**: pilih GPU yang tepat di Settings → Hardware
- **CPU threads**: set ke jumlah core fisik (bukan hyperthread)
- **Context length**: turunkan ke 2048 kalau lambat

## Troubleshooting

**Model tidak muncul di list?**
- Cek path: harus di `<models_dir>/aurum-brain/aurum-brain-q4_k_m.gguf`
- Restart LM Studio
- Klik "Refresh" di Local Models tab

**Crash saat load?**
- Kurangi context length ke 2048
- Tutup app lain yang boros memory
- Cek minimal RAM: 8GB untuk 3B model Q4

**Lambat?**
- Enable GPU acceleration di Settings
- Pakai quantization lebih kecil (Q3_K_M = 1.5GB)
- Upgrade ke PC dengan GPU NVIDIA yang lebih baik

## Backup & Restore

Untuk backup konfigurasi:
```bash
# Mac
cp -r ~/Library/Application\ Support/LM Studio/ /backup/

# Linux
cp -r ~/.lmstudio/ /backup/
```
