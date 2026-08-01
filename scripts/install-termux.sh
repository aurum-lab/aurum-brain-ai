#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
#  Aurum Brain AI - Termux Installer
#  Jalankan di Termux: bash install-termux.sh
# ============================================================
# Setelah install, AI jalan sebagai server lokal di HP.
# Bisa dipakai sebagai custom provider OpenClaw/Open WebUI/Cherry Studio/dll.
# ============================================================

set -e

# Colors untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
print_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
print_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_step()  { echo -e "${CYAN}=== $1 ===${NC}"; }

echo ""
echo "============================================================"
echo "  Aurum Brain AI - Termux Installer"
echo "  AI lokal di HP Android, jago coding Bahasa Indonesia"
echo "============================================================"
echo ""

# === 1. SETUP TERMUX REPO & UPDATE ===
print_step "1/8: Update Termux packages"

# Allow storage access (untuk download/import file dari Download folder)
if [ ! -d ~/storage ]; then
  print_info "Minta izin akses storage..."
  termux-setup-storage
  sleep 3
fi

pkg update -y -o Dpkg::Options::="--force-confold" || true
pkg upgrade -y -o Dpkg::Options::="--force-confold" || true
print_ok "Termux packages updated"

# === 2. INSTALL DEPENDENCIES ===
print_step "2/8: Install dependencies (clang, cmake, git, python, curl)"

pkg install -y \
  clang \
  cmake \
  git \
  curl \
  wget \
  python \
  python-pip \
  openssl \
  libsqlite \
  proot 2>/dev/null || true

print_ok "Dependencies installed"

# === 3. INSTALL OLLAMA ALTERNATIF (llama.cpp server) ===
print_step "3/8: Build llama.cpp untuk Android (ARM64)"

AURUM_DIR="$HOME/aurum-brain-ai"
LLAMA_DIR="$AURUM_DIR/llama.cpp"

mkdir -p "$AURUM_DIR"
cd "$AURUM_DIR"

if [ ! -d "$LLAMA_DIR" ]; then
  print_info "Clone llama.cpp (bisa beberapa menit)..."
  git clone --depth 1 https://github.com/ggerganov/llama.cpp "$LLAMA_DIR"
fi

cd "$LLAMA_DIR"

# Build untuk Android ARM64 (cpu=aarch64)
print_info "Build llama.cpp (butuh 5-10 menit, sekali saja)..."
mkdir -p build
cd build

cmake .. \
  -DCMAKE_BUILD_TYPE=Release \
  -DLLAMA_BUILD_TESTS=OFF \
  -DLLAMA_BUILD_EXAMPLES=OFF \
  -DLLAMA_BUILD_SERVER=ON \
  -DCMAKE_C_COMPILER=clang \
  -DCMAKE_CXX_COMPILER=clang++ \
  -DLLAMA_NATIVE=ON 2>&1 | tail -5

# Build dengan 4 thread (jangan terlalu banyak, HP akan panas)
nproc_result=$(nproc)
build_threads=$(( nproc_result < 4 ? nproc_result : 4 ))
print_info "Build dengan $build_threads threads..."

cmake --build . --config Release -j $build_threads --target llama-server llama-quantize 2>&1 | tail -5

# Symlink untuk kompatibilitas
ln -sf llama-server "$LLAMA_DIR/build/bin/server" 2>/dev/null || true
ln -sf llama-quantize "$LLAMA_DIR/build/bin/quantize" 2>/dev/null || true

print_ok "llama.cpp built successfully"

# === 4. DOWNLOAD MODEL GGUF ===
print_step "4/8: Download Aurum Brain AI model"

MODELS_DIR="$AURUM_DIR/models"
mkdir -p "$MODELS_DIR"

