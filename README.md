<p align="center">
  <img src="./assets/logo.png" alt="Pandivo TV Logo" width="220" />
</p>

<h1 align="center">Pandivo TV 🎵📺</h1>

<p align="center">
  <strong>Next-Gen AI-Powered Music & Continuous AI DJ Experience for Amazon Fire TV & Android TV</strong>
</p>

<p align="center">
  <a href="https://github.com/MAHAVEER-IT/pandivo-tv/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License: MIT" /></a>
  <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/React%20Native%20TV-0.86--stable-61DAFB?style=flat-square&logo=react" alt="React Native TV" /></a>
  <a href="https://aws.amazon.com/bedrock/"><img src="https://img.shields.io/badge/AI%20Engine-Amazon%20Bedrock%20%2B%20Gemini-FF9900?style=flat-square&logo=amazon-aws" alt="AWS Bedrock & Gemini" /></a>
  <a href="https://developer.android.com/tv"><img src="https://img.shields.io/badge/Platform-Fire%20OS%20%7C%20Android%20TV%20(API%2030--34)-3DDC84?style=flat-square&logo=android" alt="Android TV" /></a>
  <a href="https://www.npmjs.com/package/react-native-whistle-tv-offline"><img src="https://img.shields.io/badge/On--Device%20STT-Whistle%20C%2B%2B%20JNI-8A2BE2?style=flat-square" alt="Whistle STT" /></a>
</p>

---

## 💡 What is Pandivo TV?

**Pandivo TV** transforms passive television listening into an active, intelligent living-room music journey. Built specifically for the **10-foot television interface**, it brings together an autonomous **Continuous AI DJ**, an **on-device offline speech recognition engine**, and local **USB plug-and-play playback**.

Whether you speak to your Fire TV Voice Remote (*"Play upbeat 90s rock for a workout"*), steer the session live (*"No sad songs, keep it high energy"*), or plug in a thumb drive full of offline audio files, Pandivo TV delivers an effortless, living-room-first experience that never stalls or traps your remote focus.

---

## ✨ Standout Innovations & Features

### 🎧 1. Continuous AI DJ & Live Steering (Bedrock + Gemini)
- **Natural Language Vibe Understanding**: Powered by **Amazon Bedrock (Nova Lite)** with **Google Gemini 3.5 Flash** fallback. Speak any activity, mood, or decade.
- **Smart Session Trajectories**: Calculates progressive energy curves (0.0 to 1.0), harmonic BPM transitions, and suppresses artist repetition.
- **Mid-Session Voice Steering**: Steer the music on the fly without stopping playback (*"make it slower"*, *"more energetic"*, *"play something like this"*).
- **Generative DJ Commentary**: Announces upcoming songs and smooth transitions with contextual spoken commentary.

### 🎙️ 2. 100% Offline Speech-to-Text (Whistle C++ Engine)
- **Living Room Privacy**: Uses a lightweight (~16.9 MB) quantized on-device acoustic model (`whistle.cact`) compiled via native C++ JNI (`libwhistle_native.so`).
- **Zero Cloud Latency**: Transcribes voice commands directly on the TV hardware without sending private living-room audio to third-party cloud servers.
- **Works Without Internet**: Offline music keyword biasing guarantees high recognition accuracy even when disconnected from Wi-Fi.

### 💾 3. Plug-and-Play USB Storage Player
- **Automatic OTG Detection**: Instantly detects connected USB flash drives and external hard drives (`/storage/*`).
- **Offline ID3 Tag Extraction**: Extracts embedded album art, artist, title, and track numbers for **MP3, FLAC, WAV, AAC, and M4A**.
- **Auto-Generated TV Playlist**: Assembles an instant offline playlist with safety unmount protection.

### ☁️ 4. Sub-Millisecond SQLite WAL + DynamoDB Cloud Sync
- **Instant Cold Boots**: User favorites, search history, avatar choices, and playback history are stored locally in **SQLite (WAL mode)** for instant 60 FPS TV rendering.
- **Non-Blocking Cloud Sync**: Background synchronization mirrors local changes into **Amazon DynamoDB** without blocking the television interface.

