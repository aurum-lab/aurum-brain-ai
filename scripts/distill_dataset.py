#!/usr/bin/env python3
"""
Generate high-quality specialized dataset via DISTILLATION.
Pakai Llama 3.3 70B (Cloudflare) sebagai "professor" untuk
generate jawaban berkualitas tinggi untuk training model kecil.

Konsep: Professor (70B) kasih jawaban bagus →
        Murid (3B) belajar dari jawaban professor →
        Murid makin pintar (distillation)

Output: data/distilled_dataset.jsonl
"""

import json
import os
import sys
import time
import urllib.request
from pathlib import Path

# Cloudflare AI Worker untuk "professor"
PROFESSOR_URL = "https://aurum-brain-server.cakagus.workers.dev/v1/chat/completions"
PROFESSOR_KEY = os.environ.get("PROFESSOR_API_KEY", "sk-aurum-brain-aeb07f01e56285f4c58cadcdc67afbc8")

# System prompt professor
PROFESSOR_SYSTEM = """Kamu adalah professor computer science dan trading XAU/USD.
Berikan jawaban SANGAT BERKUALITAS TINGGI dalam Bahasa Indonesia:
1. Langsung ke jawaban, tidak bertele-tele
2. Kasih kode contoh yang lengkap dan bisa dipakai
3. Jelasin singkat kenapa solusi itu dipilih
4. Pakai markdown: code blocks, bold, list
5. Maksimal 500 kata per jawaban
6. Bahasa Indonesia natural, formal tapi santai"""

