#!/bin/bash
# Sentient House — Start All Services (Linux/Mac)

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOGS="$REPO_ROOT/logs"

mkdir -p "$LOGS"

echo "=== Sentient House Services ==="
echo "Repo root: $REPO_ROOT"

# 1. Zo API (Express, port 3001)
if ! lsof -i :3001 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "[zo-api] Starting on port 3001..."
  cd "$REPO_ROOT/zo-api" && nohup node server.js >> "$LOGS/zo-api.log" 2>&1 &
else
  echo "[zo-api] Already running on port 3001"
fi

# 2. OpenClaw Gateway (port 18789)
if ! lsof -i :18789 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "[openclaw] Starting gateway on port 18789..."
  cd "$REPO_ROOT" && nohup openclaw gateway run --bind loopback --port 18789 --force >> "$LOGS/openclaw-gateway.log" 2>&1 &
else
  echo "[openclaw] Gateway already running on port 18789"
fi

# Brief wait then verify
sleep 3
echo ""
echo "--- Service Status ---"
for port in 3001 18789; do
  if lsof -i ":$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "  Port $port: UP"
  else
    echo "  Port $port: DOWN (check logs/)"
  fi
done

echo ""
echo "Logs: $LOGS"
echo "To expose externally: tailscale funnel 3001"
