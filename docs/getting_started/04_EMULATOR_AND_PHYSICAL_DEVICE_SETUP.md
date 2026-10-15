# Emulator & Physical Device Setup Guide 📺📱

This document walks you through launching **Pandivo TV** on either:
1. **An Android TV Emulator** (Local PC development without physical hardware)
2. **A Physical Amazon Fire TV Stick / Cube** (Real living-room television testing)

---

## 🖥️ Strategy 1: Android TV Emulator Setup

### 1. Create an Android TV Virtual Device (AVD)
1. Open **Android Studio**.
2. Click **Virtual Device Manager** (or Tools -> Device Manager).
3. Click **Create Device** (+).
4. Select Category: **TV**.
5. Select Profile: **Television (1080p)** (1920 x 1080 @ 320 dpi).
6. Click **Next** and select **API Level 34** (System Image: *Android TV Intel x86 Atom* or *ARM 64 v8a*).
7. Name the AVD: `Television_1080p` and click **Finish**.

### 2. Launch the Emulator
You can launch the emulator directly from Android Studio, or run the convenience script:

**Windows (Batch):**
```cmd
.\launchers\start_tv_emulator.bat
```

**macOS / Linux:**
```bash
$ANDROID_HOME/emulator/emulator -avd Television_1080p
```

Verify that ADB sees the emulator:
```bash
adb devices
# Output should list: emulator-5554   device
```

---

## 📺 Strategy 2: Physical Amazon Fire TV Setup

To run directly on an Amazon Fire TV Stick, Fire TV Cube, or Fire TV Smart TV:

### 1. Enable Developer Options on Fire OS
1. From the Fire TV home screen, navigate to **Settings** (gear icon on the right).
2. Select **My Fire TV** (or **Device & Software**).
3. Select **About**.
4. Highlight the first item (e.g. **Fire TV Stick 4K Max**) and **press the remote's Center button 7 times rapidly**.
5. A toast will appear: *"No need, you are already a developer."*
6. Press **Back**; you will now see a new menu item: **Developer Options**.
7. Open **Developer Options** and turn:
   - **ADB Debugging**: **ON**
   - **Install unknown apps** / **Unknown Sources**: **ON**

### 2. Find Your Fire TV's Local IP Address
1. In **Settings** -> **My Fire TV** -> **About** -> **Network**.
2. Note the **IP Address** (e.g., `192.168.1.145`).
3. Ensure your computer and Fire TV are on the **exact same Wi-Fi network**.

### 3. Connect Wireless ADB
Open a terminal on your computer and connect:

```bash
adb connect 192.168.1.145:5555
```

> [!IMPORTANT]
> Look at your television screen! A dialog will pop up:
> **"Allow USB debugging?"**
> Check **"Always allow from this computer"** and select **OK**.

Verify the connection:
```bash
adb devices
# Output:
# 192.168.1.145:5555    device
```

---

## 🔄 3. Reverse Port Forwarding for Metro (Essential!)

For your Fire TV to communicate with the Metro bundler running on your PC, configure reverse socket forwarding:

```bash
adb reverse tcp:8081 tcp:8081
```

*(This automatically forwards port 8081 requests from the TV back to your development machine's Metro server).*

---

## 🚀 4. Compile & Launch the Application

With Metro running in Terminal 1, open **Terminal 2** to build and install the native Android APK.

### Option A: Windows 1-Click Launch (`RUN_ANDROID_TV.bat`)
Double-click `RUN_ANDROID_TV.bat` in the project root:
```cmd
.\RUN_ANDROID_TV.bat
```
This batch script automatically sets `adb reverse`, configures `EXPO_TV=1`, compiles native C++ Whistle libraries, and launches the app on your TV!

### Option B: Cross-Platform Terminal Command
**Windows (PowerShell):**
```powershell
$env:EXPO_TV = "1"
adb reverse tcp:8081 tcp:8081
npx expo run:android
```

**macOS / Linux:**
```bash
EXPO_TV=1 adb reverse tcp:8081 tcp:8081
EXPO_TV=1 npx expo run:android
```

### Option C: Launch Existing Pre-Built APK (`launchers/INSTALL_AND_OPEN_TV_APP.bat`)
If you have already compiled an APK, you can instantly install and open it on the TV without recompiling:
```cmd
.\launchers\INSTALL_AND_OPEN_TV_APP.bat
```

---

## Next Step

Once the app boots on your TV screen, proceed to [**`05_TV_REMOTE_SIMULATION_AND_TESTING.md`**](./05_TV_REMOTE_SIMULATION_AND_TESTING.md) to learn how to control and test the app using keyboard shortcuts and ADB remote commands!
