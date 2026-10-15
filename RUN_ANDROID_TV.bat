@echo off
title Pandivo TV - Run Android TV Application
color 0b
cd /d "%~dp0"

echo ========================================================
echo   PANDIVO TV: Run on Fire TV / Android TV Device
echo ========================================================
echo.

:: Check ADB connection
where adb >nul 2>nul
if %errorlevel% equ 0 (
    echo [1/3] Checking connected ADB devices...
    adb devices
    echo.
    echo [2/3] Setting up Metro port reverse forwarding (8081)...
    adb reverse tcp:8081 tcp:8081
) else (
    echo [WARNING] ADB not found in system PATH. Proceeding with expo run...
)

echo.
echo [3/3] Compiling and launching Pandivo TV app (EXPO_TV=1)...
echo.

set EXPO_TV=1
call npx expo run:android

echo.
echo Application run script finished.
pause
