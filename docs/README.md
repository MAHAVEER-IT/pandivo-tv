# 📚 PANDIVO Fire TV Application Documentation

Welcome to the central technical documentation repository for the **PANDIVO Fire TV Application** (`com.firetv.musicpoc`).

---

## 📑 Core Documentation Index

| Document | Category | Description | Status |
| :--- | :---: | :--- | :---: |
| [**MINI_CHALLENGES.md**](./MINI_CHALLENGES.md) | **Hackathon Mini-Challenges** | Complete implementation evidence for AWS Bedrock (Nova Lite), Lambda Gateway, DynamoDB multi-device sync, and open-source npm package `react-native-whistle-tv-offline`. | ✅ Completed |
| [**FEATURE_IMPLEMENTATION_AUTH_AND_RECOMMENDATIONS.md**](./FEATURE_IMPLEMENTATION_AUTH_AND_RECOMMENDATIONS.md) | **Hackathon Judges / Core Features** | Frictionless QR code authentication, living room multi-profile switching, local SQLite WAL + Amazon DynamoDB hybrid storage, and 6-dimension personalized recommendation engine. | ✅ Completed |
| [**OFFLINE_SPEECH_RECOGNITION_FIX.md**](./OFFLINE_SPEECH_RECOGNITION_FIX.md) | **Architecture & Audio HAL** | Root cause analysis, C++ native porting (`arm64-v8a` + `x86_64`), GLIBC-to-Bionic compatibility layer, zero-fallback policy, and Android TV emulator audio setup. | ✅ Completed |
| [**media_testing/README.md**](./media_testing/README.md) | **Media QA & Optimization** | Asset footprint audit, dimension analysis, memory impact assessment on Fire TV hardware, and WebP compression roadmap. | ✅ Completed |
| [**media_testing/MEDIA_OPTIMIZATION_REPORT.md**](./media_testing/MEDIA_OPTIMIZATION_REPORT.md) | **Media Inventory** | Exhaustive audit of all 164 media assets across images, video loops, audio, and TV launcher icons. | ✅ Completed |

---

## 🎯 Architecture Highlights

- **100% Offline Living Room Privacy:** Zero Google SpeechRecognizer or cloud STT dependencies. Microphone PCM audio is captured ephemeral in-memory and transcribed locally using embedded C++ Whistle model (`whistle.cact`).
- **Dual-ABI Native Support:** Full compatibility across physical Fire TV devices (`arm64-v8a`) and Android Studio TV Emulators (`x86_64`) via custom Bionic polyfills (`glibc_compat.c`).
- **Zero Mock Fallbacks:** Authentic user speech drives dynamic music discovery and AI DJ session curation with zero static mocked playlists.
