@echo off
cd /d "%~dp0"
if not exist .env.local copy .env.example .env.local >nul
start "" notepad "%~dp0.env.local"
echo In Notepad, replace the ANTHROPIC_API_KEY value with your valid Claude API key.
echo Save the file, close Notepad, then restart the garden.
pause
