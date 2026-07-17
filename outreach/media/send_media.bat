@echo off
REM Media Press Release Sender - launches Chrome and sends emails
REM =====================================

title Media Press Release Sender
color 0A

echo.
echo  ============================================================
echo    MEDIA PRESS RELEASE SENDER
echo    Cosmic Blues Band - Blues Media Outreach
echo  ============================================================
echo.

REM Kill Chrome and clean locks
echo  [1/3] Killing Chrome...
taskkill /F /IM chrome.exe /T >nul 2>&1
timeout /t 5 /nobreak >nul
powershell -Command "Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force" >nul 2>&1
timeout /t 3 /nobreak >nul

REM Clean lock files
echo  [2/3] Cleaning locks...
set "UD=%LOCALAPPDATA%\Google\Chrome\User Data"
set "P3=%UD%\Profile 3"
if exist "%P3%\LOCK" del /f /q "%P3%\LOCK" >nul 2>&1
if exist "%P3%\DevToolsActivePort" del /f /q "%P3%\DevToolsActivePort" >nul 2>&1
if exist "%P3%\Current Session" del /f /q "%P3%\Current Session" >nul 2>&1
if exist "%P3%\Current Tabs" del /f /q "%P3%\Current Tabs" >nul 2>&1
if exist "%UD%\SingletonLock" del /f /q "%UD%\SingletonLock" >nul 2>&1
if exist "%UD%\SingletonCookie" del /f /q "%UD%\SingletonCookie" >nul 2>&1
if exist "%UD%\SingletonSocket" del /f /q "%UD%\SingletonSocket" >nul 2>&1

REM Check dependencies
echo  [3/3] Checking dependencies...
python --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found!
    pause
    exit /b 1
)
node --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found!
    pause
    exit /b 1
)
node -e "require('playwright')" >nul 2>&1
if errorlevel 1 (
    echo  [WARNING] Installing Playwright...
    call npm install playwright
)

echo.
echo  Starting Media Sender...
echo.
timeout /t 1 /nobreak >nul

cd /d "%~dp0"
python send_media.py

if errorlevel 1 (
    echo.
    echo  [ERROR] Script exited with error.
    pause
)