# Pandivo TV: Launchers & Automation Scripts 🚀📺

Welcome to the **Pandivo TV** automated launcher suite. This directory contains helper scripts designed to streamline local Fire TV development, emulator boot sequences, ADB port configuration, and remote control D-pad simulation.

---

## ⚡ The Quick Start: Which Script Should I Run?

If you just want to install and launch Pandivo TV on a connected Fire TV or emulator:

👉 **Double-click:** [`INSTALL_AND_OPEN_TV_APP.bat`](./INSTALL_AND_OPEN_TV_APP.bat)  
*(Or for PowerShell: `.\launch_gui_app.ps1`)*

This all-in-one script automatically:
1. Detects your connected Fire TV device or running emulator via ADB.
2. Establishes the Metro reverse bridge (`adb reverse tcp:8081 tcp:8081`).
3. Installs the release/debug APK.
4. Launches the main Leanback TV activity (`com.firetv.musicpoc/.MainActivity`).

---

## 📋 Complete Launcher Catalog & Directory Index

The 9 scripts in this directory are grouped into **4 core development workflows**, available in both Windows Command Prompt (`.bat`) and PowerShell (`.ps1`):

| Category | Windows Batch (`.bat`) | PowerShell (`.ps1`) | Purpose & Behavior |
|---|---|---|---|
| **🚀 Full App Launch** | [`INSTALL_AND_OPEN_TV_APP.bat`](./INSTALL_AND_OPEN_TV_APP.bat) | [`launch_gui_app.ps1`](./launch_gui_app.ps1) | **Primary Launcher**: Connects ADB, maps reverse ports, installs the APK, and opens the app on TV. |
| **🌐 Metro Bundler** | [`START_METRO.bat`](./START_METRO.bat) | — | Launches Metro packager on `localhost:8081` with `EXPO_TV=1` environment flags. |
| **📺 TV Emulator Boot** | [`start_tv_emulator.bat`](./start_tv_emulator.bat) | [`start_gui_emulator.ps1`](./start_gui_emulator.ps1) | Locates Android Studio SDK and boots the `Television_1080p` AVD emulator. |
| **📺 Emulator Shortcut**| [`RUN_EMULATOR_AND_VERIFY.bat`](./RUN_EMULATOR_AND_VERIFY.bat) | [`start_emulator_only.ps1`](./start_emulator_only.ps1) | Quick-boot shortcut to start the emulator window headlessly. |
| **🎮 Remote D-Pad Test** | [`TEST_REMOTE_CONTROL.bat`](./TEST_REMOTE_CONTROL.bat) | [`test_remote.ps1`](./test_remote.ps1) | Injects Fire TV remote keycodes (`DPAD_DOWN`, `DPAD_CENTER`, `BACK`) to test focus graphs without physical remote. |

---

## ❓ Frequently Asked Questions

### Why are there both `.bat` and `.ps1` files?
- **`.bat` files:** Standard Windows Batch files designed for 1-click execution. You can simply double-click them directly from Windows Explorer.
- **`.ps1` files:** PowerShell scripts engineered with interactive desktop session hooks (`WinSta0\Default`) to programmatically manage window handles and capture exit codes during CI/CD test runs.

### How do I run using standard npm commands instead?
If you prefer not using batch scripts, you can run all equivalent tasks from your terminal:
```bash
# Start Metro bundler
npm start

# Build, install, and run on connected TV
npm run android
```

---

## 📚 Related Documentation
- [Quick Start Guide (`01_QUICKSTART_GUIDE.md`)](../docs/1-getting-started/01_QUICKSTART_GUIDE.md)
- [Fire TV Wireless Hardware Setup (`06_FIRE_TV_HARDWARE_SETUP.md`)](../docs/1-getting-started/06_FIRE_TV_HARDWARE_SETUP.md)
- [Remote D-Pad Navigation & Simulation (`08_TV_REMOTE_SIMULATION.md`)](../docs/1-getting-started/08_TV_REMOTE_SIMULATION.md)
