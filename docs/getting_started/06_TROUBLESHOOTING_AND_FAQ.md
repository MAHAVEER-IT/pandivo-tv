# Troubleshooting & Frequently Asked Questions 🛠️❓

This guide provides fixes for common setup, build, and runtime issues when running **Pandivo TV**.

---

## 1. Port 8081 Conflict (`EADDRINUSE`)

### Symptom:
When running `START_METRO.bat` or `npx expo start`, Metro crashes with:
```
Error: listen EADDRINUSE: address already in use :::8081
```

### Cause:
Another Metro instance, Node process, or Docker container is occupying port `8081`.

### Solution:

**Windows (PowerShell):**
```powershell
# Kill whatever process is holding port 8081
npx kill-port 8081
```
Or find the PID manually:
```cmd
netstat -ano | findstr :8081
taskkill /F /PID <PID_FROM_OUTPUT>
```

**macOS / Linux:**
```bash
npx kill-port 8081
# Or:
lsof -ti:8081 | xargs kill -9
```

---

## 2. Red Screen: "Unable to load script from assets index.android.bundle"

### Symptom:
The TV app launches but displays a red or white screen saying it cannot connect to the development server or load the bundle.

### Cause:
The TV device cannot route network traffic back to your computer's `localhost:8081`.

### Solution:

1. **Ensure ADB Port Reversal is Active**:
   While your TV or emulator is connected, run:
   ```bash
   adb reverse tcp:8081 tcp:8081
   ```
2. **Reload Application**:
   Press **`r`** in the Metro bundler terminal, or run:
   ```bash
   adb shell input keyevent 82 # Opens Dev menu
   ```
   Select **"Reload"**.
3. **If connecting over Wi-Fi without port reversal**:
   - Open Developer Menu on the TV (press Menu button on remote, or `adb shell input keyevent 82`).
   - Select **"Settings"** -> **"Debug server host & port for device"**.
   - Enter your computer's local Wi-Fi IP address (e.g. `192.168.1.50:8081`).
   - Press Back and Reload.

---

## 3. ADB Device Shows `unauthorized` or `offline`

### Symptom:
Running `adb devices` shows:
```
192.168.1.145:5555    unauthorized
```

### Solution:
1. Turn on your television. A permission prompt will be visible on screen:
   **"Allow USB debugging? The computer's RSA key fingerprint is..."**
2. Check the box **"Always allow from this computer"** using your Fire TV remote.
3. Select **OK**.
4. If the prompt does not appear, restart ADB:
   ```bash
   adb kill-server
   adb start-server
   adb connect <TV_IP>:5555
   ```

---

## 4. CMake / NDK Build Error during `whistle_native` Compilation

### Symptom:
`npx expo run:android` fails inside `:app:buildCMakeDebug[arm64-v8a]` with:
```
No version of NDK matched the requested version 26.1.10909125
```
or
```
CMake '3.22.1' was not found in SDK
```

### Solution:
1. Open **Android Studio** -> **Settings** -> **Languages & Frameworks** -> **Android SDK** -> **SDK Tools**.
2. Check **Show Package Details** in the bottom right corner.
3. Expand **NDK (Side by side)** and ensure version **`26.1.10909125`** is checked and installed.
4. Expand **CMake** and ensure version **`3.22.1`** is checked and installed.
5. Click **Apply** to install the components.

---

## 5. Microphone Permission Dialog Stuck or Denied on TV

### Symptom:
Clicking the Voice / Microphone button shows *"⚠️ Microphone permission not granted"*.

### Solution:
On Android TV, permission modals can occasionally be skipped or blocked by system UI overlays. You can grant audio recording permission directly via ADB:

```bash
adb shell pm grant com.firetv.musicpoc android.permission.RECORD_AUDIO
```

This permanently unlocks the microphone pipeline for the on-device Whistle engine.

---

## 6. Audio is Silent on Android TV Emulator

### Symptom:
Tracks play and progress bar moves, but no sound is heard from PC speakers.

### Solution:
1. Open **Android Studio Device Manager**.
2. Click the Pencil (Edit) icon next to your `Television_1080p` AVD.
3. Click **Show Advanced Settings**.
4. Scroll to **Device Frame** and **Audio**.
5. Ensure **Audio Output** is set to **Host audio output**.
6. Restart the emulator with a cold boot (**Cold Boot Now** from the dropdown menu).

---

## 7. Fast Clean & Rebuild

If you ever need to reset the native Android build environment completely:

```bash
# Clean Android Gradle caches
cd android
./gradlew clean
cd ..

# Clear Metro cache and start
npx expo start -c
```
*(On Windows, use `gradlew.bat clean`)*
