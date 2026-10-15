@echo off
title Pandivo TV - Metro Bundler (EXPO_TV=1)
color 0a
cd /d "%~dp0"

echo ========================================================
echo   PANDIVO TV: Metro Development Bundler
echo ========================================================
echo.
echo Starting Metro in Android TV Mode (EXPO_TV=1) with cache reset...
echo.

set EXPO_TV=1
call npx expo start -c

echo.
echo Metro bundler closed.
pause
