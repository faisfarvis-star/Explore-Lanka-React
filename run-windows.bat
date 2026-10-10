@echo off
cd /d "%~dp0"
if not exist .env copy .env.example .env >nul
if not exist node_modules (
  echo Installing JavaScript packages for the first run...
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo Start MySQL in XAMPP, then open http://localhost:5173
call npm run dev
pause
