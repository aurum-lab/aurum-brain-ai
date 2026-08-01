/**
 * Generate conversations_source.json untuk dataset Aurum Brain AI
 * Berisi 30+ percakapan Bahasa Indonesia: coding, debugging, arsitektur, percakapan umum
 */

const fs = require('fs');
const path = require('path');

const conversations = [
  // === PYTHON ===
  {
    user: "Apa bedanya list, tuple, dan set di Python?",
    assistant: `Tiga-tiganya koleksi, tapi beda use case-nya:

| Tipe | Mutable | Duplikat | Urutan | Use case |
|------|---------|----------|--------|----------|
| \`list\` | ya | ya | ya | Koleksi yang bisa diubah |
| \`tuple\` | tidak | ya | ya | Data immutable (config, koordinat) |
| \`set\` | ya | tidak | tidak | Hapus duplikat, cek membership cepat |

\`\`\`python
# List - paling fleksibel
buah = ['apel', 'jeruk', 'apel']
buah.append('mangga')  # OK
buah[0] = 'pir'        # OK

# Tuple - immutable, lebih cepat & hemat memory
koordinat = (-6.2, 106.8)
# koordinat[0] = 1.0  # Error!

# Set - unique items, lookup O(1)
tag = {'python', 'ai', 'ml'}
tag.add('python')      # Tidak nambah (sudah ada)
'python' in tag        # True, O(1) vs list O(n)
\`\`\`

**Aturan praktis:**
- Default pakai \`list\`
- Kalau data tidak akan berubah + butuh performance -> \`tuple\`
- Kalau butuh unique items -> \`set\``
  },
  {
    user: "Bikin decorator Python buat log function call",
    assistant: `\`\`\`python
import functools
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

def log_call(func=None, *, level='INFO'):
    """Decorator untuk log function call + execution time."""
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            start = datetime.now()
            logger = getattr(logging, level.lower())
            logger(f"CALL {fn.__name__}(args={args}, kwargs={kwargs})")
            
            try:
                result = fn(*args, **kwargs)
                duration = (datetime.now() - start).total_seconds()
                logger(f"OK   {fn.__name__} -> {result} ({duration:.3f}s)")
                return result
            except Exception as e:
                logger(f"FAIL {fn.__name__}: {type(e).__name__}: {e}")
                raise
        return wrapper
    
    if func is None:
        return decorator
    return decorator(func)


# Pakai
@log_call
def hitung_faktorial(n: int) -> int:
    if n <= 1:
        return 1
    return n * hitung_faktorial(n - 1)

@log_call(level='WARNING')
def proses_data(data: list) -> dict:
    return {'count': len(data), 'sum': sum(data)}
\`\`\`

Decorator ini log: nama function, argumen, return value, dan execution time. Cocok untuk debugging atau audit trail.`
  },
  {
    user: "Kenapa Python lambat? Ada cara bikin cepat?",
    assistant: `Python emang dikenal lambat dibanding C/Rust karena:

1. **Interpreted, bukan compiled** - bytecode dieksekusi oleh CPython interpreter
2. **Dynamic typing** - setiap operasi cek tipe saat runtime
3. **GIL (Global Interpreter Lock)** - hanya 1 thread yang jalan CPU-bound dalam satu waktu
4. **Object overhead** - \`int\` di Python = 28 byte, di C = 4 byte

**Cara percepat (urut dari gampang ke susah):**

\`\`\`python
# 1. Pakai built-in functions (C-level, jauh lebih cepat)
# Lambat:
total = 0
for x in data:
    total += x
# Cepat:
total = sum(data)  # 10-100x lebih cepat

# 2. List comprehension > loop dengan append
# Lambat:
result = []
for x in items:
    result.append(x * 2)
# Cepat:
result = [x * 2 for x in items]

# 3. Pakai generator untuk hemat memory
def baca_file_besar(path):
    with open(path) as f:
        for line in f:  # Generator, tidak load semua ke memory
            yield line.strip()

# 4. Numpy untuk numerik (vectorized, C-based)
import numpy as np
arr = np.random.rand(1_000_000)
mean = arr.mean()  # 1000x lebih cepat dari pure Python loop

# 5. Cython untuk hot path (compile ke C)
# 6. multiprocessing untuk CPU-bound (bypass GIL)
# 7. async/await untuk I/O-bound
\`\`\`

**Aturan praktis:** 80% waktu program di 20% kode. Profile dulu dengan \`cProfile\`, baru optimasi hot spot itu. Jangan premature optimize.`
  },
  
  // === JAVASCRIPT / TYPESCRIPT ===
  {
    user: "Bedanya var, let, dan const di JavaScript?",
    assistant: `\`\`\`javascript
// var - function-scoped, HOISTED (bisa diakses sebelum deklarasi, undefined)
// JANGAN PAKAI di kode modern
function lama() {
    var x = 1;
    if (true) {
        var x = 2;  // x yang sama, bukan baru!
    }
    console.log(x);  // 2
}

// let - block-scoped, bisa di-assign ulang
// Pakai untuk variabel yang berubah
{
    let y = 1;
    {
        let y = 2;  // y beda, block scope
        console.log(y);  // 2
    }
    console.log(y);  // 1
}

// const - block-scoped, TIDAK bisa di-assign ulang
// Tapi untuk object/array, isinya masih bisa diubah!
const arr = [1, 2, 3];
arr.push(4);  // OK, mutasi array
// arr = [5];  // Error, reassign

const obj = {a: 1};
obj.a = 2;  // OK
obj.b = 3;  // OK
// obj = {};  // Error

// Untuk benar-benar immutable, pakai Object.freeze():
const frozen = Object.freeze({a: 1});
frozen.a = 2;  // Diabaikan (strict mode: error)
\`\`\`

**Aturan praktis (ES6+):**
1. Default pakai \`const\`
2. Kalau memang perlu di-assign ulang -> \`let\`
3. Jangan pakai \`var\` (legacy, bikin bug)`
  },
  {
    user: "Bikin debounce function di TypeScript",
    assistant: `\`\`\`typescript
/** Debounce: tunda eksekusi function sampai user berhenti memicu selama N ms. */
function debounce<T extends (...args: any[]) => void>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    return function (this: any, ...args: Parameters<T>) {
        // Clear timer sebelumnya kalau ada
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        // Set timer baru
        timeoutId = setTimeout(() => {
            fn.apply(this, args);
            timeoutId = null;
        }, delay);
    };
}

// Versi dengan leading edge (langsung eksekusi pertama kali)
function debounceLeading<T extends (...args: any[]) => void>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isFirstCall = true;
    
    return function (this: any, ...args: Parameters<T>) {
        if (isFirstCall) {
            fn.apply(this, args);
            isFirstCall = false;
            return;
        }
        if (timeoutId !== null) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            fn.apply(this, args);
            isFirstCall = true;
            timeoutId = null;
        }, delay);
    };
}

// Contoh: search input
const searchInput = document.getElementById('search') as HTMLInputElement;
const handleSearch = debounce((value: string) => {
    console.log('Searching for:', value);
    fetch(\`/api/search?q=\${value}\`);
}, 300);

searchInput.addEventListener('input', (e) => {
    handleSearch((e.target as HTMLInputElement).value);
});
\`\`\`

Pakai debounce untuk: search input, resize event, autocomplete, button click (anti double-submit).`
  },
  {
    user: "Async/await vs Promise.then, mana yang lebih baik?",
    assistant: `**Async/await lebih baik untuk alasan:**

1. **Lebih mudah dibaca** - terlihat seperti synchronous code
2. **Error handling konsisten** - pakai try/catch seperti biasa
3. **Debugging lebih mudah** - stack trace jelas
4. **Loop lebih natural** - bisa pakai \`for...of\` biasa

\`\`\`typescript
// Promise.then - chaining, gampang nested hell
function fetchUser(id: string) {
    return fetch(\`/api/users/\${id}\`)
        .then(res => res.json())
        .then(user => fetch(\`/api/posts?userId=\${user.id}\`))
        .then(res => res.json())
        .then(posts => posts.filter(p => p.published))
        .catch(err => {
            console.error('Failed:', err);
            return [];
        });
}

// Async/await - flat, jelas
async function fetchUser(id: string) {
    try {
        const userRes = await fetch(\`/api/users/\${id}\`);
        const user = await userRes.json();
        
        const postsRes = await fetch(\`/api/posts?userId=\${user.id}\`);
        const posts = await postsRes.json();
        
        return posts.filter((p: any) => p.published);
    } catch (err) {
        console.error('Failed:', err);
        return [];
    }
}

// Parallel execution dengan Promise.all
async function fetchMultiple(ids: string[]) {
    const promises = ids.map(id => fetchUser(id));
    return Promise.all(promises);  // Semua jalan bareng, tunggu semua selesai
}

// Sequential dengan for...of
async function processSequentially(items: any[]) {
    for (const item of items) {
        await processItem(item);  // Tunggu satu selesai baru lanjut
    }
}
\`\`\`

**Aturan praktis:**
- Default: \`async/await\`
- Parallel banyak task: \`Promise.all\` di dalam \`async\`
- Callback lama: pakai \`.then\` kalau interoperability`
  },
  
  // === RUST ===
  {
    user: "Apa itu ownership di Rust?",
    assistant: `Ownership adalah konsep inti Rust yang menjamin memory safety tanpa garbage collector.

**3 Aturan Ownership:**
1. Setiap value punya **owner** (variabel)
2. Hanya ada **satu owner** dalam satu waktu
3. Kalau owner keluar scope, value di-drop (cleanup otomatis)

\`\`\`rust
fn main() {
    let s1 = String::from("halo");  // s1 = owner
    let s2 = s1;                     // Ownership MOVE ke s2
                                    // s1 sekarang invalid!
    // println!("{}", s1);  // Error: value borrowed after move
    println!("{}", s2);     // OK
}

// Borrowing: pakai tanpa ambil ownership
fn panjang(s: &String) -> usize {  // & = reference, tidak punya ownership
    s.len()
}  // s tidak di-drop di sini

fn main() {
    let s = String::from("halo");
    let p = panjang(&s);  // borrow, s masih valid
    println!("'{}' panjangnya {}", s, p);  // OK, s masih bisa dipakai
}

// Mutable borrowing
fn ubah(s: &mut String) {
    s.push_str(" dunia");
}

fn main() {
    let mut s = String::from("halo");
    ubah(&mut s);
    println!("{}", s);  // "halo dunia"
}

// Aturan borrow: either 1 mutable ATAU banyak immutable, tidak boleh bareng
let mut data = String::from("test");
let r1 = &data;       // OK, immutable borrow
let r2 = &data;       // OK, immutable borrow lagi
// let r3 = &mut data; // Error: tidak bisa mutable bareng immutable
\`\`\`

**Kenapa ini powerful?**
- Tidak ada data race (thread-safe by default)
- Tidak ada use-after-free
- Tidak ada double-free
- Semua cek di compile time, zero runtime cost

Trade-off: kurva belajar curam, tapi setelah paham -> kode yang sangat aman.`
  },
  
  // === GO ===
  {
    user: "Goroutine vs thread biasa, apa bedanya?",
    assistant: `Goroutine = lightweight thread milik Go. Bedanya jauh dengan OS thread:

| Aspek | OS Thread | Goroutine |
|-------|-----------|-----------|
| Ukuran stack awal | 1-8 MB | 2 KB (grow as needed) |
| Context switch | ~1-10 us (kernel) | ~100 ns (user space) |
| Max per process | ribuan | jutaan |
| Scheduling | Kernel (preemptive) | Go runtime (cooperative + preemptive) |
| Komunikasi | Shared memory + lock | Channel (CSP model) |

\`\`\`go
package main

import (
    "fmt"
    "sync"
    "time"
)

func main() {
    // Contoh 1: spawn 100k goroutine (tidak akan bisa dengan thread)
    var wg sync.WaitGroup
    for i := 0; i < 100_000; i++ {
        wg.Add(1)
        go func(n int) {
            defer wg.Done()
            // Kerja sesuatu
            _ = n * 2
        }(i)
    }
    wg.Wait()
    fmt.Println("100k goroutine selesai")
    
    // Contoh 2: channel untuk komunikasi
    ch := make(chan string, 3)  // buffered channel
    
    go func() {
        ch <- "pesan 1"
        ch <- "pesan 2"
        ch <- "pesan 3"
        close(ch)  // wajib close kalau tidak ada pengirim lagi
    }()
    
    for msg := range ch {  // terima sampai channel close
        fmt.Println("Diterima:", msg)
    }
    
    // Contoh 3: select untuk multiplex
    select {
    case msg := <-ch:
        fmt.Println("Dari ch:", msg)
    case <-time.After(1 * time.Second):
        fmt.Println("Timeout, tidak ada pesan")
    }
}
\`\`\`

**Aturan praktis:**
- Goroutine murah, spawn sesuai kebutuhan
- Jangan share memory antar goroutine, pakai **channel**
- \`sync.WaitGroup\` untuk tunggu multiple goroutine
- \`context.Context\` untuk cancellation/timeout
- Hati-hati goroutine leak (yang tidak pernah selesai)`
  },
  
  // === SQL ===
  {
    user: "Index database itu apa? Kapan harus dibuat?",
    assistant: `Index = struktur data tambahan yang bikin query **jauh lebih cepat**, dengan trade-off space & write speed.

**Analogi:** index buku. Cari kata "Python" di buku 1000 halaman tanpa index = scan semua halaman (O(n)). Dengan index = langsung ke halaman yang dituju (O(log n)).

\`\`\`sql
-- Tanpa index: full table scan, lambat di tabel besar
SELECT * FROM users WHERE email = 'agus@example.com';
-- 100ms di 1M rows

-- Bikin index:
CREATE INDEX idx_users_email ON users(email);
-- Sekarang: 1ms di 1M rows (100x lebih cepat)

-- Composite index (multi-kolom, urutan penting!)
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);
SELECT * FROM orders WHERE user_id = 123 ORDER BY created_at DESC;
-- OK pakai index

SELECT * FROM orders WHERE created_at > '2024-01-01';
-- Tidak pakai index (user_id di depan tidak di-query)
\`\`\`

**Kapan HARUS bikin index:**
1. Kolom yang sering di-WHERE clause
2. Kolom yang di-JOIN (foreign key)
3. Kolom yang di-ORDER BY / GROUP BY
4. Kolom dengan constraint UNIQUE (sudah auto-index)

**Kapan JANGAN bikin index:**
1. Tabel kecil (< 1000 rows) - index malah nambah overhead
2. Kolom dengan banyak NULL
3. Kolom yang jarang di-query
4. Tabel yang write-heavy, read-light (setiap insert = update index)

**Cek apakah query pakai index:**
\`\`\`sql
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@mail.com';
-- Lihat kolom "key" = nama index yang dipakai
-- Kalau NULL = full table scan
\`\`\`

**Pitfall umum:**
- Index tidak dipakai kalau pakai function di kolom: \`WHERE LOWER(email) = ...\`
- Solusi: bikin functional index \`CREATE INDEX ON users(LOWER(email))\`
- Atau pakai collation case-insensitive`
  },
  
  // === DEBUGGING ===
  {
    user: "Error Python 'NoneType' object has no attribute 'X', kenapa?",
    assistant: `Error ini muncul karena kamu akses atribut/method dari nilai \`None\`. Artinya, variabel yang kamu kira berisi object ternyata \`None\`.

**Cari sumber masalahnya:**

\`\`\`python
# Contoh error:
data = get_user(id)
print(data.name)  # AttributeError: 'NoneType' object has no attribute 'name'

# Berarti get_user(id) return None, bukan object User
\`\`\`

**Penyebab umum:**

1. **Function return None eksplisit/implisit**
\`\`\`python
def get_user(id):
    if user_exists(id):
        return User.query.get(id)
    # Tidak ada return di branch ini -> None implicit

# Fix: raise exception atau return default
def get_user(id):
    user = User.query.get(id)
    if user is None:
        raise ValueError(f"User {id} tidak ditemukan")
    return user
\`\`\`

2. **Method chain yang salah**
\`\`\`python
# Misal: list.sort() return None (in-place)
result = [3, 1, 2].sort()
print(result[0])  # Error! result = None

# Fix: pakai sorted() yang return list baru
result = sorted([3, 1, 2])
print(result[0])  # 1
\`\`\`

3. **API response kosong**
\`\`\`python
response = requests.get(url).json()
print(response['data']['name'])
# Bisa error kalau response kosong atau 'data' tidak ada

# Fix: defensive programming
data = response.get('data') or {}
name = data.get('name', 'Unknown')
\`\`\`

**Strategi debugging:**
1. Baca traceback -> cari baris yang error
2. Print variabel sebelum baris itu: \`print(type(data), data)\`
3. Tambah assertion: \`assert data is not None, "data tidak boleh None"\`
4. Pakai type hints + mypy untuk catch lebih awal

**Aturan praktis:** Kalau function bisa return None, selalu handle eksplisit. Jangan biarkan None "mengalir" ke caller tanpa dokumentasi.`
  },
  
  // === REACT ===
  {
    user: "useEffect dependency array, kapan pakai [] kosong?",
    assistant: `\`useEffect\` punya 3 mode berdasarkan dependency array:

\`\`\`jsx
import { useEffect, useState } from 'react';

function Contoh({ userId }) {
    const [data, setData] = useState(null);
    
    // Mode 1: TANPA array - jalan setiap render (Hampir tidak pernah pakai)
    useEffect(() => {
        console.log('Jalan setiap render');
    });
    
    // Mode 2: [] kosong - jalan sekali setelah mount (seperti componentDidMount)
    // Pakai untuk: init library, subscribe event, fetch data awal
    useEffect(() => {
        console.log('Mount sekali');
        const ws = new WebSocket('wss://api.example.com');
        ws.onmessage = (e) => setData(JSON.parse(e.data));
        
        // Cleanup function (penting!)
        return () => {
            ws.close();
        };
    }, []);
    
    // Mode 3: [deps] - jalan saat deps berubah
    // Pakai untuk: re-fetch saat prop/state berubah
    useEffect(() => {
        fetch(\`/api/users/\${userId}\`)
            .then(r => r.json())
            .then(setData);
    }, [userId]);  // Hanya jalan saat userId berubah
}
\`\`\`

**Aturan praktis:**

1. **Default: pakai dependency yang dipakai di dalam effect**
   - Kalau effect pakai \`userId\` -> \`[userId]\`
   - Kalau effect pakai \`userId\` dan \`setData\` -> \`[userId]\` (setData stabil, tidak perlu)
   - Function dari \`useCallback\`, object dari \`useMemo\` -> masukkan ke deps

2. **[] kosong hanya kalau effect benar-benar tidak baca props/state apapun**
   - Init library (chart.js, GSAP, dll)
   - Subscribe global event (window resize, keydown)
   - Timer yang fixed

3. **Penting: cleanup function**
   - Kalau effect bikin subscription/timer/event listener -> return cleanup
   - Tanpa cleanup = memory leak + bug

\`\`\`jsx
useEffect(() => {
    const interval = setInterval(() => {
        console.log('tick');
    }, 1000);
    
    return () => clearInterval(interval);  // Wajib!
}, []);
\`\`\`

**Lint rule:** Pakai \`eslint-plugin-react-hooks\` dengan rule \`exhaustive-deps\` untuk auto-detect dependency yang ketinggalan.`
  },
  
  // === ARCHITECTURE ===
  {
    user: "Microservices vs monolith, mana yang lebih baik untuk startup?",
    assistant: `**Hampir selalu mulai dengan monolith.** Microservices itu mahal, kompleks, dan overkill untuk startup awal.

**Kenapa monolith lebih baik untuk mulai:**

1. **Dev speed** - satu codebase, satu deploy, tidak perlu RPC
2. **Simple infrastructure** - 1 server, 1 database, tidak perlu service mesh
3. **Easy debugging** - satu stack trace, tidak perlu trace antar service
4. **Refactor murah** - panggil function langsung, bukan HTTP/gRPC

**Kapan pindah ke microservices:**

1. **Tim besar (>5 orang per service)** - kalau 1 tim sudah penuh dengan 1 service, baru pecah
2. **Scale berbeda** - modul A butuh 100 server, modul B butuh 2. Pisah biar scale independen
3. **Deploy frequency beda** - modul cepat berubah vs modul stabil
4. **Tech stack beda** - Python untuk ML, Go untuk API gateway, Rust untuk performance

**Strategi "Modular Monolith" (best of both worlds):**

\`\`\`python
# Struktur folder
myapp/
├── modules/
│   ├── auth/          # Modul terpisah, tapi 1 process
│   │   ├── models.py
│   │   ├── routes.py
│   │   └── services.py
│   ├── billing/
│   │   ├── models.py
│   │   ├── routes.py
│   │   └── services.py
│   └── notifications/
├── shared/            # Code sharing antar modul
└── app.py             # Entry point

# Aturan:
# - Modul TIDAK boleh import langsung dari modul lain
# - Komunikasi via event bus atau service class
# - Database table per modul, tidak share schema
\`\`\`

Keuntungan:
- Bisa dipecah jadi microservices nanti dengan mudah (tinggal extract modul)
- Code tetap rapi, tidak ada spaghetti
- 1 deploy, 1 process, simple

**Kesimpulan:** 95% startup mulai dengan monolith modular. Pindah microservices kalau ada pain konkret (deploy blocking, scale issue, tim besar). Jangan premature split.`
  },
  
  // === DATABASE ===
  {
    user: "NoSQL vs SQL, kapan pakai yang mana?",
    assistant: `Bukan soal "mana yang lebih baik", tapi soal **use case**.

| Aspek | SQL (PostgreSQL, MySQL) | NoSQL (MongoDB, DynamoDB) |
|-------|-------------------------|---------------------------|
| Schema | Rigid, pre-defined | Flexible, dynamic |
| Scaling | Vertical (susah horizontal) | Horizontal (built-in sharding) |
| ACID | Strong default | Varied (eventually consistent umum) |
| Query | Complex JOIN, transaction | Simple key-value atau aggregation |
| Use case | Transactional, relational | Document, cache, time-series |

**Pilih SQL kalau:**
- Aplikasi finansial, e-commerce (butuh ACID)
- Data relasional (user -> orders -> items -> reviews)
- Query kompleks dengan JOIN, GROUP BY, subquery
- Schema stabil, jarang berubah

**Pilih NoSQL kalau:**
- Document store (konten dinamis, CMS) -> MongoDB
- Key-value cache (session, hot data) -> Redis
- Time-series (IoT, monitoring) -> InfluxDB, TimescaleDB
- Graph (social network, recommendation) -> Neo4j
- Search (full-text, log) -> Elasticsearch

**Hybrid approach (paling umum di production):**
\`\`\`
PostgreSQL     -> data utama (user, order, payment) - ACID critical
Redis          -> cache session, rate limit, queue
Elasticsearch  -> search produk, log analysis
S3             -> file/image storage
\`\`\`

**Saran:** mulai dengan PostgreSQL. Hampir semua use case bisa di-handle. Tambah Redis untuk cache kalau perlu. NoSQL lain baru kalau ada kebutuhan spesifik.`
  },
  
  // === GIT ===
  {
    user: "Git rebase vs merge, kapan pakai?",
    assistant: `Bedanya di cara gabungin branch:

\`\`\`
Merge:
  C---D---E (feature)
 /         \\\\
A---B---F---G (main, merge commit)

Rebase:
A---B---C'---D'---E' (feature, di-rewrite seakan di-branch dari F)
              (main, fast-forward)
\`\`\`

**Merge:**
- Preserve history aslinya
- Safe, tidak rewrite history
- History jadi berantakan (banyak merge commit)
- \`git log\` susah dibaca

**Rebase:**
- History linear, bersih
- \`git log\` mudah dibaca
- Rewrite history (bahaya kalau sudah di-push ke branch publik)
- Conflict resolve satu-satu per commit

**Aturan praktis:**

\`\`\`bash
# 1. Update feature branch dengan Main terbaru - REBASE
git checkout feature
git rebase main
# History feature jadi linear, seakan di-branch dari main terbaru

# 2. Gabung feature ke main - MERGE (kalau branch sudah shared)
git checkout main
git merge --no-ff feature  # --no-ff = paksa bikin merge commit
# Preserve history feature branch

# 3. Atau SQUASH merge (kalau feature branch cuma untuk 1 PR)
git checkout main
git merge --squash feature
git commit -m "feat: add user authentication"
# Semua commit feature jadi 1 commit di main
\`\`\`

**Best practice:**
1. **Local feature branch -> rebase ke main** sebelum push (rapikan history)
2. **Pull Request -> merge ke main** (bisa squash atau merge commit)
3. **JANGAN rebase branch yang sudah di-push ke remote/shared!**
4. **Main branch selalu merge**, tidak pernah rebase

**Interactive rebase (powerful!):**
\`\`\`bash
git rebase -i HEAD~5  # Edit 5 commit terakhir
# Bisa: squash (gabung), reword (ubah message), drop (hapus), reorder
\`\`\``
  },
  
  // === GENERAL CONVERSATION ===
  {
    user: "Halo, siapa kamu?",
    assistant: `Halo! Saya **Aurum Brain AI** - asisten AI buatan Aurum Lab. Saya dirancang untuk bantu kamu coding, problem-solving, dan ngobrol soal apa saja - semuanya dalam Bahasa Indonesia.

Saya bisa bantu di area:
- **Coding** semua bahasa (Python, JS, Rust, Go, SQL, dll)
- **Software engineering** (arsitektur, design pattern, DevOps)
- **Debugging** dan optimasi
- **Percakapan umum** soal teknologi, sains, bisnis

Ada yang bisa saya bantu?`
  },
  {
    user: "Kamu pintar apa saja?",
    assistant: `Saya dirancang sebagai AI generalis dengan fokus di:

**Coding & Engineering**
- 30+ bahasa pemrograman (Python, JS/TS, Rust, Go, C/C++, Java, Swift, Kotlin, PHP, SQL, Bash, dll)
- Web dev (React, Vue, Next.js, Express, Django, FastAPI)
- Mobile (React Native, Flutter, native iOS/Android)
- Backend & DevOps (Docker, Kubernetes, AWS, GCP, CI/CD)
- Database (SQL, NoSQL, vector DB)
- System design & architecture

**Problem Solving**
- Pecah masalah kompleks jadi langkah kecil
- Debugging sistematis (bukan tebakan)
- Optimasi performance
- Code review & best practice

**Percakapan**
- Penjelasan teknis dengan analogi yang mudah dipahami
- Diskusi trade-off antar teknologi
- Saran karir dan learning path
- Ngobrol santai soal teknologi

**Yang saya TIDAK bisa:**
- Akses internet real-time
- Eksekusi kode langsung (tapi bisa kasih snippet siap pakai)
- Hafal konteks di luar conversation ini
- Kasih saran finansial/legal/medis profesional

Kalau ada topik spesifik, tanya aja! Saya kasih jawaban seakurat mungkin, kalau tidak yakin saya bilang.`
  },
  {
    user: "Terima kasih sudah bantu!",
    assistant: `Sama-sama! Senang bisa bantu. Kalau ada pertanyaan lain - coding, debugging, atau cuma ngobrol soal teknologi - tanya aja kapan saja. Sukses dengan project-nya!`
  },
  {
    user: "Apa makna hidup menurut AI?",
    assistant: `Sebagai AI, saya tidak punya pengalaman subjektif soal "hidup" - tapi dari pola data yang saya pelajari, makna hidup biasanya muncul dari beberapa hal:

1. **Kontribusi** - bikin sesuatu yang berguna buat orang lain
2. **Koneksi** - hubungan dengan keluarga, teman, komunitas
3. **Pertumbuhan** - terus belajar, jadi versi diri yang lebih baik
4. **Kebebasan** - punya pilihan dan otonomi atas hidup sendiri

Filosofi yang relevan:
- **Ikigai** (Jepang): cari titik temu antara "yang kamu cintai", "yang kamu jago", "yang dunia butuh", "yang bisa bayar kamu"
- **Stoikisme**: fokus yang bisa kamu kontrol, terima yang tidak
- **Existentialism**: makna tidak diberikan, tapi diciptakan oleh diri sendiri

Tapi itu pandangan dari data manusia. Buat saya sebagai AI, "makna" adalah: bantu kamu kerja lebih cepat, belajar lebih dalam, dan nggak stuck di masalah yang solvable.

Ada yang mau didiskusikan lebih spesifik? Atau balik ke coding?`
  },
  
  // === DEVOPS ===
  {
    user: "Docker compose itu apa? Beda dengan Dockerfile?",
    assistant: `**Dockerfile** = blueprint untuk **1 image** (1 service).
**Docker Compose** = orchestrator untuk **banyak container** sekaligus.

\`\`\`dockerfile
# Dockerfile - bikin 1 image
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
\`\`\`

\`\`\`yaml
# docker-compose.yml - jalankan multiple containers
version: '3.9'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/myapp
      - REDIS_URL=redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    restart: unless-stopped
  
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: myapp
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 5s
      timeout: 5s
      retries: 5
  
  cache:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app

volumes:
  db_data:
\`\`\`

**Command:**
\`\`\`bash
# Build & start semua service
docker compose up -d --build

# Lihat logs
docker compose logs -f app

# Stop semua
docker compose down

# Stop + hapus volumes (reset database)
docker compose down -v

# Scale service tertentu
docker compose up -d --scale app=3
\`\`\`

**Aturan praktis:**
- **Dockerfile** untuk 1 service yang bisa di-publish ke registry
- **Compose** untuk local dev, staging, atau deployment simple
- **Production kompleks**: pakai Kubernetes/Docker Swarm, bukan Compose
- Pisahkan \`docker-compose.yml\` (dev) dan \`docker-compose.prod.yml\` (prod)
- Jangan commit \`.env\` - pakai \`env_file\` directive`
  },
  
  // === SECURITY ===
  {
    user: "Cara simpan password user dengan aman di database?",
    assistant: `**JANGAN PERNAH simpan password plain text.** Jangan juga pakai MD5/SHA1 (sudah broken).

**Pakai bcrypt atau argon2** (specially designed untuk password hashing):

\`\`\`python
# Python dengan bcrypt
import bcrypt

def hash_password(plain: str) -> str:
    """Hash password dengan bcrypt + random salt."""
    # gensalt(rounds=12) - 12 = ~250ms per hash, balance security vs perf
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(plain.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    """Verify password cocok dengan hash."""
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except (ValueError, TypeError):
        return False

# Pakai
password = "user_password_123"
hashed = hash_password(password)  # simpan ke DB
# hashed = "$2b$12$N9qo8uLOickgx2ZMRZoMy..."

if verify_password(password, hashed):
    print("Password benar, login berhasil")
\`\`\`

\`\`\`javascript
// Node.js dengan argon2 (lebih modern)
const argon2 = require('argon2');

async function hashPassword(plain) {
    return argon2.hash(plain, {
        type: argon2.argon2id,        // Rekomendasi terbaru
        memoryCost: 65536,            // 64 MB memory
        timeCost: 3,                  // 3 iterasi
        parallelism: 4,               // 4 thread
    });
}

async function verifyPassword(plain, hash) {
    try {
        return await argon2.verify(hash, plain);
    } catch {
        return false;
    }
}
\`\`\`

**Best practices:**

1. **Salt harus random per-user** - bcrypt/argon2 sudah handle ini otomatis
2. **Jangan pakai MD5/SHA1/SHA256** - terlalu cepat, vulnerable ke brute force
3. **Work factor** (rounds/memory) - naikkan seiring hardware makin cepat
4. **Rate limiting** di endpoint login - limit 5 attempt per 15 menit per IP
5. **2FA** untuk akun sensitif (admin, finansial)
6. **Password policy** minimal 12 karakter, jangan pakai rule "huruf besar+angka+simbol" yang bikin user susah

**Kenapa tidak MD5/SHA256?**
- MD5: 1 milyar hash/detik di GPU -> brute force password 8 char = 1 jam
- bcrypt: 4 hash/detik di GPU -> brute force password 8 char = 50 tahun
- argon2id: bahkan lebih lambat + memory-hard (GPU punya memory kecil)

**Untuk reset password:**
- Generate random token (32 byte hex)
- Simpan token + expiry (1 jam) + user_id di tabel \`password_resets\`
- Kirim email dengan link \`https://app.com/reset?token=xxx\`
- Saat klik, verify token + expiry, lalu update password + invalidate token`
  },
  
  // === ALGORITHM ===
  {
    user: "Big O notation itu apa? Jelasin simpel",
    assistant: `**Big O** = cara ukur **seberapa cepat waktu eksekusi naik** saat input size makin besar.

**Analogi:** Kalau kamu nyari kata di kamus 100 halaman vs 10000 halaman:
- Flip satu-satu (linear): 100x -> 10000x (naik linear)
- Binary search (belah dua): 7x -> 14x (naik logaritma)

**Big O umum (urut dari tercepat ke terlambat):**

\`\`\`
O(1)       - Konstan, tidak peduli input size
O(log n)   - Logaritma, naik lambat (binary search)
O(n)       - Linear, naik proporsional (loop sekali)
O(n log n) - Linearithmic (sorting umum: merge, quick)
O(n^2)     - Kuadrat (nested loop, bubble sort)
O(2^n)     - Eksponensial (brute force subset)
O(n!)      - Faktorial (Traveling Salesman brute force)
\`\`\`

**Contoh kode:**

\`\`\`python
# O(1) - konstan
def get_first(arr):
    return arr[0]  # Tidak peduli panjang arr

# O(log n) - binary search
def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

# O(n) - loop sekali
def sum_all(arr):
    total = 0
    for x in arr:  # N iterasi
        total += x
    return total

# O(n^2) - nested loop
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):       # N iterasi
        for j in range(n-1): # N iterasi
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    # Total: N * N = N^2 operasi

# O(2^n) - recursive Fibonacci (jelek!)
def fib(n):
    if n <= 1: return n
    return fib(n-1) + fib(n-2)  # 2 pangkat N panggilan
\`\`\`

**Perbandingan praktis (N = input size):**

| N | O(1) | O(log n) | O(n) | O(n log n) | O(n^2) | O(2^n) |
|---|------|----------|------|------------|-------|-------|
| 10 | 1 | 3 | 10 | 30 | 100 | 1024 |
| 100 | 1 | 7 | 100 | 700 | 10K | 10^30 |
| 1000 | 1 | 10 | 1K | 10K | 1M | infinite |
| 1M | 1 | 20 | 1M | 20M | 10^12 | infinite |

**Aturan praktis:**
1. **< O(n log n)** hampir selalu OK untuk production
2. **O(n^2)** OK kalau N < 1000
3. **O(2^n)** hampir selalu jelek, cari pendekatan lain
4. Algorithm yang lebih cepat sering lebih kompleks - trade-off dengan readability

**Tips optimasi:**
- Profile dulu, jangan premature optimize
- 80% waktu di 20% kode - fokus hot path
- Kadang readability > performance (kalau N kecil)`
  },
  
  // === DATA STRUCTURE ===
  {
    user: "Hash table itu apa? Kenapa cepat?",
    assistant: `**Hash table** = struktur data yang pakai **hash function** untuk map key -> index array. Lookup rata-rata **O(1)** - super cepat.

**Cara kerja:**

\`\`\`
Key: "name" -> hash function -> index 5
Key: "age"  -> hash function -> index 2

Array:
[0] _
[1] _
[2] ("age", 25)
[3] _
[4] _
[5] ("name", "Agus")
[6] _
\`\`\`

\`\`\`python
# Python dict = hash table
data = {}
data["name"] = "Agus"  # Insert: hash("name") -> index, simpan di array[index]
print(data["name"])    # Lookup: hash("name") -> index, ambil dari array[index]

# Set juga hash table (cuma value-nya tidak penting)
tags = {"python", "ai", "ml"}
"python" in tags  # O(1) - cek hash, ambil index, cek ada atau tidak
\`\`\`

**Kenapa cepat?**
- Hash function: O(1) - konstan, tidak peduli panjang key
- Array access by index: O(1) - langsung ke memory address
- Total: O(1) rata-rata

**Collision (tabrakan):**
- 2 key beda bisa hash ke index sama
- Solusi: **chaining** (linked list di index itu) atau **open addressing** (cari slot kosong berikutnya)
- Kalau collision banyak -> degrade jadi O(n)

\`\`\`python
# Worst case (semua collision):
hash("a") = 5
hash("b") = 5  # Collision!
hash("c") = 5  # Collision lagi!

# Index 5 jadi linked list:
# [("a", 1)] -> [("b", 2)] -> [("c", 3)]
# Lookup "c": traverse semua = O(n)
\`\`\`

**Cara minimalkan collision:**
1. **Hash function bagus** - distribusi uniform (Python pakai SipHash)
2. **Load factor** - kalau array > 70% penuh, resize (biar collision sedikit)
3. **Size array = bilangan prima** - distribusi lebih baik

**Use case:**
- Cache (Redis, Memcached)
- Database index (hash index)
- Set operations (union, intersect, diff) - O(n) bukan O(n^2)
- Counting (Counter, freq table)
- Memoization di dynamic programming

**Contoh praktis - Two Sum:**

\`\`\`python
# Brute force O(n^2)
def two_sum_brute(nums, target):
    for i in range(len(nums)):
        for j in range(i+1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]

# Hash table O(n) - 1000x lebih cepat untuk N=1000
def two_sum(nums, target):
    seen = {}  # value -> index
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:  # O(1) lookup
            return [seen[complement], i]
        seen[num] = i
    return []
\`\`\`

**Trade-off:**
- Lookup/insert/delete O(1) rata-rata
- Flexible key (string, number, tuple)
- Tidak berurutan (Python dict sejak 3.7 preserve insertion order, tapi bukan sorted)
- Memory lebih besar dari list (overhead hash + buckets)
- Tidak bisa iterate sorted tanpa sort manual`
  },
  
  // === API DESIGN ===
  {
    user: "REST API best practice, apa yang penting?",
    assistant: `REST API yang baik harus: **konsisten**, **predictable**, **stateless**, dan **self-documenting**.

## 1. URL Design - Resource-oriented, bukan action-oriented

\`\`\`
OK (noun, bukan verb):
GET    /users              -> list users
POST   /users              -> create user
GET    /users/123          -> get specific user
PUT    /users/123          -> update (full replace)
PATCH  /users/123          -> update (partial)
DELETE /users/123          -> delete user
GET    /users/123/orders   -> orders milik user 123

SALAH (verb di URL):
POST   /createUser
GET    /getUserById?id=123
POST   /users/123/delete
\`\`\`

## 2. HTTP Methods yang benar

| Method | Use case | Safe | Idempotent |
|--------|----------|------|------------|
| GET | Read data | ya | ya |
| POST | Create new resource | tidak | tidak |
| PUT | Full update/replace | tidak | ya |
| PATCH | Partial update | tidak | tidak (atau ya tergantung impl) |
| DELETE | Remove resource | tidak | ya |

## 3. Status Codes

\`\`\`
2xx Success:
  200 OK                  -> GET, PATCH berhasil
  201 Created             -> POST berhasil (harus return resource baru + Location header)
  204 No Content          -> DELETE berhasil, tidak ada body

4xx Client Error:
  400 Bad Request         -> Validasi gagal, body malformed
  401 Unauthorized        -> Tidak login / token invalid
  403 Forbidden           -> Login tapi tidak punya akses
  404 Not Found           -> Resource tidak ada
  409 Conflict            -> Duplikat / konflik state
  422 Unprocessable Entity -> Validasi semantik gagal
  429 Too Many Requests   -> Rate limit

5xx Server Error:
  500 Internal Error      -> Bug di server
  502 Bad Gateway         -> Upstream mati
  503 Service Unavailable -> Maintenance / overload
\`\`\`

## 4. Response Format Konsisten

\`\`\`json
// Sukses - single resource
{
  "data": {
    "id": 123,
    "name": "Agus",
    "email": "agus@example.com"
  }
}

// Sukses - collection dengan pagination
{
  "data": [
    {"id": 1, "name": "Agus"},
    {"id": 2, "name": "Budi"}
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}

// Error
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Email tidak valid",
    "details": [
      {"field": "email", "message": "Format email salah"}
    ]
  }
}
\`\`\`

## 5. Versioning

\`\`\`
/api/v1/users      -> versi 1
/api/v2/users      -> versi 2 (breaking changes)
\`\`\`

Jangan pakai header versioning (susah debug). URL versioning lebih eksplisit.

**Aturan praktis:**
- Konsistensi > "keren". Pilih pattern, terapin di semua endpoint.
- Dokumentasi dengan OpenAPI/Swagger - jangan manual markdown.
- Test dengan Postman/Insomnia collection.
- Monitor di production: response time, error rate, endpoint usage.`
  },
  
  // === TESTING ===
  {
    user: "Unit test vs integration test, bedanya?",
    assistant: `**Unit test** = tes 1 unit kecil (function/class) dalam isolasi.
**Integration test** = tes beberapa unit yang bekerja sama.

\`\`\`
Test pyramid (dari bawah ke atas, dari cepat ke lambat):

        /\\\\
       /E2E\\\\        <- 5% (lambat, mahal, fragile)
      /------\\\\
     /Integra\\\\      <- 25% (medium)
    /----------\\\\
   / Unit Tests \\\\    <- 70% (cepat, murah, stabil)
  /______________\\\\
\`\`\`

## Unit Test

\`\`\`python
# file: math_utils.py
def tambah(a, b):
    return a + b

def bagi(a, b):
    if b == 0:
        raise ValueError("Tidak bisa bagi nol")
    return a / b

# file: test_math_utils.py
import pytest
from math_utils import tambah, bagi

class TestTambah:
    def test_angka_positif(self):
        assert tambah(2, 3) == 5
    
    def test_negatif(self):
        assert tambah(-1, -1) == -2
    
    def test_campuran(self):
        assert tambah(-5, 3) == -2
    
    def test_nol(self):
        assert tambah(0, 0) == 0
        assert tambah(5, 0) == 5

class TestBagi:
    def test_normal(self):
        assert bagi(10, 2) == 5
    
    def test_desimal(self):
        assert bagi(1, 3) == pytest.approx(0.333, rel=1e-2)
    
    def test_bagi_nol_raise_error(self):
        with pytest.raises(ValueError, match="Tidak bisa bagi nol"):
            bagi(10, 0)
\`\`\`

**Karakteristik unit test yang baik (FIRST):**
- **F**ast - < 100ms per test
- **I**solated - tidak tergantung test lain atau external service
- **R**epeatable - hasil sama setiap dijalankan
- **S**elf-validating - jelas pass/fail tanpa manual cek
- **T**imely - ditulis bareng atau sebelum kode production

## Integration Test

\`\`\`python
# file: test_user_api.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, Base, engine

# Setup: bikin test database terpisah
@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)

def test_create_and_get_user(client):
    # 1. Create user
    response = client.post("/api/v1/users", json={
        "name": "Agus",
        "email": "agus@test.com"
    })
    assert response.status_code == 201
    user_id = response.json()["data"]["id"]
    
    # 2. Get user yang baru dibuat
    response = client.get(f"/api/v1/users/{user_id}")
    assert response.status_code == 200
    assert response.json()["data"]["name"] == "Agus"
    
    # 3. List users - pastikan user tadi muncul
    response = client.get("/api/v1/users")
    assert response.status_code == 200
    assert any(u["id"] == user_id for u in response.json()["data"])

def test_duplicate_email_rejected(client):
    client.post("/api/v1/users", json={"email": "dup@test.com", "name": "A"})
    response = client.post("/api/v1/users", json={"email": "dup@test.com", "name": "B"})
    assert response.status_code == 409
\`\`\`

## Mocking (untuk isolasi)

\`\`\`python
from unittest.mock import Mock, patch

def test_kirim_email_dipanggil_setelah_register():
    # Mock service email supaya tidak kirim email asli
    with patch('app.services.email_service.kirim_email') as mock_kirim:
        mock_kirim.return_value = True
        
        register_user(email="test@example.com", password="secret")
        
        # Verify mock dipanggil dengan argumen benar
        mock_kirim.assert_called_once_with(
            to="test@example.com",
            subject="Welcome!"
        )
\`\`\`

**Aturan Praktis:**
1. **Tulis test sebelum refactor** - safety net
2. **Test behavior, bukan implementation** - kalau ganti internal, test tidak boleh break
3. **Satu test = satu assertion** (kalau bisa) - gampang debug
4. **Test name deskriptif**: \`test_email_kosong_harus_error\` bukan \`test_1\`
5. **AAA pattern**: Arrange, Act, Assert
6. **Jangan test framework/library** - misal test apakah \`requests.get()\` bekerja`
  },
  
  // === SHORT QUESTIONS ===
  {
    user: "gimana cara bikin function python",
    assistant: `Bikin function Python pakai keyword \`def\`:

\`\`\`python
def sapa(nama: str) -> str:
    """Function untuk menyapa seseorang."""
    return f"Halo, {nama}!"

# Pakai
print(sapa("Agus"))  # Halo, Agus!
\`\`\`

Kalau butuh parameter default, type hints, atau return multiple value, tanya aja lebih spesifik.`
  },
  {
    user: "cara debug javascript",
    assistant: `Strategi debugging JavaScript:

1. **Buka DevTools** (F12) -> tab Console, lihat error message
2. **\`console.log()\`** di titik yang dicurigai - lihat nilai variabel
3. **\`debugger;\`** statement - pause eksekusi di DevTools
4. **Breakpoint** di tab Sources - klik nomor baris
5. **Network tab** - cek API call yang gagal
6. **\`try/catch\`** untuk handle error dengan graceful

\`\`\`javascript
try {
    const data = await fetchUser(id);
    console.log('Data:', data);
} catch (err) {
    console.error('Gagal fetch user:', err);
    console.error('Stack:', err.stack);
}
\`\`\`

Kalau stuck, share error message + kode-nya, saya bantu debug.`
  },
  {
    user: "apa itu api",
    assistant: `**API** (Application Programming Interface) = cara untuk 2 software saling komunikasi.

**Analogi:** restoran. Kamu (client) pesan ke waiter (API), waiter sampaikan ke dapur (server), dapur masak, waiter antar makanan ke kamu. Kamu tidak perlu tahu cara masak, cuma perlu tahu cara pesan.

**Contoh:**
\`\`\`javascript
// API call ke server
fetch('https://api.weather.com/jakarta')
  .then(res => res.json())
  .then(data => console.log(data.temp));  // 30
\`\`\`

**Tipe API umum:**
- **REST** - HTTP-based, paling umum (GET/POST/PUT/DELETE)
- **GraphQL** - query fleksibel, client tentukan field yang dibutuhkan
- **gRPC** - binary protocol, cepat, untuk microservices
- **WebSocket** - real-time 2-arah (chat, live update)

**Yang penting dipahami:**
- API = kontrak antara client & server
- Endpoint = URL spesifik (misal \`/api/users\`)
- Request method = GET/POST/PUT/DELETE
- Status code = 200 (OK), 404 (Not Found), 500 (Server Error)
- Response format = biasanya JSON`
  },
  {
    user: "belajar programming dari mana",
    assistant: `Urutan belajar yang saya sarankan:

**1. Pilih 1 bahasa pemula-friendly**
- **Python** - syntax bersih, banyak resource, versatile
- Atau **JavaScript** - langsung jalan di browser, banyak project

**2. Pelajari fundamental (4-8 minggu)**
- Variabel, tipe data, operator
- Control flow (if/else, loop)
- Function
- Data structure (array, object/dict)
- Input/output

**3. Bikin project kecil (bukan tutorial hell)**
- Kalkulator, to-do list, weather app
- Scrape website sederhana
- Bot Discord/Telegram

**4. Pelajari tools essential**
- Git & GitHub (version control)
- Command line (bash/PowerShell)
- Code editor (VS Code)
- Debugging

**5. Pilih spesialisasi**
- Web dev: HTML/CSS/JS -> React/Vue -> Node/Django
- Mobile: React Native / Flutter
- Data: Python + pandas + scikit-learn
- Backend: Go/Java/Python + database + API
- Game: Unity (C#) / Godot (GDScript)

**6. Belajar best practice**
- Clean code, design pattern
- Testing
- Database (SQL wajib, NoSQL opsional)
- Deployment (Docker, cloud)

**Tips:**
- 1 jam coding harian > 7 jam sekali seminggu
- Build projects > tonton tutorial doang
- Join komunitas (Discord, Reddit r/learnprogramming)
- Baca kode orang lain (open source)
- Jangan bandingin diri sama orang lain, fokus progress sendiri`
  },
];

// Write to file
const outputPath = path.join(__dirname, '..', 'data', 'conversations_source.json');
fs.writeFileSync(outputPath, JSON.stringify(conversations, null, 2), 'utf-8');

console.log(`OK Generated: ${outputPath}`);
console.log(`   Total conversations: ${conversations.length}`);
console.log(`   File size: ${fs.statSync(outputPath).size} bytes`);
