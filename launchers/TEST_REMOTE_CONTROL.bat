@echo off
set ADB="%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
%ADB% -s emulator-5554 reverse tcp:8081 tcp:8081
%ADB% -s emulator-5554 shell input keyevent 224
%ADB% -s emulator-5554 shell am start -n com.firetv.musicpoc/.MainActivity
ping 127.0.0.1 -n 3 >nul
%ADB% -s emulator-5554 shell screencap -p /sdcard/tv_live.png
%ADB% -s emulator-5554 pull /sdcard/tv_live.png "%~dp0tv_live.png"
