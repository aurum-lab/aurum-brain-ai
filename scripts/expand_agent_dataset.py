#!/usr/bin/env python3
"""
Expand dataset Aurum Brain AI dengan multi-domain knowledge + AGENT AI capabilities.

Kategori baru:
1. Agent AI - function calling, tool use, autonomous task
2. Multi-domain - science, business, health, finance, legal, creative
3. Reasoning - step-by-step problem solving
4. Code execution - simulating tool calls
5. Real-world scenarios - practical use cases
"""

import json
import random
from datetime import datetime
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
SOURCE_FILE = DATA_DIR / "conversations_source.json"
EXPANSION_LOG = DATA_DIR / "expansion_log.json"

# === AGENT AI - Function Calling & Tool Use ===
AGENT_CONVERSATIONS = [
    {
        "user": "Kamu bisa apa sebagai agent AI?",
        "assistant": """Saya sebagai **Agent AI** bisa melakukan task autonomous dengan tool use:

## Kapabilitas Agent

**1. Function Calling (Tool Use)**
- Web search untuk info real-time
- Calculator untuk operasi matematika
- Code execution (Python, JS)
- File operations (read, write, list)
- API calls ke service external
- Database queries
- Time/date operations

**2. Multi-step Reasoning**
- Pecah task kompleks jadi sub-tasks
- Execute step-by-step dengan verification
- Adaptif kalau ada error

**3. Autonomous Decision Making**
- Pilih tool yang tepat untuk task
- Combine multiple tools untuk hasil complex
- Self-correction saat gagal

**4. Context Awareness**
- Ingat context dari conversation
- Maintain state antar tool calls
- Return structured output

## Contoh Skenario

**User:** "Cari harga emas hari ini, bandingkan dengan minggu lalu, kasih rekomendasi"

**Agent akan:**
1. Call `web_search("harga emas hari ini XAU/USD")`
2. Call `web_search("harga emas minggu lalu")`
3. Call `calculator(compare, current, last_week)` → diff percentage
4. Reasoning: "Harga naik 2.3%, momentum bullish"
5. Return: "Harga XAU/USD hari ini $2400, naik 2.3% dari minggu lalu. Rekomendasi: watch for resistance di $2420"

Mau coba kasih task autonomous ke saya?"""
    },
    {
        "user": "Jelasin function calling di LLM",
        "assistant": """**Function Calling** = kemampuan LLM untuk "memanggil function" external saat menjawab.

## Cara Kerja

```
User: "Berapa cuaca di Jakarta sekarang?"
  ↓
LLM: detect butuh real-time data
  ↓
LLM: return function call → get_weather(city="Jakarta")
  ↓
System: execute get_weather("Jakarta") → return {temp: 30, condition: "sunny"}
  ↓
LLM: "Cuaca Jakarta sekarang: 30°C, cerah"
```

## Format OpenAI Function Calling

```json
{
  "model": "gpt-4",
  "messages": [{"role": "user", "content": "Cuaca Jakarta?"}],
  "tools": [{
    "type": "function",
    "function": {
      "name": "get_weather",
      "description": "Get current weather for a city",
      "parameters": {
        "type": "object",
        "properties": {
          "city": {"type": "string", "description": "City name"}
        },
        "required": ["city"]
      }
    }
  }]
}
```

## Response LLM

```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "tool_calls": [{
        "id": "call_abc123",
        "type": "function",
        "function": {
          "name": "get_weather",
          "arguments": "{\\"city\\": \\"Jakarta\\"}"
        }
      }]
    }
  }]
}
```

## Implementasi di Cloudflare Workers AI

Workers AI support function calling dengan model yang compatible (Llama 3.1+). Worker bisa:
1. Receive request dengan `tools` parameter
2. Forward ke Workers AI
3. Parse tool_calls dari response
4. Execute function lokal (web search, calculator, dll)
5. Send result kembali ke LLM untuk final response

Ini bikin AI jadi **agent autonomous** yang bisa action, bukan cuma chat."""
    },
    {
        "user": "Bikin agent AI yang bisa search web dan summarize",
        "assistant": """Berikut arsitektur **Web Search Agent** dengan Cloudflare Worker:

## Arsitektur

```
User → Cloudflare Worker → Workers AI (decide tool)
                          ↓
                          Tool: web_search("query")
                          ↓
                          Worker: fetch search results
                          ↓
                          Workers AI: summarize results
                          ↓
                          Final response ke user
```

## Worker Code (TypeScript)

```typescript
// tools yang available
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the web for current information',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'fetch_url',
      description: 'Fetch content from a URL',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to fetch' }
        },
        required: ['url']
      }
    }
  }
];

// Handler untuk tool calls
async function executeTool(name: string, args: any) {
  switch (name) {
    case 'web_search':
      // Pakai DuckDuckGo atau Brave Search API
      const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(args.query)}&format=json`);
      return await res.json();
    
    case 'fetch_url':
      const pageRes = await fetch(args.url);
      return await pageRes.text();
    
    default:
      return { error: 'Unknown tool' };
  }
}

// Main handler
export default {
  async fetch(request, env) {
    const { messages } = await request.json();
    
    // Step 1: Kirim ke LLM dengan tools
    let response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages,
      tools: TOOLS,
    });
    
    // Step 2: Kalau LLM mau call tool, execute
    while (response.tool_calls?.length > 0) {
      for (const toolCall of response.tool_calls) {
        const result = await executeTool(
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments)
        );
        // Tambah result ke messages
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
      // Kirim lagi ke LLM dengan result
      response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages,
        tools: TOOLS,
      });
    }
    
    return Response.json(response);
  }
};
```

## Limitations

- Cloudflare Workers AI function calling masih beta
- Free tier: 10k neurons/day (cukup untuk testing)
- Untuk production, pakai OpenAI/Anthropic API (lebih mature)

Tapi konsepnya sama — Anda bisa extend dengan tools lain seperti:
- `calculator` - untuk operasi matematika
- `code_execute` - run Python/JS code
- `database_query` - query SQL
- `file_read/write` - file operations
- `send_email` - email automation
- `api_call` - HTTP request ke service apapun"""
    },
    {
        "user": "Apa beda AI biasa dengan AI agent?",
        "assistant": """**AI Biasa** vs **AI Agent** — perbedaan fundamental:

## AI Biasa (Chatbot)

**Karakteristik:**
- Hanya menerima text input → return text output
- Tidak bisa ambil action di dunia nyata
- Tidak ada akses ke tools external
- Stateless (lupa context setelah response)

**Contoh:** ChatGPT versi awal, model LLM standalone

```
User: "Berapa 2+2?"
AI: "4"
```

## AI Agent (Autonomous)

**Karakteristik:**
- Bisa **call tools/functions** untuk ambil action
- **Multi-step reasoning** — pecah task kompleks
- **Maintain state** antar tool calls
- **Decision making** — pilih tool yang tepat
- **Self-correction** — adaptif saat error
- **Goal-oriented** — kerja sampai goal tercapai

**Contoh:** AutoGPT, BabyAGI, Claude with tools, ChatGPT Plugins

```
User: "Bantu saya riset kompetitor bisnis kopi"
Agent:
  → search("kopi shop Jakarta 2025") → dapat 10 kompetitor
  → fetch_url(kompetitor1.com) → extract menu & harga
  → fetch_url(kompetitor2.com) → extract menu & harga
  → analyze("bandingkan pricing strategy")
  → write_report("competitor_analysis.md")
  → return: "Selesai! Saya bikin laporan di competitor_analysis.md"
```

## Tabel Perbandingan

| Aspek | AI Biasa | AI Agent |
|-------|----------|----------|
| Input | Text | Text + multimodal |
| Output | Text | Text + actions |
| Tools | Tidak | Ya (function calling) |
| Multi-step | Tidak | Ya (planning + execution) |
| State | Stateless | Stateful |
| Decision | Reactive | Proactive |
| Autonomy | Manual | Autonomous |
| Memory | Session only | Long-term (vector DB) |

## Komponen Agent AI

1. **LLM Core** — brain untuk reasoning (Llama 3.3 70B)
2. **Tools** — capabilities (search, code, API)
3. **Memory** — short-term (context) + long-term (vector DB)
4. **Planning** — break task jadi steps
5. **Execution** — run tools, verify results
6. **Reflection** — self-evaluate, retry if failed

## Framework Agent AI Populer

- **LangChain** — Python framework untuk LLM apps
- **LlamaIndex** — RAG + agent framework
- **CrewAI** — multi-agent collaboration
- **AutoGPT** — autonomous agent
- **OpenAI Assistants API** — hosted agent

Saya sebagai Aurum Brain AI bisa jadi agent dengan function calling via Cloudflare Workers AI. Mau lihat contoh implementasi?"""
    },
    {
        "user": "Bikin contoh agent AI untuk automate task harian",
        "assistant": """Berikut contoh **Daily Task Automation Agent**:

## Skenario
Setiap pagi, agent akan:
1. Cek email baru
2. Summarize email penting
3. Cek calendar hari ini
4. Cek harga saham/crypto yang di-monitor
5. Cek cuaca
6. Bikin summary report

## Implementasi (Cloudflare Worker + Cron)

```typescript
// worker.ts - Cron trigger setiap pagi 7:00 WIB
export default {
  async scheduled(event, env, ctx) {
    const agent = new DailyAgent(env);
    await agent.run();
  },
};

class DailyAgent {
  constructor(env) {
    this.env = env;
    this.tools = [
      { name: 'check_email', fn: this.checkEmail.bind(this) },
      { name: 'check_calendar', fn: this.checkCalendar.bind(this) },
      { name: 'get_stock_price', fn: this.getStock.bind(this) },
      { name: 'get_weather', fn: this.getWeather.bind(this) },
      { name: 'send_telegram', fn: this.sendTelegram.bind(this) },
    ];
  }

  async run() {
    const tasks = [
      { tool: 'check_email', args: { folder: 'inbox', since: '24h' } },
      { tool: 'check_calendar', args: { date: 'today' } },
      { tool: 'get_stock_price', args: { symbols: ['BBCA.JK', 'BTC-USD'] } },
      { tool: 'get_weather', args: { city: 'Jakarta' } },
    ];

    // Execute semua tasks parallel
    const results = await Promise.all(
      tasks.map(t => this.executeTool(t.tool, t.args))
    );

    // Summarize dengan AI
    const summary = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        {
          role: 'system',
          content: 'Summarize daily report dalam Bahasa Indonesia, format markdown, singkat dan actionable.'
        },
        {
          role: 'user',
          content: JSON.stringify({
            emails: results[0],
            calendar: results[1],
            stocks: results[2],
            weather: results[3],
          })
        }
      ]
    });

    // Kirim ke Telegram
    await this.sendTelegram(summary.response);
  }

  async checkEmail(args) {
    // Pakai Gmail API atau IMAP
    // ... implementation
  }

  async sendTelegram(message) {
    const botToken = this.env.TELEGRAM_BOT_TOKEN;
    const chatId = this.env.TELEGRAM_CHAT_ID;
    
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
  }
}
```

## Setup Cron di wrangler.toml

```toml
[triggers]
crons = ["0 0 * * *"]  # Setiap hari 00:00 UTC = 07:00 WIB

[vars]
TELEGRAM_CHAT_ID = "your_chat_id"

# Secrets (set via wrangler secret put)
# TELEGRAM_BOT_TOKEN
# GMAIL_CLIENT_ID
# GMAIL_CLIENT_SECRET
```

## Tools yang Bisa Ditambah

- **Email** - Gmail API, send/read/filter
- **Calendar** - Google Calendar API
- **Telegram/WhatsApp** - kirim pesan otomatis
- **Notion** - update database, create pages
- **Slack** - post messages
- **GitHub** - create issues, PRs
- **Database** - query SQL/NoSQL
- **Webhook** - trigger service lain
- **RSS** - monitor blog/news
- **File storage** - S3, Google Drive

## Use Cases

1. **Morning briefing** - summary email + calendar + news
2. **Stock monitor** - alert kalau harga naik/turun >5%
3. **Social media auto-post** - schedule content
4. **Backup automation** - backup database harian
5. **Report generator** - bikin laporan dari data
6. **Customer support** - auto-reply email support
7. **Content curation** - kumpulkan artikel topik tertentu

Mau saya bikin agent untuk use case spesifik Anda?"""
    },
]

