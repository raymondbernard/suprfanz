@echo off
REM ============================================
REM SEND ALL - Email Outreach Launcher
REM Points to: SEND_ALL_VENUES.py (main script)
REM ============================================

echo ============================================
echo COSMIC BLUES - EMAIL OUTREACH
echo ============================================
echo.

cd /d "%~dp0"

echo Launching SEND_ALL_VENUES.py...
echo.
python SEND_ALL_VENUES.py

if errorlevel 1 (
    echo.
    echo [ERROR] Script exited with error.
    pause
)