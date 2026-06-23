#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

CONDA_ENV="rt-meta"

usage() {
  cat <<EOF
Usage: ./build.sh [--linux|--win|--all] [--skip-conda]

  --linux       Build Linux artifacts (AppImage, deb)
  --win         Build Windows artifacts (NSIS installer, portable exe)
  --all         Build both Linux and Windows artifacts
  --skip-conda  Use front/resources/conda-env.tar.gz instead of packing

  If no flag is given, builds for the current platform.
EOF
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command not found: $1" >&2
    exit 1
  fi
}

detect_platform() {
  case "$(uname -s)" in
    Linux*) PLATFORM="linux" ;;
    MINGW*|MSYS*|CYGWIN*) PLATFORM="win" ;;
    Darwin*)
      echo "macOS builds are not supported by this script. Use --linux or --win explicitly." >&2
      exit 1
      ;;
    *)
      echo "Could not detect platform. Use --linux, --win, or --all." >&2
      exit 1
      ;;
  esac
  echo "Auto-detected platform: $PLATFORM"
}

install_conda_runtime() {
  echo "[1/5] Installing conda runtime dependencies..."

  if [ "$PLATFORM" = "win" ]; then
    echo "      Skipping snakemake on Windows (requires MSVC build tools)."
    echo "      Backend will start; metagenomics pipeline runs need a Linux build."
    conda env update -n "$CONDA_ENV" --file back/environment.yml --prune
    conda run -n "$CONDA_ENV" pip install biopython "pyyaml>=6.0" "click>=8.0"
    conda run -n "$CONDA_ENV" pip install "./back/app/viralunity" --no-deps
  else
    conda env update -n "$CONDA_ENV" --file back/app/viralunity/environment.yml
    conda run -n "$CONDA_ENV" pip install "./back/app/viralunity"
    conda env update -n "$CONDA_ENV" --file back/environment.yml
  fi

  conda install -n "$CONDA_ENV" conda-pack -y
}

pack_conda_env() {
  echo "[2/5] Validating conda environment..."
  conda run -n "$CONDA_ENV" python -c "import uvicorn, fastapi, sqlmodel, pydantic, dotenv"
  echo "[3/5] Packing conda environment '$CONDA_ENV'..."
  mkdir -p front/resources
  conda run -n "$CONDA_ENV" conda-pack \
    -n "$CONDA_ENV" \
    -o front/resources/conda-env.tar.gz \
    --ignore-editable-packages \
    --force
  echo "      Packed: $(du -sh front/resources/conda-env.tar.gz | cut -f1)"
}

copy_backend_resources() {
  echo "[3/5] Copying backend source..."
  rm -rf front/resources/back
  mkdir -p front/resources/back/app
  cp -r back/app/. front/resources/back/app/
  find front/resources/back -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
  find front/resources/back -name "*.pyc" -delete 2>/dev/null || true
  rm -f front/resources/back/app/rtmeta.db
}

run_electron_builder() {
  export CSC_IDENTITY_AUTO_DISCOVERY=false

  case "$PLATFORM" in
    linux) bunx electron-builder --linux --publish never ;;
    win) bunx electron-builder --win --publish never ;;
    all) bunx electron-builder --linux --win --publish never ;;
    *)
      echo "Unsupported platform: $PLATFORM" >&2
      exit 1
      ;;
  esac
}

PLATFORM=""
SKIP_CONDA=false
for arg in "$@"; do
  case "$arg" in
    --linux) PLATFORM="linux" ;;
    --win) PLATFORM="win" ;;
    --all) PLATFORM="all" ;;
    --skip-conda) SKIP_CONDA=true ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      usage
      exit 1
      ;;
  esac
done

if [ -z "$PLATFORM" ]; then
  detect_platform
fi

echo ""
echo "======================================="
echo "  RT-Metagenomics - Build ($PLATFORM)"
echo "======================================="
echo ""

require_command bun
if [ "$SKIP_CONDA" != true ]; then
  require_command conda
fi

if [ "$SKIP_CONDA" = true ]; then
  echo "[1/5] Using pre-built conda pack..."
  if [ ! -f front/resources/conda-env.tar.gz ]; then
    echo "Missing front/resources/conda-env.tar.gz" >&2
    exit 1
  fi
  echo "      Packed: $(du -sh front/resources/conda-env.tar.gz | cut -f1)"
else
  install_conda_runtime
  pack_conda_env
fi

copy_backend_resources

echo "[4/5] Building Electron app..."
cd front
bun run prebuild

echo "[5/5] Packaging for: $PLATFORM ..."
run_electron_builder

echo ""
echo "======================================="
echo "  Build complete!"
echo "======================================="
echo ""
echo "Artifacts:"
ls -lh dist/ 2>/dev/null || echo "  (check front/dist/)"
