# Running Metro Bundler & Windows Batch Files ⚡🎛️

Metro is the JavaScript development bundler for React Native. It compiles TypeScript code, packages bundled assets, and streams the application bundle directly into your connected Fire TV device or emulator.

---

## 🚀 1. Easy One-Click Run (Windows `.bat` Files)

For developers on Windows, **Pandivo TV provides ready-to-run batch files** so you don't have to manually remember environment flags or type long terminal commands.

### Option A: Root `START_METRO.bat` (Recommended)
Simply open the project folder in Windows File Explorer and **double-click**:
```
pandivo-tv/START_METRO.bat
```

### Option B: Launch from Command Line
You can also trigger it from Windows PowerShell or Command Prompt:
```cmd
.\START_METRO.bat
```

### Option C: `launchers/START_METRO.bat`
Inside the `launchers/` directory, an identical convenience launcher is provided:
```cmd
.\launchers\START_METRO.bat
```

---

## 🔍 What the Batch File Does Behind the Scenes

When you double-click `START_METRO.bat`, it executes the following automated sequence:

```bat
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
```

### Why These Flags Matter:
1. **`set EXPO_TV=1`**:
   - **Crucial for Television apps!** This environment variable instructs Expo's configuration plugin (`@react-native-tvos/config-tv`) and Metro to enable Android TV leanback mode, load TV-specific focus engines, and disable standard phone touchscreen behaviors.
2. **`npx expo start -c`**:
   - The **`-c` flag** (clean cache) flushes stale Metro transformation caches, ensuring all TypeScript modifications, SQLite schemas, and audio asset references are freshly bundled.

---

## 💻 2. Manual Terminal Launch (Cross-Platform)

If you are developing on **macOS**, **Linux**, or prefer a manual terminal session:

### macOS / Linux (Bash / Zsh):
```bash
# Export the TV environment flag and start Metro with clean cache
EXPO_TV=1 npx expo start -c
```

### Windows (PowerShell):
```powershell
$env:EXPO_TV = "1"
npx expo start -c
```

---

## 🖥️ 3. Understanding the Metro Terminal Interface

Once Metro initializes, you will see the interactive Metro CLI banner:

```
Starting Metro Bundler
Android TV Mode: EXPO_TV=1 Enabled

› Metro waiting on http://localhost:8081
› Scan the QR code or press one of the keys below:

› Press a │ open Android
› Press r │ reload app on connected TV / emulator
› Press m │ toggle dev menu on TV screen
› Press j │ open debugger
› Press c │ clear console logs
```

### Useful Keyboard Shortcuts in Metro:
- **`r`**: Immediately triggers a live reload of the TV application on your connected Fire TV without recompiling native code.
- **`m`**: Opens the React Native Developer Menu on the TV screen (Inspect Element, Perf Monitor, Remote JS Debugging).
- **`c`**: Clears terminal log noise.

---

## ⚠️ Important: Keep Metro Running in the Background

> [!IMPORTANT]
> **Do not close the Metro window!**
> The Metro bundler must remain running in its terminal window while you are developing and testing. When the TV app boots, it connects back to Metro via port `8081` to download the active JavaScript bundle.

Now that Metro is running, open a **second terminal** and proceed to [**`04_EMULATOR_AND_PHYSICAL_DEVICE_SETUP.md`**](./04_EMULATOR_AND_PHYSICAL_DEVICE_SETUP.md) to launch the app on an emulator or Fire TV!