# Pertanyaan-pertanyaan berkualitas untuk distillation
# Fokus: Coding + Trading (bidang spesialisasi Aurum Brain AI)
DISTILLATION_QUESTIONS = [
    # === CODING: Python ===
    "Bikin function Python buat cek palindrome dengan docstring",
    "Bikin decorator Python buat log execution time function",
    "Bikin function Python buat baca file CSV dan return list of dict",
    "Jelasin bedanya list comprehension dan generator di Python",
    "Bikin function Python buat validate email dengan regex",
    "Bikin class Python untuk stack dengan push, pop, peek",
    "Bikin function Python buat hitung fibonacci dengan memoization",
    "Jelasin cara pakai async/await di Python dengan contoh",
    "Bikin function Python buat debounce dengan threading",
    "Bikin function Python buat cek apakah bilangan prima",
    
    # === CODING: JavaScript ===
    "Bikin function JavaScript buat debounce dengan TypeScript",
    "Bikin function JavaScript buat format tanggal ke 'DD MMM YYYY' bahasa Indonesia",
    "Jelasin bedanya var, let, const di JavaScript",
    "Bikin function JavaScript buat deep clone object",
    "Bikin function JavaScript buat group array by property",
    "Jelasin event loop di JavaScript dengan contoh",
    "Bikin function JavaScript buat chunk array menjadi ukuran tertentu",
    "Bikin function JavaScript buat debounce dengan cancel option",
    "Jelasin closure di JavaScript dengan contoh sederhana",
    "Bikin function JavaScript buat flatten nested array",
    
    # === CODING: React ===
    "Bikin komponen React untuk form login dengan validation",
    "Bikin custom hook React useFetch untuk API calls",
    "Jelasin useEffect dependency array dan kapan pakai []",
    "Bikin komponen React untuk modal dengan aksesibilitas",
    "Bikin custom hook React useLocalStorage",
    "Jelasin bedanya controlled dan uncontrolled component di React",
    "Bikin komponen React untuk infinite scroll dengan IntersectionObserver",
    "Bikin custom hook React useDebounce",
    "Jelasin React Context dan kapan pakai vs props",
    "Bikin komponen React untuk dark mode toggle",
    
    # === CODING: SQL ===
    "Bikin SQL query untuk cari top 10 customer dengan total pembelian terbesar",
    "Jelasin index database dan kapan harus dibuat",
    "Bikin SQL query untuk hitung running total",
    "Jelasin JOIN di SQL: INNER, LEFT, RIGHT, FULL",
    "Bikin SQL query untuk cari duplicate records",
    
    # === CODING: Git ===
    "Jelasin git rebase vs merge, kapan pakai yang mana",
    "Bikin git command untuk undo commit terakhir tanpa hapus perubahan",
    "Jelasin git stash dan cara pakainya",
    "Bikin git command untuk squash multiple commits jadi satu",
    
    # === CODING: API Design ===
    "Jelasin REST API best practices yang penting",
    "Bikin contoh REST API endpoint untuk CRUD user",
    "Jelasin HTTP status codes yang umum dipakai",
    "Bikin contoh pagination di REST API",
    
    # === CODING: Debugging ===
    "Error Python NoneType has no attribute, kenapa dan cara fix?",
    "Error JavaScript undefined is not a function, kenapa?",
    "Error React too many re-renders, kenapa dan cara fix?",
    "Error SQL deadlock detected, kenapa dan cara fix?",
    
    # === TRADING: XAU/USD ===
    "Jelasin RSI indicator dan cara pakainya untuk trading XAU/USD",
    "Jelasin MACD dan cara baca sinyal buy/sell",
    "Jelasin support dan resistance cara mengidentifikasi",
    "Bikin checklist entry trading XAU/USD sebelum open posisi",
    "Jelasin risk management untuk trading XAU/USD",
    "Jelasin candlestick pattern yang paling akurat untuk XAU/USD",
    "Jelasin kill zone terbaik untuk trading XAU/USD",
    "Jelasin cara pakai ATR untuk set stop loss",
    "Bikin trading plan harian untuk XAU/USD",
    "Jelasin psikologi trading: cara control emosi saat loss",
    
    # === WEB DEVELOPMENT ===
    "Bikin landing page HTML/CSS responsive untuk bisnis kopi",
    "Bikin navbar responsive dengan hamburger menu di React",
    "Jelasin cara deploy Next.js ke Vercel",
    "Bikin CSS untuk dark mode dengan CSS variables",
    "Jelasin responsive design dengan CSS Grid dan Flexbox",
    
    # === PROBLEM SOLVING ===
    "Jelasin Big O notation dengan contoh sederhana",
    "Bikin function untuk cek balanced parentheses",
    "Jelasin binary search dengan contoh kode",
    "Bikin function untuk reverse linked list",
    "Jelasin perbedaan stack dan queue dengan contoh",
    
    # === DEVOPS ===
    "Bikin Dockerfile untuk aplikasi Node.js production",
    "Jelasin docker compose vs dockerfile",
    "Bikin docker-compose.yml untuk app + database + redis",
    "Jelasin CI/CD pipeline dengan GitHub Actions",
    
    # === SECURITY ===
    "Cara simpan password user dengan aman di database",
    "Jelasin SQL injection dan cara mencegahnya",
    "Jelasin CORS dan kenapa penting untuk web security",
    "Bikin function untuk generate JWT token di Python",
    
    # === PERCAKAPAN UMUM ===
    "Halo, siapa kamu?",
    "Kamu bisa bantu apa saja?",
    "Belajar programming dari mana untuk pemula?",
    "Tips jaga kesehatan untuk programmer",
    "Bedanya startup dan small business apa?",
]

def ask_professor(question):
    """Tanya ke professor (Llama 70B) untuk dapat jawaban berkualitas tinggi."""
    import subprocess
    
    payload = json.dumps({
        "model": "aurum-brain",
        "messages": [
            {"role": "system", "content": PROFESSOR_SYSTEM},
            {"role": "user", "content": question}
        ],
        "max_tokens": 600,
        "temperature": 0.3,
    })
    
    try:
        result = subprocess.run([
            'curl', '-s', '--max-time', '30',
            'https://aurum-brain-server.cakagus.workers.dev/v1/chat/completions',
            '-X', 'POST',
            '-H', 'Content-Type: application/json',
            '-H', f'Authorization: Bearer {PROFESSOR_KEY}',
            '-d', payload,
        ], capture_output=True, text=True, timeout=35)
        
        data = json.loads(result.stdout)
        return data.get('choices', [{}])[0].get('message', {}).get('content', '')
    except Exception as e:
        print(f"  ERROR: {e}")
        return None

