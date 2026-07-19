@echo off
title Housing Connect Apply
cd /d "%~dp0\.."

echo ============================================================
echo HOUSING CONNECT APPLY
echo ============================================================
echo.

echo [1/4] Killing Chrome...
taskkill /F /IM chrome.exe /T >nul 2>&1
timeout /t 5 /nobreak >nul
powershell -Command "Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force" >nul 2>&1
timeout /t 3 /nobreak >nul

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

echo [3/4] Checking deps...
python --version >nul 2>&1 || (echo ERROR: Python not found & pause & exit /b 1)
node --version >nul 2>&1 || (echo ERROR: Node.js not found & pause & exit /b 1)
node -e "require('playwright')" 2>nul || (echo Installing Playwright... & npm install playwright)

echo [4/4] Starting...
echo.
python scripts\housing-connect-apply.py %*

pause