# === MULTI-DOMAIN KNOWLEDGE ===
MULTI_DOMAIN_CONVERSATIONS = [
    # Science
    {
        "user": "Jelasin teori relativitas Einstein dengan simpel",
        "assistant": """**Teori Relativitas Einstein** = 2 teori: Khusus (1905) + Umum (1915)

## Relativitas Khusus (1905)

**Premis:**
1. Kecepatan cahaya selalu sama untuk semua observer (c = 300.000 km/s)
2. Hukum fisika sama di semua frame referensi inertial

**Konsekuensi:**
- **Dilasi waktu** - waktu melambat saat mendekati kecepatan cahaya
- **Kontraksi panjang** - objek memendek saat bergerak cepat
- **E = mc²** - massa dan energi ekuivalen

**Analogi:** Bayangkan naik kereta cepat. Untuk Anda di dalam, semua normal. Untuk orang di luar yang melihat, jam Anda berjalan lambat dan tubuh Anda terlihat lebih pendek.

## Relativitas Umum (1915)

**Konsep:** Gravitasi bukan gaya, tapi kelengkungan ruang-waktu

**Analogi:** Bayangkan kain kasa yang ditarik. Taruh bola bowling di tengah → kain melengkung. Gulirkan kelereng ke dekatnya → kelereng akan bergerak ke arah bola (gravitasi).

**Bukti:**
- GPS butuh koreksi relativitas (kalau tidak, error 10km/hari)
- Black hole - gravitasi sangat kuat sampai cahaya tidak bisa lolos
- Lensa gravitasi - cahaya dibelokkan massa besar
- Gelombang gravitasi - terdeteksi 2015 (LIGO)

## Aplikasi Modern

- **GPS** - koreksi dilasi waktu
- **PET scan** - antimatter dari E=mc²
- **Accelerator partikel** - partikel mendekati cahaya
- **Nuclear energy** - konversi massa ke energi

Einstein dapat Nobel 1921 bukan karena relativitas, tapi karena penjelasan efek fotolistrik (kontribusi ke quantum mechanics)."""
    },
    # Business
    {
        "user": "Bedanya startup dan small business apa?",
        "assistant": """**Startup** vs **Small Business** - perbedaan mindset dan growth model:

## Small Business (Bisnis Kecil)

**Karakteristik:**
- Goal: profit stabil dan berkelanjutan
- Growth: linear, bertahap
- Pendanaan: modal sendiri / bank loan
- Exit: jalan terus, wariskan ke anak
- Risk: lebih rendah

**Contoh:** Warung, toko kelontong, restoran, jasa service, konsultan solo

**Mindset:** "Bangun bisnis yang profitable dari hari 1, jaga cash flow."

## Startup

**Karakteristik:**
- Goal: growth super cepat, scale global
- Growth: eksponensial (2x, 10x, 100x)
- Pendanaan: VC, angel investor (jutaan dollar)
- Exit: IPO atau akuisisi (exit bagus = $1B+)
- Risk: sangat tinggi (90% gagal)

**Contoh:** Gojek, Tokopedia, Traveloka, Grab, Uber, Airbnb

**Mindset:** "Bakar duit dulu untuk dapet user, scale dulu profit belakangan."

## Tabel Perbandingan

| Aspek | Small Business | Startup |
|-------|----------------|---------|
| Goal | Profit stabil | Growth cepat |
| Growth | Linear (10-50%/tahun) | Eksponensial (100-1000%/tahun) |
| Market | Lokal | Global/Nasional |
| Pendanaan | Modal sendiri/Bank | VC/Angel |
| Tim | 1-10 orang | 10-1000+ |
| Exit | Jalan terus | IPO/Akuisisi |
| Failure rate | 20-30% | 90% |
| Valuation | Berdasarkan profit | Berdasarkan growth/potential |

## Contoh Numerik

**Small Business (Restoran):**
- Modal: Rp 200jt
- Year 1 revenue: Rp 600jt, profit Rp 100jt
- Year 5 revenue: Rp 1.5M (grow 25%/tahun)
- Exit value: Rp 500jt-1M (berdasarkan profit)

**Startup (SaaS):**
- Modal: Rp 10M (VC funding)
- Year 1 revenue: Rp 200jt (burn Rp 500jt)
- Year 5 revenue: Rp 50M (grow 200%/tahun)
- Exit value: Rp 200M-1B (berdasarkan revenue multiple)

## Kapan Pilih Apa?

**Pilih Small Business kalau:**
- Mau profit dari hari 1
- Tidak suka risk tinggi
- Family-oriented
- Market lokal spesifik
- Tidak butuh scale global

**Pilih Startup kalau:**
- Mau scale besar cepat
- Comfortable dengan risk (90% gagal)
- Punya akses ke VC funding
- Solusi problem global
- Tim strong dengan track record

**Hybrid:** Banyak bisnis mulai sebagai small business, lalu pivot jadi startup kalau nemu product-market fit. Contoh: Bukalapak mulai dari toko online kecil."""
    },
    # Health
    {
        "user": "Tips jaga kesehatan untuk programmer yang duduk seharian",
        "assistant": """**Tips Kesehatan untuk Programmer** - karena duduk 8-12 jam/hari berisiko:

## Risikonya

- **Back pain** - postur buruk, herniated disc
- **Neck strain** - "tech neck" dari lihat monitor
- **RSI** (Repetitive Strain Injury) - carpal tunnel syndrome
- **Eye strain** - blue light, fokus terus
- **Obesity** - kalori tidak terbakar
- **Cardiovascular** - duduk = new smoking
- **Mental health** - stress, burnout, isolasi

## 10 Tips Praktis

### 1. Atur Ergonomi Workspace
- **Monitor:** setingkat mata, jarak 50-70cm
- **Keyboard:** pergelangan tangan lurus, tidak naik/turun
- **Kursi:** lumbar support, kaki flat di lantai
- **Lampu:** cukup terang, hindari silau

### 2. Rule 20-20-20 (Mata)
Setiap 20 menit:
- Lihat objek 20 kaki (6 meter) jauhnya
- Selama 20 detik
- Mengurangi eye strain 50%+

### 3. Microbreak Setiap Jam
- Berdiri 5 menit setiap 1 jam
- Stretch leher, bahu, pergelangan
- Apps: Time Out (Mac), Workrave (Windows), Stretchly (cross-platform)

### 4. Hydrate
- Minum 2-3 liter air/hari
- Botol air di meja = reminder visual
- Kurangi kopi (>4 cangki/hari = anxiety, insomnia)

### 5. Exercise Minimum
- **150 menit/minggu** kardio (jalan cepat, lari, sepeda)
- **2x/minggu** strength training (cukup bodyweight: push-up, squat, plank)
- Gym optional, yang penting konsisten

### 6. Postur Checklist
```
✅ Telinga sejajar bahu (tidak maju)
✅ Bahu rileks, tidak naik
✅ Punggung menyentuh backrest
✅ Kaki flat di lantai (atau footrest)
✅ Siku 90 derajat saat ngetik
```

### 7. Stretching Harian (5 menit)
```
1. Neck roll - 5x kiri, 5x kanan
2. Shoulder shrug - 10x
3. Wrist circles - 10x masing-masing tangan
4. Chest opener - tangan di belakang, dada ke depan
5. Hip flexor stretch - 30 detik masing-masing kaki
6. Standing forward fold - 30 detik
```

### 8. Sleep Hygiene
- 7-9 jam/hari (non-negotiable)
- No screen 1 jam sebelum tidur
- Kamar gelap, dingin (18-20°C)
- Konsisten jam tidur (bahkan weekend)

### 9. Nutrition
- Sarapan (jangan skip)
- Protein cukup (1.2-1.6g/kg berat badan)
- Sayur + buah 5 porsi/hari
- Kurangi gula olahan (gula = energy crash)
- Limit kopi setelah jam 2 siang

### 10. Mental Health
- Social interaction (jangan isolasi)
- Hobby di luar coding
- Therapy kalau perlu (tidak ada salahnya)
- Vacation (ambil cuti, jangan stack)
- Limit overtime (40 jam/minggu ideal)

## Tools Bantu

- **Stand up desk** - alternate duduk/berdiri
- **Ergonomic chair** - investasi termahal tapi worth it
- **Mechanical keyboard** - lebih baik dari laptop keyboard
- **Trackball mouse** - kurangi gerakan pergelangan
- **Blue light glasses** - kalau banyak kerja malam
- **Apple Watch/Fitbit** - remind berdiri, track aktivitas

## Red Flags (Segera ke Dokter)

- Nyeri punggung yang tidak hilang >2 minggu
- Kesemutan/kebas di tangan persisten
- Sakit kepala berulang dengan pandangan kabur
- Sulit tidur >2 minggu
- Mood drop signifikan, tidak ada minat

Investasi kesehatan = investasi karir jangka panjang. Programmer sehat = produktivitas 2x."""
    },
    # Finance
    {
        "user": "Cara mulai investasi saham untuk pemula",
        "assistant": """**Panduan Investasi Saham untuk Pemula** (Indonesia):

## Prasyarat SEBELUM Investasi

1. **Emergency fund dulu** - 6-12 bulan pengeluaran di rekening terpisah
2. **Bebas hutang konsumtif** - kartu kredit, pinjaman online
3. **Asuransi** - jiwa + kesehatan (minimal BPJS)
4. **Paham dasar** - baca 1-2 buku, ikut kelas gratis

## Step-by-Step

### Step 1: Pilih Broker (Sekuritas)

**Broker Konvensional** (untuk pemula):
- **BCA Sekuritas** - integrate dengan BCA, mudah
- **Mandiri Sekuritas** - integrate dengan Mandiri
- **BNI Sekuritas** - integrate dengan BNI

**Broker Online** (lebih murah):
- **Stockbit** - UI bagus, fee rendah, education bagus
- **Ajaib** - mobile-first, cocok pemula
- **IPOT (Indo Premier)** - fitur lengkap
- **Mirae Asset** - research bagus

**Fee jual/beli:** 0.15% (beli) + 0.25% (jual) + pajak 0.1%

### Step 2: Buka Rekening Efek

Syarat:
- KTP
- NPWP
- Rekening bank
- Email + no HP
- e-KYC (video call / datang kantor)

Proses: 1-3 hari kerja

### Step 3: Setor Dana

- Transfer dari bank ke rekening efek
- Minimal: Rp 100rb - 1jt (tergantung broker)
- Recommended mulai: Rp 1-5jt (cukup diversifikasi)

### Step 4: Pilih Saham

**Untuk pemula, fokus blue chip stocks:**

**Bank (defensif, dividen):**
- BBCA (BCA) - paling stabil
- BBRI (BRI) - dividen tinggi
- BMRI (Mandiri)

**Consumer goods:**
- UNVR (Unilever)
- GGRM (Gudang Garam)
- ICBP (Indofood CBP)

**Telco:**
- TLKM (Telkom) - dividen tinggi
- ISAT (Indosat)

**Astra Group:**
- ASII (Astra International)

### Step 5: Strategi Buy

**Jangan market order (beli harga pasar), pakai limit order:**
- Tentukan harga target (misal: BBCA di Rp 8.500)
- Set limit buy di harga itu
- Tunggu sampai match

**Dollar Cost Averaging (DCA):**
- Beli rutin tiap bulan dengan nominal sama (misal Rp 1jt/bulan)
- Tidak peduli harga naik/turun
- Hasil: rata-rata harga beli stabil

### Step 6: Monitoring (Jangan Overtrade)

- Cek 1x/minggu (cukup)
- Jangan panic sell saat market turun
- Rebalance 1-2x/tahun

## Strategi Pemula

### 1. Value Investing (Warren Buffett style)
- Cari saham undervalued (P/E rendah, PBV <1.5)
- Hold jangka panjang (5-10 tahun)
- Tidak peduli fluktuasi harian

### 2. Dividend Investing
- Cari saham dividen yield tinggi (>4%)
- Cash flow pasif dari dividen
- Reinvest dividen (compound interest)

### 3. Index Fund / ETF
- Beli reksa dana indeks (BIB, KIIDR)
- Auto diversifikasi 30+ saham
- Cocok untuk yang tidak mau riset

## Yang Harus Dihindari

- **Day trading** (scalping) - 90% trader rugi
- **Margin trading** (hutang untuk beli saham) - bisa bangkrut
- **FOMO buy** saham yang sudah naik tinggi
- **Panic sell** saat market crash
- **Listen rumor** / "saham gorengan"
- **Pakai duit pinjaman** untuk investasi

## Tax

- **Dividen:** 10% (auto dipotong)
- **Capital gain:** 0.1% (saat jual, auto dipotong)
- **Tidak perlu lapor sendiri** kalau via broker resmi

## Resources Belajar

**Gratis:**
- Stockbit Academy (YouTube)
- Bareh Saham (YouTube)
- Investnesia.com
- SahamOK.com
- Buku: "Smart Guide Investasi Saham" oleh Arief Suherlan

**Berbayar:**
- TICMI (The Indonesian Capital Market Institute) - sertifikasi
- Class: stockbit, blink, ruangguru

## Checklist Pemula

```
☐ Emergency fund 6-12 bulan ✓
☐ Bebas hutang konsumtif ✓
☐ Buka rekening efek ✓
☐ Setor Rp 1-5jt ✓
☐ Beli 2-3 blue chip stocks ✓
☐ Hold minimum 1 tahun ✓
☐ Cek 1x/minggu, tidak overtrade ✓
```

**Disclaimer:** Ini edukasi umum, bukan saran investasi. Saham berisiko, nilai bisa turun. Hanya investasikan uang yang siap hilang."""
    },
    # Creative Writing
    {
        "user": "Bikin prompt untuk AI image generator yang bagus",
        "assistant": """**Struktur Prompt AI Image Generator** yang bagus (Midjourney, DALL-E, Stable Diffusion):

## Formula Universal

```
[Subject] + [Action/Pose] + [Style] + [Lighting] + [Composition] + [Mood] + [Technical Specs]
```

## Contoh Implementasi

### Portrait Photography
```
A 25-year-old Indonesian woman with long black hair, 
wearing traditional batik dress, 
smiling warmly at camera, 
golden hour lighting, 
shot on 85mm lens f/1.4, 
shallow depth of field, 
bokeh background of rice terrace, 
professional portrait photography, 
8k, hyperrealistic, 
mood: serene and confident
```

### Fantasy Art
```
Ancient dragon perched on mountain peak, 
spreading massive wings, 
breathing blue fire, 
dramatic stormy sky with lightning, 
epic fantasy art style, 
oil painting technique, 
Rembrandt lighting, 
ultra detailed scales, 
cinematic composition, 
mood: powerful and majestic, 
8k, ArtStation trending
```

### Product Photography
```
Minimalist ceramic coffee mug, 
matte black finish, 
on white marble surface, 
soft diffused lighting from left, 
clean white background, 
product photography, 
commercial shot, 
50mm lens, f/8 for sharp focus, 
mood: elegant and premium
```

### Cyberpunk Scene
```
Neon-lit cyberpunk street in Tokyo 2099, 
flying cars overhead, 
holographic billboards in Japanese, 
rain reflecting on wet asphalt, 
lone figure in trench coat walking away, 
Blade Runner aesthetic, 
cyan and magenta color palette, 
cinematic wide shot, 
mood: dystopian and atmospheric
```

## Keywords yang Ampuh

### Quality Boosters
- `8k`, `4k`, `ultra HD`, `hyperrealistic`
- `highly detailed`, `intricate details`
- `professional photography`, `award-winning`
- `trending on ArtStation`, `by Greg Rutkowski` (untuk Stable Diffusion)

### Style Modifiers
- `oil painting`, `watercolor`, `pencil sketch`
- `anime style`, `Studio Ghibli`, `Pixar 3D`
- `cyberpunk`, `steampunk`, `vaporwave`
- `minimalist`, `art deco`, `bauhaus`
- `photorealistic`, `cinematic`, `documentary`

### Lighting
- `golden hour` (sunset/sunrise)
- `blue hour` (twilight)
- `Rembrandt lighting` (dramatic)
- `soft diffused light` (portrait)
- `harsh shadows` (dramatic)
- `neon glow` (cyberpunk)
- `backlit` (silhouette)

### Composition
- `close-up`, `medium shot`, `wide shot`
- `bird's eye view`, `worm's eye view`
- `rule of thirds`, `centered composition`
- `symmetrical`, `asymmetrical`
- `leading lines`, `framing`

### Camera/Lens (untuk photorealistic)
- `shot on 85mm f/1.4` (portrait)
- `shot on 24mm f/2.8` (wide landscape)
- `shot on 50mm f/1.8` (standard)
- `drone shot`, `aerial photography`
- `macro lens` (close-up detail)

## Tips Tambahan

### 1. Negative Prompt (Stable Diffusion)
Tell AI what NOT to include:
```
Negative: blurry, low quality, distorted, extra fingers, deformed, watermark, text, signature
```

### 2. Aspect Ratio
- `--ar 16:9` (landscape, desktop wallpaper)
- `--ar 9:16` (portrait, phone wallpaper)
- `--ar 1:1` (square, Instagram)
- `--ar 21:9` (ultrawide, cinematic)

### 3. Reference Artists
```
"in the style of [artist name]"
```
- Greg Rutkowski (fantasy)
- Wes Anderson (symmetric, pastel)
- Hayao Miyazaki (anime, nature)
- Annie Leibovitz (portrait)

### 4. Weight/Emphasis
- `(keyword:1.5)` - lebih penting
- `(keyword:0.5)` - kurang penting
- `((keyword))` - double emphasis

### 5. Iterative Refinement
Mulai simple, lalu refine:
```
v1: "dragon on mountain"
v2: "ancient dragon perched on mountain peak, spreading wings"
v3: "ancient dragon perched on mountain peak, spreading massive wings, breathing blue fire, dramatic sky, fantasy art, 8k"
```

## Tools

- **Midjourney** - Discord bot, bayar $10-60/bln
- **DALL-E 3** - via ChatGPT Plus atau Bing Image Creator (gratis)
- **Stable Diffusion** - open source, install lokal (gratis, butuh GPU)
- **Leonardo.ai** - free tier generous
- **Adobe Firefly** - integrate dengan Photoshop

**Generator Indonesia:**
- Bisa pakai Groq + Llama untuk generate prompt, lalu paste ke image generator

Mau saya bikin prompt spesifik untuk kebutuhan Anda (logo, ilustrasi buku, social media, dll)?"""
    },
    # Reasoning/Logic
    {
        "user": "Kerangka berpikir untuk problem solving",
        "assistant": """**Framework Problem Solving** yang dipakai consultant top (McKinsey, BCG):

## 1. Framework Utama: MECE + Pyramid Principle

### MECE (Mutually Exclusive, Collectively Exhaustive)
- Pecah problem jadi kategori yang **tidak overlap** (Mutually Exclusive)
- Dan **mencakup semua kemungkinan** (Collectively Exhaustive)

**Contoh:** Analisis kenapa sales turun
```
❌ Tidak MECE: "karena produk jelek, pelayanan buruk, kompetitor kuat"
   (terlalu vague, bisa overlap)

✅ MECE:
├── Internal Factors
│   ├── Product (quality, features, price)
│   ├── Marketing (awareness, conversion, retention)
│   └── Operations (supply, delivery, support)
└── External Factors
    ├── Competition (new entrants, pricing)
    ├── Market (demand shift, economic)
    └── Regulatory (new laws, restrictions)
```

### Pyramid Principle (Barbara Minto)
- Mulai dari **conclusion** dulu (top of pyramid)
- Lalu **3 supporting arguments**
- Tiap argument didukung **data/evidence**

```
            [CONCLUSION]
           /     |      \
      [ARG1]  [ARG2]  [ARG3]
       / \     / \     / \
     [D] [D] [D] [D] [D] [D]
```

## 2. Framework Spesifik per Problem

### Profitability Framework
```
Profit = Revenue - Cost

Revenue = Volume × Price
   ├── Volume: market size, share, retention
   └── Price: positioning, elasticity, competitor

Cost = Fixed + Variable
   ├── Fixed: rent, salary, equipment
   └── Variable: COGS, marketing, shipping
```

### 5 Whys (Root Cause Analysis)
Tanya "kenapa" 5x untuk sampai root cause:

```
Problem: User churn naik 20%
Why 1: Karena fitur baru bug
Why 2: Karena QA tidak test edge case
Why 3: Karena QA tidak punya test plan
Why 4: Karena tidak ada QA process formal
Why 5: Karena tidak ada QA training

Root cause: Tidak ada QA process + training
Solution: Implement QA process + training
```

### SWOT Analysis
```
┌─────────────────┬─────────────────┐
│   STRENGTHS     │   WEAKNESSES    │
│ (internal +)    │ (internal -)    │
├─────────────────┼─────────────────┤
│  OPPORTUNITIES  │     THREATS     │
│ (external +)    │ (external -)    │
└─────────────────┴─────────────────┘
```

### Porter's 5 Forces (Industry Analysis)
1. **Threat of new entrants** - barrier to entry
2. **Bargaining power of suppliers** - supplier concentration
3. **Bargaining power of buyers** - buyer concentration
4. **Threat of substitutes** - alternative products
5. **Competitive rivalry** - intensity of competition

### Jobs-to-be-Done (JTBD)
User tidak beli product, mereka "hire" product untuk job:
- "Hire" Gojek untuk job "sampai tujuan cepat"
- "Hire" Netflix untuk job "hiburan santai"
- "Hire" Notion untuk job "atur semua catatan"

Tanya: "What job user hire this product for?"

## 3. Process Problem Solving (McKinsey 7-Step)

```
1. Define Problem (specific, measurable)
   "Sales turun 20% di Q3 2025, target stabil 100M/bulan"

2. Structure Problem (MECE breakdown)
   - Internal vs External
   - Revenue vs Cost

3. Prioritize (80/20 - mana yang high impact)
   Focus: 3 hypothesis terbesar impactnya

4. Develop Hypotheses
   H1: Marketing budget dipangkas → awareness turun
   H2: Competitor launch produk serupa murah
   H3: Product quality turun (bug increase)

5. Conduct Analysis (data-driven)
   - Cek marketing spend vs sales
   - Research competitor moves
   - Analyze bug reports & churn survey

6. Synthesize Findings
   - H1: 50% kontribusi (marketing budget -30%, awareness -45%)
   - H2: 30% kontribusi (competitor grabbed 15% market share)
   - H3: 20% kontribusi (churn dari bug naik 8%)

7. Develop Recommendations
   - Restore marketing budget (Rp 50jt/bulan)
   - Launch loyalty program (fight competitor)
   - Fix top 5 bugs (quality improvement)
   - Expected: sales recover dalam 3 bulan
```

## 4. Decision Making Framework

### Decision Matrix (Weighted Scoring)
```
Option    | Cost (30%) | Speed (20%) | Quality (50%) | Total
---------|------------|-------------|---------------|------
Build A   | 8          | 5           | 9             | 7.9
Buy B     | 4          | 9           | 7             | 6.5
Partner C | 6          | 7           | 6             | 6.1
```

### Eisenhower Matrix
```
          URGENT        NOT URGENT
         ┌─────────────┬─────────────┐
IMPORTANT│  DO NOW     │  SCHEDULE   │
         │ (crisis,    │ (planning,  │
         │  deadline)  │  learning)  │
         ├─────────────┼─────────────┤
NOT      │  DELEGATE   │  ELIMINATE  │
IMPORTANT│ (interrupts,│ (time       │
         │  meetings)  │  wasters)   │
         └─────────────┴─────────────┘
```

### OODA Loop (untuk dynamic situations)
- **O**bserve - gather data
- **O**rient - analyze context
- **D**ecide - choose action
- **A**ct - execute
- Loop cepat = win (asal di militer, sekarang startup)

## 5. Mental Models

- **First Principles** - pecah ke truth fundamental (Elon Musk style)
- **Inversion** - "bagaimana agar pasti gagal?" lalu avoid itu
- **Second-order thinking** - "lalu apa yang terjadi setelahnya?"
- **Circle of competence** - tahu batas knowledge Anda
- **Margin of safety** - buffer untuk uncertainty

## Apply ke Coding Problem

```
Problem: API response lambat (5 detik)

1. Define: endpoint /api/users lambat 5s, target <500ms
2. Structure: 
   - Database (query slow?)
   - Application (logic heavy?)
   - Network (latency?)
3. Prioritize: database paling sering jadi biang
4. Hypothesis:
   H1: N+1 query problem
   H2: Missing index
   H3: Large data transfer
5. Analyze:
   - EXPLAIN ANALYZE query → ketemu sequential scan
   - Cek ORM logs → 47 queries untuk 1 request
6. Synthesize: H1 + H2 confirmed (N+1 + no index)
7. Recommend:
   - Add eager loading (resolve N+1)
   - Add index on user_id
   - Expected: 5s → 200ms (25x faster)
```

Framework ini scalable dari problem coding sampai problem bisnis."""
    },
]

