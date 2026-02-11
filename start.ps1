# Zo House Startup Script (Windows PowerShell)
# Run with: .\start.ps1
# Starts: zo-api, zo-house-3d frontend, and Tailscale Funnel

param(
    [switch]$NoFunnel  # Use -NoFunnel to skip Tailscale
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   ZO HOUSE - Starting All Services" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$ROOT = $PSScriptRoot
$LogDir = Join-Path $ROOT "logs"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }

# Check if Node is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    exit 1
}

# Check and start Tailscale service
$hasTailscale = Get-Command tailscale -ErrorAction SilentlyContinue
if ($hasTailscale) {
    $tailscaleService = Get-Service -Name "Tailscale" -ErrorAction SilentlyContinue
    if ($tailscaleService -and $tailscaleService.Status -ne "Running") {
        Write-Host "Starting Tailscale service..." -ForegroundColor Yellow
        Start-Service -Name "Tailscale" -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3
    }
}

Write-Host "[1/4] Installing dependencies..." -ForegroundColor Yellow

# Install API dependencies
Write-Host "  -> zo-api" -ForegroundColor Gray
Push-Location "$ROOT\zo-api"
npm install --silent 2>$null
Pop-Location

# Install frontend dependencies
Write-Host "  -> zo-house-3d" -ForegroundColor Gray
Push-Location "$ROOT\zo-house-3d"
npm install --silent 2>$null
Pop-Location

Write-Host "`n[2/4] Starting zo-api server..." -ForegroundColor Yellow
$apiJob = Start-Job -ScriptBlock {
    Set-Location $using:ROOT\zo-api
    node server.js
}
Start-Sleep -Seconds 2

Write-Host "[3/4] Starting zo-house-3d frontend..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:ROOT\zo-house-3d
    npm run dev
}
Start-Sleep -Seconds 3

# Start Tailscale Funnel
$funnelUrl = $null
if (-not $NoFunnel -and $hasTailscale) {
    Write-Host "[4/4] Starting Tailscale Funnel..." -ForegroundColor Yellow
    try {
        # Start funnel in background
        Start-Process -NoNewWindow -FilePath "tailscale" -ArgumentList "funnel 3001" `
            -RedirectStandardOutput "$LogDir\tailscale.log" `
            -RedirectStandardError "$LogDir\tailscale-error.log"
        Start-Sleep -Seconds 2
        
        # Get funnel URL
        $statusOutput = & tailscale status --json 2>$null | ConvertFrom-Json
        if ($statusOutput.Self.DNSName) {
            $funnelUrl = "https://$($statusOutput.Self.DNSName.TrimEnd('.'))"
            Write-Host "  Funnel URL: $funnelUrl" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "  Tailscale Funnel failed to start (check if logged in)" -ForegroundColor Yellow
    }
} elseif (-not $hasTailscale) {
    Write-Host "[4/4] Tailscale not found - skipping Funnel" -ForegroundColor Yellow
    Write-Host "  Install from: https://tailscale.com/download" -ForegroundColor Gray
} else {
    Write-Host "[4/4] Skipping Tailscale Funnel (-NoFunnel)" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   ZO HOUSE - Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`n  API (local):    http://localhost:3001" -ForegroundColor White
Write-Host "  Frontend:       http://localhost:5173" -ForegroundColor White
if ($funnelUrl) {
    Write-Host "  API (external): $funnelUrl" -ForegroundColor Cyan
}
Write-Host "`n  Logs: $LogDir" -ForegroundColor Gray
Write-Host "  Press Ctrl+C to stop all services`n" -ForegroundColor Gray

# Keep script running and show logs
try {
    while ($true) {
        Receive-Job -Job $apiJob -ErrorAction SilentlyContinue
        Receive-Job -Job $frontendJob -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host "`nStopping services..." -ForegroundColor Yellow
    Stop-Job -Job $apiJob -ErrorAction SilentlyContinue
    Stop-Job -Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $apiJob -ErrorAction SilentlyContinue
    Remove-Job -Job $frontendJob -ErrorAction SilentlyContinue
    # Stop Tailscale Funnel
    if ($hasTailscale -and -not $NoFunnel) {
        & tailscale funnel off 2>$null
    }
    Write-Host "All services stopped." -ForegroundColor Green
}
