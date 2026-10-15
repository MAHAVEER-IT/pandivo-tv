# Stage 4: AI DJ & Voice Recognition Subsystems Test Specification 🤖🎙️

> **Project**: Pandivo TV (`com.firetv.musicpoc`)  
> **Hackathon**: *Build, Ship, Shape: Amazon Developer Hackathon 2026*  
> **Testing Stage**: Stage 4 — AI DJ Continuous Session Engine & Voice Recognition Subsystems  
> **Authority & Manual QA Verification**: **MAHAVEER**  
> **Date**: 2026-10-15  
> **Status**: **PASS (100% Validated)**  

---

## 📋 Executive Overview

Stage 4 validates the intelligent music curation, natural-language voice parsing, and dynamic continuous session engine of **Pandivo TV**. 

Designed for the 10-foot living room experience on Amazon Fire TV and Android TV, the AI DJ subsystem combines:
1. **Amazon Bedrock (Nova Lite `amazon.nova-lite-v1:0`) Primary Intent Engine**: Ultra-fast (~500ms), AWS-native foundation model transforming spoken requests into structured JSON music constraints.
2. **Google Gemini 3.5 Flash / Flash Lite Redundancy Engine**: Automatic high-availability secondary cloud fallback if AWS quotas or network routes experience spikes.
3. **Deterministic Offline Fallback NLP**: Seamless zero-latency offline heuristic parsing ensuring uninterrupted service even under zero network connectivity.
4. **AI DJ Continuous Session Engine (`aiDjSessionService.ts`)**: Lookahead queue planning, smooth energy trajectory steering, BPM pacing, strict artist non-repetition, negative mood exclusion, and live spoken radio commentary via Amazon Bedrock.
5. **10-Foot Voice & Processing TV UI (`AIDJProcessingOverlay.tsx` & `AiDjScreen.tsx`)**: Central pulsing orb, 6-segment native vector horseshoe gauge, multi-stage progress indicators, track reveal rows, and graceful error classification.

---

## 🎯 Test Objectives

1. Validate all **12 Gemini Intent Engine Acceptance Test Cases** across mood, activity context, decade filters, duration scaling, energy steering, negative exclusions, and out-of-domain rejections.
2. Validate all **8 AI DJ Continuous Session Acceptance Test Cases** ensuring lookahead queue maintenance, zero consecutive artist repeats, smooth energy progression ($\Delta \le 0.40$), and dynamic commentary.
3. Verify live 10-foot TV UI transitions triggered from `HERO_VOICE` on the Home screen and the dedicated `NAV_DJ` landing tab.
4. Confirm voice microphone listening state, audio ducking/pause continuity, and error classification with interactive `Try Again` and `Back` controls.

---

## 🔬 Test Suites & Specifications

### Suite A: Gemini Intent Parsing & Music Constraints (`geminiIntentService.ts`)

| Test ID | Test Name | Input Voice Prompt | Expected Parameters | Evaluation Metric |
|---|---|---|---|---|
| **INT-01** | Mood & Duration Parsing | *"Create a calm playlist for 30 minutes"* | `mood: calm`, `duration_minutes: 30` | Strict intent match |
| **INT-02** | Activity Context & Energy | *"Give me energetic workout music"* | `context: workout`, `energy: high` | Context & energy match |
| **INT-03** | Era Filter & Theme | *"Play romantic songs from the 2000s"* | `theme/mood: romantic`, `era: 2000-2009` | Era window match |
| **INT-04** | Similar Track Discovery | *"Play something similar to this"* | `action: play_similar` | Action match |
| **INT-05** | Live Energy Steering | *"Make it more energetic"* | `action: modify_playlist`, `mod.energy: high` | Steering action |
| **INT-06** | Negative Constraint | *"Remove sad songs"* | `action: modify_playlist`, `exclude_moods: ['sad']` | Exclusion list |
| **INT-07** | Custom Era Range | *"Give me music from 2010 to 2020"* | `era_start: 2010`, `era_end: 2020` | Era range bounds |
| **INT-08** | Multi-Word Context | *"Play something for a rainy evening"* | `context: rainy_evening` | Multi-word disambiguation |
| **INT-09** | Compound Tri-Constraint | *"I want chill acoustic music for an hour"* | `mood: chill`, `genre: acoustic`, `duration: 60m` | 3-factor constraint match |
| **INT-10** | Out-of-Domain Filter | *"What's the capital of France?"* | `action: unsupported`, `confidence: >= 0.95` | Rejection classification |
| **INT-11** | Ambiguity Clarification | *"Play something good"* | `needs_clarification: true`, prompt issued | Clarification trigger |
| **INT-12** | Hyphenated Multi-Constraint | *"Create a relaxing 45-minute playlist with romantic songs from the 2010s"* | `mood: relaxed`, `duration: 45m`, `theme: romantic`, `era: 2010-2019` | 4-factor hyphenated match |

- **Verification Sign-Off**:
  - **Manually Verified by**: MAHAVEER

---

### Suite B: AI DJ Continuous Session Engine (`aiDjSessionService.ts`)

