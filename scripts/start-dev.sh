#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "[start-dev] starting backend on http://localhost:8787"
npm run dev:server &
SERVER_PID=$!

echo "[start-dev] starting frontend (vite)"
npm run dev
