#!/usr/bin/env python3
"""
Train Aurum Brain AI - LoRA fine-tuning di Qwen2.5-3B-Instruct.

Output: out/aurum-brain-q4_k_m.gguf (siap import ke PocketPal/Ollama/llama.cpp)

Pipeline:
1. Load Qwen2.5-3B-Instruct sebagai base model
2. Apply LoRA (r=32, alpha=64) - fine-tune pada dataset Indonesia
3. Train 3 epoch
4. Merge LoRA weights ke base
5. Convert ke GGUF format (llama.cpp)
6. Quantize ke Q4_K_M (sekitar 2GB, optimal untuk mobile)

Run di GitHub Actions (free tier, ~30 menit) atau lokal (butuh GPU 8GB+ / CPU 16GB RAM).
"""

import json
import os
import subprocess
import sys
from pathlib import Path

# Setup
os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

# Konfigurasi - bisa di-override via environment variable
# Default ke 1.5B (lebih cepat, ~15-30 menit) — bisa override ke 3B via env
BASE_MODEL = os.environ.get("AURUM_BASE_MODEL", "Qwen/Qwen2.5-1.5B-Instruct")
DATA_PATH = Path(__file__).parent.parent / "data" / "train.jsonl"
OUT_DIR = Path(__file__).parent.parent / "out"
ADAPTER_DIR = OUT_DIR / "adapter"
MERGED_DIR = OUT_DIR / "merged"
GGUF_PATH = OUT_DIR / "aurum-brain-q4_k_m.gguf"

# LoRA config - r=16 untuk hemat memory + cepat
LORA_R = int(os.environ.get("LORA_R", "16"))
LORA_ALPHA = int(os.environ.get("LORA_ALPHA", "32"))
LORA_DROPOUT = float(os.environ.get("LORA_DROPOUT", "0.05"))
EPOCHS = int(os.environ.get("EPOCHS", "2"))
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "1"))
GRAD_ACCUM = int(os.environ.get("GRAD_ACCUM", "4"))
LEARNING_RATE = float(os.environ.get("LEARNING_RATE", "2e-4"))
MAX_LEN = int(os.environ.get("MAX_LEN", "768"))


def load_and_tokenize(tokenizer, path, max_len=1024):
    """Load JSONL dataset dan tokenize dengan ChatML template."""
    rows = []
    with open(path, encoding='utf-8') as f:
        for line in f:
            rows.append(json.loads(line))
    
    print(f"   Loaded {len(rows)} conversations from {path}")
    
    def format_chat(row):
        msgs = [
            {"role": "system", "content": row["system"]},
            {"role": "user", "content": row["user"]},
            {"role": "assistant", "content": row["assistant"]},
        ]
        return tokenizer.apply_chat_template(msgs, tokenize=False)
    
    texts = [format_chat(r) for r in rows]
    enc = tokenizer(
        texts,
        truncation=True,
        padding="max_length",
        max_length=max_len,
        return_tensors=None,
    )
    
    input_ids_list = enc["input_ids"]
    attn_list = enc["attention_mask"]
    
    # Mask prompt tokens dengan -100 (hanya train bagian assistant)
    labels_list = []
    # Cari marker ChatML untuk assistant
    marker_text = "<|im_start|>assistant"
    marker_ids = tokenizer.encode(marker_text, add_special_tokens=False)
    
    for i, ids in enumerate(input_ids_list):
        # Cari posisi marker assistant (scan dari belakang)
        idx = -1
        for j in range(len(ids) - len(marker_ids), -1, -1):
            if ids[j:j + len(marker_ids)] == marker_ids:
                idx = j + len(marker_ids)
                break
        
        if idx == -1:
            idx = len(ids) // 2  # fallback
        
        # Label: -100 untuk prompt, input_ids untuk assistant response
        lbl = [-100] * idx + ids[idx:]
        lbl = lbl[:max_len] + [-100] * max(0, max_len - len(lbl))
        labels_list.append(lbl)
    
    return {
        "input_ids": input_ids_list,
        "attention_mask": attn_list,
        "labels": labels_list,
    }