### 🎮 5. 10-Foot Living Room UI & Companion Avatars
- **Zero Focus Traps**: Mathematically mapped D-pad spatial navigation graphs with self-healing focus fallbacks.
- **Interactive Companion Avatars**: Choose your visual companion (*Bamboo the Panda, Ember the Fox, Frost the Wolf, Sunny the Dog, Shadow the Cat*).
- **Immersive Fullscreen Visualizer**: Dynamic palettes, animated vinyl textures, and living-room ambiance.

---

## ⚡ Quick Start: Download & Run

### 🪟 Windows 1-Click Launch (Easiest)
1. **Start Metro Bundler**: Double-click [**`START_METRO.bat`**](./START_METRO.bat)
2. **Compile & Run on TV**: Double-click [**`RUN_ANDROID_TV.bat`**](./RUN_ANDROID_TV.bat)

---

### 💻 Manual Command Line (Cross-Platform)

```bash
# 1. Clone the repository
git clone https://github.com/MAHAVEER-IT/pandivo-tv.git
cd pandivo-tv

# 2. Install dependencies
npm install

# 3. Configure environment variables (Optional - runs 100% offline without keys!)
cp .env.example .env

# 4. Start Metro & Launch on your connected Fire TV / Android TV Emulator
EXPO_TV=1 npx expo start -c
# (In a second terminal: adb reverse tcp:8081 tcp:8081 && EXPO_TV=1 npx expo run:android)
```