| Test ID | Test Name | Invariant / Target | Verification Method |
|---|---|---|---|
| **DJ-01** | Session Initialization & Duration Scaling | Starter track selected, duration set to 120m, lookahead queue $\ge 3$ tracks, welcome commentary generated ($> 20$ chars) | Algorithmic test runner |
| **DJ-02** | Continuous Auto-Transition Event | Advancing track increments history, records played track ID, loads next queue item, maintains replenished lookahead queue ($\ge 3$ tracks) | Simulation runner |
| **DJ-03** | Smooth Energy Trajectory | Energy shifts gradually toward target without jarring jumps; maximum single-step energy difference $\le 0.40$ | Multi-step mathematical delta check |
| **DJ-04** | Live Energy Boost Steering | Mid-session command "Make it more energetic" increases target energy and updates DJ commentary dynamically | Steering function check |
| **DJ-05** | Negative Mood Exclusions | Command "No sad songs" appends to `excludedMoods` and purges all sad tracks from the lookahead queue immediately | Lookahead array validation |
| **DJ-06** | Pace & Energy Deceleration | Command "Slow things down" reduces target energy value ($0.85 \rightarrow 0.60$) and favors downtempo tracks | Mathematical delta check |
| **DJ-07** | 10-Track Zero Repetition & Variety | Across 10 sequential track transitions: 10/10 unique track IDs (zero duplicates) and 0 consecutive repeats by the same artist | Sliding window & Set validation |
| **DJ-08** | Dynamic DJ Speech Commentary | Spoken intro announcements generated for session starts and inter-track transitions reflecting artist, mood, and tempo | String length & content analysis |

- **Verification Sign-Off**:
  - **Manually Verified by**: MAHAVEER

---

### Suite C: 10-Foot TV UI & Voice Recognition Lifecycle (`AIDJProcessingOverlay.tsx`, `AiDjScreen.tsx`)

| Test ID | Test Name | Action / Trigger | Expected TV UI Behavior | Evidence Captured |
|---|---|---|---|---|
| **UI-DJ-01** | Dedicated AI DJ Landing Page | Navigate to `NAV_DJ` tab on sidebar | Renders central hero mic orb with 6-segment vector gauge, feature cards, and "Your AI Playlists" row | [`back_to_ai_dj_tab.png`](file:///c:/Users/kanna/OneDrive/Documents/AMAZON_HACK/TESTING/FireTVMusicPOC/docs/testing/stage_4_ai_dj_voice/screenshots/back_to_ai_dj_tab.png) |
| **UI-DJ-02** | Contextual AI DJ Launch | Focus `HERO_VOICE` on Home screen and press `Select` | Opens `AIDJProcessingOverlay` modal with animated music note and soundwaves | [`ai_dj_overlay_generating.png`](file:///c:/Users/kanna/OneDrive/Documents/AMAZON_HACK/TESTING/FireTVMusicPOC/docs/testing/stage_4_ai_dj_voice/screenshots/ai_dj_overlay_generating.png) |
| **UI-DJ-03** | Multi-Stage Processing Overlay | Observe generation stages | Transitions through `ANALYZING` $\rightarrow$ `CURATING` $\rightarrow$ `OPTIMIZING` $\rightarrow$ `READY` with glowing progress dot | Live TV rendering verified |
| **UI-DJ-04** | Track Reveal & Metadata Presentation | Overlay reaches `READY` | 5 revealed track preview cards, session duration, and mood summary displayed | Live TV rendering verified |
| **UI-DJ-05** | Playlist Detail Auto-Transition | Auto-proceed timer expires (2.2s) | Smooth transition to `PlaylistScreen` (`AI DJ MIX` badge, 4-artwork collage, tracklist, and auto-play) | [`ai_dj_overlay_ready_or_playlist.png`](file:///c:/Users/kanna/OneDrive/Documents/AMAZON_HACK/TESTING/FireTVMusicPOC/docs/testing/stage_4_ai_dj_voice/screenshots/ai_dj_overlay_ready_or_playlist.png) |
| **UI-DJ-06** | Remote Voice Listening State | Press `Select` on central `AI_DJ_MIC` | Orb glows hot pink, soundwave equalizer animates, top toast displays `Listening... Tell me your mood`, playback pauses | [`voice_listening_active.png`](file:///c:/Users/kanna/OneDrive/Documents/AMAZON_HACK/TESTING/FireTVMusicPOC/docs/testing/stage_4_ai_dj_voice/screenshots/voice_listening_active.png) |
| **UI-DJ-07** | Voice Timeout & Error Recovery | Allow 8s speech timeout to elapse | Frosted error card appears: "We couldn't understand your request." with focused `Try Again` and `Back` buttons | [`after_speech_timeout.png`](file:///c:/Users/kanna/OneDrive/Documents/AMAZON_HACK/TESTING/FireTVMusicPOC/docs/testing/stage_4_ai_dj_voice/screenshots/after_speech_timeout.png) |
| **UI-DJ-08** | Error Dismissal via Remote Back | Press `Back` (`KEYCODE_BACK` = 4) on error card | Overlay cleanly dismisses, focus safely restored to AI DJ landing page without crashing or focus trapping | [`error_overlay_dismissed.png`](file:///c:/Users/kanna/OneDrive/Documents/AMAZON_HACK/TESTING/FireTVMusicPOC/docs/testing/stage_4_ai_dj_voice/screenshots/error_overlay_dismissed.png) |

- **Verification Sign-Off**:
  - **Manually Verified by**: MAHAVEER

---

## 🏆 Stage 4 Verification Sign-Off

```text
================================================================================
              STAGE 4: AI DJ & VOICE SUBSYSTEMS ACCEPTANCE SIGN-OFF
================================================================================
Test Suites:
  - Suite A (Gemini Intent Parsing):        12 / 12 PASS  (100%)
  - Suite B (AI DJ Continuous Engine):       8 /  8 PASS  (100%)
  - Suite C (10-Foot TV UI & Voice Flow):    8 /  8 PASS  (100%)

Total Tests Executed:                       28 / 28 PASS  (100%)
Test Environment:                           Android TV 13 (API 33) Television_1080p
Package:                                    com.firetv.musicpoc
Signed-Off Authority:                       QA & Lead Engineering
Status:                                     APPROVED FOR PRODUCTION / SHIP TRACK
- **Manually Verified by**: MAHAVEER
================================================================================
```
