# Fullscreen Player Screen (`FullscreenPlayerScreen.tsx`) 🎬🎧

## Overview

The **Fullscreen Player Screen** is the dedicated immersive listening canvas for 10-foot living rooms. It expands from the Global MiniPlayer to fill the entire 1080p television display with dynamic ambient motion backgrounds, rotating vinyl record animations, real-time waveform visualizers, AI song insights powered by Gemini, and comprehensive playback/seek controls.

- **Component Path:** [`FireTVMusicPOC/src/components/FullscreenPlayerScreen.tsx`](../../../src/components/FullscreenPlayerScreen.tsx)
- **Container Wrapper:** [`FireTVMusicPOC/src/components/fullscreen/FullscreenPlayerContainer.tsx`](../../../src/components/fullscreen/FullscreenPlayerContainer.tsx)
- **Navigation Graph:** [`FireTVMusicPOC/src/navigation/fullscreenNavGraph.ts`](../../../src/navigation/fullscreenNavGraph.ts)
- **Motion Engine:** [`FireTVMusicPOC/src/components/TVMotionBackground.tsx`](../../../src/components/TVMotionBackground.tsx)
- **Navigation Key:** `FULLSCREEN`

---

## 🖼️ UI Layout & Visual Elements

```text
+-----------------------------------------------------------------------------------------+
| [TVMotionBackground: Looped 1080p Ambient Video / Particle Physics Simulation]          |
|                                                                                         |
|  [⤡ FS_BTN_MINIMIZE]                                       [🎨 FS_BTN_BACKGROUND: Themes]|
|                                                                                         |
|  LEFT: 3D VINYL & ARTWORK                 RIGHT: TRACK METADATA & AI INSIGHTS          |
|  +-------------------------------------+  +------------------------------------------+  |
|  |           _________                 |  | Synthwave Sunset                         |  |
|  |       .-'         '-.               |  | Neon Pulse • 128 BPM • Instrumental      |  |
|  |     .'    +-----+    '.             |  |                                          |  |
|  |    /      | Art |      \            |  | [✨ FS_BTN_AI_INFO: Song Story by Gemini] |  |
|  |   |   (O) | 280 | (O)   |           |  |                                          |  |
|  |    \      | 280 |      /            |  | Up Next in Queue:                        |  |
|  |     '.    +-----+    .'             |  | • [FS_QUEUE_0] Midnight Drive (03:42)    |  |
|  |       '-._________.-'               |  | • [FS_QUEUE_1] Cyber Chill (04:10)       |  |
|  |   (Continuous 33 RPM Rotation)      |  | • [FS_QUEUE_2] Tokyo Rain (02:55)        |  |
|  +-------------------------------------+  +------------------------------------------+  |
|                                                                                         |
|  TIMELINE SCRUBBER:                                                                     |
|  01:45 ===================🔘------------------------------------------------- 04:20    |
|  [FS_SCRUBBER: Live Seek Preview (-10s / +10s with D-Pad Left / Right)]                 |
|                                                                                         |
|  PLAYBACK CONTROLS ROW:                                                                 |
|  [⏮ PREV]   [⏪ -10s]   [▶/⏸ PLAY/PAUSE]   [⏩ +10s]   [⏭ NEXT]   [💖 LIKE]   [🔀 SHUFFLE]|
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

---

## 🎮 Focus ID Mapping & D-Pad Navigation

| Element Focus ID | Type | D-Pad Left | D-Pad Right | D-Pad Up | D-Pad Down | Action on Select (OK/Enter) |
|---|---|---|---|---|---|---|
| `FS_BTN_PLAY` | Center Action | `FS_BTN_REWIND_10` | `FS_BTN_FORWARD_10`| `FS_SCRUBBER` | *Boundary* | Toggles audio play / pause. |
| `FS_BTN_REWIND_10`| Quick Seek | `FS_BTN_PREV` | `FS_BTN_PLAY` | `FS_SCRUBBER` | *Boundary* | Seeks backward 10 seconds. |
| `FS_BTN_FORWARD_10`| Quick Seek | `FS_BTN_PLAY` | `FS_BTN_NEXT` | `FS_SCRUBBER` | *Boundary* | Seeks forward 10 seconds. |
| `FS_BTN_PREV` | Skip Action | *Boundary* | `FS_BTN_REWIND_10` | `FS_SCRUBBER` | *Boundary* | Plays previous track in queue. |
| `FS_BTN_NEXT` | Skip Action | `FS_BTN_FORWARD_10`| `FS_BTN_LIKE` | `FS_SCRUBBER` | *Boundary* | Plays next track in queue. |
| `FS_BTN_LIKE` | Favorite Action| `FS_BTN_NEXT` | `FS_BTN_AI_INFO` | `FS_SCRUBBER` | *Boundary* | Toggles track favorite status. |
| `FS_BTN_AI_INFO`| AI Insights | `FS_BTN_LIKE` | *Boundary* | `FS_QUEUE_0` | *Boundary* | Opens Gemini Song Story drawer. |
| `FS_SCRUBBER` | Scrub Bar | Live Seek -10s | Live Seek +10s | `FS_BTN_MINIMIZE` | `FS_BTN_PLAY` | Commits seek position to audio engine. |
| `FS_BTN_MINIMIZE`| Exit Action | *Boundary* | `FS_BTN_BACKGROUND`| *Boundary* | `FS_SCRUBBER` | Minimizes player; restores previous tab. |
| `FS_BTN_BACKGROUND`| Visualizer | `FS_BTN_MINIMIZE` | *Boundary* | *Boundary* | `FS_QUEUE_0` | Opens background theme selector modal. |
| `FS_QUEUE_{N}`| Up Next Item | `FS_BTN_AI_INFO` | *Boundary* | `FS_QUEUE_{N-1}` | `FS_QUEUE_{N+1}` | Jumps directly to queued track. |

---

## 🧩 Key Features & Technical Details

1. **Ambient Motion Engine (`TVMotionBackground.tsx`)**:
   - Offers 4 customizable 1080p atmospheric visualizer modes:
     - **Emerald Nature**: Slow-panning sunlit rainforest canopy.
     - **Cyberpunk City**: Looped neon metropolis rain.
     - **Sakura Drift**: 3-tier botanical leaf physics simulation with 3D sway.
     - **Minimalist Studio**: Pure dark OLED gradient with audio waveform reactive glow.
2. **Vinyl 33 RPM Continuous Rotation**:
   - Uses native driver animation: `Animated.loop(Animated.timing(spinValue, { toValue: 1, duration: 20000, easing: Easing.linear, useNativeDriver: true }))`.
   - Smoothly pauses in place when music is paused, and resumes upon playback.
3. **Interactive TV Timeline Scrubber**:
   - D-Pad Left/Right on `FS_SCRUBBER` allows seeking in 10-second increments with an on-screen time badge before committing to audio hardware, preventing audio stuttering.
4. **Gemini Song AI Storytelling (`geminiSongInfoService.ts`)**:
   - Pressing `FS_BTN_AI_INFO` queries Gemini 2.5 Flash for contextual song insights:
     - Behind-the-scenes artist intent & production anecdotes.
     - Detected acoustic characteristics (tempo, key signature, mood descriptors).
     - Recommended complementary tracks.
