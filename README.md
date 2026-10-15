# Pandivo TV 🎵📺

> **Next-Gen AI-Powered Music Experience for Amazon Fire TV & Android TV**

Pandivo TV is a 10-foot living room music application engineered specifically for Fire TV and Android TV devices. Combining Google Gemini-powered continuous AI DJ sessions, 100% offline speech recognition via the on-device Whistle AI model, decentralized Audius streaming, and plug-and-play USB external drive playback.

---

## 🌟 Key Features

### 🎧 1. Continuous AI DJ (Powered by Google Gemini)
- **Natural Language Vibe Search**: Ask for any mood, context, or activity (e.g. *"create a morning vibe"*, *"high energy music"*, *"ambient focus"*).
- **Multi-Model Cloud Resilience**: Primary `gemini-3.5-flash` with automatic fallback chain to `gemini-flash-lite-latest`.
- **Zero-Downtime Offline Engine**: If the network drops or the cloud experiences high demand, a deterministic local fallback engine smoothly curates, balances energy trajectories, and starts playback without interruption.

### 🎙️ 2. Whistle On-Device Speech-to-Text
- **100% Offline Voice Commands**: Uses a lightweight (~16.9 MB) native on-device AI speech-to-text model (`whistle.cact`).
- **Low Latency & Privacy**: Speech processing stays on the TV without sending voice audio to third-party cloud servers.
- **Microphone Pipeline**: Native AudioRecord circular buffering and C++ JNI bindings.

### 💾 3. USB Storage Audio Player
- **Plug-and-Play Scanning**: Automatically detects connected USB flash drives and external storage (`/storage/*`).
- **Multi-Format Support**: Play local high-fidelity audio files: **MP3, FLAC, AAC, WAV, M4A**.
- **Metadata Extraction**: Scans ID3 tags, artist, album, track numbers, and embedded cover artwork.

### 🌐 4. Audius Streaming & SQLite Persistence
- **Decentralized Music**: Full-length track streaming from the Audius decentralized audio network with automatic discovery node rotation.
- **Local SQLite (WAL mode)**: Fast local database storing favorites, custom playlists, play counts, and companion avatar preferences.

### 🎮 5. 10-Foot Living Room UI
- Designed from the ground up for TV remote control (D-Pad navigation: Up, Down, Left, Right, Select, Back).
- Fullscreen visualizer with dynamic mood palettes, animated vinyl textures, and companion avatar themes.

---

## 🚀 Getting Started

> 📖 **Looking for full step-by-step setup guides?**
> Check out the [**Getting Started & Developer Setup Guide**](./docs/getting_started/README.md) covering Windows/macOS/Linux setup, Fire TV wireless ADB, and troubleshooting.

### ⚡ Quick Start (Windows 1-Click)
1. **Start Metro Bundler**: Double-click [**`START_METRO.bat`**](./START_METRO.bat)
2. **Launch on Fire TV / Emulator**: Double-click [**`RUN_ANDROID_TV.bat`**](./RUN_ANDROID_TV.bat)

---

### 💻 Manual Command Line Setup

#### 1. Clone & Install
```bash
git clone https://github.com/MAHAVEER-IT/pandivo-tv.git
cd pandivo-tv
npm install
```

#### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your free Google Gemini API key from [Google AI Studio](https://aistudio.google.com/):
```env
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

#### 3. Run Metro & Launch on TV
Start Metro with TV flags enabled:
```bash
# Terminal 1: Start Metro
EXPO_TV=1 npx expo start -c
```

In a separate terminal, compile and launch on your connected Fire TV / emulator:
```bash
# Terminal 2: Connect and Run
adb reverse tcp:8081 tcp:8081
EXPO_TV=1 npx expo run:android
```

---

## 📚 Documentation Suites

- [**Getting Started & Developer Setup Guide**](./docs/getting_started/README.md): System prerequisites, Android SDK, ADB, Metro batch files.
- [**10-Foot Television Screens & UI Specifications**](./docs/pages/README.md): D-pad focus ID matrices, layout wireframes, screen states.
- [**Core Functions & Code Reference**](./docs/functions/README.md): Bedrock/Gemini AI DJ, Whistle offline STT, SQLite WAL repositories, audio playback.


## 🕹️ TV Remote Control Controls

| Button | Action |
| :--- | :--- |
| **Arrow Keys / D-Pad** | Navigate between cards, sidebar tabs, and player controls |
| **Center / Enter** | Select track, play/pause, open playlist, toggle buttons |
| **Back / Esc** | Exit fullscreen player, dismiss overlays, return to Home |
| **Menu / F2** | Open quick actions |

---

## 📄 License
MIT License.
