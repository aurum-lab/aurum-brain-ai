#!/usr/bin/env python3
"""
Expand dataset Aurum Brain AI dengan variasi baru tiap hari.

Strategi:
1. Load dataset existing (data/conversations_source.json)
2. Generate pertanyaan baru dari template (paraphrasing, keyword variation)
3. Tambah percakapan baru dari template library
4. Shuffle + deduplikat
5. Simpan sebagai data/train.jsonl baru

Tiap hari dataset makin besar + variatif → AI makin pintar.
"""

import json
import random
from datetime import datetime
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
SOURCE_FILE = DATA_DIR / "conversations_source.json"
TRAIN_FILE = DATA_DIR / "train.jsonl"
EXPANSION_LOG = DATA_DIR / "expansion_log.json"

# === TEMPLATE PERCAKAPAN BARU ===
# Setiap entry: template dengan placeholder {topic}, {language}, dll
# Akan di-expand jadi multiple variations
NEW_CONVERSATION_TEMPLATES = [
    # Coding - bahasa berbeda
    {
        "user": "Bikin function {language} buat {task}",
        "assistant": "Berikut function {language} untuk {task}:\n\n```{lang_code}\n{code_example}\n```\n\n**Penjelasan:**\n{explanation}",
        "variations": [
            {"language": "Python", "lang_code": "python", "task": "menghitung factorial", "code_example": "def factorial(n):\n    return 1 if n <= 1 else n * factorial(n-1)", "explanation": "Pakai recursion, basis case n<=1 return 1."},
            {"language": "JavaScript", "lang_code": "javascript", "task": "validasi email", "code_example": "function isValidEmail(email) {\n    return /^[^@]+@[^@]+\\.[^@]+$/.test(email);\n}", "explanation": "Regex sederhana untuk cek format email."},
            {"language": "TypeScript", "lang_code": "typescript", "task": "debounce function", "code_example": "function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {\n    let timer: ReturnType<typeof setTimeout>;\n    return (...args: Parameters<T>) => {\n        clearTimeout(timer);\n        timer = setTimeout(() => fn(...args), delay);\n    };\n}", "explanation": "Generic type untuk type safety, clearTimeout untuk cancel timer sebelumnya."},
            {"language": "Go", "lang_code": "go", "task": "reverse string", "code_example": "func reverseString(s string) string {\n    runes := []rune(s)\n    for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {\n        runes[i], runes[j] = runes[j], runes[i]\n    }\n    return string(runes)\n}", "explanation": "Convert ke rune slice supaya support Unicode, lalu swap dari kedua ujung."},
            {"language": "Rust", "lang_code": "rust", "task": "cek palindrome", "code_example": "fn is_palindrome(s: &str) -> bool {\n    let cleaned: String = s.chars().filter(|c| c.is_alphanumeric()).map(|c| c.to_lowercase().next().unwrap()).collect();\n    cleaned == cleaned.chars().rev().collect::<String>()\n}", "explanation": "Filter alphanumeric, lowercase, lalu bandingkan dengan reverse."},
        ]
    },
    # Web dev
    {
        "user": "Bikin {component} untuk {use_case}",
        "assistant": "Berikut {component} untuk {use_case}:\n\n```{lang}\n{code}\n```\n\n**Fitur:**\n{features}",
        "variations": [
            {"component": "komponen React", "use_case": "todo list", "lang": "tsx", "code": "function TodoList() {\n  const [todos, setTodos] = useState([]);\n  const [input, setInput] = useState('');\n  return (\n    <div>\n      <input value={input} onChange={e => setInput(e.target.value)} />\n      <button onClick={() => { setTodos([...todos, input]); setInput(''); }}>Add</button>\n      <ul>{todos.map((t, i) => <li key={i}>{t}</li>)}</ul>\n    </div>\n  );\n}", "features": "- useState untuk state management\n- Spread operator untuk immutable update\n- key prop untuk React reconciliation"},
            {"component": "landing page HTML", "use_case": "bisnis kopi", "lang": "html", "code": "<!DOCTYPE html>\n<html>\n<head><title>Kopi Senja</title></head>\n<body>\n  <header><nav>Menu | About | Contact</nav></header>\n  <hero><h1>Kopi Senja</h1><p>Ngopi santai</p></hero>\n</body>\n</html>", "features": "- Semantic HTML5\n- Responsive (pakai meta viewport)\n- Simple navigation"},
            {"component": "API endpoint Next.js", "use_case": "upload image", "lang": "typescript", "code": "export async function POST(req: Request) {\n  const formData = await req.formData();\n  const file = formData.get('file') as File;\n  const bytes = await file.arrayBuffer();\n  return Response.json({ size: file.size, type: file.type });\n}", "features": "- App Router Next.js 14+\n- FormData parsing\n- File size validation"},
        ]
    },
    # Debugging
    {
        "user": "Error {error_message}, kenapa?",
        "assistant": "Error ini terjadi karena {root_cause}.\n\n**Solusi:**\n{solution}\n\n**Kode yang benar:**\n```{lang}\n{fixed_code}\n```",
        "variations": [
            {"error_message": "TypeError: undefined is not a function", "root_cause": "variabel yang kamu panggil belum di-assign ke function, atau typo nama function", "solution": "Cek apakah variabel sudah di-import/define sebelum dipanggil.", "lang": "javascript", "fixed_code": "// Salah: myFunc()\n// Benar: pastikan myFunc sudah didefinisikan\nfunction myFunc() { /* ... */ }\nmyFunc();"},
            {"error_message": "KeyError: 'name' di Python", "root_cause": "kamu akses key 'name' di dict, tapi key itu tidak ada", "solution": "Pakai .get() dengan default value, atau cek dengan 'in' operator.", "lang": "python", "fixed_code": "# Salah: name = data['name']\n# Benar:\nname = data.get('name', 'Unknown')\n# atau\nif 'name' in data:\n    name = data['name']"},
            {"error_message": "cannot read property 'map' of undefined", "root_cause": "variabel yang kamu .map() belum di-assign atau undefined", "solution": "Pastikan data sudah loaded sebelum render, tambahkan guard.", "lang": "jsx", "fixed_code": "// Salah: {items.map(item => <li>{item}</li>)}\n// Benar:\n{items?.map(item => <li>{item}</li>) || <p>Loading...</p>}"},
        ]
    },
    # Konsep programming
    {
        "user": "Jelasin {concept} dengan contoh sederhana",
        "assistant": "**{concept}** = {definition}\n\n**Analogi:**\n{analogy}\n\n**Contoh kode:**\n```{lang}\n{example}\n```\n\n**Kapan pakai:**\n{use_case}",
        "variations": [
            {"concept": "closure di JavaScript", "definition": "function yang mengakses variabel dari scope luarnya, bahkan setelah function luar selesai", "analogy": "Seperti backpack - function bawa variabel dari tempat ia dibuat", "lang": "javascript", "example": "function counter() {\n  let count = 0;\n  return () => ++count;\n}\nconst c = counter();\nc(); // 1\nc(); // 2", "use_case": "Untuk encapsulation, callback, event handler"},
            {"concept": "recursion", "definition": "function yang memanggil dirinya sendiri sampai kondisi basis terpenuhi", "analogy": "Seperti cermin yang memantul cermin - berhenti saat ada kondisi stop", "lang": "python", "example": "def factorial(n):\n    if n <= 1:  # basis case\n        return 1\n    return n * factorial(n - 1)  # recursive call", "use_case": "Tree traversal, divide & conquer, fibonacci"},
            {"concept": "polymorphism di OOP", "definition": "object berbeda bisa merespon method yang sama dengan cara berbeda", "analogy": "Tombol 'play' di remote - TV play channel, music player play song, video play movie", "lang": "python", "example": "class Dog:\n    def sound(self): return 'Woof'\nclass Cat:\n    def sound(self): return 'Meow'\nfor animal in [Dog(), Cat()]:\n    print(animal.sound())  # Woof, Meow", "use_case": "Untuk code yang flexible, mudah di-extend"},
        ]
    },
    # Percakapan umum
    {
        "user": "{greeting}",
        "assistant": "{response}",
        "variations": [
            {"greeting": "Selamat pagi", "response": "Selamat pagi! Semoga harimu produktif. Ada yang bisa saya bantu soal coding atau website?"},
            {"greeting": "Lagi belajar coding dari mana?", "response": "Urutan yang saya saranan:\n1. Pilih 1 bahasa (Python atau JavaScript)\n2. Pelajari fundamental (variabel, loop, function)\n3. Bikin project kecil (todo list, calculator)\n4. Pelajari tools (Git, VSCode)\n5. Pilih spesialisasi (web, mobile, data)\n\nTanya spesifik kalau mau detail!"},
            {"greeting": "Kamu bisa bantu apa aja?", "response": "Saya bisa bantu:\n- Coding (Python, JS, Rust, Go, SQL, dll)\n- Bikin website (HTML, React, Next.js)\n- Debug error\n- Jelasin konsep programming\n- Review kode\n- Software architecture\n\nTanya aja!"},
        ]
    },
]

