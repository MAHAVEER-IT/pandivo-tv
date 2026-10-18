# Pandivo TV: Architecture Documentation Suite 🏛️

Welcome to the comprehensive technical architecture documentation for **Pandivo TV** (`com.firetv.musicpoc`), an open-source living room music companion built for the *Build, Ship, Shape: Amazon Developer Hackathon 2026*.

---

## 📑 Core Architecture Documents

| Document | Purpose & Scope | Key Technologies Covered |
|---|---|---|
| **1. [System Architecture](SYSTEM_ARCHITECTURE.md)** | End-to-end system design, client-cloud topology, benchmarks & high-level architecture diagram. | React Native TV 0.86, Expo 57, AWS Lambda, Amazon Bedrock, DynamoDB |
| **2. [Data Flow & Storage](DATA_FLOW_AND_STORAGE.md)** | Hybrid local SQLite WAL mode + Amazon DynamoDB single-table cloud sync, schema definitions & cold boot disaster recovery. | SQLite 3 WAL, Amazon DynamoDB single-table, Non-blocking sync manager |
| **3. [Voice & Generative AI Pipeline](VOICE_AND_AI_PIPELINE.md)** | On-device C++ JNI microphone pipeline (Whistle), Amazon Bedrock Nova Lite intent parsing, AI DJ live commentary & 3-tier failover. | C++ JNI (`whistle.cact`), `amazon.nova-lite-v1:0`, Google Gemini Flash |
| **4. [TV Navigation & UI State](TV_NAVIGATION_AND_UI_STATE.md)** | 10-foot spatial D-pad state machines, collision-free modal isolation, self-healing focus fallbacks & 60 FPS optimizations. | Spatial navigation graphs, VirtualizedLists, Hermes AOT, WebP textures |

---

## 🗂️ Architectural Subsystems

In addition to core system design documents, this section includes complete specifications for every screen and function in the codebase:

- 📱 [**Screen-by-Screen UI/UX Specifications (`pages/`)**](./pages/README.md): Detailed wireframes, focus maps, and remote handlers for all 10 television screens (Home, AI DJ, Search, Library, Favorites, Fullscreen Player, Settings, Avatars, etc.).
- 🧩 [**Modular Code Function Reference (`functions/`)**](./functions/README.md): Deep-dive reference for all 8 underlying functional engines (AWS Cloud Sync, AI DJ & Intent, Offline Voice, SQLite Storage, Audio Playback, Spatial Navigation, USB Discovery, Catalog & Search).

---

## 🏆 Amazon Developer Hackathon 2026 Architecture Alignment

```mermaid
graph TD
    A["Pandivo TV Architecture"] --> B["AWS Builder Mini-Challenge Stack"]
    A --> C["Open Source & Friction Log Excellence"]
    A --> D["10-Foot Living Room TV Mastery"]

    B --> B1["Amazon Bedrock (Nova Lite): Sub-600ms live AI DJ & natural language search"]
    B --> B2["Amazon DynamoDB: Single-table multi-device cloud synchronization"]
    B --> B3["AWS Lambda: Serverless Function URL orchestration in ap-southeast-2"]

    C --> C1["Zero-Passive-Listening C++ JNI speech engine (Whistle)"]
    C --> C2["10/10 Friction Items documented with workarounds & recommendations"]
    C --> C3["100% Green Automated Test Suites (Integration + Acceptance)"]

    D --> D1["Deterministic spatial D-pad remote navigation with zero focus traps"]
    D --> D2["Sub-1ms local SQLite WAL mode for uncompromised 60 FPS UI responsiveness"]
    D --> D3["Lossless WebP texture optimization dropping memory by 78%"]
```
