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
  
  // === WEB DEVELOPMENT ( tambahan untuk AI jago bikin website ) ===
  {
    user: "Bikin landing page HTML/CSS sederhana yang responsive",
    assistant: `\`\`\`html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jasa Digital - Landing Page</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
    }
    
    /* Navbar sticky */
    nav {
      position: sticky; top: 0; z-index: 100;
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(10px);
      padding: 1rem 2rem;
      display: flex; justify-content: space-between; align-items: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    nav .logo { font-weight: 700; font-size: 1.25rem; color: #4f46e5; }
    nav .links { display: flex; gap: 2rem; }
    nav a { color: #4b5563; text-decoration: none; font-weight: 500; }
    nav a:hover { color: #4f46e5; }
    
    /* Hero */
    .hero {
      padding: 6rem 2rem 4rem;
      text-align: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .hero h1 { font-size: 3rem; margin-bottom: 1rem; line-height: 1.2; }
    .hero p { font-size: 1.25rem; opacity: 0.9; max-width: 600px; margin: 0 auto 2rem; }
    .hero .cta {
      display: inline-block;
      padding: 0.875rem 2rem;
      background: white; color: #4f46e5;
      border-radius: 8px; font-weight: 600; text-decoration: none;
      transition: transform 0.2s;
    }
    .hero .cta:hover { transform: translateY(-2px); }
    
    /* Features grid */
    .features {
      max-width: 1200px; margin: 0 auto;
      padding: 4rem 2rem;
      display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
    }
    .feature {
      padding: 2rem;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      transition: box-shadow 0.2s;
    }
    .feature:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .feature .icon { font-size: 2rem; margin-bottom: 1rem; }
    .feature h3 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    .feature p { color: #6b7280; }
    
    /* CTA section */
    .cta-section {
      background: #f9fafb;
      padding: 4rem 2rem;
      text-align: center;
    }
    .cta-section h2 { font-size: 2rem; margin-bottom: 1rem; }
    .cta-section .btn {
      display: inline-block;
      padding: 1rem 2rem;
      background: #4f46e5; color: white;
      border-radius: 8px; text-decoration: none; font-weight: 600;
    }
    
    footer {
      padding: 2rem;
      text-align: center; color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    
    /* Responsive - mobile */
    @media (max-width: 640px) {
      nav { padding: 1rem; }
      nav .links { display: none; } /* Bisa diubah jadi hamburger menu */
      .hero h1 { font-size: 2rem; }
      .hero p { font-size: 1rem; }
      .features { padding: 2rem 1rem; }
    }
  </style>
</head>
<body>
  <nav>
    <div class="logo">BrandName</div>
    <div class="links">
      <a href="#features">Fitur</a>
      <a href="#pricing">Harga</a>
      <a href="#contact">Kontak</a>
    </div>
  </nav>
  
  <section class="hero">
    <h1>Solusi Digital untuk Bisnis Anda</h1>
    <p>Bikin website profesional dalam hitungan menit. Tanpa coding, tanpa ribet.</p>
    <a href="#cta" class="cta">Mulai Sekarang</a>
  </section>
  
  <section class="features" id="features">
    <div class="feature">
      <div class="icon">⚡</div>
      <h3>Cepat</h3>
      <p>Load di bawah 1 detik. Optimal untuk SEO dan user experience.</p>
    </div>
    <div class="feature">
      <div class="icon">📱</div>
      <h3>Responsive</h3>
      <p>Tampil sempurna di HP, tablet, dan desktop. Mobile-first design.</p>
    </div>
    <div class="feature">
      <div class="icon">🔒</div>
      <h3>Aman</h3>
      <p>SSL gratis, backup harian, proteksi DDoS bawaan.</p>
    </div>
  </section>
  
  <section class="cta-section" id="cta">
    <h2>Siap Mulai?</h2>
    <p style="margin-bottom: 2rem; color: #6b7280;">Coba gratis 14 hari, tanpa kartu kredit.</p>
    <a href="#" class="btn">Daftar Gratis</a>
  </section>
  
  <footer>
    <p>&copy; 2025 BrandName. All rights reserved.</p>
  </footer>
</body>
</html>
\`\`\`

**Poin penting:**
- **Mobile-first**: pakai media query \`\@media (max-width: 640px)\` untuk adjust mobile
- **CSS Grid** dengan \`auto-fit\` + \`minmax\` bikin responsive otomatis tanpa breakpoint
- **Sticky navbar** dengan \`backdrop-filter: blur\` efek modern
- **Hemat dependency**: pure HTML/CSS, no framework, load cepat`
  },
  {
    user: "Bikin komponen React untuk form login dengan validation",
    assistant: `\`\`\`tsx
// components/LoginForm.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
});

type LoginData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSubmit: (data: LoginData) => Promise<void>;
  loading?: boolean;
}

export function LoginForm({ onSubmit, loading }: LoginFormProps) {
  const [serverError, setServerError] = useState<string>('');
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });
  
  const submit = async (data: LoginData) => {
    setServerError('');
    try {
      await onSubmit(data);
    } catch (err: any) {
      setServerError(err.message || 'Login gagal');
    }
  };
  
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4 max-w-sm mx-auto p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
      
      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
          {serverError}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          {...register('email')}
          type="email"
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="kamu@example.com"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          {...register('password')}
          type="password"
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="********"
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting || loading}
        className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting || loading ? 'Loading...' : 'Login'}
      </button>
    </form>
  );
}
\`\`\`

**Pakai:**
\`\`\`tsx
<LoginForm onSubmit={async (data) => {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Email atau password salah');
}} />
\`\`\`

**Kenapa pakai react-hook-form + zod:**
- **Performance**: react-hook-form tidak re-render saat user ngetik (unlike controlled inputs)
- **Type safety**: zod schema = source of truth untuk type + validation
- **UX**: error message muncul real-time, disable button saat loading
- **Accessibility**: label terhubung otomatis dengan input via htmlFor`
  },
  {
    user: "Bikin Next.js API route untuk upload file ke S3",
    assistant: `\`\`\`typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Inisialisasi S3 client (singleton)
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 2. Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }
    
    // 3. Validate file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File terlalu besar. Maksimal 5MB.' },
        { status: 413 }
      );
    }
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: \`Tipe file tidak didukung: \${file.type}\` },
        { status: 415 }
      );
    }
    
    // 4. Generate unique filename
    const ext = file.name.split('.').pop();
    const filename = \`\${session.user.id}/\${Date.now()}-\${Math.random().toString(36).slice(2, 8)}.\${ext}\`;
    
    // 5. Upload ke S3
    const buffer = Buffer.from(await file.arrayBuffer());
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: filename,
      Body: buffer,
      ContentType: file.type,
      // ACL: 'public-read', // kalau mau public. Untuk private, generate presigned URL.
    }));
    
    // 6. Return URL
    const url = \`https://\${process.env.S3_BUCKET_NAME}.s3.\${process.env.AWS_REGION}.amazonaws.com/\${filename}\`;
    
    return NextResponse.json({ url, filename });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Gagal upload file' },
      { status: 500 }
    );
  }
}
\`\`\`

**Frontend (React):**
\`\`\`tsx
async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
    // JANGAN set Content-Type header manual! Browser akan set otomatis dengan boundary.
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error);
  }
  
  return await res.json(); // { url, filename }
}
\`\`\`

**Setup environment (\`.env.local\`):**
\`\`\`
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET_NAME=your-bucket
\`\`\`

**Tips:**
- Untuk file besar (>5MB), pakai **presigned URL** — upload langsung dari frontend ke S3, lewat server
- Untuk image, pertimbangkan pakai \`sharp\` untuk resize/compress sebelum upload
- Selalu validate di server, jangan percaya client validation saja`
  },
  {
    user: "Cara bikin navbar responsive dengan hamburger menu di React",
    assistant: `\`\`\`tsx
// components/Navbar.tsx
import { useState, useEffect } from 'react';

const navLinks = [
  { href: '#home', label: 'Beranda' },
  { href: '#features', label: 'Fitur' },
  { href: '#pricing', label: 'Harga' },
  { href: '#contact', label: 'Kontak' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Close menu saat resize ke desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Add background saat scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <nav className={\`fixed top-0 left-0 right-0 z-50 transition-all \${
      scrolled ? 'bg-white/95 backdrop-blur shadow-md' : 'bg-transparent'
    }\`}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <a href="#home" className="text-xl font-bold text-gray-900">
          BrandName
        </a>
        
        {/* Desktop menu */}
        <div className="hidden md:flex gap-6">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              {link.label}
            </a>
          ))}
          <button className="bg-blue-600 text-white px-4 py-1.5 rounded font-medium hover:bg-blue-700">
            Login
          </button>
        </div>
        
        {/* Hamburger button (mobile) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
      
      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-2 space-y-1">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                {link.label}
              </a>
            ))}
            <button className="w-full text-left py-2 text-blue-600 font-medium">
              Login
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
\`\`\`

**Poin penting:**
- **\`md:hidden\`** = hamburger button hanya tampil di mobile (<768px)
- **\`hidden md:flex\`** = desktop menu hanya tampil di >=768px
- **Close menu saat klik link** dengan \`onClick={() => setIsOpen(false)}\`
- **Close saat resize ke desktop** supaya state tidak nyangkut
- **Add background saat scroll** untuk readability (efek navbar transparent → solid)
- **aria-label** untuk accessibility (screen reader)

**Tanpa Tailwind (pakai CSS biasa):**
\`\`\`css
.hamburger { display: block; }
@media (min-width: 768px) {
  .hamburger { display: none; }
  .desktop-menu { display: flex; }
}
.desktop-menu { display: none; }
\`\`\``
  },
  {
    user: "Bikin carousel/slider image di React tanpa library",
    assistant: `\`\`\`tsx
// components/Carousel.tsx
import { useState, useEffect, useCallback } from 'react';

interface CarouselProps {
  images: { src: string; alt: string; caption?: string }[];
  autoPlay?: boolean;
  interval?: number; // ms
}

export function Carousel({ images, autoPlay = true, interval = 5000 }: CarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const next = useCallback(() => {
    setCurrent(c => (c + 1) % images.length);
  }, [images.length]);
  
  const prev = () => {
    setCurrent(c => (c - 1 + images.length) % images.length);
  };
  
  // Auto-play
  useEffect(() => {
    if (!autoPlay || isPaused) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [autoPlay, isPaused, interval, next]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [next]);
  
  if (images.length === 0) return null;
  
  return (
    <div
      className="relative w-full max-w-3xl mx-auto overflow-hidden rounded-lg"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: \`translateX(-\${current * 100}%)\` }}
      >
        {images.map((img, i) => (
          <div key={i} className="w-full flex-shrink-0 relative">
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-64 md:h-96 object-cover"
            />
            {img.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-4">
                {img.caption}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Prev button */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full"
        aria-label="Previous"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      {/* Next button */}
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full"
        aria-label="Next"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      
      {/* Dots indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={\`w-2 h-2 rounded-full transition-all \${
              i === current ? 'bg-white w-6' : 'bg-white/50'
            }\`}
            aria-label={\`Go to slide \${i + 1}\`}
          />
        ))}
      </div>
    </div>
  );
}
\`\`\`

**Pakai:**
\`\`\`tsx
<Carousel
  images={[
    { src: '/img1.jpg', alt: 'Slide 1', caption: 'Caption 1' },
    { src: '/img2.jpg', alt: 'Slide 2', caption: 'Caption 2' },
    { src: '/img3.jpg', alt: 'Slide 3' },
  ]}
  autoPlay
  interval={5000}
/>
\`\`\`

**Fitur:**
- **Auto-play** dengan pause on hover
- **Keyboard navigation** (arrow left/right)
- **Touch-friendly** buttons (mobile)
- **Dots indicator** untuk langsung loncat ke slide tertentu
- **Smooth transition** dengan CSS \`transition-transform\`
- **Accessibility**: aria-label untuk screen reader

**Tips untuk production:**
- Tambah \`loading="lazy"\` untuk image yang belum terlihat
- Pakai \`<picture>\` + srcset untuk responsive images
- Tambah swipe gesture untuk mobile (pakai \`onTouchStart\`/\`onTouchEnd\`)`
  },
  {
    user: "Bikin dark mode toggle di Next.js dengan Tailwind",
    assistant: `\`\`\`tsx
// components/ThemeToggle.tsx
'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  
  // Init theme dari localStorage atau system preference
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = stored || (systemDark ? 'dark' : 'light');
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);
  
  const toggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };
  
  // Hydration mismatch fix
  if (!mounted) {
    return <div className="w-9 h-9" />; // placeholder same size
  }
  
  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        // Sun icon
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        // Moon icon
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}
\`\`\`

**Layout (\`app/layout.tsx\`):**
\`\`\`tsx
// Tambah script untuk set theme SEBELUM React hydrate (cegah flash)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: \`
          (function() {
            const stored = localStorage.getItem('theme');
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (stored === 'dark' || (!stored && systemDark)) {
              document.documentElement.classList.add('dark');
            }
          })();
        \`}} />
      </head>
      <body className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}
\`\`\`

**\`tailwind.config.ts\`:**
\`\`\`typescript
import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class', // penting! pakai class strategy
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
\`\`\`

**Pakai di komponen:**
\`\`\`tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  <p className="text-gray-600 dark:text-gray-300">
    Ini teks yang adaptif theme
  </p>
</div>
\`\`\`

**Tips:**
- **\`suppressHydrationWarning\`** di <html> untuk hindari warning React karena class diubah oleh script
- **Script inline** di <head> mencegah flash of unstyled content (FOUC)
- **\`mounted\` state** untuk hindari hydration mismatch (server render light, client render dark)
- **System preference** sebagai fallback kalau user belum pilih`
  },
  {
    user: "Bikin modal/dialog di React dengan aksesibilitas",
    assistant: `\`\`\`tsx
// components/Modal.tsx
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  
  // Lock body scroll saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      previouslyFocused.current = document.activeElement as HTMLElement;
      // Focus pertama element di modal
      setTimeout(() => {
        dialogRef.current?.focus();
      }, 0);
    } else {
      document.body.style.overflow = '';
      // Restore focus ke element sebelumnya
      previouslyFocused.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // Close pada Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      // Trap focus di dalam modal
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0] as HTMLElement;
        const last = focusable[focusable.length - 1] as HTMLElement;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
  }[size];
  
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal content */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={\`relative bg-white rounded-lg shadow-xl w-full \${sizeClass} max-h-[90vh] overflow-hidden flex flex-col\`}
      >
        {title && (
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 id="modal-title" className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
\`\`\`

**Pakai:**
\`\`\`tsx
const [isOpen, setIsOpen] = useState(false);

<>
  <button onClick={() => setIsOpen(true)}>Buka Modal</button>
  <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Konfirmasi">
    <p>Apakah Anda yakin ingin menghapus item ini?</p>
    <div className="flex gap-2 mt-4 justify-end">
      <button onClick={() => setIsOpen(false)} className="px-4 py-2 text-gray-600">
        Batal
      </button>
      <button onClick={handleConfirm} className="px-4 py-2 bg-red-600 text-white rounded">
        Hapus
      </button>
    </div>
  </Modal>
</>
\`\`\`

**Fitur aksesibilitas:**
- **\`role="dialog"\`** + **\`aria-modal\`** untuk screen reader
- **Focus trap** — Tab key stay di dalam modal
- **Restore focus** ke element sebelumnya setelah close
- **Escape key** untuk close
- **Backdrop click** untuk close
- **Body scroll lock** saat modal terbuka
- **\`createPortal\`** untuk render di document.body (avoid z-index issue)

**Tanpa library**, modal ini lebih powerful daripada kebanyakan library modal populer.`
  },
  {
    user: "Tailwind vs CSS biasa, kapan pakai yang mana?",
    assistant: `Tergantung tim, project, dan preferensi. Tapi secara umum:

## Tailwind CSS — untuk project dynamic, fast-paced

**Kelebihan:**
- **No context switch** — styling langsung di JSX, tidak loncat ke file CSS
- **Design system konsisten** — spacing, color, typography built-in
- **Bundle kecil otomatis** — hanya class yang dipakai yang masuk bundle
- **Responsive mudah** — \`md:flex\`, \`lg:grid-cols-3\` langsung jalan
- **Dark mode trivial** — \`dark:bg-gray-900\`
- **Refactor aman** — hapus class di JSX = hapus style, tidak ada CSS orphan

**Kekurangan:**
- **HTML jadi panjang** — \`className="flex items-center gap-4 px-6 py-4 bg-blue-600 hover:bg-blue-700"\`
- **Learning curve** — harus hafal nama class Tailwind
- **Sulit untuk styling dinamis kompleks** — kalau butuh banyak kondisi, CSS biasa lebih bersih
- **Tidak cocok untuk tim yang baru** — perlu setup + training

## CSS biasa (CSS Modules / styled-components) — untuk project complex

**Kelebihan:**
- **HTML bersih** — \`<button className="btn-primary">Submit</button>\`
- **Styling dinamis mudah** — pakai variabel, fungsi, props
- **Reuse pattern** — bisa bikin utility classes sendiri
- **Tidak perlu build tooling khusus**

**Kekurangan:**
- **Context switch** — loncat antara JSX dan CSS file
- **Bundle tidak optimal** — sulit tree-shake CSS
- **Naming** — harus pikir nama class (BEM, atomic, dll)
- **Responsive** — harus tulis media query manual

## Saran berdasarkan use case

| Use case | Rekomendasi |
|----------|-------------|
| Startup / MVP | **Tailwind** — dev speed penting |
| Design system matang | **CSS Modules** — kontrol penuh |
| Tim kecil / solo dev | **Tailwind** — produktif |
| Tim besar | **CSS Modules + design tokens** — konsistensi |
| Library komponen | **CSS Modules** — consumer bisa override |
| Blog / static site | **CSS biasa** — simple, no build |
| Enterprise app besar | **CSS Modules + Tailwind utility** — hybrid |

## Hybrid approach (paling umum di production)

\`\`\`tsx
// Pakai CSS Module untuk komponen yang complex
import styles from './Button.module.css';

export function Button({ variant, children }) {
  return (
    <button className={\`\${styles.btn} \${styles[variant]}\`}>
      {children}
    </button>
  );
}

// + Tailwind untuk layout & spacing di page level
<div className="flex items-center gap-4 px-6 py-8 max-w-4xl mx-auto">
  <Button variant="primary">Save</Button>
</div>
\`\`\`

## Aturan praktis

1. **Kalau ragu, pakai Tailwind** — lebih produktif untuk 80% kasus
2. **Pisahkan ke CSS Module kalau** class > 10 atau ada banyak conditional
3. **Jangan campur** dalam 1 komponen — pilih salah satu approach
4. **Pakai \`cva\` (class-variance-authority)** kalau Tailwind bikin className kepanjangan:
   \`\`\`tsx
   const button = cva('px-4 py-2 rounded font-medium', {
     variants: {
       variant: {
         primary: 'bg-blue-600 text-white hover:bg-blue-700',
         secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
       },
       size: { sm: 'text-sm', lg: 'text-lg px-6 py-3' }
     }
   });
   \`\`\``
  },
  {
    user: "Cara deploy Next.js ke Vercel",
    assistant: `Vercel adalah creator Next.js, jadi deploy ke sana paling gampang dan optimal.

## Cara 1: via GitHub (recommended, auto-deploy)

1. **Push code ke GitHub**
2. Buka **https://vercel.com** → login dengan GitHub
3. Klik **"Add New Project"**
4. Pilih repo Anda
5. Vercel auto-detect Next.js, tinggal klik **"Deploy"**
6. Tunggu 1-2 menit, langsung live di \`https://<project>.vercel.app\`

Setiap push ke \`main\` branch → auto-deploy ke production.
Setiap PR → preview deployment otomatis.

## Cara 2: via Vercel CLI

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy dari folder project
vercel

# Untuk production deploy
vercel --prod
\`\`\`

## Setup Environment Variables

### Via Dashboard
1. Project Settings → Environment Variables
2. Add variable, pilih environment (Production / Preview / Development)
3. Redeploy untuk apply

### Via CLI
\`\`\`bash
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
\`\`\`

### Via \`vercel.json\` (jangan commit secrets!)
\`\`\`json
{
  "build": {
    "env": {
      "NEXT_PUBLIC_API_URL": "https://api.example.com"
    }
  }
}
\`\`\`

## Custom Domain

1. Project Settings → Domains
2. Add domain: \`myapp.com\`
3. Vercel kasih DNS records, tambahkan ke registrar
4. SSL otomatis (Let's Encrypt)

## Database Options

Vercel tidak punya database bawaan, tapi integrasi mudah:
- **Vercel Postgres** (Neon) — PostgreSQL serverless
- **Vercel KV** (Upstash) — Redis compatible
- **Vercel Blob** — file storage (S3-like)
- **PlanetScale** — MySQL serverless
- **Supabase** — PostgreSQL + Auth + Storage

\`\`\`bash
# Bikin Vercel Postgres
vercel postgres create mydb

# Pakai di Next.js
import { sql } from '@vercel/postgres';
const { rows } = await sql\`SELECT * FROM users WHERE id = \${userId}\`;
\`\`\`

## Optimasi untuk Production

### \`next.config.js\`
\`\`\`javascript
const nextConfig = {
  // Output standalone untuk Vercel (otomatis)
  output: 'standalone',
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  
  // Compression
  compress: true,
  
  // Security headers
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    }];
  },
};
\`\`\`

## Edge Functions (optional)

Next.js Edge Runtime = deploy function ke edge network (200+ lokasi):

\`\`\`typescript
export const runtime = 'edge';

export default function handler(req: Request) {
  return new Response(JSON.stringify({ hello: 'world' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
\`\`\`

Edge = latency rendah (5-50ms), tapi terbatas (no Node.js API, no DB connection pooling).

## Monitoring

- **Vercel Analytics** — Web Vitals, traffic (free untuk hobby)
- **Vercel Speed Insights** — Core Web Vitals real user
- **Sentry** — error tracking
- **LogDrains** — kirim log ke Datadog / Logflare

## Pricing

- **Hobby** (gratis): 100GB bandwidth, 100GB-hours serverless, cukup untuk portfolio/blog kecil
- **Pro** ($20/bln): 1TB bandwidth, lebih banyak serverless, no commercial limit
- **Enterprise** ($150+/bln): SSO, SLA, dedicated support

## Alternatif Vercel

Kalau mau self-host atau avoid vendor lock-in:
- **Netlify** — mirip Vercel, free tier generous
- **Cloudflare Pages** — free unlimited bandwidth, lebih cepat global
- **Railway** — full backend support, database bawaan
- **Fly.io** — deploy ke multi-region, cocok untuk full-stack
- **Self-host**: VPS (DigitalOcean/Hetzner) + Docker + Nginx

**Saran:** Untuk Next.js project baru, mulai dengan Vercel. Simple, fast, integrasi mulus. Pindah kalau sudah butuh kontrol lebih atau cost naik.`
  },
  {
    user: "Bikin animasi loading skeleton di React",
    assistant: `\`\`\`tsx
// components/Skeleton.tsx
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={\`animate-pulse bg-gray-200 rounded \${className}\`} />
  );
}

// Pakai untuk card
export function CardSkeleton() {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <Skeleton className="h-40 w-full" /> {/* image */}
      <Skeleton className="h-4 w-3/4" /> {/* title */}
      <Skeleton className="h-3 w-full" /> {/* description */}
      <Skeleton className="h-3 w-5/6" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" /> {/* button */}
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

// Pakai untuk list
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3 p-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Pakai untuk table
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      <div className="grid gap-2" style={{ gridTemplateColumns: \`repeat(\${cols}, 1fr)\` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-8" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid gap-2" style={{ gridTemplateColumns: \`repeat(\${cols}, 1fr)\` }}>
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-6" />
          ))}
        </div>
      ))}
    </div>
  );
}
\`\`\`

**CSS untuk shimmer effect (lebih keren dari pulse):**
\`\`\`css
/* globals.css */
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.skeleton-shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 1000px 100%;
  animation: shimmer 2s infinite linear;
}
\`\`\`

\`\`\`tsx
export function SkeletonShimmer({ className = '' }: { className?: string }) {
  return <div className={\`skeleton-shimmer rounded \${className}\`} />;
}
\`\`\`

**Pakai dengan React Suspense:**
\`\`\`tsx
import { Suspense } from 'react';

export function ProductsPage() {
  return (
    <div>
      <h1>Products</h1>
      <Suspense fallback={<ListSkeleton count={8} />}>
        <ProductList />
      </Suspense>
    </div>
  );
}

async function ProductList() {
  const products = await fetchProducts(); // async data fetch
  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
\`\`\`

**Tips:**
- **Skeleton harus match layout** real content — supaya tidak layout shift (CLS)
- **Pakai shimmer** untuk terlihat lebih premium dari pulse biasa
- **Stagger animation** (delay per item) untuk efek lebih natural
- **Jangan terlalu cepat** — kalau data load dalam 200ms, skip skeleton (cuma bikin flicker)
- **Pakai \`min-h\`** supaya skeleton tidak collapse saat content kosong

**Tanpa Tailwind:**
\`\`\`css
.skeleton {
  background: #e5e7eb;
  border-radius: 4px;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
\`\`\``
  },
  {
    user: "Cara bikin infinite scroll di React",
    assistant: `\`\`\`tsx
// hooks/useInfiniteScroll.ts
import { useEffect, useRef, useState, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  fetchMore: (page: number) => Promise<{ data: any[]; hasMore: boolean }>;
  threshold?: number; // px dari bottom untuk trigger
  initialPage?: number;
}

export function useInfiniteScroll({ fetchMore, threshold = 100, initialPage = 1 }: UseInfiniteScrollOptions) {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMore(page);
      setData(prev => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage(p => p + 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchMore, page, loading, hasMore]);
  
  // IntersectionObserver untuk trigger
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: \`\${threshold}px\` }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loading, threshold]);
  
  return { data, loading, error, hasMore, sentinelRef, loadMore };
}
\`\`\`

**Pakai:**
\`\`\`tsx
function PostList() {
  const { data: posts, loading, hasMore, sentinelRef, error } = useInfiniteScroll({
    fetchMore: async (page) => {
      const res = await fetch(\`/api/posts?page=\${page}\`);
      const json = await res.json();
      return { data: json.posts, hasMore: json.hasMore };
    },
    threshold: 200,
  });
  
  return (
    <div>
      {posts.map(post => (
        <article key={post.id} className="p-4 border-b">
          <h3>{post.title}</h3>
          <p>{post.excerpt}</p>
        </article>
      ))}
      
      {/* Sentinel element - trigger load saat terlihat */}
      <div ref={sentinelRef} className="h-4" />
      
      {loading && <div className="p-4 text-center">Loading...</div>}
      {error && <div className="p-4 text-red-500">Error: {error}</div>}
      {!hasMore && <div className="p-4 text-center text-gray-500">Sudah semua ✨</div>}
    </div>
  );
}
\`\`\`

**Tips:**
- **IntersectionObserver** lebih efisien dari scroll event (no layout thrashing)
- **\`rootMargin\`** = preload sebelum user benar-benar sampai bottom
- **Debounce kalau pakai scroll event**: jangan trigger lebih dari 1x per 200ms
- **Cancel request** kalau user scroll cepat: pakai AbortController
- **Empty state**: tampilkan sesuatu kalau \`data.length === 0\` dan tidak loading
- **Error recovery**: tombol "Coba lagi" kalau error

**Virtual scrolling untuk list panjang (>1000 items):**
\`\`\`tsx
// Hanya render items yang terlihat di viewport
import { useVirtualizer } from '@tanstack/react-virtual';

function BigList({ items }) {
  const parentRef = useRef(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} style={{ height: 600, overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(item => (
          <div
            key={item.key}
            style={{
              position: 'absolute',
              top: item.start,
              height: item.size,
            }}
          >
            {items[item.index].title}
          </div>
        ))}
      </div>
    </div>
  );
}
\`\`\`

Virtual scroll = render hanya 5-10 items yang terlihat, bukan 1000. Hemat memory & cepat.`
  },
];

// Write to file
const outputPath = path.join(__dirname, '..', 'data', 'conversations_source.json');
fs.writeFileSync(outputPath, JSON.stringify(conversations, null, 2), 'utf-8');

console.log(`OK Generated: ${outputPath}`);
console.log(`   Total conversations: ${conversations.length}`);
console.log(`   File size: ${fs.statSync(outputPath).size} bytes`);
