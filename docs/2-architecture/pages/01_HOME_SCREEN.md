# Home Screen (`HomeScreen.tsx`) 🏠🎵

## Overview

The **Home Screen** serves as the primary living room landing surface of Pandivo TV. It greets users with an ambient, time-contextual hero banner that changes dynamically throughout the day (Dawn, Noon, Sunset, Midnight), highlights recent playback history, and provides quick-access carousels for curated mixes.

- **Component Path:** [`FireTVMusicPOC/src/components/home/HomeScreen.tsx`](../../../src/components/home/HomeScreen.tsx)
- **Navigation Key:** `HOME`
- **Associated Nav Rail Item:** `NAV_HOME`

---

## 🖼️ UI Layout & Visual Elements

```text
+-----------------------------------------------------------------------------------------+
| [TopHeaderBar: Pandivo Logo, Context Greeting, Clock, Companion Avatar]                 |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  +-- HERO BANNER CARD ---------------------------------------------------------------+  |
|  | [Panoramic Panoramic Artwork (Time-Themed) + Gradient Overlay]                    |  |
|  |                                                                                   |  |
|  |  (Greeting Pill: "Good Afternoon")                                               |  |
|  |  What do you want to hear?                                                        |  |
|  |  "Ask Pandivo to play music for any mood, moment, or activity."                   |  |
|  |                                                                                   |  |
|  |  [✨ HERO_VOICE: "AI DJ: Create energizing focus beats" ]  [ HERO_CHILL: ▶ Play ]  |  |
|  +-----------------------------------------------------------------------------------+  |
|                                                                                         |
|  RECENTLY PLAYED                                                             See All -> |
|  +--------------+  +--------------+  +--------------+  +--------------+                 |
|  | [REC_0 Card] |  | [REC_1 Card] |  | [REC_2 Card] |  | [REC_3 Card] |                 |
|  | Artwork      |  | Artwork      |  | Artwork      |  | Artwork      |                 |
|  | Track Title  |  | Track Title  |  | Track Title  |  | Track Title  |                 |
|  | Artist Name  |  | Artist Name  |  | Artist Name  |  | Artist Name  |                 |
|  | (▶ Playing)  |  |              |  |              |  |              |                 |
|  +--------------+  +--------------+  +--------------+  +--------------+                 |
|                                                                                         |
|  FOR YOU CURATED MIXES                                                       See All -> |
|  +--------------+  +--------------+  +--------------+  +--------------+                 |
|  | [MIX_0 Card] |  | [MIX_1 Card] |  | [MIX_2 Card] |  | [MIX_3 Card] |                 |
|  | Artwork      |  | Artwork      |  | Artwork      |  | Artwork      |                 |
|  | Lofi Beats   |  | Synthwave    |  | Acoustic Vibe|  | Deep Focus   |                 |
|  +--------------+  +--------------+  +--------------+  +--------------+                 |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
| [GlobalMiniPlayer: Current Track | Scrubber | Play/Pause | Fullscreen Button]           |
+-----------------------------------------------------------------------------------------+
```

---

## 🎮 Focus ID Mapping & D-Pad Navigation

| Element Focus ID | Type | D-Pad Left | D-Pad Right | D-Pad Up | D-Pad Down | Action on Select (OK/Enter) |
|---|---|---|---|---|---|---|
| `HERO_VOICE` | Action Capsule | `NAV_HOME` (Nav Rail) | `HERO_CHILL` | *Boundary (stays)* | `REC_0` (or `MIX_0` if empty) | Opens Voice AI DJ modal with contextual time prompt. |
| `HERO_CHILL` | Floating Play Card | `HERO_VOICE` | *Boundary* | *Boundary* | `REC_1` (or `MIX_1`) | Plays instant time-themed playlist (e.g. Chill, Energetic). |
| `REC_0` | Track Card | `NAV_HOME` (Nav Rail) | `REC_1` | `HERO_VOICE` | `MIX_0` | Starts playback of track; opens MiniPlayer. |
| `REC_{N}` | Track Card | `REC_{N-1}` | `REC_{N+1}` | `HERO_CHILL` | `MIX_{N}` | Starts playback of track; shifts queue. |
| `MIX_0` | Playlist Card | `NAV_HOME` (Nav Rail) | `MIX_1` | `REC_0` | `MINI_PLAY` (MiniPlayer) | Opens selected playlist detail screen. |
| `MIX_{N}` | Playlist Card | `MIX_{N-1}` | `MIX_{N+1}` | `REC_{N}` | `MINI_PLAY` (MiniPlayer) | Opens selected playlist detail screen. |

---

## 🧩 Key Features & Technical Capabilities

1. **Context-Aware Dynamic Theming (`TimeTheme`)**:
   - The banner dynamically adapts its artwork, greeting phrase, and accent colors to the user's real-time clock:
     - **Dawn** (05:00 - 11:59): Gentle sunrise palette, *"Start your morning"*.
     - **Noon** (12:00 - 16:59): High-contrast energizing palette, *"Power through your afternoon"*.
     - **Sunset** (17:00 - 21:59): Deep violet and amber hues, *"Wind down your evening"*.
     - **Midnight** (22:00 - 04:59): Dark synth and lofi tones, *"Late-night ambiance"*.
2. **Tripartite Track Title Coloration**:
   - When a track card is focused via TV remote, the title splits into a high-visibility, 3-color living-room gradient (Purple -> Blue -> Cyan) for optimal readability across 10-foot distances.
3. **Recent Tracks Sync (SQLite WAL + DynamoDB)**:
   - Recently played tracks are populated from local SQLite (`recent_tracks` table) and hydrated from Amazon DynamoDB during cold boot.
4. **Live Playing Equalizer Indicator**:
   - If a song in the Recently Played row matches `currentTrack.id` while playing, an animated glowing `▶` badge appears on the card.
