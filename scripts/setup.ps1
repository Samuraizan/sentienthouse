# Sentient House — First-Time Windows Setup
# Run once after cloning the repo

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "=== Sentient House Setup ===" -ForegroundColor Cyan

# Check Node.js
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "ERROR: Node.js not found. Install Node.js 22+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "Node.js: $nodeVersion" -ForegroundColor Green

# Check OpenClaw
$openclawVersion = openclaw --version 2>$null
if (-not $openclawVersion) {
    Write-Host "Installing OpenClaw..." -ForegroundColor Yellow
    npm install -g openclaw@latest
} else {
    Write-Host "OpenClaw: $openclawVersion" -ForegroundColor Green
}

# Install zo-api dependencies
Write-Host "`nInstalling zo-api dependencies..." -ForegroundColor Yellow
Push-Location "$RepoRoot\zo-api"
npm install
Pop-Location

# Install zo-house-3d dependencies (for local dev)
Write-Host "Installing zo-house-3d dependencies..." -ForegroundColor Yellow
Push-Location "$RepoRoot\zo-house-3d"
npm install
Pop-Location

# Create data directory
$dataDir = Join-Path $RepoRoot "data"
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir | Out-Null
    Write-Host "Created data/ directory" -ForegroundColor Green
}

# Create logs directory
$logsDir = Join-Path $RepoRoot "logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
    Write-Host "Created logs/ directory" -ForegroundColor Green
}

# Check for .env
$envFile = Join-Path $RepoRoot ".env"
if (-not (Test-Path $envFile)) {
    Copy-Item "$RepoRoot\.env.example" $envFile
    Write-Host "`nWARNING: .env file created from template. Edit it with your real API keys!" -ForegroundColor Yellow
}

# Check for .credentials
$credsDir = Join-Path $RepoRoot ".credentials"
if (-not (Test-Path $credsDir)) {
    Write-Host "`nWARNING: .credentials/ directory missing. Copy your API credentials there." -ForegroundColor Yellow
    Write-Host "See .credentials.example/README.md for required files." -ForegroundColor Yellow
}

# Check OpenClaw config
$openclawConfig = Join-Path $env:USERPROFILE ".openclaw\openclaw.json"
if (-not (Test-Path $openclawConfig)) {
    Write-Host "`nWARNING: OpenClaw config not found at $openclawConfig" -ForegroundColor Yellow
    Write-Host "Copy config/openclaw.template.json to $openclawConfig and fill in secrets." -ForegroundColor Yellow
}

# Check Tailscale
$tailscale = Get-Command tailscale -ErrorAction SilentlyContinue
if (-not $tailscale) {
    Write-Host "`nNOTE: Tailscale not found. Install from https://tailscale.com/download" -ForegroundColor Yellow
    Write-Host "Tailscale is needed to expose the API externally via Funnel." -ForegroundColor Yellow
} else {
    Write-Host "Tailscale: found" -ForegroundColor Green
}

Write-Host "`n=== Setup Complete ===" -ForegroundColor Cyan
Write-Host "Next steps:"
Write-Host "  1. Edit .env with your real API keys"
Write-Host "  2. Copy .credentials/ with apis.json, google.json"
Write-Host "  3. Configure OpenClaw: copy config/openclaw.template.json"
Write-Host "  4. Run: .\scripts\start-all.ps1"
