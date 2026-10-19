# Build, Run, and Automated Verification Guide 🚀🧪

## Overview

This guide provides end-to-end instructions for compiling, bundling, deploying, and verifying **Pandivo TV** on physical Fire TV devices and Android TV emulators. It also details the automated test suites that guarantee Amazon Appstore compliance.

---

## 1. Development Build & Live Reloading

Pandivo TV uses **Expo CLI** configured with the TV target environment (`EXPO_TV=1`).

### Step 1: Ensure Your Device is Connected
```bash
adb devices
# Verify at least one device or emulator shows "device"
```

### Step 2: Start the Metro Bundler
In a dedicated terminal tab, start Metro with cache clean:
```bash
npm start -- -c
```

### Step 3: Compile and Install on TV
In a second terminal window, launch the native Android build:
```bash
npm run android
```

This command executes Gradle under the hood, compiles C++ JNI sources (`libwhistle_native.so`), packages assets (`whistle.cact`), generates the debug APK, and installs it onto your connected Fire TV device via ADB.

---

## 2. Standalone APK Compilation via Gradle

To produce standalone APK binaries without keeping a Metro terminal running:

### Assembling Debug APK:
```bash
cd android

# On Windows (PowerShell)
.\gradlew assembleDebug

# On macOS / Linux
./gradlew assembleDebug
```
- **Output Artifact**: `android/app/build/outputs/apk/debug/app-debug.apk`

### Assembling Release APK:
```bash
cd android

# On Windows (PowerShell)
.\gradlew assembleRelease

# On macOS / Linux
./gradlew assembleRelease
```
- **Output Artifact**: `android/app/build/outputs/apk/release/app-release.apk`

---

## 3. Direct Sideloading & ADB Execution

If you have precompiled the APK and want to push it directly to a Fire TV Stick:

```bash
# Sideload APK onto TV (replacing previous install while keeping data)
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Launch the app activity directly on the TV
adb shell am start -n com.firetv.musicpoc/.MainActivity

# Force stop the app if needed
adb shell am force-stop com.firetv.musicpoc
```

### Live Logcat Monitoring:
Filter logs specifically for Pandivo TV components:
```bash
adb logcat -s SpeechRecognition WhistleEngine AudioRecordEngine ReactNativeJS
```

---

## 4. Automated Verification Test Suites

Pandivo TV includes a comprehensive automated test matrix in the [`scripts/`](../../../scripts/) folder covering D-pad focus, voice parsing, USB storage, and Amazon Appstore compliance.

### 1. Master Acceptance Test Suite
Verifies end-to-end TV user journeys and state machine integrity:
```bash
node scripts/run_acceptance_tests.js
```

### 2. Amazon Appstore Technical Compliance Suite
Validates Android TV manifest flags, TV banner presence, leanback launcher intent filters, and touch-screen independence:
```bash
node scripts/run_appstore_compliance_tests.js
```

### 3. AI DJ & Natural Language Intent Suite
Validates Bedrock / Gemini prompt parsing, fallback mechanisms, and live steering commands:
```bash
node scripts/run_ai_dj_tests.js
```

### 4. Playlist & 10-Foot Navigation Suite
Validates D-pad focus cycles, Fisher-Yates shuffle randomization, and spatial bounds:
```bash
node scripts/run_playlist_tests.js
```

### 5. USB Mass Storage Test Suite
Validates hot-plug event listeners, ID3 parsing, and auto-exit guards:
```bash
node scripts/run_usb_storage_tests.js
```

---

## 5. Troubleshooting Common Build Issues

### Issue 1: `SDK location not found`
Create or verify `android/local.properties` exists and points to your Android SDK:
- **Windows**: `sdk.dir=C:\\Users\\<YourUsername>\\AppData\\Local\\Android\\Sdk`
- **macOS / Linux**: `sdk.dir=/Users/<YourUsername>/Library/Android/sdk`

### Issue 2: `CMake Error: Could not find toolchain file`
Ensure you have installed NDK `26.1.10909125` in the Android Studio SDK Manager and set `ANDROID_NDK_HOME`.

### Issue 3: `Metro has encountered an error: duplicate symbols`
Reset Metro bundler cache:
```bash
npx expo start -c
```

### Issue 4: `Activity class does not exist`
Perform a clean Gradle build:
```bash
cd android
./gradlew clean
cd ..
npm run android
```
