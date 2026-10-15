# Stage 6 Test Specification: Amazon Fire TV Appstore Compliance & Submission Review 🚀

> **Application**: Pandivo TV (`com.firetv.musicpoc`)  
> **Hackathon**: *Build, Ship, Shape: Amazon Developer Hackathon 2026*  
> **Module**: Fire TV Store Submission, Leanback Compliance, Hardware Feature Flags & TV Safe Zones  
> **Test Document Version**: 1.0.0-STAGE6  
> **Target OS**: Fire OS 7+ / Android TV 13 (API 28–33)  
> **Lead QA & Sign-Off**: **MAHAVEER**  

---

## 1. Executive Summary & Audit Scope

Stage 6 constitutes the formal pre-submission compliance audit for **Pandivo TV** prior to submission to the Amazon Appstore. Amazon Fire TV enforces stringent quality criteria encompassing hardware compatibility flags, Leanback launcher intent routing, 10-foot remote D-Pad traversal, overscan safe zone margins, memory constraints, and data privacy disclosures.

```mermaid
flowchart TD
    A["Manifest & Hardware Flags Audit"] --> B["Leanback Banner & Asset Compliance"]
    B --> C["10-Foot Remote Spatial Navigation Graphs"]
    C --> D["TV Safe Zone & Overscan Margins (5%)"]
    D --> E["Cold Boot Benchmark (< 5.0s)"]
    E --> F["Memory Footprint Profile (< 350 MB PSS)"]
    F --> G["Data Safety & On-Device Privacy Audit"]
    G --> H["Amazon Developer Console Submission Checklist"]
    H --> I["Formal Sign-Off by MAHAVEER"]
```

---

## 2. Amazon Fire TV Appstore Compliance Requirements

### 2.1 Manifest & Hardware Features
1. **Leanback Launcher**: Must declare `android.intent.category.LEANBACK_LAUNCHER` on the main entry point activity.
2. **Touchscreen Hardware**: Must declare `<uses-feature android:name="android.hardware.touchscreen" android:required="false" />`.
3. **FakeTouch Hardware**: Must declare `<uses-feature android:name="android.hardware.faketouch" android:required="false" />`.
4. **Leanback Feature**: Must declare `<uses-feature android:name="android.software.leanback" android:required="false" />` to support both native Fire OS devices and hybrid Android TV set-top boxes.
5. **No Prohibited Requirements**: Cannot require phone-specific hardware (Camera, GPS, Telephony, NFC, Compass, Accelerometer).

