# Pakai Aurum Brain AI dengan Ollama

**Ollama** adalah cara paling gampang untuk jalanin AI model lokal di Mac/Windows/Linux.

## Install Ollama

### Mac
```bash
# Download dari https://ollama.com/download/mac
# Atau pakai Homebrew:
brew install ollama
```

### Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Windows
Download installer dari https://ollama.com/download/windows

## Setup Aurum Brain AI

### 1. Download GGUF

Dari GitHub Releases:
```bash
# Ganti URL dengan release terbaru
curl -L -o aurum-brain-q4_k_m.gguf \
  https://github.com/aurum-lab/aurum-brain-ai/releases/latest/download/aurum-brain-q4_k_m.gguf
```

### 2. Bikin Modelfile

File `modelfile` sudah ada di repo. Tinggal pastikan path GGUF benar:

```bash
# Edit baris pertama modelfile kalau perlu:
FROM ./aurum-brain-q4_k_m.gguf
```

### 3. Create model di Ollama

```bash
ollama create aurum-brain -f modelfile
```

### 4. Run!

```bash
# Interactive chat
ollama run aurum-brain

# One-shot
ollama run aurum-brain "Bikin function Python buat cek palindrome"
```

## Pakai via API

Ollama expose API di `http://localhost:11434`:

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "aurum-brain",
  "messages": [
    {"role": "user", "content": "Halo, siapa kamu?"}
  ],
  "stream": false
}'
```

### Python

```python
import requests

response = requests.post('http://localhost:11434/api/chat', json={
    'model': 'aurum-brain',
    'messages': [
        {'role': 'user', 'content': 'Jelasin Big O notation'}
    ],
    'stream': False,
})

print(response.json()['message']['content'])
```

### JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        model: 'aurum-brain',
        messages: [{ role: 'user', content: 'Halo!' }],
        stream: false,
    }),
});
const data = await response.json();
console.log(data.message.content);
```

## Management

```bash
# Lihat semua model
ollama list

# Info model
ollama show aurum-brain

# Hapus model
ollama rm aurum-brain

# Update model (setelah edit modelfile)
ollama create aurum-brain -f modelfile
```

## Performance Tips

- **Mac M1/M2/M3**: Ollama otomatis pakai Metal GPU. Sangat cepat.
- **Linux dengan GPU NVIDIA**: pastikan CUDA terinstall, Ollama auto-detect.
- **Windows**: pakai WSL2 untuk performance terbaik.
- **CPU only**: set `OLLAMA_NUM_PARALLEL=1` di env untuk hemat memory.

## Resource Limits

Edit `~/.ollama/config.json` atau set env var:

```bash
# Maksimal context length
export OLLAMA_CONTEXT_LENGTH=8192

# Maksimal memory (GB)
export OLLAMA_MAX_VRAM=8

# CPU threads
export OLLAMA_NUM_THREAD=4
```
