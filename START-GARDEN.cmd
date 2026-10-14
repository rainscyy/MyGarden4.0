@echo off
setlocal
where node >nul 2>nul
if errorlevel 1 (
 echo Please install Node.js 22 or later, then double-click this file again.
 pause
 exit /b 1
)
set "GARDEN_RUNTIME=%LOCALAPPDATA%\OurCognitiveGardens"
robocopy "%~dp0." "%GARDEN_RUNTIME%" /E /XD node_modules .next .git .garden-data /XF START-GARDEN.cmd CONFIGURE-CLAUDE.cmd /NFL /NDL /NJH /NJS >nul
if errorlevel 8 (
 echo Could not copy the project. Ensure OneDrive files are available locally.
 pause
 exit /b 1
)
cd /d "%GARDEN_RUNTIME%"
call npm install --no-audit --no-fund
if errorlevel 1 (
 pause
 exit /b 1
)
start "" http://localhost:3000
call npm run dev -- --hostname 127.0.0.1
pause