# Cek apakah user mau full version (3B) atau starter (1.5B)
echo ""
echo "Pilih model:"
echo "  1) Starter - Qwen2.5-1.5B Q4 (~1GB, lebih cepat di HP)"
echo "  2) Full    - Qwen2.5-3B Q4 (~2GB, lebih pintar, fine-tuned khusus)"
echo "  3) Skip download (kalau sudah punya GGUF sendiri)"
echo ""
read -p "Pilihan [1/2/3, default=1]: " model_choice

model_choice=${model_choice:-1}

GGUF_FILE=""

if [ "$model_choice" = "1" ]; then
  GGUF_FILE="$MODELS_DIR/aurum-brain-starter-q4_k_m.gguf"
  if [ ! -f "$GGUF_FILE" ]; then
    print_info "Download starter model (~1GB)..."
    print_info "Sumber: Qwen2.5-1.5B-Instruct GGUF (pre-quantized)"
    
    # Download dari HuggingFace (Qwen official)
    pip install -q huggingface_hub
    python3 << 'PYEOF'
from huggingface_hub import hf_hub_download
import shutil, os

path = hf_hub_download(
    repo_id="Qwen/Qwen2.5-1.5B-Instruct-GGUF",
    filename="qwen2.5-1.5b-instruct-q4_k_m.gguf",
    local_dir=os.path.expanduser("~/aurum-brain-ai/models"),
)
target = os.path.expanduser("~/aurum-brain-ai/models/aurum-brain-starter-q4_k_m.gguf")
shutil.copy(path, target)
print(f"Downloaded to: {target}")
PYEOF
  else
    print_ok "Model starter sudah ada, skip download"
  fi
  
elif [ "$model_choice" = "2" ]; then
  GGUF_FILE="$MODELS_DIR/aurum-brain-q4_k_m.gguf"
  if [ ! -f "$GGUF_FILE" ]; then
    print_info "Download full version (~2GB)..."
    print_info "Sumber: GitHub Releases aurum-lab/aurum-brain-ai"
    
    # Cek latest release URL
    LATEST_URL=$(curl -sL https://api.github.com/repos/aurum-lab/aurum-brain-ai/releases/latest \
      | python3 -c "import json,sys; r=json.load(sys.stdin); a=[x for x in r.get('assets',[]) if 'q4_k_m' in x['name'] and 'starter' not in x['name']]; print(a[0]['browser_download_url'] if a else '')")
    
    if [ -z "$LATEST_URL" ]; then
      print_warn "Full version belum available (training mungkin masih berjalan)"
      print_info "Fallback ke starter version..."
      model_choice="1"
      GGUF_FILE="$MODELS_DIR/aurum-brain-starter-q4_k_m.gguf"
      if [ ! -f "$GGUF_FILE" ]; then
        pip install -q huggingface_hub
        python3 << 'PYEOF'
from huggingface_hub import hf_hub_download
import shutil, os
path = hf_hub_download(repo_id="Qwen/Qwen2.5-1.5B-Instruct-GGUF", filename="qwen2.5-1.5b-instruct-q4_k_m.gguf", local_dir=os.path.expanduser("~/aurum-brain-ai/models"))
shutil.copy(path, os.path.expanduser("~/aurum-brain-ai/models/aurum-brain-starter-q4_k_m.gguf"))
PYEOF
      fi
    else
      curl -L -o "$GGUF_FILE" "$LATEST_URL"
    fi
  else
    print_ok "Full model sudah ada, skip download"
  fi
  
