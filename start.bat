@echo off
REM Zo House Startup Script (Windows CMD)
REM Double-click or run: start.bat

echo.
echo ========================================
echo    ZO HOUSE - Starting All Services
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] Starting zo-api server...
start "Zo API" cmd /k "cd zo-api && npm install && node server.js"
timeout /t 3 /nobreak > nul

echo [2/2] Starting zo-house-3d frontend...
start "Zo Frontend" cmd /k "cd zo-house-3d && npm install && npm run dev"
timeout /t 3 /nobreak > nul

echo.
echo ========================================
echo    ZO HOUSE - Services Started!
echo ========================================
echo.
echo   API:      http://localhost:3001
echo   Frontend: http://localhost:5173
echo.
echo   Close the terminal windows to stop services
echo.
pause
