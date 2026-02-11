#!/bin/bash
# Zo House Startup Script (Unix/Mac/WSL)
# Run with: ./start.sh

set -e

echo ""
echo "========================================"
echo "   ZO HOUSE - Starting All Services"
echo "========================================"
echo ""

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    exit 1
fi

echo "[1/3] Installing dependencies..."

# Install API dependencies
echo "  -> zo-api"
cd "$ROOT/zo-api" && npm install --silent 2>/dev/null

# Install frontend dependencies
echo "  -> zo-house-3d"
cd "$ROOT/zo-house-3d" && npm install --silent 2>/dev/null

echo ""
echo "[2/3] Starting zo-api server..."
cd "$ROOT/zo-api" && node server.js &
API_PID=$!
sleep 2

echo "[3/3] Starting zo-house-3d frontend..."
cd "$ROOT/zo-house-3d" && npm run dev &
FRONTEND_PID=$!
sleep 3

echo ""
echo "========================================"
echo "   ZO HOUSE - Services Started!"
echo "========================================"
echo ""
echo "  API:      http://localhost:3001"
echo "  Frontend: http://localhost:5173"
echo ""
echo "  Press Ctrl+C to stop all services"
echo ""

# Cleanup on exit
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $API_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "All services stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
