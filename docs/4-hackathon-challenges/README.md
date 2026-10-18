# Amazon Developer Hackathon 2026: Challenges & Core Innovations 🏆

Welcome to the **Hackathon Evidence & Innovation Portal** for Pandivo TV, submitted to the ***Build, Ship, Shape: Amazon Developer Hackathon 2026***.

---

## 🧭 Executive Navigation for Hackathon Judges

| Document | Track / Focus | Key Evidence & Benchmarks |
|---|---|---|
| [**`MINI_CHALLENGES.md`**](./MINI_CHALLENGES.md) | **Mini-Challenges Track** | Full implementation details and live verification for: <br>• **Challenge 1**: Amazon Bedrock Nova Lite (`amazon.nova-lite-v1:0`)<br>• **Challenge 2**: AWS Lambda Serverless Gateway (Sydney `ap-southeast-2`)<br>• **Challenge 3**: Amazon DynamoDB Single-Table State Sync (`pandivo-tv-cloud-sync`)<br>• **Challenge 4**: Open-source npm package `react-native-whistle-tv-offline`. |
| [**`CORE_FEATURES_AND_RECOMMENDATIONS.md`**](./CORE_FEATURES_AND_RECOMMENDATIONS.md) | **Core Architecture & Curation** | Frictionless QR code companion authentication, multi-profile living room user switching, 6D mood/time-of-day scoring engine, and SQLite WAL + DynamoDB hybrid persistence. |
| [**`OPEN_SOURCE_MINI_CHALLENGE.md`**](./OPEN_SOURCE_MINI_CHALLENGE.md) | **Open Source Contribution** | Extraction of standalone offline speech recognition engine into [`react-native-whistle-tv-offline`](https://www.npmjs.com/package/react-native-whistle-tv-offline), dual-ABI C++ binaries, zero-cloud privacy architecture. |
| [**`friction_log/AMAZON_FRICTION_LOG.md`**](./friction_log/AMAZON_FRICTION_LOG.md) | **Ecosystem Feedback** | Detailed 10-point constructive developer friction report covering Fire TV emulation, Gradle NDK quirks, remote D-pad input handling, and documentation ergonomics. |

---

## 🚀 Track Submissions Summary

### 1. Cloud & Generative AI with AWS Services
- **Amazon Bedrock Nova Lite**: Sub-second natural language extraction (**555 ms – 709 ms**) and radio-host commentary (**435 ms – 477 ms**).
- **Serverless AWS Lambda Gateway**: Clean, easy-to-audit serverless bridge handling Bedrock Converse API invocation and DynamoDB single-table persistence without embedding IAM credentials in the client APK.
- **Amazon DynamoDB Cloud Sync**: Debounced **67 ms** state push and **4 ms – 41 ms** cold boot restore synchronizing avatar selections, liked tracks, playlists, and AI DJ history across multi-room Fire TVs.

### 2. Open-Source TV Ecosystem Contribution
- **npm Package**: [`react-native-whistle-tv-offline`](https://www.npmjs.com/package/react-native-whistle-tv-offline)
- **GitHub Repository**: [`MAHAVEER-IT/react-native-whistle-tv-offline`](https://github.com/MAHAVEER-IT/react-native-whistle-tv-offline)
- **Capabilities**: Universal on-device speech-to-text with audio DSP preprocessor, VAD trimming, AGC normalizer, pre-inference RMS energy gating, and clean punctuation normalization.
