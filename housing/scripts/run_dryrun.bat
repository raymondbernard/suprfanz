@echo off
title Housing Connect Dry Run
cd /d "%~dp0\.."

echo ============================================================
echo HOUSING CONNECT DRY RUN — Form Inspection
echo No applications will be submitted.
echo ============================================================
echo.

REM Kill Chrome
echo [1/4] Killing Chrome...
taskkill /F /IM chrome.exe /T >nul 2>&1
timeout /t 5 /nobreak >nul
powershell -Command "Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force" >nul 2>&1
timeout /t 3 /nobreak >nul

REM Clean locks
echo [2/4] Cleaning locks...
set "UD=%LOCALAPPDATA%\Google\Chrome\User Data"
set "P3=%UD%\Profile 3"
if exist "%P3%\LOCK" del /f /q "%P3%\LOCK" >nul 2>&1
if exist "%P3%\DevToolsActivePort" del /f /q "%P3%\DevToolsActivePort" >nul 2>&1
if exist "%P3%\Current Session" del /f /q "%P3%\Current Session" >nul 2>&1
if exist "%P3%\Current Tabs" del /f /q "%P3%\Current Tabs" >nul 2>&1
if exist "%UD%\SingletonLock" del /f /q "%UD%\SingletonLock" >nul 2>&1
if exist "%UD%\SingletonCookie" del /f /q "%UD%\SingletonCookie" >nul 2>&1
if exist "%UD%\SingletonSocket" del /f /q "%UD%\SingletonSocket" >nul 2>&1

REM Check deps
echo [3/4] Checking deps...
python --version >nul 2>&1 || (echo ERROR: Python not found & pause & exit /b 1)
node --version >nul 2>&1 || (echo ERROR: Node.js not found & pause & exit /b 1)
node -e "require('playwright')" 2>nul || (echo Installing Playwright... & npm install playwright)

REM Run
echo [4/4] Starting dry run...
echo.
python scripts\housing-connect-dryrun.py

pause