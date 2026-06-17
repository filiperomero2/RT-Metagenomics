#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

docker run -d \
  --name rt-metagenomics \
  --rm \
  -p 3000:3000 \
  -p 8000:8000 \
  -v "$PROJECT_DIR":/app \
  rt-meta:latest