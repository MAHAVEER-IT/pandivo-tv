# Pandivo TV: Setup & Getting Started Guide 🛠️📺

Welcome to the **Pandivo TV** setup hub. If you are downloading or cloning this repository from GitHub, this directory contains all the instructions you need to get the app running on your Fire TV or emulator.

---

## 🚀 START HERE: Quick Run Guide

If you just cloned the repository and want to launch the application immediately:

👉 **[Read the Step-by-Step Guide: HOW_TO_DOWNLOAD_AND_RUN.md](./HOW_TO_DOWNLOAD_AND_RUN.md)** 👈

### In a nutshell (3 commands):
```bash
# 1. Clone repository from GitHub
git clone https://github.com/MAHAVEER-IT/pandivo-tv.git
cd pandivo-tv

# 2. Install dependencies
npm install

# 3. Launch on Fire TV (via Wi-Fi) or Android TV Emulator
npm run android
```

*(Note: The app includes a bundled music catalog, local SQLite database, and offline speech keywords, so it runs **100% out-of-the-box** even before you configure cloud API keys!)*

---

## 📚 Technical Setup Modules (For Deep Dives)

For developers, contributors, and evaluators who need in-depth configuration details for specific subsystems:

| Document | Description | Focus Area |
|---|---|---|
| [**`HOW_TO_DOWNLOAD_AND_RUN.md`**](./HOW_TO_DOWNLOAD_AND_RUN.md) | **Beginner-Friendly Start Guide**: From `git clone` to running on TV in 5 min. | **All Users / Evaluators** |
| [**`01_DEVELOPMENT_ENVIRONMENT_SETUP.md`**](./01_DEVELOPMENT_ENVIRONMENT_SETUP.md) | Host OS toolchain: Node.js 20+, Java JDK 17, Android Studio, SDK 34, NDK r26b. | Host Environment |
| [**`02_FIRE_TV_AND_EMULATOR_SETUP.md`**](./02_FIRE_TV_AND_EMULATOR_SETUP.md) | Fire TV Developer Mode (7-click unlock), ADB over Wi-Fi, and 1080p TV AVD setup. | Hardware & Emulators |
| [**`03_C_PLUS_PLUS_AND_WHISTLE_NATIVE_SETUP.md`**](./03_C_PLUS_PLUS_AND_WHISTLE_NATIVE_SETUP.md) | Whistle C++ JNI compilation, `libneedle.a` linking, and `whistle.cact` model asset. | Native C++ STT Engine |
| [**`04_AWS_BACKEND_AND_DYNAMODB_SETUP.md`**](./04_AWS_BACKEND_AND_DYNAMODB_SETUP.md) | Amazon DynamoDB single-table schema, AWS IAM policies, and Bedrock Nova Lite. | Cloud Persistence & AI |
| [**`05_GEMINI_AI_API_SETUP.md`**](./05_GEMINI_AI_API_SETUP.md) | Google Gemini 3.5 Flash credentials, environment variables, and diagnostic test. | Generative AI Setup |
| [**`06_USB_STORAGE_TESTING_SETUP.md`**](./06_USB_STORAGE_TESTING_SETUP.md) | Micro-USB OTG Y-cable, FAT32 drive formatting, and ID3 audio tag extraction. | Local USB Audio Playback |
| [**`07_BUILD_RUN_AND_VERIFICATION_GUIDE.md`**](./07_BUILD_RUN_AND_VERIFICATION_GUIDE.md) | Standalone APK compilation (`assembleDebug`), ADB commands, and test runners. | CI/CD & Testing |

---

## 🖥️ System Requirements Summary

| Component | Minimum | Recommended |
|---|---|---|
| **Node.js** | `v20.12.0` (LTS) | `v20.x` or `v22.x` |
| **Java** | OpenJDK 17 | Eclipse Temurin JDK 17 |
| **Android SDK** | API Level 34 (`Android 14.0`) | API Level 34 |
| **Android NDK** | `26.1.10909125` (r26b) | `26.1.10909125` |
| **CMake** | `3.22.1` | `3.22.1` |
| **Device** | Fire TV Stick 4K (Fire OS 7+) or Android TV 1080p AVD | Fire TV Stick 4K Max / Cube |
