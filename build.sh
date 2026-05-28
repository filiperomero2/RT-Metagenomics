#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Parse arguments ──────────────────────────────────────────────────────────
PLATFORM=""
for arg in "$@"; do
  case "$arg" in
    --linux) PLATFORM="linux" ;;
    --win)   PLATFORM="win"   ;;
    --all)   PLATFORM="all"   ;;
    *)
      echo "Usage: ./build.sh [--linux|--win|--all]"
      echo "  If no flag is given, builds for the current platform."
      exit 1
      ;;
  esac
done

# Auto-detect platform when no flag is provided
if [ -z "$PLATFORM" ]; then
  case "$(uname -s)" in
    Linux*)  PLATFORM="linux" ;;
    Darwin*) PLATFORM="linux" ;;
    MINGW*|MSYS*|CYGWIN*) PLATFORM="win" ;;
    *)
      echo "Could not detect platform. Use --linux, --win, or --mac."
      exit 1
      ;;
  esac
  echo "Auto-detected platform: $PLATFORM"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  RT-Metagenomics — Build ($PLATFORM)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── 1. Pack the conda environment ────────────────────────────────────────────
echo "[1/4] Packing conda environment 'rt-meta'…"
mkdir -p front/resources
conda-pack \
  --name rt-meta \
  --output front/resources/conda-env.tar.gz \
  --ignore-editable-packages \
  --force
echo "      Packed: $(du -sh front/resources/conda-env.tar.gz | cut -f1)"

# ── 2. Copy backend source into resources ────────────────────────────────────
echo "[2/4] Copying backend source…"
rm -rf front/resources/back
mkdir -p front/resources/back/app
cp -r back/app/. front/resources/back/app/
# Remove runtime artifacts that shouldn't ship
find front/resources/back -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find front/resources/back -name "*.pyc" -delete 2>/dev/null || true
rm -f front/resources/back/app/rtmeta.db

# ── 3. Build Electron (main + renderer via electron-vite) ────────────────────
echo "[3/4] Building Electron app…"
cd front
bun run prebuild

# ── 4. Package with electron-builder ─────────────────────────────────────────
echo "[4/4] Packaging for: $PLATFORM …"
case "$PLATFORM" in
  linux) bunx electron-builder --linux  ;;
  win)   bunx electron-builder --win    ;;
  all)   bunx electron-builder --linux --win ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Build complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Artifacts:"
ls -lh dist/ 2>/dev/null || echo "  (check front/dist/)"