> 📖 **Need step-by-step help with Android SDK, JDK 17, or wireless Fire TV ADB?**
> - [**Beginner's 5-Minute Setup Guide**](./docs/setup/HOW_TO_DOWNLOAD_AND_RUN.md)
> - [**Full Getting Started & Prerequisites Suite**](./docs/getting_started/README.md)

---

## 🎵 100% Copyright-Free & Royalty-Free Audio

> [!NOTE]
> **Safe for Public Evaluation & Live Streaming**
> - All bundled demo audio tracks, test streams, and catalog music included in Pandivo TV are **100% copyright-free and royalty-free**.
> - Audio is sourced under open **Creative Commons (CC0 / CC-BY)** licenses and decentralized open streams via the **Audius** network.
> - Evaluators and hackathon judges can freely test, record screen demos, and publicly showcase Pandivo TV without copyright flags or DMCA concerns.

---

## 📚 Complete Documentation Suite

Pandivo TV features extensive, production-grade documentation across all subsystems:

| Documentation Suite | Description | Key Topics |
|---|---|---|
| [**Hackathon Mini-Challenges**](./docs/MINI_CHALLENGES.md) | **AWS & Open Source Tracks** | Technical blueprints, full Lambda code, Bedrock Nova Lite & DynamoDB benchmarks, and npm package documentation. |
| [**Judge Implementation Guide**](./docs/FEATURE_IMPLEMENTATION_AUTH_AND_RECOMMENDATIONS.md) | **Core Feature Evidence** | Frictionless QR companion authentication, living-room multi-profile switching, and 6D recommendation engine. |
| [**Getting Started Suite**](./docs/getting_started/README.md) | **Developer Onboarding** | Prerequisites, 1-click batch files, wireless Fire TV setup, D-pad simulation, FAQ. |
| [**Tech Stack & Architecture**](./docs/TECH_STACK_AND_PACKAGES.md) | **Technical Reference** | Subsystem architectures, package matrix, native C++ NDK & CMake toolchain. |
| [**Core Functions Reference**](./docs/functions/README.md) | **API & Functions** | Bedrock AI DJ, Whistle STT, SQLite WAL repositories, audio playback, spatial navigation. |
| [**10-Foot UI & Screen Specs**](./docs/pages/README.md) | **Design & UI** | Layout wireframes, D-pad focus ID matrices, and state transitions for all 9 screens. |
| [**System Architecture**](./docs/architecture/README.md) | **Deep-Dive Systems** | Data flows, edge AI speech pipeline, and DynamoDB single-table persistence. |
| [**Master Test Plan & Runs**](./docs/testing/MASTER_TEST_PLAN.md) | **Verification** | 6-stage test matrix, device profiles, and hardware verification run logs. |
| [**Amazon Friction Log**](./docs/friction_log/AMAZON_FRICTION_LOG.md) | **Developer Insights** | Living-room development learnings, Fire OS quirks, and audio optimizations. |

---

## 🚀 Hackathon Mini-Challenges Track Submissions

Pandivo TV includes complete, production-verified implementations for two hackathon mini-challenge tracks. Full technical evidence, architecture diagrams, and benchmark data are documented in [**docs/MINI_CHALLENGES.md**](./docs/MINI_CHALLENGES.md):

1. **Cloud & Generative AI with AWS Services**:
   - **Amazon Bedrock (Nova Lite `amazon.nova-lite-v1:0`)**: Serves sub-second natural language intent parsing (**555 ms – 709 ms**), energetic radio-host transition commentary (**435 ms – 477 ms**), and musicological insights (**~500 ms**).
   - **Serverless AWS Lambda Gateway**: Clean, easy-to-implement serverless bridge handling Bedrock Converse API invocation and DynamoDB single-table persistence without embedding IAM credentials in the client APK.
   - **Amazon DynamoDB Cloud Sync (`pandivo-tv-cloud-sync`)**: Debounced **67 ms** state push and **4 ms – 41 ms** cold boot restore synchronizing avatar selections, liked tracks, playlists, and AI DJ history across multi-room Fire TVs.
2. **Open-Source TV Ecosystem Contribution**:
   - **NPM Package**: [`react-native-whistle-tv-offline`](https://www.npmjs.com/package/react-native-whistle-tv-offline) (`npm i react-native-whistle-tv-offline`)
   - **GitHub Repository**: [`MAHAVEER-IT/react-native-whistle-tv-offline`](https://github.com/MAHAVEER-IT/react-native-whistle-tv-offline)
   - Lightweight (~16.9 MB) 100% offline speech recognition engine for Fire OS & Android TV with dual-ABI C++ binaries (`arm64-v8a` + `x86_64`) and zero cloud audio transmission.

---

## 🕹️ Fire TV Remote Control Quick Reference

| Remote Button | Android KeyCode | PC Keyboard Shortcut | TV Action |
|:---:|:---:|:---:|---|
| **D-Pad Arrows** | `19, 20, 21, 22` | `↑` `↓` `←` `→` | Navigate highlight focus between cards, sidebar tabs, and player controls |
| **Center / Select** | `23` | `Enter` / `Return` | Select track, play/pause, open playlist, toggle buttons |
| **Back** | `4` | `Escape` / `Backspace` | Exit fullscreen player, dismiss overlays, return to Home |
| **Play / Pause** | `85` | `Spacebar` | Toggle playback |
| **Fast-Forward / Rewind** | `90 / 89` | `]` / `[` | Audio scrubber seek (+10s / -10s) |
| **Voice / Microphone** | `Hardware Mic` | *Broadcast Intent* | Speak your mood or music request (e.g. *"Play relaxing lofi music"*) |

---

## 📦 Standalone Open-Source Package

As part of our commitment to the television developer community, the core offline speech recognition engine was extracted into an independent, drag-and-drop open-source package:

- 📦 **NPM**: [`react-native-whistle-tv-offline`](https://www.npmjs.com/package/react-native-whistle-tv-offline) (`npm i react-native-whistle-tv-offline`)
- 💻 **GitHub**: [`MAHAVEER-IT/react-native-whistle-tv-offline`](https://github.com/MAHAVEER-IT/react-native-whistle-tv-offline)
- 📖 **Mini-Challenges Technical Blueprint**: [`docs/MINI_CHALLENGES.md`](./docs/MINI_CHALLENGES.md)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.