def load_existing_dataset():
    """Load dataset yang sudah ada."""
    if SOURCE_FILE.exists():
        with open(SOURCE_FILE, encoding='utf-8') as f:
            return json.load(f)
    return []

def expand_dataset(existing):
    """Generate variasi baru dari template."""
    new_conversations = []
    
    for template in NEW_CONVERSATION_TEMPLATES:
        for variation in template["variations"]:
            # Cek apakah sudah ada di dataset (deduplikat berdasarkan user message)
            user_msg = template["user"].format(**variation)
            if not any(c["user"] == user_msg for c in existing + new_conversations):
                new_conversations.append({
                    "user": user_msg,
                    "assistant": template["assistant"].format(**variation),
                })
    
    return new_conversations

def load_expansion_log():
    """Load log ekspansi sebelumnya."""
    if EXPANSION_LOG.exists():
        with open(EXPANSION_LOG, encoding='utf-8') as f:
            return json.load(f)
    return {"expansions": [], "total_added": 0}

def save_expansion_log(log):
    """Simpan log ekspansi."""
    with open(EXPANSION_LOG, 'w', encoding='utf-8') as f:
        json.dump(log, f, indent=2, ensure_ascii=False)

def main():
    print("=" * 60)
    print("  Aurum Brain AI - Daily Dataset Expansion")
    print(f"  Date: {datetime.now().isoformat()}")
    print("=" * 60)
    
    # Load existing
    existing = load_existing_dataset()
    print(f"\n[1/4] Existing dataset: {len(existing)} conversations")
    
    # Expand
    new_convs = expand_dataset(existing)
    print(f"[2/4] New conversations generated: {len(new_convs)}")
    
    if not new_convs:
        print("\n[3/4] No new conversations to add (all variations already in dataset)")
        print("[4/4] Skip - dataset unchanged")
        return 0
    
    # Combine + shuffle untuk variasi
    combined = existing + new_convs
    random.shuffle(combined)
    
    # Save back to source
    with open(SOURCE_FILE, 'w', encoding='utf-8') as f:
        json.dump(combined, f, indent=2, ensure_ascii=False)
    print(f"[3/4] Saved {len(combined)} conversations to {SOURCE_FILE}")
    
    # Update log
    log = load_expansion_log()
    log["expansions"].append({
        "date": datetime.now().isoformat(),
        "added": len(new_convs),
        "total": len(combined),
    })
    log["total_added"] += len(new_convs)
    save_expansion_log(log)
    print(f"[4/4] Expansion log updated (total added: {log['total_added']})")
    
    print(f"\n{'=' * 60}")
    print(f"  EXPANSION COMPLETE")
    print(f"{'=' * 60}")
    print(f"  Before: {len(existing)} conversations")
    print(f"  Added:  {len(new_convs)} new conversations")
    print(f"  After:  {len(combined)} conversations")
    print(f"  Total added (all time): {log['total_added']}")
    
    return len(new_convs)

if __name__ == "__main__":
    main()
