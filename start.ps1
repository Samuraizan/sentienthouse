# Zo House Startup Script (Windows PowerShell)
# Run with: .\start.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   ZO HOUSE - Starting All Services" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$ROOT = $PSScriptRoot

# Check if Node is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    exit 1
}

Write-Host "[1/3] Installing dependencies..." -ForegroundColor Yellow

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

Write-Host "`n[2/3] Starting zo-api server..." -ForegroundColor Yellow
$apiJob = Start-Job -ScriptBlock {
    Set-Location $using:ROOT\zo-api
    node server.js
}
Start-Sleep -Seconds 2

Write-Host "[3/3] Starting zo-house-3d frontend..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:ROOT\zo-house-3d
    npm run dev
}
Start-Sleep -Seconds 3

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   ZO HOUSE - Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`n  API:      http://localhost:3001" -ForegroundColor White
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "`n  Press Ctrl+C to stop all services`n" -ForegroundColor Gray

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
    Write-Host "All services stopped." -ForegroundColor Green
}
