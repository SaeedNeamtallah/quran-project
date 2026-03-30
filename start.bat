@echo off
title Quranic Pomodoro
color 0A
echo Starting Quranic Pomodoro Application...
echo.
python -m pip install -r requirements.txt
echo.
echo Starting the backend server...
start http://127.0.0.1:8080/
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8080
pause
