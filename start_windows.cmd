@echo off
setlocal
cd /d "%~dp0"
set "DATABASE_URL=file:./data/dev.db"

where node >nul 2>nul || (echo ERROR: Node.js not found. Install Node.js 22 LTS or newer. & pause & exit /b 1)
for /f "tokens=1 delims=." %%V in ('node -p "process.versions.node"') do set NODE_MAJOR=%%V
if %NODE_MAJOR% LSS 22 (echo ERROR: Node.js 22+ required. Current: & node -v & pause & exit /b 1)

if not exist "node_modules\next\package.json" goto bootstrap
if not exist ".next\BUILD_ID" goto bootstrap
goto startapp

:bootstrap
echo First run: dependencies or production build are missing.
echo Running install_windows.cmd automatically ...
call install_windows.cmd
if errorlevel 1 (
  echo.
  echo INSTALL FAILED. Check network access to the npm registry and the error above.
  pause
  exit /b 1
)

:startapp
node scripts\check-platshared.mjs || exit /b 1
start "" cmd /c "timeout /t 3 /nobreak ^>nul ^& start http://127.0.0.1:3000"
call npm start
