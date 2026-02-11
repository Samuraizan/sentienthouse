# Sentient House — Start All Services (Windows)
# Starts: zo-api (Express), OpenClaw gateway, and optionally Tailscale Funnel

$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$LogDir = Join-Path $RepoRoot "logs"

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }

Write-Host "=== Sentient House Services ===" -ForegroundColor Cyan
Write-Host "Repo root: $RepoRoot"

# ── 1. Zo API (Express, port 3001) ──
$zoApiRunning = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($zoApiRunning) {
    Write-Host "[zo-api] Already running on port 3001" -ForegroundColor Yellow
} else {
    Write-Host "[zo-api] Starting on port 3001..." -ForegroundColor Green
    Start-Process -NoNewWindow -FilePath "node" `
        -ArgumentList "$RepoRoot\zo-api\server.js" `
        -RedirectStandardOutput "$LogDir\zo-api.log" `
        -RedirectStandardError "$LogDir\zo-api-error.log"
}

# ── 2. OpenClaw Gateway (port 18789) ──
$gatewayRunning = Get-NetTCPConnection -LocalPort 18789 -ErrorAction SilentlyContinue
if ($gatewayRunning) {
    Write-Host "[openclaw] Gateway already running on port 18789" -ForegroundColor Yellow
} else {
    Write-Host "[openclaw] Starting gateway on port 18789..." -ForegroundColor Green
    Start-Process -NoNewWindow -FilePath "openclaw" `
        -ArgumentList "gateway run --bind loopback --port 18789 --force" `
        -RedirectStandardOutput "$LogDir\openclaw-gateway.log" `
        -RedirectStandardError "$LogDir\openclaw-gateway-error.log"
}

# ── 3. Brief wait then verify ──
Start-Sleep -Seconds 3

Write-Host "`n--- Service Status ---" -ForegroundColor Cyan
foreach ($port in @(3001, 18789)) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) {
        Write-Host "  Port ${port}: UP" -ForegroundColor Green
    } else {
        Write-Host "  Port ${port}: DOWN (check logs/)" -ForegroundColor Red
    }
}

Write-Host "`nLogs: $LogDir"
Write-Host "To expose externally: tailscale funnel 3001" -ForegroundColor Yellow