def main():
    print("=" * 60)
    print("  Aurum Brain AI - Training Pipeline")
    print("=" * 60)
    print(f"  Base model: {BASE_MODEL}")
    print(f"  Dataset: {DATA_PATH}")
    print(f"  LoRA: r={LORA_R}, alpha={LORA_ALPHA}, dropout={LORA_DROPOUT}")
    print(f"  Epochs: {EPOCHS}, batch={BATCH_SIZE}, grad_accum={GRAD_ACCUM}")
    print(f"  Learning rate: {LEARNING_RATE}")
    print(f"  Max length: {MAX_LEN}")
    print(f"  Output GGUF: {GGUF_PATH}")
    print("=" * 60)
    
    # Validate dataset exists
    if not DATA_PATH.exists():
        print(f"ERROR: Dataset tidak ditemukan di {DATA_PATH}")
        print("Jalankan: python scripts/build_dataset.py")
        sys.exit(1)
    
    # === STEP 1: Load tokenizer & model ===
    print("\n[1/6] Load tokenizer & model...")
    from transformers import AutoModelForCausalLM, AutoTokenizer
    import torch
    
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, use_fast=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    # Load model - float16 untuk hemat memory
    dtype = torch.float16 if torch.cuda.is_available() else torch.float32
    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        torch_dtype=dtype,
        device_map="auto" if torch.cuda.is_available() else None,
    )
    print(f"   OK Model loaded. dtype={dtype}")
    
    # === STEP 2: Apply LoRA ===
    print("\n[2/6] Setup LoRA adapter...")
    from peft import LoraConfig, get_peft_model, TaskType
    
    lora_config = LoraConfig(
        r=LORA_R,
        lora_alpha=LORA_ALPHA,
        lora_dropout=LORA_DROPOUT,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        task_type=TaskType.CAUSAL_LM,
        bias="none",
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    
    # === STEP 3: Tokenize dataset ===
    print("\n[3/6] Tokenize dataset...")
    data = load_and_tokenize(tokenizer, DATA_PATH, MAX_LEN)
    
    from datasets import Dataset
    ds_dict = [
        {"input_ids": i, "attention_mask": a, "labels": l}
        for i, a, l in zip(data["input_ids"], data["attention_mask"], data["labels"])
    ]
    dataset = Dataset.from_list(ds_dict)
    print(f"   OK Dataset ready: {len(dataset)} examples")
    
    # === STEP 4: Train ===
    print("\n[4/6] Start training...")
    from transformers import Trainer, TrainingArguments
    
    args = TrainingArguments(
        output_dir=str(OUT_DIR),
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        gradient_accumulation_steps=GRAD_ACCUM,
        learning_rate=LEARNING_RATE,
        warmup_ratio=0.1,
        logging_steps=5,
        save_strategy="epoch",
        save_total_limit=1,
        report_to=[],
        disable_tqdm=False,
        optim="adamw_torch",
        fp16=torch.cuda.is_available(),
        gradient_checkpointing=True,
    )
    
    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=dataset,
    )
    
    trainer.train()
    print("   OK Training selesai")
    
    # === STEP 5: Merge LoRA & save ===
    print("\n[5/6] Merge LoRA weights & save...")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Save adapter
    model.save_pretrained(str(ADAPTER_DIR))
    tokenizer.save_pretrained(str(ADAPTER_DIR))
    
    # Merge untuk GGUF conversion
    merged_model = model.merge_and_unload()
    MERGED_DIR.mkdir(parents=True, exist_ok=True)
    merged_model.save_pretrained(str(MERGED_DIR), safe_serialization=True)
    tokenizer.save_pretrained(str(MERGED_DIR))
    print(f"   OK Merged model saved ke {MERGED_DIR}")
    
    # === STEP 6: Convert ke GGUF ===
    print("\n[6/6] Convert ke GGUF (Q4_K_M)...")
    convert_to_gguf()
    
    print("\n" + "=" * 60)
    print("  TRAINING SELESAI!")
    print("=" * 60)
    print(f"  GGUF file: {GGUF_PATH}")
    print(f"  Size: {GGUF_PATH.stat().st_size / 1024 / 1024:.1f} MB" if GGUF_PATH.exists() else "  GGUF belum ada")
    print()
    print("  Cara pakai:")
    print("  - PocketPal: import .gguf file (lihat docs/POCKETPAL.md)")
    print("  - Ollama:    ollama create aurum-brain -f modelfile")
    print("  - llama.cpp: ./main -m aurum-brain-q4_k_m.gguf -p 'Halo!'")


def convert_to_gguf():
    """Convert merged model ke GGUF format dengan quantization Q4_K_M."""
    # Clone llama.cpp kalau belum ada
    llama_cpp_dir = OUT_DIR.parent / "llama.cpp"
    if not llama_cpp_dir.exists():
        print("   Cloning llama.cpp...")
        subprocess.run([
            "git", "clone", "--depth", "1",
            "https://github.com/ggerganov/llama.cpp",
            str(llama_cpp_dir)
        ], check=True)
    
    # Convert HF -> GGUF (F16 dulu)
    print("   Convert HF -> GGUF (F16)...")
    f16_gguf = OUT_DIR / "aurum-brain-f16.gguf"
    subprocess.run([
        sys.executable,
        str(llama_cpp_dir / "convert_hf_to_gguf.py"),
        str(MERGED_DIR),
        "--outfile", str(f16_gguf),
        "--outtype", "f16",
    ], check=True)
    
    # Quantize ke Q4_K_M (optimal untuk mobile)
    print("   Quantize F16 -> Q4_K_M...")
    # Cari binary quantize (nama berbeda di versi llama.cpp baru vs lama)
    quantize_bin = None
    for name in ["llama-quantize", "quantize"]:
        path = llama_cpp_dir / "build" / "bin" / name
        if path.exists():
            quantize_bin = path
            break
    if not quantize_bin:
        # Fallback: cari di root llama.cpp
        for name in ["llama-quantize", "quantize"]:
            path = llama_cpp_dir / name
            if path.exists():
                quantize_bin = path
                break
    
    if not quantize_bin:
        raise RuntimeError("quantize binary tidak ditemukan. Build llama.cpp dulu.")
    
    print(f"   Using quantize binary: {quantize_bin}")
    subprocess.run([
        str(quantize_bin),
        str(f16_gguf),
        str(GGUF_PATH),
        "Q4_K_M",
    ], check=True)
    
    # Cleanup F16 file (besar, tidak perlu)
    if f16_gguf.exists():
        f16_gguf.unlink()
    
    print(f"   OK GGUF saved: {GGUF_PATH}")


if __name__ == "__main__":
    main()
