@echo off
setlocal
cd /d "%~dp0"
set "DATABASE_URL=file:./data/dev.db"
where node >nul 2>nul || (echo ERROR: Node.js not found. & exit /b 1)
node scripts\check-platshared.mjs || exit /b 1
call npm run verify:all || exit /b 1
if exist ".next\BUILD_ID" (
  echo PASS: production build marker exists.
) else (
  echo NOTE: production build marker is absent; run install_windows.cmd before formal deployment.
)
exit /b 0
