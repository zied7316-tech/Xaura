@echo off
echo ========================================
echo   Starting Xaura Platform
echo ========================================
echo.
echo Killing any existing Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting Backend Server (Port 5000)...
start "Xaura Backend" cmd /k "cd backend && npm run dev"
timeout /t 5 /nobreak >nul

echo Starting Frontend Server (Port 3000)...
start "Xaura Frontend" cmd /k "cd web && npm run dev"

echo.
echo ========================================
echo   Servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Two command windows will open.
echo Keep them open while using Xaura.
echo.
echo Press any key to close this window...
pause >nul




