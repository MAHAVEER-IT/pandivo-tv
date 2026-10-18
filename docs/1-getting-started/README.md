# Pandivo TV: Getting Started & Developer Setup Guide 🚀📺

Welcome to the **Pandivo TV** onboarding and developer documentation! This directory provides everything you need to get the app running on an Android TV emulator or physical Amazon Fire TV device (Fire TV Stick 4K, 4K Max, Cube, Omni QLED).

---

## ⚡ 60-Second Quickstart (For Experienced Developers)

If your environment already has **Node.js LTS**, **JDK 17**, and the **Android TV SDK / ADB** configured:

```bash
# 1. Clone the repository
git clone https://github.com/MAHAVEER-IT/pandivo-tv.git
cd pandivo-tv

# 2. Install dependencies
npm install

# 3. Create .env configuration (Optional - runs 100% offline out-of-the-box!)
cp .env.example .env

# 4. Start Metro Bundler (Windows: double-click START_METRO.bat)
npx expo start -c

# 5. Build and launch on your connected Android TV / Fire TV (Windows: double-click RUN_ANDROID_TV.bat)
npx expo run:android
```

---

## 📚 Complete Step-by-Step Documentation Index

| Step | Guide | Purpose | Key Topics Covered |
|:---:|---|---|---|
| **01** | [**`01_QUICKSTART_GUIDE.md`**](./01_QUICKSTART_GUIDE.md) | **5-Minute Quickstart** | Fastest path from `git clone` to TV screen with zero hassle. |
| **02** | [**`02_SYSTEM_REQUIREMENTS.md`**](./02_SYSTEM_REQUIREMENTS.md) | **System Requirements** | Node.js, JDK 17, Android Studio, SDK API 34, CMake, NDK toolchains. |
| **03** | [**`03_INSTALLATION.md`**](./03_INSTALLATION.md) | **Clone & Installation** | Cloning, `npm install`, `react-native-tvos` resolution, `.env` file setup. |
| **04** | [**`04_DEVELOPMENT_ENVIRONMENT.md`**](./04_DEVELOPMENT_ENVIRONMENT.md) | **Host Environment** | Java home, Android SDK path, ADB in PATH, and CMake verification. |
| **05** | [**`05_RUNNING_METRO_AND_SCRIPTS.md`**](./05_RUNNING_METRO_AND_SCRIPTS.md) | **Metro Bundler** | One-click `START_METRO.bat`, `EXPO_TV=1` flag, cache reset, terminal flags. |
| **06** | [**`06_FIRE_TV_HARDWARE_SETUP.md`**](./06_FIRE_TV_HARDWARE_SETUP.md) | **Fire TV Hardware** | Fire OS 7/8 Developer Mode (7-click unlock), wireless ADB, Wi-Fi pairing. |
| **07** | [**`07_EMULATOR_SETUP.md`**](./07_EMULATOR_SETUP.md) | **TV Emulator** | Television 1080p AVD creation, hardware acceleration, cold boots. |
| **08** | [**`08_TV_REMOTE_SIMULATION.md`**](./08_TV_REMOTE_SIMULATION.md) | **Remote & Testing** | Simulating D-pad buttons via ADB keycodes, voice injection broadcast, batch test scripts. |
| **09** | [**`09_TROUBLESHOOTING_AND_FAQ.md`**](./09_TROUBLESHOOTING_AND_FAQ.md) | **Fixes & FAQ** | Port 8081 conflicts, white screen fix, Gradle NDK build issues, mic permissions. |

---

## 🛠️ Advanced Subsystem Setup (`advanced_setup/`)

For evaluators and developers configuring backend cloud services, offline speech C++ compilation, or USB storage:

| Guide | Subsystem | Description |
|---|---|---|
| [**`01_C_PLUS_PLUS_AND_WHISTLE_NATIVE.md`**](./advanced_setup/01_C_PLUS_PLUS_AND_WHISTLE_NATIVE.md) | **Whistle STT C++** | C++ JNI bridge compilation, `libneedle.a` linking, and `whistle.cact` model asset. |
| [**`02_AWS_BACKEND_AND_DYNAMODB.md`**](./advanced_setup/02_AWS_BACKEND_AND_DYNAMODB.md) | **AWS Cloud Backend** | Amazon DynamoDB single-table schema, AWS Lambda Gateway, Bedrock Nova Lite IAM. |
| [**`03_GEMINI_AI_API.md`**](./advanced_setup/03_GEMINI_AI_API.md) | **Gemini Fallback AI** | Google Gemini 3.5 Flash credentials, environment variables, diagnostic test. |
| [**`04_USB_STORAGE_TESTING.md`**](./advanced_setup/04_USB_STORAGE_TESTING.md) | **USB Mass Storage** | OTG Y-cable hardware setup, FAT32 formatting, ID3 audio tag extraction. |
| [**`05_BUILD_RUN_AND_VERIFICATION.md`**](./advanced_setup/05_BUILD_RUN_AND_VERIFICATION.md) | **Build & Verification** | Standalone APK compilation (`assembleDebug` / `assembleRelease`), signing, ADB test suite. |

---

## 🗂️ 1-Click Launchers & Batch Files

| File | Location | Description |
|---|---|---|
| **`START_METRO.bat`** | Project Root | **1-Click**: Starts Metro bundler with `EXPO_TV=1` and clear-cache `-c` |
| **`RUN_ANDROID_TV.bat`** | Project Root | **1-Click**: Checks ADB, sets port reverse (`8081`), builds and installs APK |
| **`START_METRO.bat`** | `launchers/` | Alternative launcher for Metro bundler |
| **`INSTALL_AND_OPEN_TV_APP.bat`** | `launchers/` | Automated ADB install and TV package launch script |
| **`start_tv_emulator.bat`** | `launchers/` | Starts the `Television_1080p` Android TV emulator instance |
| **`TEST_REMOTE_CONTROL.bat`** | `launchers/` | Interactive command-line Fire TV remote controller (D-Pad, Play, Back) |
