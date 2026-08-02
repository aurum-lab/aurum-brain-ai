# Kustomisasi Aurum Brain AI

Panduan untuk modifikasi AI sesuai kebutuhan Anda.

## 1. Edit System Prompt (Paling Gampang)

System prompt = "kepribadian" AI. Edit di `data/system_prompt.txt`.

Contoh kustomisasi:
- Tambah keahlian spesifik (misal: "Kamu juga ahli di domain X")
- Ubah tone (misal: lebih santai, atau lebih formal)
- Tambah aturan jawaban (misal: "Selalu kasih analogi")
- Restrict topic (misal: "Tidak menjawab soal politik")

Setelah edit, re-train atau pakai langsung di PocketPal/Ollama (set di Settings).

## 2. Tambah Data Training

Edit `scripts/generate_source.js`:

```javascript
const conversations = [
  // ... existing
  
  // Tambah percakapan baru Anda:
  {
    user: "Pertanyaan Anda di sini",
    assistant: `Jawaban yang Anda inginkan AI pelajari...
    
    Bisa multi-line, bisa pakai code blocks:
    
    \`\`\`python
    print("hello")
    \`\`\``
  },
];
```

Lalu jalankan:
```bash
node scripts/generate_source.js
python scripts/build_dataset.py
```

Commit & push — GitHub Actions akan auto-retrain.

## 3. Ganti Base Model

Default: `Qwen/Qwen2.5-3B-Instruct` (balance antara pintar dan mobile-friendly).

Alternatif:
- `Qwen/Qwen2.5-1.5B-Instruct` — lebih kecil, lebih cepat di HP lama
- `Qwen/Qwen2.5-7B-Instruct` — lebih pintar, butuh HP flagship
- `Qwen/Qwen2.5-Coder-3B-Instruct` — khusus coding (Bahasa Indonesia masih OK)
- `meta-llama/Llama-3.2-3B-Instruct` — alternative dengan lisensi berbeda
- `HuggingFaceTB/SmolLM2-360M-Instruct` — ultra kecil, untuk HP low-end

Ganti via environment variable atau workflow dispatch:
```bash
# Manual trigger di GitHub
gh workflow run train.yml -R aurum-lab/aurum-brain-ai \
  -f base_model=Qwen/Qwen2.5-7B-Instruct \
  -f epochs=5
```

## 4. Tuning LoRA Parameters

Untuk hasil lebih akurat (tapi training lebih lama):

```bash
# Di GitHub Actions workflow dispatch, atau set env var:
LORA_R=64           # Default 32. Higher = lebih banyak yang dipelajari
LORA_ALPHA=128      # Default 64. Biasanya 2x LORA_R
EPOCHS=5            # Default 3. More = lebih hafal dataset
BATCH_SIZE=1        # Default 2. Turunkan kalau OOM
GRAD_ACCUM=16       # Default 4. Naikkan kalau BATCH_SIZE diturunkan
LEARNING_RATE=1e-4  # Default 2e-4. Lower = lebih stabil
MAX_LEN=2048        # Default 1024. Naikkan kalau percakapan panjang
```

## 5. Tambah Dataset Eksternal

### Dari HuggingFace
```python
from datasets import load_dataset

# Contoh: dataset Indonesian conversations
hf_dataset = load_dataset("indonesian-nlp/oasst1-id", split="train[:1000]")

# Convert ke format kita
for row in hf_dataset:
    new_conversation = {
        "user": row["instruction"],
        "assistant": row["output"],
    }
    # Add to conversations array
```

### Dari File Custom
Bikin file JSON baru di `data/custom_conversations.json`:

```json
[
  {
    "user": "...",
    "assistant": "..."
  }
]
```

Edit `scripts/build_dataset.py` untuk load + merge.

## 6. Quantization Level

Default: `Q4_K_M` (balance quality vs size).

Alternatif (edit di `scripts/train.py`):

| Quant | Size | Quality | Speed | Use case |
|-------|------|---------|-------|----------|
| Q2_K | ~1.2GB | Rendah | Cepat | HP lama, low RAM |
| Q3_K_M | ~1.5GB | Sedang | Cepat | Budget phones |
| **Q4_K_M** | **~2GB** | **Baik** | **Sedang** | **Default, recommended** |
| Q5_K_M | ~2.3GB | Sangat baik | Sedang | HP flagship |
| Q6_K | ~2.7GB | Hampir F16 | Lambat | Quality critical |
| F16 | ~6GB | Original | Lambat | Development only |

Untuk ganti quantization, edit `scripts/train.py` baris:
```python
subprocess.run([
    str(quantize_bin),
    str(f16_gguf),
    str(GGUF_PATH),
    "Q5_K_M",  # Ganti ke level yang diinginkan
], check=True)
```

## 7. Custom Training Data dari Chat Logs

Kalau punya history chat yang ingin AI pelajari:

```python
# scripts/import_chat_logs.py
import json
from pathlib import Path

