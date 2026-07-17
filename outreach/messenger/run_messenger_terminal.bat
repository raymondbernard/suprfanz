@echo off
REM Facebook Messenger Terminal v2.0 - Full Launcher
REM =====================================
REM Kills Chrome, cleans ALL lock files, THEN runs terminal
REM The Python script just launches Chrome - cleanup happens here first

title Facebook Messenger Terminal
color 0A

echo.
echo  ============================================================
echo    FACEBOOK MESSENGER AUTOMATION TERMINAL v2.0
echo  ============================================================
echo.

REM Step 1: Kill ALL Chrome processes
echo  [1/4] Killing Chrome processes...
taskkill /F /IM chrome.exe /T >nul 2>&1
timeout /t 5 /nobreak >nul
powershell -Command "Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force" >nul 2>&1
timeout /t 3 /nobreak >nul

REM Step 2: Clean ALL lock and session files
echo  [2/4] Cleaning lock files...
set "UD=%LOCALAPPDATA%\Google\Chrome\User Data"
set "P3=%UD%\Profile 3"

if exist "%P3%\LOCK" del /f /q "%P3%\LOCK" >nul 2>&1
if exist "%P3%\DevToolsActivePort" del /f /q "%P3%\DevToolsActivePort" >nul 2>&1
if exist "%P3%\Current Session" del /f /q "%P3%\Current Session" >nul 2>&1
if exist "%P3%\Current Tabs" del /f /q "%P3%\Current Tabs" >nul 2>&1
if exist "%UD%\SingletonLock" del /f /q "%UD%\SingletonLock" >nul 2>&1
if exist "%UD%\SingletonCookie" del /f /q "%UD%\SingletonCookie" >nul 2>&1
if exist "%UD%\SingletonSocket" del /f /q "%UD%\SingletonSocket" >nul 2>&1

REM Step 3: Check dependencies
echo  [3/4] Checking dependencies...
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

REM Step 4: Launch the terminal
echo  [4/4] Starting Messenger Terminal...
echo.
timeout /t 1 /nobreak >nul

cd /d "%~dp0"
python messenger_terminal.py

if errorlevel 1 (
    echo.
    echo  [ERROR] Terminal exited with error.
    pause
)