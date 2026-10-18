# Advanced Subsystem Setup & Configuration Guide 🛠️⚙️

This directory contains technical deep-dive guides for configuring Pandivo TV's native engines, cloud AI integrations, and hardware subsystems.

---

## 📚 Technical Setup Modules

| Document | Subsystem | Description |
|---|---|---|
| [**`01_C_PLUS_PLUS_AND_WHISTLE_NATIVE.md`**](./01_C_PLUS_PLUS_AND_WHISTLE_NATIVE.md) | **Native Speech Engine** | Whistle C++ JNI compilation, `libneedle.a` linking, CMake toolchain, and `whistle.cact` neural model asset. |
| [**`02_AWS_BACKEND_AND_DYNAMODB.md`**](./02_AWS_BACKEND_AND_DYNAMODB.md) | **Cloud Persistence & AI** | Amazon DynamoDB single-table schema (`pandivo-tv-cloud-sync`), AWS Lambda Gateway, and Bedrock Nova Lite IAM. |
| [**`03_GEMINI_AI_API.md`**](./03_GEMINI_AI_API.md) | **Secondary AI Engine** | Google Gemini 3.5 Flash credentials, environment variables, rate limiting, and diagnostic test. |
| [**`04_USB_STORAGE_TESTING.md`**](./04_USB_STORAGE_TESTING.md) | **Local Audio Playback** | Micro-USB OTG Y-cable, FAT32 drive formatting, permissions, and ID3 audio tag extraction. |
| [**`05_BUILD_RUN_AND_VERIFICATION.md`**](./05_BUILD_RUN_AND_VERIFICATION.md) | **Build Pipeline & CI** | Standalone APK compilation (`assembleDebug` / `assembleRelease`), APK signing verification, and ADB test runners. |

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
