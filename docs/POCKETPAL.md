# Import Aurum Brain AI ke PocketPal

**PocketPal** adalah app iOS/Android untuk jalanin AI model lokal (GGUF) di HP. Aurum Brain AI sudah didesain supaya langsung compatible.

## 📥 Step 1: Download GGUF

1. Buka **https://github.com/aurum-lab/aurum-brain-ai/releases**
2. Pilih release terbaru
3. Download file: **`aurum-brain-q4_k_m.gguf`** (~2GB)
4. Download juga: **`system_prompt.txt`** (untuk set personality AI)

> Note: File 2GB butuh WiFi untuk download. Pastikan storage HP cukup (minimal 3GB free).

## 📱 Step 2: Install PocketPal

### iOS (iPhone/iPad)
- App Store: https://apps.apple.com/app/pocketpal/id6477592319
- Minimum: iOS 16.0+
- Recommended: iPhone 12 atau newer (untuk performance optimal)

### Android
- Play Store: https://play.google.com/store/apps/details?id=com.pocketpal
- Minimum: Android 8.0+
- Recommended: Snapdragon 855 atau setara (4GB+ RAM)

## 📲 Step 3: Import Model

### Cara A: Import dari File (paling umum)

1. **Pindahkan file GGUF ke HP**
   - iOS: pakai Files app, AirDrop dari Mac, atau download langsung di Safari
   - Android: pakai File Manager, atau download langsung di Chrome

2. **Buka PocketPal app**
3. **Tap icon "+"** di pojok kanan atas
4. **Pilih "Import from file"**
5. **Navigasi ke file** `aurum-brain-q4_k_m.gguf`
6. **Tunggu import** (1-3 menit, tergantung HP)
7. **Beri nama model**: `Aurum Brain AI`
8. **Tap "Save"**

### Cara B: Import dari URL (kalau PocketPal support)

1. Copy direct URL dari GitHub Release:
   ```
   https://github.com/aurum-lab/aurum-brain-ai/releases/download/vXXXX/aurum-brain-q4_k_m.gguf
   ```
2. Di PocketPal: **"+" → "Import from URL"**
3. Paste URL
4. Tunggu download selesai

## ⚙️ Step 4: Set System Prompt (PENTING!)

System prompt adalah "kepribadian" AI. Tanpa ini, AI akan jadi Qwen2.5 biasa, bukan Aurum Brain AI.

1. Buka file **`system_prompt.txt`** (yang sudah kamu download di Step 1)
2. Copy semua isinya
3. Di PocketPal → buka model `Aurum Brain AI` → **Settings** (gear icon)
4. Cari field **"System Prompt"** atau **"System Message"**
5. Paste system prompt
6. **Save**

## 🎯 Step 5: Setting Inference Parameters

Di Settings model, set parameter berikut untuk hasil terbaik:

```
Temperature: 0.7        → kreativitas vs konsistensi (0.7 = balance)
Top P: 0.9              → probability cutoff
Top K: 40               → top-k token sampling
Context Length: 4096    → maksimal token context (4K = sekitar 3000 kata)
Repeat Penalty: 1.1     → hindari repetisi
Max Tokens: 1024        → maksimal token per response
```

## 💬 Step 6: Mulai Chat!

1. Buka model `Aurum Brain AI`
2. Ketik: `Halo, siapa kamu?`
3. AI harus jawab dengan personality Aurum Brain AI (Bahasa Indonesia, percaya diri, expert)

**Contoh pertanyaan untuk test:**
- "Bikin function Python buat cek palindrome"
- "Jelasin Big O notation"
- "Apa bedanya SQL vs NoSQL?"
- "Debug error ini: [paste error]"
- "Review kode ini: [paste kode]"

## 🔧 Troubleshooting

### Model lambat
- **iPhone**: pastikan tidak ada app lain yang berat. Close browser apps.
- **Android**: aktifkan "Performance Mode" di Settings. Battery saver OFF.
- **Reduce context length** ke 2048 kalau masih lambat.

### Out of memory (OOM)
- Pakai quantization lebih kecil: `aurum-brain-q3_k_m.gguf` (sekitar 1.5GB)
- Atau turun ke model lebih kecil (1.5B parameter)
- Close app lain, restart HP

### Jawaban aneh / tidak konsisten
- Pastikan **system prompt sudah di-set** (Step 4)
- Coba **temperature lebih rendah** (0.3-0.5) untuk jawaban lebih konsisten
- Coba **temperature lebih tinggi** (0.9-1.0) untuk jawaban lebih kreatif

### Model tidak terdeteksi
- Pastikan file GGUF tidak corrupt: cek size harus ~2GB
- Re-download kalau size kurang dari 1.5GB
- Restart PocketPal app

### Crash saat import
- iOS: pastikan storage cukup (Settings → General → iPhone Storage)
- Android: clear cache PocketPal, coba import lagi
- Format file harus `.gguf` (bukan `.bin` atau `.safetensors`)

## 🆚 Perbandingan dengan Cloud AI

| Aspek | Aurum Brain AI (PocketPal) | ChatGPT/Gemini |
|-------|---------------------------|----------------|
| Privacy | 100% lokal, tidak ada data keluar | Data dikirim ke server |
| Internet | Tidak butuh | Wajib |
| Cost | Gratis selamanya | Berlangganan |
| Speed | 5-30 detik per response | 1-3 detik |
| Kecerdasan | 3B parameter, cukup untuk coding | 100B+ parameter, lebih pintar |
| Bahasa Indonesia | Fine-tuned khusus | Default multilingual |
| Kustomisasi | Bisa retrain | Tidak bisa |

## 🎓 Tips Pakai

1. **Pertanyaan spesifik > pertanyaan umum**
   - ❌ "Jelasin Python"
   - ✅ "Jelasin bedanya list, tuple, dan set di Python dengan contoh"

2. **Kasih konteks kalau perlu**
   - "Saya bikin REST API pakai FastAPI, mau bikin endpoint upload file..."

3. **Minta kode, bukan teori**
   - "Bikin function debounce di TypeScript, kasih contoh pakai"

4. **Iterasi kalau jawaban kurang**
   - "Bisa lebih singkat?"
   - "Kasih contoh untuk kasus X"
   - "Apa ada cara lain?"

5. **Save response bagus**
   - Copy kode snippet ke note app
   - Atau export conversation di PocketPal

## ❓ FAQ

**Q: Bisa dipakai offline?**
A: Ya! Setelah model di-import, PocketPal jalan 100% offline. Tidak butuh internet.

**Q: Boros battery?**
A: Cukup boros saat generate response (5-30 detik). Idle tidak boros. Pakai charger kalau sesi panjang.

**Q: Bisa multi-turn conversation?**
A: Ya, PocketPal simpan context sesi. Tapi context length 4096 token (sekitar 3000 kata). Kalau kepanjangan, AI akan "lupa" awal percakapan.

**Q: Bisa pakai di PC?**
A: Bisa! Pakai Ollama atau LM Studio. Lihat `docs/OLLAMA.md` dan `docs/LMSTUDIO.md`.

**Q: Model ini halusinasi?**
A: Ya, semua AI model bisa halusinasi. Selalu verify info penting (kode, fakta) sumber terpercaya.

**Q: Bisa retrain dengan data saya?**
A: Bisa! Edit `data/conversations_source.json`, tambah data Anda, lalu trigger workflow di GitHub. Lihat `docs/CUSTOMIZE.md`.
