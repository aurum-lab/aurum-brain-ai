#!/usr/bin/env python3
"""
Push training metrics to Supabase after successful training run.
"""
import os
import json
import sys
from datetime import datetime
from pathlib import Path

try:
    import requests
except ImportError:
    print("Installing requests...")
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "requests"], check=True)
    import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set")
    sys.exit(1)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def supabase_request(method, table, data=None, params=None):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    resp = requests.request(method, url, headers=HEADERS, json=data, params=params, timeout=30)
    if resp.status_code >= 400:
        print(f"❌ Supabase {method} {table} failed: {resp.status_code} {resp.text}")
        resp.raise_for_status()
    return resp.json() if resp.text else None

def get_brainstat():
    """Get current BrainStat (single row with id='default')"""
    try:
        res = supabase_request("GET", "BrainStat", params={"id": "eq.default", "select": "*"})
        return res[0] if res else None
    except Exception as e:
        print(f"⚠️ Get BrainStat failed: {e}")
        return None

def upsert_brainstat(stat):
    """Upsert BrainStat row"""
    return supabase_request("POST", "BrainStat", data=stat, params={"on_conflict": "id"})

def insert_learninglog(log):
    """Insert LearningLog row"""
    return supabase_request("POST", "LearningLog", data=log)

def main():
    print("📊 Pushing training metrics to Supabase...")
    
    # Load training info from environment / files
    github_sha = os.environ.get("GITHUB_SHA", "unknown")[:7]
    base_model = os.environ.get("BASE_MODEL", "Qwen/Qwen2.5-3B-Instruct")
    epochs = int(os.environ.get("EPOCHS", "2"))
    dataset_size = 0
    
    train_jsonl = Path("data/train.jsonl")
    if train_jsonl.exists():
        dataset_size = sum(1 for _ in open(train_jsonl))
    
    gguf_path = Path("out/aurum-brain-q4_k_m.gguf")
    gguf_size_mb = round(gguf_path.stat().st_size / 1024 / 1024, 1) if gguf_path.exists() else 0
    
    # Get current BrainStat
    current = get_brainstat()
    total_memories = (current.get("totalMemories", 0) if current else 0) + dataset_size
    total_signals = current.get("totalSignals", 0) if current else 0
    
    # Calculate maturity (simple heuristic: 0.1 per 1000 memories, capped at 10)
    maturity = min(10.0, total_memories / 10000)
    
    # Update BrainStat
    brainstat = {
        "id": "default",
        "totalMemories": total_memories,
        "totalSignals": total_signals,
        "totalWinSignals": current.get("totalWinSignals", 0) if current else 0,
        "totalLossSignals": current.get("totalLossSignals", 0) if current else 0,
        "winRate": current.get("winRate", 0) if current else 0,
        "avgConfidence": current.get("avgConfidence", 0) if current else 0,
        "totalPnl": current.get("totalPnl", 0) if current else 0,
        "learningStreak": (current.get("learningStreak", 0) if current else 0) + 1,
        "lastLearnAt": datetime.utcnow().isoformat() + "Z",
        "maturity": round(maturity, 2),
        "updatedAt": datetime.utcnow().isoformat() + "Z"
    }
    
    print(f"  Updating BrainStat: memories={total_memories}, maturity={maturity:.2f}, streak={brainstat['learningStreak']}")
    upsert_brainstat(brainstat)
    
    # Insert LearningLog
    learninglog = {
        "sessionDate": datetime.utcnow().isoformat() + "Z",
        "trigger": f"GitHub Actions: {github_sha}",
        "memoriesCreated": dataset_size,
        "memoriesUpdated": 0,
        "patternsFound": 0,  # Could be enhanced to detect new patterns
        "signalsAnalyzed": 0,
        "avgConfidenceBefore": current.get("avgConfidence", 0) if current else 0,
        "avgConfidenceAfter": current.get("avgConfidence", 0) if current else 0,
        "weightDeltaTotal": 0,
        "summary": f"LoRA fine-tune on {base_model}, {epochs} epochs, {dataset_size} samples, GGUF {gguf_size_mb}MB",
        "details": json.dumps({
            "base_model": base_model,
            "epochs": epochs,
            "dataset_size": dataset_size,
            "gguf_size_mb": gguf_size_mb,
            "github_sha": github_sha,
            "lora_r": 16,
            "lora_alpha": 32,
            "max_len": 768
        }),
        "duration": int(os.environ.get("TRAIN_DURATION_SEC", "0")),
        "createdAt": datetime.utcnow().isoformat() + "Z"
    }
    
    print(f"  Inserting LearningLog: {dataset_size} memories, {gguf_size_mb}MB GGUF")
    insert_learninglog(learninglog)
    
    print("✅ Supabase metrics pushed successfully!")

if __name__ == "__main__":
    main()