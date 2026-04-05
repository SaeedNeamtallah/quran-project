@echo off
title Quranic Pomodoro Next
echo Starting Quranic Pomodoro migration workspace...
echo.
echo 1. Start the legacy FastAPI backend from the parent project if it is not already running.
echo 2. Install Node.js 20+ if this machine does not have node available.
echo 3. Run npm install inside "new q".
echo.
set FASTAPI_BASE_URL=http://127.0.0.1:8080
npm run dev
pause
