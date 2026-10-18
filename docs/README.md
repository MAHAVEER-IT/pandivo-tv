# 📚 PANDIVO Documentation Hub

[![Platform: Fire OS & Android TV](https://img.shields.io/badge/Platform-Fire%20OS%207%20%7C%208%20%28Android%20TV%29-orange.svg)](https://developer.amazon.com/fire-tv)
[![STT: 100% On-Device Whistle](https://img.shields.io/badge/Speech%20Engine-100%25%20Offline%20Whistle-green.svg)](./SPEECH_TO_TEXT_PROBLEMS_AND_SOLUTIONS.md)
[![AI: Amazon Bedrock Nova Lite](https://img.shields.io/badge/AI%20Engine-Amazon%20Bedrock%20Nova%20Lite-blue.svg)](./MINI_CHALLENGES.md)
[![Package: react-native-whistle-tv-offline](https://img.shields.io/badge/npm-react--native--whistle--tv--offline-red.svg)](https://www.npmjs.com/package/react-native-whistle-tv-offline)

Welcome to the **PANDIVO Technical Documentation Portal**. This repository contains the complete architectural blueprints, hackathon challenge evidence, speech recognition engineering deep-dives, QA test runs, and setup guides for the PANDIVO Amazon Fire TV application (`com.firetv.musicpoc`).

---

## 🧭 Executive Quick Start for Hackathon Judges

If you are evaluating this project for the **Amazon Developer Hackathon**, start here:

| Document | Focus Area | Why It Matters |
|---|---|---|
| [**MINI_CHALLENGES.md**](./MINI_CHALLENGES.md) | **Hackathon Mini-Challenges** | Proof and implementation details for AWS Bedrock Nova Lite, Lambda Gateway, DynamoDB sync, and the open-source npm package. |
| [**SPEECH_TO_TEXT_PROBLEMS_AND_SOLUTIONS.md**](./SPEECH_TO_TEXT_PROBLEMS_AND_SOLUTIONS.md) | **Speech AI & Audio DSP** | Exhaustive root-cause analysis and mathematical solutions for living room remote mic gain, silence hallucinations, and AGC. |
| [**FEATURE_IMPLEMENTATION_AUTH_AND_RECOMMENDATIONS.md**](./FEATURE_IMPLEMENTATION_AUTH_AND_RECOMMENDATIONS.md) | **Core Features & Curation** | Frictionless QR-code authentication, multi-profile living room switching, SQLite WAL + DynamoDB hybrid storage, and recommendation engine. |
| [**AMAZON_FRICTION_LOG.md**](./friction_log/AMAZON_FRICTION_LOG.md) | **Ecosystem Feedback** | Detailed, constructive feedback on developer ergonomics across the Fire TV development toolchain. |
| [**OPEN_SOURCE_MINI_CHALLENGE.md**](./OPEN_SOURCE_MINI_CHALLENGE.md) | **Open Source Contribution** | Standalone npm package [`react-native-whistle-tv-offline`](https://www.npmjs.com/package/react-native-whistle-tv-offline) extracted for the global TV dev community. |

---

## 🗂️ Documentation Directory Map

```
docs/
├── 🏆 Hackathon & Mini-Challenges
│   ├── MINI_CHALLENGES.md                           ──► Proof for Bedrock, DynamoDB, Lambda, and open-source
│   ├── FEATURE_IMPLEMENTATION_AUTH_AND_RECOMMENDATIONS.md ──► QR auth, multi-profile, hybrid storage
│   ├── OPEN_SOURCE_MINI_CHALLENGE.md                ──► npm package release specifications
│   └── friction_log/AMAZON_FRICTION_LOG.md          ──► Developer friction log & SDK feedback
│
├── 🎙️ Speech Engine & Audio DSP Pipeline
│   ├── SPEECH_TO_TEXT_PROBLEMS_AND_SOLUTIONS.md     ──► DSP pipeline, VAD trimming, AGC, silence gating
│   ├── OFFLINE_SPEECH_RECOGNITION_FIX.md            ──► C++ JNI bridge, dual-ABI (ARM64/x86_64), GLIBC polyfill
│   └── TECH_STACK_AND_PACKAGES.md                   ──► Dependency inventory & library justifications
│
├── 🏗️ Architecture & System Design
│   └── architecture/
│       ├── SYSTEM_ARCHITECTURE.md                   ──► End-to-end component topology & threading model
│       ├── DATA_FLOW_AND_STORAGE.md                 ──► SQLite WAL + DynamoDB cloud synchronization
│       ├── TV_NAVIGATION_AND_UI_STATE.md            ──► 10-foot D-pad focus engine & centralized player store
│       └── VOICE_AND_AI_PIPELINE.md                 ──► Whistle C++ JNI & 3-Tier Bedrock cascade
│
├── 📱 Screen-by-Screen Specifications
│   └── pages/                                       ──► Detailed UI/UX specs for all 10 television screens
│       ├── 01_HOME_SCREEN.md ... 10_GLOBAL_CHASSIS_AND_NAVIGATION.md
│
├── 🧩 Modular Function Reference
│   └── functions/                                   ──► Deep-dive code breakdown for all internal engine modules
│       ├── 01_AWS_CLOUD_SYNC ... 08_CATALOG_AND_SEARCH
│
├── 🚀 Getting Started & Setup Guides
│   ├── setup/HOW_TO_DOWNLOAD_AND_RUN.md             ──► Quickest path to run the app from source
│   ├── getting_started/                             ──► 6-part setup series (Metro bundler, prerequisites, etc.)
│   └── setup/                                       ──► Backend AWS credentials & C++ NDK setup
│
└── 🧪 QA, Media Audits & Compliance Evidence
    ├── testing/MASTER_TEST_PLAN.md                  ──► Complete test strategy and acceptance criteria
    ├── testing/DEVICE_MATRIX.md                     ──► Fire TV Stick 4K/Max, Cube, and Omni compatibility
    ├── media_testing/MEDIA_OPTIMIZATION_REPORT.md   ──► Audit of all 164 media assets & WebP memory footprint
    └── testing/stage_1_smoke/ ... stage_6_compliance ──► Complete test execution logs & screenshot archives
```

---

## 📑 Detailed Category Breakdown

### 1. 🏆 Hackathon Challenges & Core Innovations

Essential reading for evaluation of hackathon criteria and AWS/Fire TV integration:

- **[Mini-Challenges Overview](./MINI_CHALLENGES.md)**: Direct evidence and architecture for:
  - *Challenge 1*: Amazon Bedrock Nova Lite integration via resilient multi-tier fallback.
  - *Challenge 2*: AWS Lambda REST Gateway for metadata streaming.
  - *Challenge 3*: Amazon DynamoDB multi-device profile and favorites sync.
  - *Challenge 4*: Open-source npm package `react-native-whistle-tv-offline`.
- **[Feature Implementation & Recommendation Engine](./FEATURE_IMPLEMENTATION_AUTH_AND_RECOMMENDATIONS.md)**: Deep dive into the 6-dimension mood/time-of-day scoring engine and frictionless living room QR authentication.
- **[Amazon Developer Friction Log](./friction_log/AMAZON_FRICTION_LOG.md)**: Real-world developer experience report identifying pain points in Fire TV emulation, Gradle NDK integration, and remote input handling.

---

### 2. 🎙️ Offline Speech AI & Audio DSP Engineering

How PANDIVO achieved sub-120ms on-device speech recognition with zero cloud dependencies and zero silence hallucinations:

- **[Speech-to-Text Problems, Root Causes & Solutions](./SPEECH_TO_TEXT_PROBLEMS_AND_SOLUTIONS.md)**:
  - *The TV Remote Dilemma*: Solving low-gain Bluetooth microphones and 2–3 foot couch distance.
  - *Audio Preprocessor*: 80Hz 1-pole High-Pass Filter, VAD Energy Silence Trimmer, and Peak AGC Normalizer (0.85 dynamic range).
  - *Eliminating Silence Hallucinations*: Pre-inference RMS energy gating (`<0.010 RMS`) and post-inference token blacklist.
  - *Aho-Corasick Phrase Biasing*: Boosting music catalog terms via prefix trees.
  - *Punctuation Normalization*: Stripping trailing punctuation for 100% search parity (`"Rose."` → `"rose"`).
- **[Offline Speech Recognition Architecture & Native C++](./OFFLINE_SPEECH_RECOGNITION_FIX.md)**: JNI integration, `whistle.cact` 16.9 MB neural model deployment, dual ABI support (`arm64-v8a` + `x86_64`), and GLIBC compatibility shims for Android Bionic.
- **[Technology Stack & Dependencies](./TECH_STACK_AND_PACKAGES.md)**: Full inventory of production packages, licenses, and architecture justifications.

---

### 3. 🏗️ Architecture, UI State & Data Flow

Technical specifications covering how PANDIVO maintains 60 FPS spatial animations and resilient state:

- **[System Architecture](./architecture/SYSTEM_ARCHITECTURE.md)**: Macro-level component topologies, execution threads, and hardware boundaries.
- **[Data Flow & Storage](./architecture/DATA_FLOW_AND_STORAGE.md)**: Hybrid storage engine combining ultra-fast local SQLite WAL mode with asynchronous Amazon DynamoDB cloud replication.
- **[TV Navigation & Focus Engine](./architecture/TV_NAVIGATION_AND_UI_STATE.md)**: 10-foot spatial navigation hierarchy, centralized audio player store, and D-pad event routing.
- **[Voice & AI Pipeline](./architecture/VOICE_AND_AI_PIPELINE.md)**: Complete lifecycle of a voice command from remote mic trigger to Bedrock AI DJ playlist generation.

---

### 4. 📱 UI Screen Specifications (`/pages`)

Comprehensive documentation of every 10-foot interface screen:

| Screen | File | Key Capabilities |
|---|---|---|
| **Home Screen** | [`01_HOME_SCREEN.md`](./pages/01_HOME_SCREEN.md) | Dynamic time-of-day hero banner, featured playlists, and recently played shelf. |
| **AI DJ Screen** | [`02_AI_DJ_SCREEN.md`](./pages/02_AI_DJ_SCREEN.md) | Visual mic circular gauge, mood intent visualization, and generative session builder. |
| **Search Screen** | [`03_SEARCH_SCREEN.md`](./pages/03_SEARCH_SCREEN.md) | Hybrid fuzzy search, live query suggestions, and on-screen 10-foot keypad. |
| **Library Screen** | [`04_LIBRARY_SCREEN.md`](./pages/04_LIBRARY_SCREEN.md) | Aggregated view of playlists, liked songs, and USB offline media tracks. |
| **Favorites Screen** | [`05_FAVORITES_SCREEN.md`](./pages/05_FAVORITES_SCREEN.md) | Fast-access pinned tracks with instantaneous local SQLite bookmarking. |
| **Playlist Detail** | [`06_PLAYLIST_DETAIL_SCREEN.md`](./pages/06_PLAYLIST_DETAIL_SCREEN.md) | Hero artwork, duration metrics, Fisher-Yates shuffle toggle, and tracklist. |
| **Fullscreen Player** | [`07_FULLSCREEN_PLAYER_SCREEN.md`](./pages/07_FULLSCREEN_PLAYER_SCREEN.md) | Spatial looping ambient video canvases, theme palette switcher, and Bedrock insight modal. |
| **Settings Screen** | [`08_SETTINGS_SCREEN.md`](./pages/08_SETTINGS_SCREEN.md) | Audio output configuration, cache management, and hardware diagnostic toggles. |
| **Avatar Selection** | [`09_AVATAR_SELECTION_SCREEN.md`](./pages/09_AVATAR_SELECTION_SCREEN.md) | Interactive companion vibe selector (Bamboo, Rusty, Frost, Sparky, Shadow). |
| **Global Chassis** | [`10_GLOBAL_CHASSIS_AND_NAVIGATION.md`](./pages/10_GLOBAL_CHASSIS_AND_NAVIGATION.md) | Collapsible navigation drawer, mini-player persistence, and focus traps. |

---

### 5. 🧩 Modular Function Reference (`/functions`)

Exhaustive API documentation for core application services:

- [`01_AWS_CLOUD_SYNC_FUNCTIONS.md`](./functions/01_AWS_CLOUD_SYNC_FUNCTIONS.md): DynamoDB conflict resolution and retry logic.
- [`02_AI_DJ_AND_INTENT_FUNCTIONS.md`](./functions/02_AI_DJ_AND_INTENT_FUNCTIONS.md): Bedrock Nova Lite prompts, schema validation, and Gemini fallback.
- [`03_OFFLINE_VOICE_FUNCTIONS.md`](./functions/03_OFFLINE_VOICE_FUNCTIONS.md): Native JNI bindings and audio buffer lifecycle.
- [`04_SQLITE_STORAGE_FUNCTIONS.md`](./functions/04_SQLITE_STORAGE_FUNCTIONS.md): Relational schema, queries, and index optimizations.
- [`05_AUDIO_PLAYBACK_FUNCTIONS.md`](./functions/05_AUDIO_PLAYBACK_FUNCTIONS.md): MediaPlayer wrapper, queue managers, and Fisher-Yates shuffle.
- [`06_TV_SPATIAL_NAVIGATION_FUNCTIONS.md`](./functions/06_TV_SPATIAL_NAVIGATION_FUNCTIONS.md): Focus state managers and D-pad event interceptors.
- [`07_USB_STORAGE_DISCOVERY_FUNCTIONS.md`](./functions/07_USB_STORAGE_DISCOVERY_FUNCTIONS.md): Android Storage Access Framework (SAF) and local MP3/FLAC metadata parsing.
- [`08_CATALOG_AND_SEARCH_FUNCTIONS.md`](./functions/08_CATALOG_AND_SEARCH_FUNCTIONS.md): Fuzzy scoring algorithms and relevance sorting.

---

### 6. 🚀 Setup, Build & Developer Guides

- **[How to Download and Run (Quickstart)](./setup/HOW_TO_DOWNLOAD_AND_RUN.md)**: The fastest guide to running PANDIVO via pre-configured batch scripts.
- **[Getting Started Series](./getting_started/README.md)**:
  - [`01_SYSTEM_REQUIREMENTS_AND_PREREQUISITES.md`](./getting_started/01_SYSTEM_REQUIREMENTS_AND_PREREQUISITES.md)
  - [`02_CLONING_AND_DEPENDENCY_INSTALLATION.md`](./getting_started/02_CLONING_AND_DEPENDENCY_INSTALLATION.md)
  - [`03_RUNNING_METRO_BUNDLER_AND_BATCH_FILES.md`](./getting_started/03_RUNNING_METRO_BUNDLER_AND_BATCH_FILES.md)
  - [`04_EMULATOR_AND_PHYSICAL_DEVICE_SETUP.md`](./getting_started/04_EMULATOR_AND_PHYSICAL_DEVICE_SETUP.md)
  - [`05_TV_REMOTE_SIMULATION_AND_TESTING.md`](./getting_started/05_TV_REMOTE_SIMULATION_AND_TESTING.md)
  - [`06_TROUBLESHOOTING_AND_FAQ.md`](./getting_started/06_TROUBLESHOOTING_AND_FAQ.md)
- **[Environment & Backend Setup](./setup/README.md)**:
  - [`01_DEVELOPMENT_ENVIRONMENT_SETUP.md`](./setup/01_DEVELOPMENT_ENVIRONMENT_SETUP.md)
  - [`02_FIRE_TV_AND_EMULATOR_SETUP.md`](./setup/02_FIRE_TV_AND_EMULATOR_SETUP.md)
  - [`03_C_PLUS_PLUS_AND_WHISTLE_NATIVE_SETUP.md`](./setup/03_C_PLUS_PLUS_AND_WHISTLE_NATIVE_SETUP.md)
  - [`04_AWS_BACKEND_AND_DYNAMODB_SETUP.md`](./setup/04_AWS_BACKEND_AND_DYNAMODB_SETUP.md)
  - [`05_GEMINI_AI_API_SETUP.md`](./setup/05_GEMINI_AI_API_SETUP.md)
  - [`06_USB_STORAGE_TESTING_SETUP.md`](./setup/06_USB_STORAGE_TESTING_SETUP.md)
  - [`07_BUILD_RUN_AND_VERIFICATION_GUIDE.md`](./setup/07_BUILD_RUN_AND_VERIFICATION_GUIDE.md)

---

### 7. 🧪 Testing, Quality Assurance & Media Audits

- **[Master Test Plan](./testing/MASTER_TEST_PLAN.md)**: Comprehensive QA methodology spanning unit, integration, UI focus, and performance benchmarks.
- **[Hardware Device Matrix](./testing/DEVICE_MATRIX.md)**: Verification matrix covering physical Fire TV Stick 4K, Fire TV Cube, Omni QLED, and x86_64 emulators.
- **[Media Optimization & Footprint Report](./media_testing/MEDIA_OPTIMIZATION_REPORT.md)**: Exhaustive audit of all 164 media assets, detailing dimension limits, WebP compression, and RAM impact on living room hardware.
- **Stage Testing Archives**:
  - [Stage 1: Smoke Tests & Infrastructure Verification](./testing/stage_1_smoke/STAGE_1_SMOKE_TEST_REPORT.md)
  - [Stage 2: 10-Foot Navigation & Focus Traps](./testing/stage_2_tv_navigation/STAGE_2_TV_NAVIGATION_REPORT.md)
  - [Stage 3: Audio Streaming & Playback Engine](./testing/stage_3_audio_streaming/STAGE_3_AUDIO_STREAMING_REPORT.md)
  - [Stage 4: AI DJ & Voice Recognition](./testing/stage_4_ai_dj_voice/STAGE_4_AI_DJ_VOICE_REPORT.md)
  - [Stage 5: USB Offline Storage Discovery](./testing/stage_5_usb_storage/STAGE_5_USB_STORAGE_REPORT.md)
  - [Stage 6: Fire TV Appstore Compliance](./testing/stage_6_compliance/STAGE_6_COMPLIANCE_REPORT.md)

---

## 📄 License & Community

PANDIVO is created for the **Amazon Developer Hackathon 2026** by Mahaveer K.
Core speech-to-text libraries are released under the **MIT License**.
