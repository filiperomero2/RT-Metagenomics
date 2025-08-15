#!/bin/bash
cd /app/back/app && uvicorn main:app --host 0.0.0.0 --port 8000 &
cd /app/front && npm run dev