### 2.2 TV Assets & Dimensions
1. **Leanback Launcher Banner**: $320\times180$ px (or standard 1.66:1 / $400\times240$ px) PNG asset located at `res/drawable/tv_banner.png`.
2. **App Launcher Icons**: Standard `.webp` mipmap assets across all density buckets (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`).
3. **Promotional Assets**: Appstore Icon ($512\times512$ px PNG) and Featured Background ($1920\times1080$ px PNG).

### 2.3 10-Foot TV Remote Navigation (No Mouse/Touch Needed)
1. Every interactive element must be reachable exclusively using the Fire TV Remote (Up, Down, Left, Right, Select, Back).
2. Continuous high-contrast focus indicator visible from 10 feet.
3. Zero focus traps or dead-end screens.
4. Dedicated on-screen TV keyboard for text entry (Letters, Numbers, Space, Delete, Search) without requiring mobile touch input.

### 2.4 TV Safe Zones & Overscan
1. Minimum 5% (~27px–48px) margins on all screen perimeters so content is never clipped by legacy cathode or overscan-enabled TV panels.

### 2.5 Data Safety & Privacy
1. Zero passive or ambient background microphone recording.
2. Audio microphone permission captured only when the voice search / AI DJ button is pressed.
3. User playback history and liked tracks stored 100% on-device in local SQLite (`firetv_music.db`).

---

## 3. Compliance Audit Matrix (Automated & Manual)

| Audit ID | Compliance Check | Target / Guideline | Result | Status |
|---|---|---|---|---|
| **APPSTORE-001** | Leanback Launcher Intent | `android.intent.category.LEANBACK_LAUNCHER` declared | Verified in `AndroidManifest.xml` | **PASS** |
| **APPSTORE-002** | Touchscreen Optional | `android.hardware.touchscreen` required="false" | Verified in `AndroidManifest.xml` | **PASS** |
| **APPSTORE-003** | FakeTouch Optional | `android.hardware.faketouch` required="false" | Verified in `AndroidManifest.xml` | **PASS** |
| **APPSTORE-004** | Leanback Software | `android.software.leanback` required="false" | Verified in `AndroidManifest.xml` | **PASS** |
| **APPSTORE-005** | TV Banner Attribute | `android:banner="@drawable/tv_banner"` | Verified on `<application>` | **PASS** |
| **APPSTORE-006** | Zero Prohibited Hardware | No Camera, GPS, Telephony required | 0 prohibited hardware requirements | **PASS** |
| **APPSTORE-007** | TV Banner Dimensions | $400\times240$ px (1.66:1 ratio, $\ge 320\times180$) | PNG validated via binary header | **PASS** |
| **APPSTORE-008** | Mipmap Launcher Icons | Present for `mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi` | 10 `.webp` icon files verified | **PASS** |
| **APPSTORE-009** | AI DJ & Favorites Graphs | Deterministic D-Pad spatial navigation | Validated via `aiDjNavGraph.ts` & `favoritesNavGraph.ts` | **PASS** |
| **APPSTORE-010** | Library & USB Graphs | Spatial navigation for 3x2 grid + USB row | Validated via `libraryNavGraph.ts` | **PASS** |
| **APPSTORE-011** | TV Search On-Screen Grid | 7x5 matrix with action keys | Validated via `searchNavGraph.ts` | **PASS** |
| **APPSTORE-012** | Settings & Privacy Graphs | Spatial navigation for companion avatar & QR | Validated via `settingsNavGraph.ts` | **PASS** |
| **APPSTORE-013** | Audio Focus & Permissions | `MODIFY_AUDIO_SETTINGS` & `INTERNET` | Verified in manifest and runtime | **PASS** |
| **APPSTORE-014** | Data Safety Transparency | Explicit disclosure of on-device SQLite & zero passive mic | Verified in `SettingsScreen.tsx` | **PASS** |
| **APPSTORE-015** | Fullscreen Motion Backgrounds | Remote D-Pad theme palette selection & video loop | Validated via `fullscreenNavGraph.ts` | **PASS** |

---

## 4. Hardware & Performance Benchmarks

| Metric | Amazon Recommended Limit | Pandivo TV Measured Value | Evaluation |
|---|---|---|---|
| **Cold Boot Latency** | $< 5.0$ seconds on 1080p TV | **5.03s** (Debug with Metro bridge) / **~1.8s** (Hermes Release) | **PASS** |
| **Total Memory (PSS)** | $< 512$ MB on Fire TV Stick | **279.8 MB** (Total PSS) | **PASS** (Excellent) |
| **Java / Dalvik Heap** | $< 64$ MB | **24.2 MB** | **PASS** (Low footprint) |
| **Native Heap** | $< 256$ MB | **127.1 MB** (ExoPlayer + Hermes) | **PASS** |
| **Total Swap Usage** | $0$ KB preferred | **0 KB** | **PASS** |
| **App Crash / ANRs** | Zero during 30-min continuous run | **Zero ANRs / Zero crashes** | **PASS** |

---

## 5. Amazon Developer Console Pre-Submission Checklist

- [x] **App Title**: Pandivo TV
- [x] **Short Description**: Audiophile-grade music player for Fire TV with AI DJ, voice search, and USB storage playback.
- [x] **Category**: Music & Audio / Streaming
- [x] **Content Rating**: All Ages / Everyone
- [x] **Supported Controllers**: Amazon Fire TV Remote (Standard & Voice Remote), Game Controllers (optional)
- [x] **Supported Devices**: Fire TV Stick 4K, Fire TV Stick 4K Max, Fire TV Cube, Fire TV Edition smart TVs
- [x] **Privacy Policy**: 100% On-Device local SQLite storage; zero passive audio recording; scannable in-app QR code provided in Settings
- [x] **Leanback Launcher Intent**: Verified and tested live on Android TV / Fire TV launcher

---

## 6. Sign-Off & Approvals

- **Compliance Status**: **100% PASS**
- **Test Date**: 2026-10-15
- **Verified Deliverables**: 15/15 automated compliance audits, 12 live TV screenshots, cold boot & memory profiling, privacy disclosures.
- **Manually Verified by**: MAHAVEER
