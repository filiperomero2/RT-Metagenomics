#!/usr/bin/env bash
set -eu

LEVEL="${1:-bootstrap}"
APP_DIR="${RT_META_APP_DIR:-$HOME/.rt-metagenomics}"
DATABASES_DIR="$APP_DIR/databases"
DB_FILE="$APP_DIR/rtmeta.db"
OUTPUT_DIR="$APP_DIR/output"

usage() {
  cat <<'EOF'
Usage: reset-test-env.sh [bootstrap|app|full]

  bootstrap  Remove downloaded tool databases (default)
  app        bootstrap + delete app SQLite DB and pipeline output
  full       Remove entire ~/.rt-metagenomics runtime (conda, backend copy, marker)

Environment:
  RT_META_APP_DIR  Override runtime root (default: ~/.rt-metagenomics)
EOF
}

if [[ "$LEVEL" == "-h" || "$LEVEL" == "--help" ]]; then
  usage
  exit 0
fi

if [[ "$LEVEL" != "bootstrap" && "$LEVEL" != "app" && "$LEVEL" != "full" ]]; then
  echo "Unknown level: $LEVEL" >&2
  usage >&2
  exit 1
fi

echo "RT-Metagenomics reset ($LEVEL)"
echo "Runtime directory: $APP_DIR"

stop_backend() {
  if pgrep -f "uvicorn main:app" >/dev/null 2>&1; then
    echo "Stopping backend (uvicorn)..."
    pkill -f "uvicorn main:app" || true
    sleep 1
  fi
}

clear_database_configs() {
  if [[ ! -f "$DB_FILE" ]]; then
    return
  fi

  if command -v python3 >/dev/null 2>&1; then
    echo "Clearing database config rows from $DB_FILE ..."
    python3 - "$DB_FILE" <<'PY'
import sqlite3
import sys

db_path = sys.argv[1]
types = (
    "kraken2_database",
    "krona_database",
    "taxdump",
    "diamond_database",
    "deacon_database",
)
conn = sqlite3.connect(db_path)
try:
    placeholders = ",".join("?" for _ in types)
    cur = conn.execute(
        f"DELETE FROM config WHERE type IN ({placeholders})",
        types,
    )
    conn.commit()
    print(f"  removed {cur.rowcount} config row(s)")
finally:
    conn.close()
PY
    return
  fi

  echo "python3 not found; skipping config table cleanup."
}

remove_databases() {
  if [[ -d "$DATABASES_DIR" ]]; then
    echo "Removing databases: $DATABASES_DIR"
    rm -rf "$DATABASES_DIR"
  else
    echo "No databases directory at $DATABASES_DIR"
  fi
}

remove_app_data() {
  if [[ -f "$DB_FILE" ]]; then
    echo "Removing app database: $DB_FILE"
    rm -f "$DB_FILE"
  fi

  if [[ -d "$OUTPUT_DIR" ]]; then
    echo "Removing pipeline output: $OUTPUT_DIR"
    rm -rf "$OUTPUT_DIR"
  fi
}

remove_full_runtime() {
  if [[ -d "$APP_DIR" ]]; then
    echo "Removing full runtime: $APP_DIR"
    rm -rf "$APP_DIR"
  else
    echo "No runtime directory at $APP_DIR"
  fi
}

stop_backend

case "$LEVEL" in
  bootstrap)
    remove_databases
    clear_database_configs
    ;;
  app)
    remove_databases
    remove_app_data
    ;;
  full)
    remove_full_runtime
    ;;
esac

echo "Done. Restart the app or run 'bun run dev' to test bootstrap again."
