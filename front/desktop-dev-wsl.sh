#!/usr/bin/env bash
set -e

# WSL-specific dev script for Neutralino.js desktop mode
# Ensures file watching works across WSL/Windows filesystem boundaries

export CHOKIDAR_USEPOLLING=true
export WATCHPACK_POLLING=true

cd "$(dirname "${BASH_SOURCE[0]}")"

# Start Next.js dev server and Neutralino in parallel
concurrently "next dev" "sleep 3 && neu run -- --url=http://localhost:3000"
