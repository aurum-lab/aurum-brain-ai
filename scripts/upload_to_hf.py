#!/usr/bin/env python3
"""
Upload Aurum Brain AI merged model ke Hugging Face Hub.
Dipanggil dari GitHub Actions setelah training selesai.

Model yang di-upload: format PyTorch (safetensors) - bukan GGUF
Supaya bisa dipakai via HF Inference API (gratis).
"""

import os
import sys
from pathlib import Path

def upload_to_hf():
    """Upload merged model ke Hugging Face Hub."""
    try:
        from huggingface_hub import HfApi, create_repo
    except ImportError:
        print("Installing huggingface_hub...")
        import subprocess
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "huggingface_hub"], check=True)
        from huggingface_hub import HfApi, create_repo
    
    token = os.environ.get("HF_TOKEN")
    if not token:
        print("ERROR: HF_TOKEN not set")
        sys.exit(1)
    
    # Model repo name di HF
    repo_id = os.environ.get("HF_REPO_ID", "aurum-lab/aurum-brain-ai")
    
    # Path ke merged model (dibuat oleh train.py)
    merged_dir = Path("out/merged")
    
    if not merged_dir.exists():
        print(f"ERROR: Merged model tidak ditemukan di {merged_dir}")
        print("Pastikan train.py sudah selesai dan model sudah di-merge.")
        sys.exit(1)
    
    print(f"=== Upload ke Hugging Face Hub ===")
    print(f"  Repo: {repo_id}")
    print(f"  Source: {merged_dir}")
    
    # List files yang akan di-upload
    files_to_upload = list(merged_dir.glob("*"))
    print(f"  Files: {len(files_to_upload)}")
    for f in files_to_upload:
        size_mb = f.stat().st_size / 1024 / 1024
        print(f"    - {f.name} ({size_mb:.1f} MB)")
    
    # Create repo (public, biar bisa dipakai Inference API gratis)
    api = HfApi(token=token)
    
    try:
        create_repo(repo_id, token=token, repo_type="model", exist_ok=True, private=False)
        print(f"\n  OK Repo ready: https://huggingface.co/{repo_id}")
    except Exception as e:
        print(f"\n  Repo sudah ada atau error: {e}")
    
    # Upload semua file dari merged dir
    print(f"\n  Uploading files...")
    api.upload_folder(
        folder_path=str(merged_dir),
        repo_id=repo_id,
        repo_type="model",
        commit_message=f"Upload Aurum Brain AI - fine-tuned model ({os.environ.get('GITHUB_SHA', 'unknown')[:7]})",
    )
    
    # Upload system prompt juga
    system_prompt = Path("data/system_prompt.txt")
    if system_prompt.exists():
        api.upload_file(
            path_or_fileobj=str(system_prompt),
            path_in_repo="system_prompt.txt",
            repo_id=repo_id,
            repo_type="model",
            commit_message="Upload system prompt",
        )
    
    # Bikin Model Card
    model_card = f"""---
language: id
tags:
  - aurum-brain-ai
  - indonesian
  - coding
  - fine-tuned
  - qwen
base_model: Qwen/Qwen2.5-1.5B-Instruct
pipeline_tag: text-generation
---

# 🧠 Aurum Brain AI

Custom fine-tuned model dari Qwen2.5-1.5B-Instruct untuk Bahasa Indonesia, coding, dan percakapan pintar.

## Spesifikasi
- Base: Qwen/Qwen2.5-1.5B-Instruct
- Fine-tune: LoRA r=16, alpha=32
- Bahasa: Indonesia (native)
- Format: PyTorch (safetensors)

## Kemampuan
- 🇮🇩 Bahasa Indonesia natural
- 💻 Coding expert (Python, JS, Rust, Go, SQL, dll)
- 🌐 Web Development (HTML, CSS, React, Next.js)
- 🧠 Problem Solving & debugging
- 🤖 Agent AI capabilities

## Cara Pakai via HF Inference API

```python
from huggingface_hub import InferenceClient

client = InferenceClient(model="{repo_id}")
response = client.text_generation(
    "Halo, siapa kamu?",
    max_new_tokens=100,
)
print(response)
```

## System Prompt
Lihat file `system_prompt.txt` di repo ini untuk personality AI.

## Training
Auto-trained 8x/hari via GitHub Actions. Dataset: 68+ percakapan Bahasa Indonesia.
"""
    
    # Upload model card
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
        f.write(model_card)
        f.flush()
        api.upload_file(
            path_or_fileobj=f.name,
            path_in_repo="README.md",
            repo_id=repo_id,
            repo_type="model",
            commit_message="Upload model card",
        )
    
    print(f"\n=== UPLOAD SELESAI ===")
    print(f"  Model URL: https://huggingface.co/{repo_id}")
    print(f"  Inference API: https://api-inference.huggingface.co/models/{repo_id}")
    print(f"\n  Telegram bot bisa pakai model ini sekarang!")

if __name__ == "__main__":
    upload_to_hf()
