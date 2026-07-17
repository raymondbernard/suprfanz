@echo off
echo ============================================
echo COSMIC RAY - MESSENGER AUTOMATION TERMINAL v2.0
echo ============================================
echo.
echo Launching the new Messenger Terminal...
echo.
echo Features:
echo   - Duplicate prevention (never sends twice)
echo   - Rate-limited messaging
echo   - Batch controls
echo   - Multiple message styles
echo   - Interactive menu system
echo ============================================
echo.
pause
cd /d "%~dp0fbfriends"
call run_messenger_terminal.bat
