#!/bin/bash
# Zo House Startup Script (Unix/Mac/WSL)
# Run with: ./start.sh
# Starts: zo-api, zo-house-3d frontend, and Tailscale Funnel
# Use --no-funnel to skip Tailscale

set -e

NO_FUNNEL=false
if [[ "$1" == "--no-funnel" ]]; then
    NO_FUNNEL=true
fi

echo ""
echo "========================================"
echo "   ZO HOUSE - Starting All Services"
echo "========================================"
echo ""

ROOT="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT/logs"
mkdir -p "$LOG_DIR"

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    exit 1
fi

# Check and start Tailscale
HAS_TAILSCALE=false
if command -v tailscale &> /dev/null; then
    HAS_TAILSCALE=true
    # Try to start Tailscale daemon if not running (Linux/Mac)
    if ! tailscale status &> /dev/null; then
        echo "Starting Tailscale service..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS - start via brew services or open app
            brew services start tailscale 2>/dev/null || open -a Tailscale 2>/dev/null || true
        else
            # Linux - try systemctl
            sudo systemctl start tailscaled 2>/dev/null || true
        fi
        sleep 3
    fi
fi

echo "[1/4] Installing dependencies..."

# Install API dependencies
echo "  -> zo-api"
cd "$ROOT/zo-api" && npm install --silent 2>/dev/null

# Install frontend dependencies
echo "  -> zo-house-3d"
cd "$ROOT/zo-house-3d" && npm install --silent 2>/dev/null

echo ""
echo "[2/4] Starting zo-api server..."
cd "$ROOT/zo-api" && node server.js > "$LOG_DIR/zo-api.log" 2>&1 &
API_PID=$!
sleep 2

echo "[3/4] Starting zo-house-3d frontend..."
cd "$ROOT/zo-house-3d" && npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
sleep 3

# Start Tailscale Funnel
FUNNEL_URL=""
FUNNEL_PID=""
if [[ "$NO_FUNNEL" == "false" ]] && [[ "$HAS_TAILSCALE" == "true" ]]; then
    echo "[4/4] Starting Tailscale Funnel..."
    tailscale funnel 3001 > "$LOG_DIR/tailscale.log" 2>&1 &
    FUNNEL_PID=$!
    sleep 2
    # Get funnel URL
    FUNNEL_URL=$(tailscale status --json 2>/dev/null | grep -o '"DNSName":"[^"]*"' | cut -d'"' -f4 | sed 's/\.$//')
    if [[ -n "$FUNNEL_URL" ]]; then
        FUNNEL_URL="https://$FUNNEL_URL"
        echo "  Funnel URL: $FUNNEL_URL"
    fi
elif [[ "$HAS_TAILSCALE" == "false" ]]; then
    echo "[4/4] Tailscale not found - skipping Funnel"
    echo "  Install from: https://tailscale.com/download"
else
    echo "[4/4] Skipping Tailscale Funnel (--no-funnel)"
fi

echo ""
echo "========================================"
echo "   ZO HOUSE - Services Started!"
echo "========================================"
echo ""
echo "  API (local):    http://localhost:3001"
echo "  Frontend:       http://localhost:5173"
if [[ -n "$FUNNEL_URL" ]]; then
    echo "  API (external): $FUNNEL_URL"
fi
echo ""
echo "  Logs: $LOG_DIR"
echo "  Press Ctrl+C to stop all services"
echo ""

# Cleanup on exit
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $API_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    if [[ -n "$FUNNEL_PID" ]]; then
        tailscale funnel off 2>/dev/null || true
        kill $FUNNEL_PID 2>/dev/null || true
    fi
    echo "All services stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
