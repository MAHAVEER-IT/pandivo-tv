# 📚 PANDIVO Technical Documentation Portal

[![Platform: Fire OS & Android TV](https://img.shields.io/badge/Platform-Fire%20OS%207%20%7C%208%20%28Android%20TV%29-orange.svg)](https://developer.amazon.com/fire-tv)
[![STT: 100% On-Device Whistle](https://img.shields.io/badge/Speech%20Engine-100%25%20Offline%20Whistle-green.svg)](./3-speech-and-ai/SPEECH_TO_TEXT_PROBLEMS_AND_SOLUTIONS.md)
[![AI: Amazon Bedrock Nova Lite](https://img.shields.io/badge/AI%20Engine-Amazon%20Bedrock%20Nova%20Lite-blue.svg)](./4-hackathon-challenges/MINI_CHALLENGES.md)
[![Package: react-native-whistle-tv-offline](https://img.shields.io/badge/npm-react--native--whistle--tv--offline-red.svg)](https://www.npmjs.com/package/react-native-whistle-tv-offline)

Welcome to the **PANDIVO Technical Documentation Portal**. This repository contains the complete architectural blueprints, hackathon challenge evidence, speech recognition engineering deep-dives, QA test runs, and setup guides for the PANDIVO Amazon Fire TV application (`com.firetv.musicpoc`).

---

## 🧭 Executive Quick Start for Hackathon Judges

If you are evaluating this project for the **Amazon Developer Hackathon**, start here:

| Document | Focus Area | Why It Matters |
|---|---|---|
| [**`MINI_CHALLENGES.md`**](./4-hackathon-challenges/MINI_CHALLENGES.md) | **Hackathon Mini-Challenges** | Proof and implementation details for AWS Bedrock Nova Lite, Lambda Gateway, DynamoDB sync, and the open-source npm package. |
| [**`SPEECH_TO_TEXT_PROBLEMS_AND_SOLUTIONS.md`**](./3-speech-and-ai/SPEECH_TO_TEXT_PROBLEMS_AND_SOLUTIONS.md) | **Speech AI & Audio DSP** | Exhaustive root-cause analysis and mathematical solutions for living room remote mic gain, silence hallucinations, and AGC. |
| [**`CORE_FEATURES_AND_RECOMMENDATIONS.md`**](./4-hackathon-challenges/CORE_FEATURES_AND_RECOMMENDATIONS.md) | **Core Features & Curation** | Frictionless QR-code authentication, multi-profile living room switching, SQLite WAL + DynamoDB hybrid storage, and recommendation engine. |
| [**`AMAZON_FRICTION_LOG.md`**](./4-hackathon-challenges/friction_log/AMAZON_FRICTION_LOG.md) | **Ecosystem Feedback** | Detailed, constructive feedback on developer ergonomics across the Fire TV development toolchain. |
| [**`LIVE_DEVICE_TESTING.md`**](./6-cloud-physical-firetv-testing/README.md) | **Live Hardware Proof** | Official Amazon Appstore Quality Central device farm run on physical Fire OS TV with Fire TV remote. |
| [**`OPEN_SOURCE_MINI_CHALLENGE.md`**](./4-hackathon-challenges/OPEN_SOURCE_MINI_CHALLENGE.md) | **Open Source Contribution** | Standalone npm package [`react-native-whistle-tv-offline`](https://www.npmjs.com/package/react-native-whistle-tv-offline) extracted for the global TV dev community. |

---

## 🗂️ Documentation Structure (6 Core Sections)

```
docs/
├── 1-getting-started/            ──► Step-by-step developer onboarding, prerequisites, and Fire TV setup
│   ├── 01_QUICKSTART_GUIDE.md ... 09_TROUBLESHOOTING_AND_FAQ.md
│   └── advanced_setup/           ──► C++ NDK toolchain, AWS backend, Gemini, and USB hardware setup
│
├── 2-architecture/               ──► End-to-end system design, data flow, screen & function specs
│   ├── SYSTEM_ARCHITECTURE.md, DATA_FLOW_AND_STORAGE.md, TV_NAVIGATION_AND_UI_STATE.md
│   ├── pages/                    ──► Detailed UI/UX specs for all 10 television screens
│   └── functions/                ──► Code breakdown for all 8 underlying functional engines
│
├── 3-speech-and-ai/              ──► On-device Whistle STT, Audio DSP preprocessor, and Bedrock AI DJ
│   ├── SPEECH_TO_TEXT_PROBLEMS_AND_SOLUTIONS.md, OFFLINE_SPEECH_RECOGNITION_FIX.md
│   └── TECH_STACK_AND_PACKAGES.md
│
├── 4-hackathon-challenges/       ──► Official hackathon mini-challenge evidence & ecosystem friction log
│   ├── MINI_CHALLENGES.md, CORE_FEATURES_AND_RECOMMENDATIONS.md, OPEN_SOURCE_MINI_CHALLENGE.md
│   └── friction_log/             ──► Constructive Amazon Fire TV developer experience report
│
├── 5-qa-and-testing/             ──► Master test strategy, hardware matrix, 6 validation stages & media audit
│   ├── MASTER_TEST_PLAN.md, DEVICE_MATRIX.md, stage_1_smoke ... stage_6_compliance
│   └── media_testing/            ──► Lossless WebP asset audit reducing TV memory by 78%
│
└── 6-cloud-physical-firetv-testing/ ──► Live Amazon Appstore Quality Central physical TV test evidence
    ├── README.md                 ──► Complete 11-screen walkthrough with live Fire TV remote
    └── screenshots/              ──► High-resolution screenshots from Amazon's cloud device farm
```

---

## 📑 Detailed Category Breakdown

### 1. 🚀 [Getting Started & Developer Onboarding (`1-getting-started/`)](./1-getting-started/README.md)

From initial git clone to living room television launch:

- [**01: 5-Minute Quickstart Guide**](./1-getting-started/01_QUICKSTART_GUIDE.md): Fastest path to running PANDIVO via pre-configured batch files.
- [**02: System Requirements & Prerequisites**](./1-getting-started/02_SYSTEM_REQUIREMENTS.md): Node.js LTS, JDK 17, Android Studio, SDK API 34.
- [**03: Installation & Configuration**](./1-getting-started/03_INSTALLATION.md): Dependency installation, `.env` file setup, and TV flags.
- [**04: Development Environment Setup**](./1-getting-started/04_DEVELOPMENT_ENVIRONMENT.md): Host environment configuration and tool verification.
- [**05: Running Metro Bundler & Scripts**](./1-getting-started/05_RUNNING_METRO_AND_SCRIPTS.md): Metro cache clearing, port binding, and `EXPO_TV=1`.
- [**06: Fire TV Hardware Provisioning**](./1-getting-started/06_FIRE_TV_HARDWARE_SETUP.md): 7-click developer mode unlock, Wi-Fi ADB pairing.
- [**07: Android TV Emulator Setup**](./1-getting-started/07_EMULATOR_SETUP.md): 1080p TV AVD configuration and hardware acceleration.
- [**08: TV Remote Simulation & Keycodes**](./1-getting-started/08_TV_REMOTE_SIMULATION.md): ADB remote control keycodes, voice injection broadcast.
- [**09: Troubleshooting & FAQ**](./1-getting-started/09_TROUBLESHOOTING_AND_FAQ.md): Port 8081 conflicts, white screen fix, mic permissions.
- [**Advanced Subsystems Setup (`advanced_setup/`)**](./1-getting-started/advanced_setup/README.md):
  - [`01_C_PLUS_PLUS_AND_WHISTLE_NATIVE.md`](./1-getting-started/advanced_setup/01_C_PLUS_PLUS_AND_WHISTLE_NATIVE.md)
  - [`02_AWS_BACKEND_AND_DYNAMODB.md`](./1-getting-started/advanced_setup/02_AWS_BACKEND_AND_DYNAMODB.md)
  - [`03_GEMINI_AI_API.md`](./1-getting-started/advanced_setup/03_GEMINI_AI_API.md)
  - [`04_USB_STORAGE_TESTING.md`](./1-getting-started/advanced_setup/04_USB_STORAGE_TESTING.md)
  - [`05_BUILD_RUN_AND_VERIFICATION.md`](./1-getting-started/advanced_setup/05_BUILD_RUN_AND_VERIFICATION.md)

---

### 2. 🏛️ [Architecture, Screens & Functions (`2-architecture/`)](./2-architecture/README.md)

Macro design, 10-foot television spatial UX, and modular engines:

- [**System Architecture**](./2-architecture/SYSTEM_ARCHITECTURE.md): Component topology, thread models, client-cloud boundaries.
- [**Data Flow & Storage**](./2-architecture/DATA_FLOW_AND_STORAGE.md): Hybrid local SQLite WAL mode + Amazon DynamoDB cloud replication.
- [**TV Navigation & Focus Engine**](./2-architecture/TV_NAVIGATION_AND_UI_STATE.md): Spatial D-pad routing, 60 FPS Hermes optimization, focus traps.
- [**Voice & AI Pipeline**](./2-architecture/VOICE_AND_AI_PIPELINE.md): End-to-end flow from remote mic to Bedrock generative DJ commentary.
- [**Screen-by-Screen UI Specifications (`pages/`)**](./2-architecture/pages/README.md):
  - 10 television screen layouts: [`01_HOME_SCREEN.md`](./2-architecture/pages/01_HOME_SCREEN.md) through [`10_GLOBAL_CHASSIS_AND_NAVIGATION.md`](./2-architecture/pages/10_GLOBAL_CHASSIS_AND_NAVIGATION.md).
- [**Modular Function Reference (`functions/`)**](./2-architecture/functions/README.md):
  - 8 core subsystems: [`01_AWS_CLOUD_SYNC`](./2-architecture/functions/01_AWS_CLOUD_SYNC_FUNCTIONS.md) through [`08_CATALOG_AND_SEARCH`](./2-architecture/functions/08_CATALOG_AND_SEARCH_FUNCTIONS.md).

---

### 3. 🎙️ [Speech AI, Audio DSP & Generative AI (`3-speech-and-ai/`)](./3-speech-and-ai/README.md)

How PANDIVO achieves sub-120ms on-device speech recognition with zero cloud dependencies and zero silence hallucinations:

- [**Speech-to-Text Problems, Root Causes & Solutions**](./3-speech-and-ai/SPEECH_TO_TEXT_PROBLEMS_AND_SOLUTIONS.md):
  - *The TV Remote Dilemma*: Solving low-gain Bluetooth microphones and 2–3 foot couch distance.
  - *Audio Preprocessor*: 80Hz 1-pole High-Pass Filter, VAD Energy Silence Trimmer, and Peak AGC Normalizer (0.85 dynamic range).
  - *Eliminating Silence Hallucinations*: Pre-inference RMS energy gating (`<0.010 RMS`) and post-inference token blacklist.
  - *Aho-Corasick Phrase Biasing*: Boosting music catalog terms via prefix trees.
  - *Punctuation Normalization*: Stripping trailing punctuation for 100% search parity (`"Rose."` → `"rose"`).
- [**Offline Speech Recognition Architecture & Native C++**](./3-speech-and-ai/OFFLINE_SPEECH_RECOGNITION_FIX.md): JNI integration, `whistle.cact` 16.9 MB neural model deployment, dual ABI support (`arm64-v8a` + `x86_64`), and GLIBC compatibility shims for Android Bionic.
- [**Technology Stack & Dependencies**](./3-speech-and-ai/TECH_STACK_AND_PACKAGES.md): Full inventory of production packages, licenses, and architecture justifications.

---

### 4. 🏆 [Hackathon Mini-Challenges & Ecosystem Feedback (`4-hackathon-challenges/`)](./4-hackathon-challenges/README.md)

Essential evidence for the Amazon Developer Hackathon evaluation criteria:

- [**Mini-Challenges Overview & Evidence**](./4-hackathon-challenges/MINI_CHALLENGES.md):
  - *Challenge 1*: Amazon Bedrock Nova Lite integration via resilient multi-tier fallback.
  - *Challenge 2*: AWS Lambda REST Gateway for metadata streaming.
  - *Challenge 3*: Amazon DynamoDB multi-device profile and favorites sync.
  - *Challenge 4*: Open-source npm package `react-native-whistle-tv-offline`.
- [**Feature Implementation & Recommendation Engine**](./4-hackathon-challenges/CORE_FEATURES_AND_RECOMMENDATIONS.md): Deep dive into the 6-dimension mood/time-of-day scoring engine and frictionless living room QR authentication.
- [**Open-Source TV Ecosystem Contribution**](./4-hackathon-challenges/OPEN_SOURCE_MINI_CHALLENGE.md): Package specifications, dual-ABI binaries, and developer ergonomics.
- [**Amazon Developer Friction Log**](./4-hackathon-challenges/friction_log/AMAZON_FRICTION_LOG.md): Constructive 10-point report on Fire TV emulation, Gradle NDK integration, and remote input handling.

---

### 5. 🧪 [Quality Assurance, Device Matrix & Media Audits (`5-qa-and-testing/`)](./5-qa-and-testing/README.md)

Verification across 6 stages and multi-device hardware validation:

- [**Master Test Plan**](./5-qa-and-testing/MASTER_TEST_PLAN.md): Complete QA methodology spanning unit, integration, UI focus, and performance benchmarks.
- [**Hardware Device Matrix**](./5-qa-and-testing/DEVICE_MATRIX.md): Verification matrix covering physical Fire TV Stick 4K, Fire TV Cube, Omni QLED, and x86_64 emulators.
- [**Media Optimization & Footprint Report**](./5-qa-and-testing/media_testing/MEDIA_OPTIMIZATION_REPORT.md): Exhaustive audit of all 164 media assets; WebP compression reducing texture memory by 78%.
- **Stage Testing Archives**:
  - [Stage 1: Smoke Tests & Infrastructure Verification](./5-qa-and-testing/stage_1_smoke_test/STAGE_1_SMOKE_TEST.md)
  - [Stage 2: 10-Foot Navigation & Focus Traps](./5-qa-and-testing/stage_2_tv_navigation/STAGE_2_DPAD_NAVIGATION_TEST.md)
  - [Stage 3: Audio Streaming & Playback Engine](./5-qa-and-testing/stage_3_audio_streaming/STAGE_3_AUDIO_STREAMING_TEST.md)
  - [Stage 4: AI DJ & Voice Recognition](./5-qa-and-testing/stage_4_ai_dj_voice/STAGE_4_AI_DJ_VOICE_TEST.md)
  - [Stage 5: USB Offline Storage Discovery](./5-qa-and-testing/stage_5_usb_storage/STAGE_5_USB_STORAGE_TEST.md)
  - [Stage 6: Fire TV Appstore Compliance](./5-qa-and-testing/stage_6_compliance/STAGE_6_COMPLIANCE_TEST.md)

---

### 6. 📺 [Amazon Appstore Quality Central Live Verification (`6-cloud-physical-firetv-testing/`)](./6-cloud-physical-firetv-testing/README.md)

Direct visual verification on real physical hardware via Amazon's official **Appstore Quality Central Live Device Interaction** cloud farm:

- [**Live Physical Fire TV Verification & 11-Screen Walkthrough**](./6-cloud-physical-firetv-testing/README.md):
  - Verified on **`FOS 14 3P TV`** physical television at **60 FPS** with physical Fire TV remote.
  - End-to-end evidence for Home, AI DJ, 5-stage glassmorphic generator, playlist detail with active scrubber, companion avatar carousel, search, Fire OS mic permissions, and settings with privacy QR code.

---

## 📄 License & Community

PANDIVO is created for the **Amazon Developer Hackathon 2026** by Mahaveer K.  
Core speech-to-text libraries are released under the **MIT License**.
