# Pandivo TV: Core Functions & Code Reference Guide 🛠️📖

## Overview

This directory provides developer-level documentation for every critical function and engine in **Pandivo TV**. Each document details the function's technical purpose, type signatures, parameter specifications, failure fallbacks, and simple, runnable examples.

---

## 🗂️ Core Function Categories

| Document | Focus Domain | Key Functions Documented |
|---|---|---|
| [**`01_AWS_CLOUD_SYNC_FUNCTIONS.md`**](./01_AWS_CLOUD_SYNC_FUNCTIONS.md) | **Amazon DynamoDB & Cloud Sync** | `initializeCloudSyncOnBoot`, `performCloudSyncPush`, `queueCloudSyncPush`, `subscribeToCloudRestore` |
| [**`02_AI_DJ_AND_INTENT_FUNCTIONS.md`**](./02_AI_DJ_AND_INTENT_FUNCTIONS.md) | **Bedrock Nova Lite & Gemini AI** | `parseVoiceIntent`, `generateAiDjSession`, `getGeminiSongStory`, `handleAiDjError` |
| [**`03_OFFLINE_VOICE_FUNCTIONS.md`**](./03_OFFLINE_VOICE_FUNCTIONS.md) | **Whistle C++ JNI Speech Engine** | `startListening`, `stopListening`, `isRecognitionAvailable`, `WhistleEngine.transcribe` |
| [**`04_SQLITE_STORAGE_FUNCTIONS.md`**](./04_SQLITE_STORAGE_FUNCTIONS.md) | **Local SQLite WAL Database** | `getLikedSongIds`, `setSongLike`, `getSavedAvatarSelection`, `recordSearch`, `recordRecentlyPlayed` |
| [**`05_AUDIO_PLAYBACK_FUNCTIONS.md`**](./05_AUDIO_PLAYBACK_FUNCTIONS.md) | **Living Room Playback & Audio** | `handlePlayTrack`, `handleTogglePlayPause`, `handleSeekDelta`, `handleToggleShuffle`, `handleToggleFullscreen` |
| [**`06_TV_SPATIAL_NAVIGATION_FUNCTIONS.md`**](./06_TV_SPATIAL_NAVIGATION_FUNCTIONS.md) | **10-Foot D-Pad State Machines** | `getHomeNextFocus`, `getAiDjNextFocus`, `getPlaylistNextFocus`, `getLibraryNextFocus`, `getSearchNextFocus` |
| [**`07_USB_STORAGE_DISCOVERY_FUNCTIONS.md`**](./07_USB_STORAGE_DISCOVERY_FUNCTIONS.md) | **USB Storage & Offline ID3** | `scanUsbVolumes`, `parseUsbAudioTracks`, `detectUsbMountState`, `buildUsbPlaylist` |
| [**`08_CATALOG_AND_SEARCH_FUNCTIONS.md`**](./08_CATALOG_AND_SEARCH_FUNCTIONS.md) | **Fuzzy Search & Recommendations** | `searchRankedTracks`, `getRecommendedTracksForTimeOfDay`, `calculateRelevanceScore` |

---

## 💡 How to Use These Guides

- **No Secret Leaks / Clean Paths**: All sample code imports use project-relative aliases (`FireTVMusicPOC/src/...`).
- **Production Error Handling**: Every example shows how to handle hardware disconnects, network timeouts, and cold boot states.
- **Copy-Paste Ready**: Code snippets are designed for drop-in usage and unit testing.
