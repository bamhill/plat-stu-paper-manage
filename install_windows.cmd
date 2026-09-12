@echo off
setlocal
cd /d "%~dp0"
set "DATABASE_URL=file:./data/dev.db"

echo [1/6] Checking Node.js 22+ ...
where node >nul 2>nul || (echo ERROR: Node.js not found. Install Node.js 22 LTS or newer. & exit /b 1)
for /f "tokens=1 delims=." %%V in ('node -p "process.versions.node"') do set NODE_MAJOR=%%V
if %NODE_MAJOR% LSS 22 (echo ERROR: Node.js 22+ required. Current: & node -v & exit /b 1)
node -v

echo [2/6] Read-only PlatShared detection ...
node scripts\check-platshared.mjs || exit /b 1

echo [3/6] Installing locked dependencies ...
call npm ci || exit /b 1

echo [4/6] Initializing Prisma and local data ...
call npm run setup || exit /b 1

echo [5/6] Running R19 + ModelAssist verification ...
call npm run verify:all || exit /b 1

echo [6/6] Building Next.js production application ...
call npm run build || exit /b 1

echo.
echo INSTALL PASS. Run start_windows.cmd.
exit /b 0
