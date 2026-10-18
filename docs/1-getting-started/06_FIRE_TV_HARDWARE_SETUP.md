# Fire TV Hardware & Android TV Emulator Setup 📺🎮

## Overview

Pandivo TV is engineered specifically for the 10-foot television living room experience. This guide details how to configure physical Amazon Fire TV devices (Fire TV Stick 4K, 4K Max, Fire TV Cube, Smart TVs) and setup an Android TV Virtual Device (AVD) emulator in Android Studio for rapid desktop iteration.

---

## 1. Physical Amazon Fire TV Device Configuration

### Step 1: Enable Developer Options
On modern Fire OS (Fire OS 7 and Fire OS 8), Developer Options are hidden by default:
1. Turn on your Fire TV and navigate to **Settings** (gear icon) on the top right.
2. Select **My Fire TV** (or **Device & Software** on some editions).
3. Select **About**.
4. Highlight the first item displaying your device's name (e.g. *Fire TV Stick 4K Max*).
5. **Press the remote's Center (Select) button 7 times consecutively**.
6. A toast notification will appear at the bottom: *"No need, you are already a developer."*
7. Press **Back** once. You will now see the new **Developer Options** menu.

### Step 2: Enable ADB Debugging
1. Open **Developer Options**.
2. Turn **ADB Debugging** to **ON**.
3. Turn **Apps from Unknown Sources** to **ON**.

### Step 3: Find the Fire TV IP Address
1. Go to **Settings -> My Fire TV -> About -> Network**.
2. Note the **IP Address** assigned to your Fire TV on your local Wi-Fi (e.g. `192.168.1.150`).

### Step 4: Connect via ADB over Wi-Fi
Ensure your development computer and your Fire TV are connected to the same local Wi-Fi network / subnet:

```bash
# Connect to the Fire TV
adb connect 192.168.1.150:5555

# Check connection status
adb devices
```

> [!IMPORTANT]
> The very first time you execute `adb connect`, an **"Allow USB debugging?"** prompt will appear on your TV screen. Check the box **"Always allow from this computer"** and select **OK** using your Fire TV remote.

---

## 2. Android TV Emulator Setup (Android Studio AVD)

If you don't have a physical Fire TV device connected, you can run the app inside an Android TV emulator on your development computer.

### Step 1: Create an Android TV Device
1. Open Android Studio and launch the **Device Manager** (*Tools -> Device Manager*).
2. Click **Create Device**.
3. Under **Category** on the left, select **TV**.
4. Choose **Television (1080p)** (1920 x 1080, 320 dpi). Click **Next**.

### Step 2: Select System Image
1. Select the **Release Name**:
   - **Android 14.0 ("UpsideDownCake") - API Level 34** (Google APIs), OR
   - **Android 11.0 ("Red Velvet Cake") - API Level 30** (Closest architectural match to Fire OS 8).
2. Click **Download** if the image is not yet installed, then click **Next**.

### Step 3: Configure Emulated Hardware & Audio
1. Under **Emulated Performance**, set **Graphics** to **Hardware - GLES 2.0** for smooth 60 FPS transitions.
2. Under **Memory and Internal Storage**:
   - RAM: `4096 MB`
   - VM Heap: `512 MB`
   - Internal Storage: `8192 MB`
3. Click **Finish**.

### Step 4: Enable Host Microphone Pass-Through
To test voice commands on the emulator:
1. Start the emulator.
2. In the emulator sidebar toolbar, click the **three dots (...)** for **Extended Controls**.
3. Select **Microphone**.
4. Check **Virtual microphone uses host audio input**.

---

## 3. Remote Control D-Pad Keyevent Cheatsheet

You can simulate physical Fire TV remote button presses directly from your terminal using ADB:

| Remote Button | Android Keycode | ADB Command |
|---|---|---|
| **D-Pad Up** | `19` | `adb shell input keyevent 19` |
| **D-Pad Down** | `20` | `adb shell input keyevent 20` |
| **D-Pad Left** | `21` | `adb shell input keyevent 21` |
| **D-Pad Right** | `22` | `adb shell input keyevent 22` |
| **Center / Select** | `23` | `adb shell input keyevent 23` |
| **Back** | `4` | `adb shell input keyevent 4` |
| **Play / Pause** | `85` | `adb shell input keyevent 85` |
| **Fast Forward** | `90` | `adb shell input keyevent 90` |
| **Rewind** | `89` | `adb shell input keyevent 89` |
| **Next Track** | `87` | `adb shell input keyevent 87` |
| **Previous Track** | `88` | `adb shell input keyevent 88` |
| **Voice / Alexa Mic** | `231` | `adb shell input keyevent 231` |

### Simulated Voice Command Broadcast:
If testing in an environment without physical audio input, you can send simulated voice input directly to Pandivo TV's native receiver:

```bash
adb shell am broadcast -a com.firetv.musicpoc.VOICE_INPUT --es query "Play chill lofi beats for studying"
```

---

## 4. Troubleshooting Connection Issues

### Problem: `adb connect` hangs or says `Connection refused`
1. Verify both the computer and Fire TV are on the exact same Wi-Fi SSID (disable guest network isolation or VPN).
2. Toggle **ADB Debugging** OFF and back ON in the Fire TV Settings.
3. Restart the ADB daemon on your computer:
   ```bash
   adb kill-server
   adb start-server
   adb connect <TV_IP>:5555
   ```

### Problem: `Device unauthorized`
Your computer's RSA key is not yet whitelisted on the TV.
1. Run `adb disconnect`.
2. Delete `~/.android/adbkey` and `~/.android/adbkey.pub` if corrupted.
3. Re-run `adb connect <TV_IP>:5555` and look at the TV screen to approve the authorization dialog.