elif [ "$model_choice" = "3" ]; then
  print_info "Skip download. Akan pakai model yang sudah ada."
  # List GGUF yang ada di folder models
  echo "GGUF files di $MODELS_DIR:"
  ls -la "$MODELS_DIR"/*.gguf 2>/dev/null || print_warn "Belum ada GGUF file"
  
  # Pilih GGUF pertama yang ada
  GGUF_FILE=$(ls "$MODELS_DIR"/*.gguf 2>/dev/null | head -1)
  if [ -z "$GGUF_FILE" ]; then
    print_error "Tidak ada GGUF file di $MODELS_DIR"
    print_info "Download manual, atau jalankan installer lagi dengan pilihan 1 atau 2"
    exit 1
  fi
  print_info "Pakai: $GGUF_FILE"
fi

if [ ! -f "$GGUF_FILE" ]; then
  print_error "Model file tidak ditemukan: $GGUF_FILE"
  exit 1
fi

print_ok "Model ready: $GGUF_FILE ($(du -h "$GGUF_FILE" | cut -f1))"

# === 5. DOWNLOAD SYSTEM PROMPT ===
print_step "5/8: Download system prompt"

PROMPT_FILE="$AURUM_DIR/system_prompt.txt"
if [ ! -f "$PROMPT_FILE" ]; then
  print_info "Download system_prompt.txt..."
  curl -sL -o "$PROMPT_FILE" \
    https://raw.githubusercontent.com/aurum-lab/aurum-brain-ai/main/data/system_prompt.txt
fi

if [ ! -s "$PROMPT_FILE" ]; then
  print_warn "Gagal download system prompt. Buat default..."
  cat > "$PROMPT_FILE" << 'EOF'
Kamu adalah Aurum Brain AI - asisten AI cerdas buatan Indonesia.
Jawab dalam Bahasa Indonesia, jago coding, problem-solving, dan percakapan umum.
EOF
fi

print_ok "System prompt ready"

# === 6. BUAT START SCRIPT ===
print_step "6/8: Create start/stop scripts"

# start.sh - menjalankan server
cat > "$AURUM_DIR/start.sh" << EOF
#!/data/data/com.termux/files/usr/bin/bash
# Start Aurum Brain AI server
# Akses di: http://localhost:8080

GGUF_FILE="$GGUF_FILE"
PROMPT_FILE="$PROMPT_FILE"
PORT=\${1:-8080}

echo "============================================"
echo "  Aurum Brain AI - Local Server"
echo "============================================"
echo "  Model: \$(basename "\$GGUF_FILE")"
echo "  URL:   http://localhost:\$PORT"
echo "  API:   http://localhost:\$PORT/v1/chat/completions"
echo "============================================"
echo ""
echo "Tekan Ctrl+C untuk stop"
echo ""

# Deteksi jumlah core
THREADS=\$(nproc)
echo "Threads: \$THREADS"
echo ""

# Run server
"$LLAMA_DIR/build/bin/llama-server" \\
  --model "\$GGUF_FILE" \\
  --host 0.0.0.0 \\
  --port \$PORT \\
  --threads \$THREADS \\
  --ctx-size 4096 \\
  --system-prompt-file "\$PROMPT_FILE" \\
  --temp 0.7 \\
  --top-p 0.9 \\
  --top-k 40 \\
  --repeat-penalty 1.1
EOF

chmod +x "$AURUM_DIR/start.sh"
print_ok "start.sh created"

# chat.sh - CLI chat interface
cat > "$AURUM_DIR/chat.sh" << EOF
#!/data/data/com.termux/files/usr/bin/bash
# Quick CLI chat dengan Aurum Brain AI
# Pakai: ./chat.sh "Halo, siapa kamu?"

GGUF_FILE="$GGUF_FILE"
PROMPT_FILE="$PROMPT_FILE"

PROMPT="\${1:-Halo, siapa kamu?}"

"$LLAMA_DIR/build/bin/llama-cli" \\
  --model "\$GGUF_FILE" \\
  --system-prompt-file "\$PROMPT_FILE" \\
  --prompt "\$PROMPT" \\
  --n-predict 500 \\
  --temp 0.7 \\
  --top-p 0.9 \\
  --threads \$(nproc) \\
  --ctx-size 2048
EOF

chmod +x "$AURUM_DIR/chat.sh"
print_ok "chat.sh created"

# stop.sh - stop server
cat > "$AURUM_DIR/stop.sh" << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
# Stop semua server Aurum Brain AI
pkill -f "llama-server" 2>/dev/null && echo "Server stopped" || echo "Tidak ada server yang running"
EOF

chmod +x "$AURUM_DIR/stop.sh"
print_ok "stop.sh created"

# === 7. TEST MODEL ===
print_step "7/8: Test model dengan prompt singkat"

print_info "Test 1: Halo, siapa kamu? (bisa butuh 30-60 detik)"
echo ""

timeout 90 "$LLAMA_DIR/build/bin/llama-cli" \
  --model "$GGUF_FILE" \
  --system-prompt-file "$PROMPT_FILE" \
  --prompt "Halo, siapa kamu?" \
  --n-predict 150 \
  --temp 0.7 \
  --threads $(nproc) \
  --ctx-size 1024 2>&1 | grep -v "^llama_" | head -30

print_ok "Test selesai"

# === 8. SETUP AUTOSTART (optional) ===
print_step "8/8: Setup autostart (optional)"

if [ -d ~/.termux ]; then
  # Allow boot (kalau Termux:Boot installed)
  if [ ! -f ~/.termux/boot/aurum-brain.sh ]; then
    read -p "Setup autostart saat HP boot? (butuh Termux:Boot app) [y/N]: " autostart
    if [[ "$autostart" =~ ^[Yy]$ ]]; then
      mkdir -p ~/.termux/boot
      cat > ~/.termux/boot/aurum-brain.sh << EOF
#!/data/data/com.termux/files/usr/bin/bash
# Autostart Aurum Brain AI server saat HP boot
termux-wake-lock
sleep 5
$AURUM_DIR/start.sh 8080 &
EOF
      chmod +x ~/.termux/boot/aurum-brain.sh
      print_ok "Autostart configured. Install Termux:Boot dari F-Droid atau Play Store untuk aktifkan."
    fi
  fi
fi

# === FINAL ===
echo ""
echo "============================================================"
echo -e "${GREEN}  INSTALL SELESAI!${NC}"
echo "============================================================"
echo ""
echo "📁 Lokasi:"
echo "   Models:    $MODELS_DIR"
echo "   Scripts:   $AURUM_DIR/start.sh"
echo "              $AURUM_DIR/chat.sh"
echo "              $AURUM_DIR/stop.sh"
echo "   System:    $PROMPT_FILE"
echo ""
echo "🚀 Cara pakai:"
echo ""
echo "   1. Start server (background):"
echo "      $AURUM_DIR/start.sh"
echo ""
echo "   2. Akses API dari HP lain / app:"
echo "      http://localhost:8080/v1/chat/completions"
echo "      (atau ganti 'localhost' dengan IP HP di jaringan WiFi)"
echo ""
echo "   3. Quick chat di Termux:"
echo "      $AURUM_DIR/chat.sh 'Halo, siapa kamu?'"
echo ""
echo "   4. Stop server:"
echo "      $AURUM_DIR/stop.sh"
echo ""
echo "🔧 Custom Provider Setup:"
echo "   - OpenClaw:    Add provider, URL = http://localhost:8080/v1"
echo "   - Open WebUI:  Settings → Connections → Ollama, base URL = http://localhost:8080"
echo "   - Cherry Studio: Settings → Model → OpenAI compatible, URL = http://localhost:8080/v1"
echo "   - Any app supporting OpenAI API: set base URL to http://localhost:8080/v1"
echo ""
echo "⚠️  Tips:"
echo "   - Pakai termux-wake-lock supaya server tidak mati saat layar off"
echo "   - HP akan agak panas saat generate. Pakai charger kalau sesi panjang"
echo "   - Speed tergantung HP: 5-30 detik per response"
echo ""
echo "📚 Dokumentasi lengkap: https://github.com/aurum-lab/aurum-brain-ai/blob/main/docs/TERMUX.md"
echo ""