def main():
    print("=" * 60)
    print("  DISTILLATION: Professor 70B → Murid 3B")
    print("  Generate dataset berkualitas tinggi")
    print("=" * 60)
    
    output_file = Path("data/distilled_dataset.jsonl")
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    # Load system prompt
    system_prompt_path = Path("data/system_prompt.txt")
    if system_prompt_path.exists():
        system_prompt = system_prompt_path.read_text(encoding='utf-8')
    else:
        system_prompt = "Kamu adalah Aurum Brain AI."
    
    # Cek yang sudah ada (untuk resume)
    existing_questions = set()
    if output_file.exists():
        with open(output_file, encoding='utf-8') as f:
            for line in f:
                try:
                    row = json.loads(line)
                    existing_questions.add(row.get('user', ''))
                except:
                    pass
    
    print(f"\n  Total questions: {len(DISTILLATION_QUESTIONS)}")
    print(f"  Already done: {len(existing_questions)}")
    print(f"  Remaining: {len(DISTILLATION_QUESTIONS) - len(existing_questions)}")
    print()
    
    success_count = 0
    fail_count = 0
    
    with open(output_file, 'a', encoding='utf-8') as f:
        for i, question in enumerate(DISTILLATION_QUESTIONS, 1):
            if question in existing_questions:
                print(f"  [{i}/{len(DISTILLATION_QUESTIONS)}] SKIP (sudah ada): {question[:50]}...")
                continue
            
            print(f"  [{i}/{len(DISTILLATION_QUESTIONS)}] Tanya professor: {question[:50]}...")
            
            answer = ask_professor(question)
            
            if answer and len(answer) > 20:
                record = {
                    "system": system_prompt,
                    "user": question,
                    "assistant": answer,
                }
                f.write(json.dumps(record, ensure_ascii=False) + '\n')
                f.flush()
                success_count += 1
                print(f"    ✓ Jawaban: {len(answer)} chars")
            else:
                fail_count += 1
                print(f"    ✗ Gagal atau jawaban kosong")
            
            # Rate limit: tunggu 1 detik antar request
            time.sleep(1)
    
    print(f"\n{'=' * 60}")
    print(f"  DISTILLATION SELESAI")
    print(f"{'=' * 60}")
    print(f"  Success: {success_count}")
    print(f"  Failed: {fail_count}")
    print(f"  Total in file: {success_count + len(existing_questions)}")
    print(f"  Output: {output_file}")
    
    # Merge dengan existing dataset
    print(f"\n  Merge dengan conversations_source.json...")
    
    source_file = Path("data/conversations_source.json")
    if source_file.exists():
        with open(source_file, encoding='utf-8') as f:
            source = json.load(f)
    else:
        source = []
    
    # Load distilled
    distilled = []
    with open(output_file, encoding='utf-8') as f:
        for line in f:
            try:
                distilled.append(json.loads(line))
            except:
                pass
    
    # Merge (dedup by user question)
    existing_users = {c['user'] for c in source}
    new_added = 0
    for d in distilled:
        if d['user'] not in existing_users:
            source.append({'user': d['user'], 'assistant': d['assistant']})
            existing_users.add(d['user'])
            new_added += 1
    
    with open(source_file, 'w', encoding='utf-8') as f:
        json.dump(source, f, indent=2, ensure_ascii=False)
    
    print(f"  Added {new_added} new conversations to source")
    print(f"  Total dataset: {len(source)} conversations")

if __name__ == "__main__":
    main()