def import_from_whatsapp_export(json_path):
    """Import chat WhatsApp export ke format dataset."""
    with open(json_path) as f:
        messages = json.load(f)
    
    conversations = []
    current_user_msg = None
    
    for msg in messages:
        if msg['from'] == 'me':
            if current_user_msg:
                # Save previous pair
                conversations.append({
                    'user': current_user_msg,
                    'assistant': '',  # Will be filled by next message
                })
            current_user_msg = msg['text']
        else:
            if current_user_msg and conversations:
                conversations[-1]['assistant'] = msg['text']
                current_user_msg = None
    
    return conversations

# Pakai
convs = import_from_whatsapp_export('whatsapp_export.json')
Path('data/imported_conversations.json').write_text(json.dumps(convs, indent=2))
```

## 8. Eval & Test Model

Setelah training, test model sebelum pakai production:

```bash
# Quick test via llama.cpp
./llama.cpp/main -m out/aurum-brain-q4_k_m.gguf -p "Halo, siapa kamu?" -n 200

# Atau pakai script Python
python scripts/test_model.py
```

Bikin `scripts/test_model.py`:

```python
#!/usr/bin/env python3
"""Quick test model dengan beberapa pertanyaan standar."""
from llama_cpp import Llama

llm = Llama(
    model_path="out/aurum-brain-q4_k_m.gguf",
    n_ctx=2048,
    n_threads=4,
)

SYSTEM = open("data/system_prompt.txt").read()

TEST_QUESTIONS = [
    "Halo, siapa kamu?",
    "Bikin function Python buat cek palindrome",
    "Jelasin Big O notation",
    "Apa bedanya SQL vs NoSQL?",
    "Cara simpan password dengan aman?",
]

for q in TEST_QUESTIONS:
    print(f"\n--- USER: {q}")
    response = llm.create_chat_completion(
        messages=[
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": q},
        ],
        max_tokens=500,
        temperature=0.7,
    )
    print(f"--- AI: {response['choices'][0]['message']['content']}")
```

## 9. Multi-stage Training

Untuk pintar di multiple domain, pakai curriculum learning:

```python
# Stage 1: General Indonesian
train_on_dataset("data/general_indonesian.jsonl", epochs=2)

# Stage 2: Coding focus  
train_on_dataset("data/coding_examples.jsonl", epochs=3)

# Stage 3: Specific domain (e.g., trading, finance)
train_on_dataset("data/domain_specific.jsonl", epochs=2)
```

Edit `scripts/train.py` untuk support multi-stage.

## 10. Distribusi Model

Setelah train, share ke tim atau publik:

### Private (tim saja)
- Upload ke HuggingFace private repo
- Atau pakai GitHub Releases di repo private

### Public
- HuggingFace Hub (free, ada Model Card)
- GitHub Releases (sudah otomatis dari workflow)
- Atau hosting sendiri (S3, Cloudflare R2)

Untuk HuggingFace:
```bash
# Install huggingface_hub
pip install huggingface_hub

# Login (butuh token dari https://huggingface.co/settings/tokens)
huggingface-cli login

# Upload
huggingface-cli upload aurum-lab/aurum-brain-ai out/aurum-brain-q4_k_m.gguf
```

## Iteration Cycle

1. Edit dataset / system prompt
2. Push ke GitHub
3. Tunggu GitHub Actions selesai (~30 menit)
4. Download GGUF baru dari Releases
5. Test di PocketPal / Ollama
6. Repeat sampai puas

**Tips:** Track perubahan di `CHANGELOG.md` supaya tahu versi mana yang paling bagus.