# === REAL-WORLD SCENARIOS ===
SCENARIO_CONVERSATIONS = [
    {
        "user": "Bantu bikin business plan untuk startup tech",
        "assistant": """**Template Business Plan Startup Tech** (investor-ready):

## 1. Executive Summary (1 halaman)

```
[Company Name]: [Tagline 5-7 kata]
Mission: [1 kalimat - kenapa company ini exist]
Vision: [1 kalimat - masa depan 5-10 tahun]

Problem: [3-4 kalimat - pain point market]
Solution: [3-4 kalimat - bagaimana Anda solve]
Market Size: [TAM/SAM/SOM dengan angka]

Traction: [metrics kalau sudah jalan]
  - MRR: $X
  - Users: X
  - Growth: X% MoM

Ask: $X untuk X% equity, gunanya untuk...
```

## 2. Problem Statement

**Format:** "Bagaimana kita bisa [goal] untuk [target user] yang [pain point]?"

**Contoh:** "Bagaimana kita bisa bantu UMKM kuliner di Indonesia yang kesulitan terima pembayaran digital karena biaya gateway mahal?"

**Validasi Problem:**
- Customer interview (min 20 orang)
- Survey quantitative (min 100 responden)
- Analisis kompetitor (gap di market)
- Data sekunder (Google Trends, statistik pemerintah)

## 3. Solution & Product

**Format Pitch:** "Untuk [target user] yang [pain], kami bikin [product] yang [key feature]. Berbeda dari [kompetitor] karena [unique value]."

**MVP Scope:**
- Core features (3-5): [list]
- Nice-to-have: [list, exclude dari MVP]
- Teknologi: [stack, kenapa pilih ini]

**Product Roadmap:**
```
Phase 1 (Month 0-3): MVP
  - [feature 1]
  - [feature 2]

Phase 2 (Month 4-6): Growth
  - [feature 3]
  - [feature 4]

Phase 3 (Month 7-12): Scale
  - [feature 5]
  - Expand to [market]
```

## 4. Market Analysis

**TAM/SAM/SOM:**
- **TAM** (Total Addressable Market): seluruh market size
- **SAM** (Serviceable Addressable Market): market yang bisa Anda reach
- **SOM** (Serviceable Obtainable Market): realistis dapet 3-5 tahun

**Contoh (Fintech UMKM Indonesia):**
- TAM: 64M UMKM × Rp 100rb/bulan = Rp 76.8T/tahun
- SAM: 10M UMKM urban dengan smartphone = Rp 12T/tahun
- SOM (3 tahun): 1% SAM = Rp 120M/tahun

**Customer Persona:**
```
Persona 1: "Budi, 35, owner warung"
- Pain: terima pembayaran cash repot, susah tracking
- Behavior: pakai WhatsApp untuk order
- Willingness to pay: Rp 50-100rb/bulan

Persona 2: "Siti, 28, owner cafe"
- Pain: banyak payment gateway, fee tinggi
- Behavior: aktif Instagram, ngerti tech
- Willingness to pay: Rp 200-500rb/bulan
```

## 5. Business Model

**Revenue Model (pilih salah satu):**
- SaaS subscription (Rp X/bulan)
- Transaction fee (X% per transaksi)
- Freemium (free + premium features)
- Marketplace (commission)
- Ads/sponsorship

**Unit Economics:**
```
CAC (Customer Acquisition Cost): Rp 200rb
LTV (Lifetime Value): Rp 2.4jt (24 bulan × Rp 100rb)
LTV/CAC ratio: 12x (sehat, >3x OK)
Payback period: 2 bulan

Gross margin: 70%
Burn rate: Rp 50jt/bulan
Runway: 18 bulan (kalau ada Rp 900jt)
```

## 6. Go-to-Market Strategy

**Channel acquisition:**
- Organic: SEO, content marketing, social media
- Paid: Google Ads, Facebook Ads, TikTok Ads
- Partnership: [strategic partner]
- Referral: invite friends, dapat benefit
- Sales: B2B direct sales

**Pricing strategy:**
- Free trial 14 hari
- Basic: Rp 99rb/bulan
- Pro: Rp 299rb/bulan
- Enterprise: custom

## 7. Competitive Analysis

| Kompetitor | Strength | Weakness | Pricing |
|-----------|----------|----------|---------|
| X | Brand kuat | Mahal | Rp 500rb/bln |
| Y | Murah | Feature kurang | Rp 50rb/bln |
| Z | Lengkap | UX jelek | Rp 200rb/bln |
| **Anda** | **[differentiator]** | **[risk]** | **Rp 99rb/bln** |

**Moat (defensible advantage):**
- Network effect?
- Switching cost?
- Brand?
- Tech patent?
- Exclusive data?

## 8. Team

```
Founder 1: [Nama], CEO
- Background: [experience relevant]
- Track record: [achievement]

Founder 2: [Nama], CTO  
- Background: [tech experience]
- Track record: [built X, scaled Y]

Advisor: [Nama], [relevant expertise]
```

**Hiring plan:**
- Month 1-3: 2 engineers, 1 designer
- Month 4-6: 1 marketing, 1 sales
- Month 7-12: 1 PM, 1 customer success

## 9. Financial Projection

```
              Year 1    Year 2    Year 3
Users          1,000    10,000   50,000
MRR           Rp 100M  Rp 1B    Rp 5B
Expenses      Rp 600M  Rp 1.5B  Rp 3B
Net (Loss)    (500M)   (500M)   2B (profit)

Funding needed: Rp 1B (seed)
Use of funds:
- Engineering: 50%
- Marketing: 30%
- Operations: 20%
```

## 10. Funding Ask

```
Raise: Rp 1,000,000,000 (Rp 1M)
Valuation: Rp 5M pre-money
Equity offered: 20%

Use of funds:
- Product development: Rp 500M (50%)
- Marketing & sales: Rp 300M (30%)
- Operations & hiring: Rp 200M (20%)

Runway: 18 bulan dengan burn Rp 55M/bulan
Milestone 18 bulan:
- 10,000 users
- MRR Rp 1M
- Series A ready (raise Rp 5-10M)
```

## Pitch Deck Slides (10-12 slides)

1. Title slide (logo + tagline)
2. Problem
3. Solution
4. Market size (TAM/SAM/SOM)
5. Product (screenshot/demo)
6. Business model
7. Traction (metrics chart)
8. Competition (matrix)
9. Team
10. Financials (projection chart)
11. Ask (funding + use)
12. Contact

## Tools

- **Slide deck:** Pitch.com, Beautiful.ai, Canva
- **Financial model:** Excel/Google Sheets (atau Causal, Pry)
- **Customer dev:** Typeform, Calendly, Notion
- **MVP:** Bubble (no-code), Next.js + Supabase (code)

## Validation Checklist

```
☐ 20+ customer interviews
☐ Problem validated (80% confirm pain)
☐ Solution tested (5+ early adopters)
☐ Willingness to pay validated
☐ Market size calculated (TAM/SAM/SOM)
☐ Competitive map done
☐ Team complete (CEO + CTO minimum)
☐ MVP scope defined
☐ Financial model built
☐ Pitch deck ready (10 slides)
☐ 3+ investor pipeline
```

Mau saya bantu detail bagian tertentu (financial model, pitch deck, MVP scope)?"""
    },
]

