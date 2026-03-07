#!/usr/bin/env bash
set -e

# go to the script’s own directory, then into ./app
cd "$(dirname "${BASH_SOURCE[0]}")/app" || exit 1
# Activate the rt-meta conda environment
eval "$(conda shell.bash hook)"
conda activate rt-meta
uvicorn main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --reload \
  --log-level debug