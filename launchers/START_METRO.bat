@echo off
title Metro Bundler - Fire TV Music
cd /d "%~dp0.."
set EXPO_TV=1
npx expo start -c
pause
