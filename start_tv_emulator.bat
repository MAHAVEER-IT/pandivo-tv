@echo off
title Fire TV Music - Emulator & App Launcher
color 0b
echo ========================================================
echo   FIRE TV MUSIC: 1080p Emulator + App Auto-Launcher
echo ========================================================
echo.

set ADB="%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
set EMULATOR="%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe"

echo [1/4] Checking Android TV 1080p Emulator...
%ADB% devices | findstr "emulator" >nul
if %errorlevel% equ 0 (
    echo [OK] Emulator is already running!
) else (
    echo [INFO] Starting Android TV 1080p Emulator in GUI mode...
    start "" %EMULATOR% -avd Television_1080p
    echo [INFO] Waiting for emulator to connect to ADB...
    %ADB% wait-for-device
)

echo [2/4] Waiting for Android TV system to complete boot...
:wait_boot
for /f "tokens=*" %%a in ('%ADB% shell getprop sys.boot_completed 2^>nul') do set BOOT_STATE=%%a
if not "%BOOT_STATE%"=="1" (
    timeout /t 2 /nobreak >nul
    goto wait_boot
)
echo [OK] Android TV system boot completed!

echo [3/4] Reversing Metro bundler port 8081...
%ADB% reverse tcp:8081 tcp:8081
echo [OK] Port 8081 reversed to Metro!

powershell -Command "try { if ((Invoke-WebRequest -Uri 'http://localhost:8081/status' -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Metro bundler is already running on port 8081!
) else (
    echo [INFO] Starting Metro bundler with EXPO_TV=1...
    start "Metro Bundler - Fire TV Music" cmd /k "cd /d \"%~dp0\" && set EXPO_TV=1&& npx expo start -c"
    echo [INFO] Waiting for Metro bundler to initialize...
    timeout /t 5 /nobreak >nul
)

:: Check if com.firetv.musicpoc package is installed
set APK_PATH="%~dp0android\app\build\outputs\apk\debug\app-debug.apk"
if not exist %APK_PATH% (
    set APK_PATH="%~dp0..\android\app\build\outputs\apk\debug\app-debug.apk"
)

%ADB% shell pm list packages | findstr "com.firetv.musicpoc" >nul
if %errorlevel% neq 0 (
    echo [INFO] Fire TV Music is not installed on emulator. Installing APK now...
    if exist %APK_PATH% (
        %ADB% install -r %APK_PATH%
        echo [OK] App installed successfully!
    ) else (
        echo [WARN] APK not found at %APK_PATH%!
    )
)

echo [4/4] Launching Fire TV Music Application...
%ADB% shell am start -n com.firetv.musicpoc/.MainActivity
echo.
echo ========================================================
echo   APP LAUNCHED SUCCESSFULLY!
echo ========================================================
echo.
echo  VERIFICATION GUIDE:
echo  --------------------------------------------------------
echo  1. Watch the 2.7s Cinematic Intro:
echo     - Deep black canvas (#0B0D12) + low swell atmosphere
echo     - Tiny point of light -> circular pulse ('whoom')
echo     - Organic waveform stretches (white -> subtle violet)
echo     - Sonic brand logo locks ('... ting' signature chime)
echo     - Logo glides into header dock; Home screen appears
echo.
echo  2. Controls (Keyboard or TV Remote side panel):
echo     - ARROW KEYS    : D-Pad Navigation (Up/Down/Left/Right)
echo     - ENTER         : Select / Click
echo     - BACKSPACE/ESC : Back
echo     - Select [REPLAY INTRO] button to watch it again anytime!
echo.
echo ========================================================
echo Press any key to reload app (send 'rr'), or close this window.
pause >nul
%ADB% shell input text "rr"
echo Reload command sent!
pause
