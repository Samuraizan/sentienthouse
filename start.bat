@echo off
REM Zo House Startup Script (Windows CMD)
REM Double-click or run: start.bat
REM Starts: zo-api, zo-house-3d frontend, and Tailscale Funnel

echo.
echo ========================================
echo    ZO HOUSE - Starting All Services
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Starting zo-api server...
start "Zo API" cmd /k "cd zo-api && npm install && node server.js"
timeout /t 3 /nobreak > nul

echo [2/3] Starting zo-house-3d frontend...
start "Zo Frontend" cmd /k "cd zo-house-3d && npm install && npm run dev"
timeout /t 3 /nobreak > nul

echo [3/3] Starting Tailscale Funnel...
where tailscale >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    REM Start Tailscale service if not running
    sc query Tailscale | find "RUNNING" >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo   Starting Tailscale service...
        net start Tailscale >nul 2>nul
        timeout /t 3 /nobreak > nul
    )
    start "Tailscale Funnel" cmd /k "tailscale funnel 3001"
    timeout /t 2 /nobreak > nul
    echo   Tailscale Funnel started on port 3001
) else (
    echo   Tailscale not found - skipping Funnel
    echo   Install from: https://tailscale.com/download
)

echo.
echo ========================================
echo    ZO HOUSE - Services Started!
echo ========================================
echo.
echo   API (local):    http://localhost:3001
echo   Frontend:       http://localhost:5173
echo   API (external): Check Tailscale Funnel window for URL
echo.
echo   Close the terminal windows to stop services
echo.
pause
