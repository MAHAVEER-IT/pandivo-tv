@echo off
title Fire TV Music - Install & Open TV App
color 0b

echo ========================================================
echo   FIRE TV MUSIC: Install & Open on TV Emulator
echo ========================================================
echo.

:: 1. Locate ADB
set ADB="%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
if not exist %ADB% (
    where adb >nul 2>nul
    if %errorlevel% equ 0 (
        set ADB=adb
    ) else (
        echo [ERROR] ADB not found in %LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe or PATH.
        echo Please ensure Android SDK is installed.
        pause
        exit /b 1
    )
)

:: 2. Locate Emulator
set EMULATOR="%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe"

:: 3. Locate APK
set APK_PATH="%~dp0android\app\build\outputs\apk\debug\app-debug.apk"
if not exist %APK_PATH% (
    set APK_PATH="%~dp0..\android\app\build\outputs\apk\debug\app-debug.apk"
)

if not exist %APK_PATH% (
    echo [ERROR] APK file not found at:
    echo %APK_PATH%
    echo Please make sure the project is built.
    pause
    exit /b 1
)

:: 4. Check if Emulator is Running
echo [1/5] Checking Android TV 1080p Emulator...
%ADB% devices | findstr "emulator" >nul
if %errorlevel% equ 0 (
    echo [OK] Emulator is already running!
) else (
    echo [INFO] Emulator not detected. Starting Television_1080p...
    if exist %EMULATOR% (
        start "" %EMULATOR% -avd Television_1080p
        echo [INFO] Waiting for emulator to start...
        %ADB% wait-for-device
    ) else (
        echo [ERROR] Emulator executable not found.
        pause
        exit /b 1
    )
)

:: 5. Wait for Boot Completion
echo [2/5] Waiting for Android TV system to complete boot...
:wait_boot
for /f "tokens=*" %%a in ('%ADB% shell getprop sys.boot_completed 2^>nul') do set BOOT_STATE=%%a
if not "%BOOT_STATE%"=="1" (
    timeout /t 2 /nobreak >nul
    goto wait_boot
)
echo [OK] Android TV system boot completed!

:: 6. Reverse Metro Bundler Port 8081
echo [3/5] Reversing Metro bundler port 8081...
%ADB% reverse tcp:8081 tcp:8081
echo [OK] Port 8081 reversed to Metro!

:: 7. Check / Start Metro Bundler
echo [4/5] Checking Metro Bundler...
powershell -Command "try { if ((Invoke-WebRequest -Uri 'http://localhost:8081/status' -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Metro bundler is already running on port 8081!
) else (
    echo [INFO] Starting Metro bundler with EXPO_TV=1...
    start "Metro Bundler - Fire TV Music" cmd /k "cd /d \"%~dp0\" && set EXPO_TV=1&& npx expo start -c"
    echo [INFO] Waiting for Metro bundler to initialize...
    timeout /t 5 /nobreak >nul
)

:: 8. Install APK to Emulator
echo [5/5] Installing Fire TV Music APK to Emulator...
%ADB% install -r %APK_PATH%
if %errorlevel% equ 0 (
    echo [OK] APK installed successfully!
) else (
    echo [WARN] Install returned non-zero code. Trying to proceed...
)

:: 9. Launch the App
echo.
echo Launching Fire TV Music Application...
%ADB% shell am start -n com.firetv.musicpoc/.MainActivity
echo.

echo ========================================================
echo   FIRE TV MUSIC APP IS RUNNING ON THE TV EMULATOR!
echo ========================================================
echo.
echo  REMOTE / KEYBOARD NAVIGATION:
echo  --------------------------------------------------------
echo   - ARROW KEYS    : D-Pad Navigation (Up/Down/Left/Right)
echo   - ENTER         : Select / Click / Play / Pause
echo   - ESC / BACK    : Back button
echo.
echo  SHORTCUTS:
echo   - Press [R] key in this window to reload the app (sends 'rr')
echo   - Or close this window anytime.
echo ========================================================
echo.

:menu_loop
set /p USER_CHOICE="Press [R] to Reload app, [O] to Re-open app, or [Q] to Quit: "
if /i "%USER_CHOICE%"=="R" (
    echo Sending reload command...
    %ADB% shell input text "rr"
    echo [OK] Reload signal sent!
    goto menu_loop
)
if /i "%USER_CHOICE%"=="O" (
    echo Opening app...
    %ADB% reverse tcp:8081 tcp:8081
    %ADB% shell am start -n com.firetv.musicpoc/.MainActivity
    echo [OK] App launched!
    goto menu_loop
)
if /i "%USER_CHOICE%"=="Q" exit /b 0
goto menu_loop