def load_existing():
    if SOURCE_FILE.exists():
        with open(SOURCE_FILE, encoding='utf-8') as f:
            return json.load(f)
    return []

def main():
    print("=" * 60)
    print("  Aurum Brain AI - Multi-Domain + Agent AI Expansion")
    print(f"  Date: {datetime.now().isoformat()}")
    print("=" * 60)
    
    existing = load_existing()
    print(f"\n[1/3] Existing dataset: {len(existing)} conversations")
    
    new_convs = []
    
    # Tambah agent AI conversations
    for conv in AGENT_CONVERSATIONS:
        if not any(c["user"] == conv["user"] for c in existing + new_convs):
            new_convs.append(conv)
    print(f"[2/3] Agent AI conversations added: {len([c for c in new_convs if c in AGENT_CONVERSATIONS])}")
    
    # Tambah multi-domain conversations
    multi_added = 0
    for conv in MULTI_DOMAIN_CONVERSATIONS:
        if not any(c["user"] == conv["user"] for c in existing + new_convs):
            new_convs.append(conv)
            multi_added += 1
    print(f"       Multi-domain conversations added: {multi_added}")
    
    # Tambah scenario conversations
    scenario_added = 0
    for conv in SCENARIO_CONVERSATIONS:
        if not any(c["user"] == conv["user"] for c in existing + new_convs):
            new_convs.append(conv)
            scenario_added += 1
    print(f"       Real-world scenarios added: {scenario_added}")
    
    if not new_convs:
        print("\n[3/3] No new conversations to add")
        return 0
    
    combined = existing + new_convs
    random.shuffle(combined)
    
    with open(SOURCE_FILE, 'w', encoding='utf-8') as f:
        json.dump(combined, f, indent=2, ensure_ascii=False)
    print(f"[3/3] Saved {len(combined)} conversations to {SOURCE_FILE}")
    
    # Update log
    if EXPANSION_LOG.exists():
        with open(EXPANSION_LOG) as f:
            log = json.load(f)
    else:
        log = {"expansions": [], "total_added": 0}
    
    log["expansions"].append({
        "date": datetime.now().isoformat(),
        "added": len(new_convs),
        "total": len(combined),
        "categories": ["agent_ai", "multi_domain", "scenarios"],
    })
    log["total_added"] += len(new_convs)
    
    with open(EXPANSION_LOG, 'w', encoding='utf-8') as f:
        json.dump(log, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'=' * 60}")
    print(f"  EXPANSION COMPLETE")
    print(f"{'=' * 60}")
    print(f"  Before: {len(existing)} conversations")
    print(f"  Added:  {len(new_convs)} new conversations")
    print(f"  After:  {len(combined)} conversations")
    print(f"  Total added (all time): {log['total_added']}")
    print(f"\n  Categories added:")
    print(f"    - Agent AI (function calling, tool use)")
    print(f"    - Multi-domain (science, business, health, finance, creative)")
    print(f"    - Real-world scenarios (business plan, etc)")
    
    return len(new_convs)

if __name__ == "__main__":
    main()
