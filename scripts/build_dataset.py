#!/usr/bin/env python3
"""
Build training dataset untuk Aurum Brain AI dari JSON source.
Baca data/conversations_source.json, gabung dengan system_prompt.txt,
output ke data/train.jsonl (format ChatML).
"""

import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
SYSTEM_PROMPT = (DATA_DIR / "system_prompt.txt").read_text(encoding="utf-8")
SOURCE_FILE = DATA_DIR / "conversations_source.json"
OUTPUT_FILE = DATA_DIR / "train.jsonl"

def build_dataset():
    """Bangun dataset training dari source JSON."""
    conversations = json.loads(SOURCE_FILE.read_text(encoding="utf-8"))
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        for entry in conversations:
            record = {
                "system": SYSTEM_PROMPT,
                "user": entry["user"],
                "assistant": entry["assistant"],
            }
            f.write(json.dumps(record, ensure_ascii=False) + '\n')
    
    count = len(conversations)
    print(f"OK Dataset generated: {OUTPUT_FILE}")
    print(f"   Total conversations: {count}")
    print(f"   Format: ChatML JSONL (system/user/assistant)")
    print(f"   System prompt length: {len(SYSTEM_PROMPT)} chars")
    
    # Stats
    total_chars = sum(len(e["user"]) + len(e["assistant"]) for e in conversations)
    print(f"   Total content chars: {total_chars}")
    print(f"   Avg per conversation: {total_chars // count} chars")
    
    return count

if __name__ == "__main__":
    build_dataset()
