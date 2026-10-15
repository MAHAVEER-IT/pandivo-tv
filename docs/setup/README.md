# Pandivo TV: Developer & Device Setup Guide 🛠️📺

## Overview

Welcome to the **Pandivo TV** setup and onboarding documentation. Pandivo TV is a production-grade 10-foot television music experience built with **React Native TVOS (0.86)**, **Expo (v57)**, **C++ JNI (Whistle offline speech engine)**, **Amazon Bedrock (Nova Lite)**, and **Amazon DynamoDB**.

This guide covers everything required to set up your local development environment, build native C++ binaries, configure physical Fire TV hardware, provision AWS services, and run automated verification test suites.

---

## 📋 Setup Documentation Modules

| Guide | Description | Target Audience |
|---|---|---|
| [**`01_DEVELOPMENT_ENVIRONMENT_SETUP.md`**](./01_DEVELOPMENT_ENVIRONMENT_SETUP.md) | Host OS toolchain: Node.js 20+, Java JDK 17, Android Studio, Android SDK 34, NDK r26b, CMake. | All Developers |
| [**`02_FIRE_TV_AND_EMULATOR_SETUP.md`**](./02_FIRE_TV_AND_EMULATOR_SETUP.md) | Fire TV Stick 4K & Cube developer mode, ADB over Wi-Fi, and Android TV 1080p AVD setup. | App Developers & QA |
| [**`03_C_PLUS_PLUS_AND_WHISTLE_NATIVE_SETUP.md`**](./03_C_PLUS_PLUS_AND_WHISTLE_NATIVE_SETUP.md) | Whistle C++ JNI compilation, `libneedle.a` linking, and `whistle.cact` acoustic model bundling. | Native / C++ Engineers |
| [**`04_AWS_BACKEND_AND_DYNAMODB_SETUP.md`**](./04_AWS_BACKEND_AND_DYNAMODB_SETUP.md) | Amazon DynamoDB single-table schema, AWS IAM policies, and Amazon Bedrock Nova Lite integration. | Cloud / Backend Engineers |
| [**`05_GEMINI_AI_API_SETUP.md`**](./05_GEMINI_AI_API_SETUP.md) | Google Gemini 3.5 Flash API credentials, environment variables, and diagnostic connectivity test. | AI / Full-Stack Engineers |
| [**`06_USB_STORAGE_TESTING_SETUP.md`**](./06_USB_STORAGE_TESTING_SETUP.md) | USB OTG setup, FAT32 drive formatting, ID3 audio tagging, and physical/virtual mount testing. | QA / Media Testers |
| [**`07_BUILD_RUN_AND_VERIFICATION_GUIDE.md`**](./07_BUILD_RUN_AND_VERIFICATION_GUIDE.md) | Metro bundling, Gradle build commands, APK deployment, and automated test runners. | DevOps & CI/CD |

---

## ⚡ 5-Minute Quickstart (Prerequisites Met)

If your machine already has Node.js 20+, Java 17, Android SDK 34, and ADB installed:

```bash
# 1. Clone the repository
git clone https://github.com/MAHAVEER-IT/pandivo-tv.git
cd pandivo-tv/FireTVMusicPOC

# 2. Install JavaScript dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your EXPO_PUBLIC_GEMINI_API_KEY and AWS backend credentials

# 4. Connect Fire TV or start Android TV Emulator
adb devices

# 5. Build and launch debug build on TV
npm run android
```

---

## 🖥️ System Requirements Matrix

| Component | Minimum Requirement | Recommended |
|---|---|---|
| **Host Operating System** | Windows 10/11 (64-bit), macOS 13+, or Ubuntu 22.04+ | Windows 11 / macOS Sonoma |
| **RAM** | 16 GB | 32 GB (for concurrent emulator + build) |
| **Node.js** | `v20.12.0` (LTS) | `v20.x` or `v22.x` |
| **Java Development Kit** | OpenJDK 17 | Eclipse Temurin JDK 17 |
| **Android SDK Platform** | API Level 34 (`Android 14.0`) | API Level 34 |
| **Android NDK** | `26.1.10909125` (r26b) | `26.1.10909125` |
| **CMake** | `3.22.1` | `3.22.1` |
| **Physical TV Device** | Fire TV Stick 4K (Fire OS 7 / Android 9) | Fire TV Stick 4K Max / Fire TV Cube (Fire OS 8) |
| **Virtual TV Device** | Android Studio Android TV (1080p) API 30+ | Android TV (1080p) API 34 |

---

## 📁 Key Project Directories Reference

```text
FireTVMusicPOC/
├── android/                   # Native Android TV Gradle & JNI project
│   ├── app/src/main/cpp/      # CMakeLists.txt and whistle_jni.cpp
│   ├── app/src/main/assets/   # Bundled whistle.cact offline model (16.9 MB)
│   └── app/src/main/jniLibs/  # Precompiled architecture libraries (arm64, x86_64)
├── assets/                    # 10-foot UI artwork, icons, and playlist banners
├── docs/                      # Architectural, UI, function, and setup documentation
│   ├── functions/             # Core code & function reference guides
│   ├── pages/                 # Screen-by-screen TV layout specifications
│   └── setup/                 # Environment & hardware setup guides (this folder)
├── scripts/                   # Automated D-pad, AI DJ, and USB compliance test suites
└── src/                       # React Native TV TypeScript source code
    ├── components/            # 10-foot TV UI components & focusable widgets
    ├── context/               # Global state (Theme, Playback, Favorites, AI DJ)
    ├── database/              # SQLite WAL schema & entity repositories
    ├── navigation/            # TV D-pad spatial navigation state machines
    └── services/              # Bedrock, Gemini, Cloud Sync, and Audio engines
```
