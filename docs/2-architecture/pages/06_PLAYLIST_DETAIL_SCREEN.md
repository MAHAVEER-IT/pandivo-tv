# Playlist Detail Screen (`PlaylistScreen.tsx`) 🎶📋

## Overview

The **Playlist Detail Screen** displays the complete track inventory of any selected playlist (Curated, AI DJ, Liked Songs, or USB local storage). It features a prominent header with high-resolution artwork, playback action triggers (Play All, Shuffle, Like Playlist), and a 10-foot TV tracklist with live equalizer bars for the active track.

- **Component Path:** [`FireTVMusicPOC/src/components/PlaylistScreen.tsx`](../../../src/components/PlaylistScreen.tsx)
- **Navigation Graph:** [`FireTVMusicPOC/src/navigation/playlistNavGraph.ts`](../../../src/navigation/playlistNavGraph.ts)
- **Navigation Key:** `SELECTED_PLAYLIST`
- **Origin Contexts:** Navigated to from Home, Library, AI DJ, or Favorites.

---

## 🖼️ UI Layout & Visual Elements

```text
+-----------------------------------------------------------------------------------------+
| [TopHeaderBar: Pandivo Logo, Clock, Companion Avatar]                                   |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  +-- PLAYLIST HERO HEADER -----------------------------------------------------------+  |
|  |  +----------------+   Chill Vibes                                                 |  |
|  |  |                |   "Relax. Focus. Feel good."                                  |  |
|  |  | Large Artwork  |   14 Songs • 48 min • Curated for Fire TV                     |  |
|  |  | 240x240        |                                                               |  |
|  |  +----------------+   [▶ PL_BTN_PLAY: Play All]  [🔀 PL_BTN_SHUFFLE]  [♡ PL_BTN_LIKE]|
|  +-----------------------------------------------------------------------------------+  |
|                                                                                         |
|  #   TITLE & ARTIST                                              DURATION   FAVORITE    |
|  -------------------------------------------------------------------------------------  |
|  1   [PL_TRK_0] 🎵 Daydreams in Tokyo • Lofi Girl                  03:14      [♡ FAV_0] |
|  2   [PL_TRK_1] 📊 (Live Equalizer) Neon Sunset • Synthwave       04:02      [💖 FAV_1]|
|  3   [PL_TRK_2] 🎵 Forest Rain • Calm Nature                       02:45      [♡ FAV_2] |
|  4   [PL_TRK_3] 🎵 Coffee Shop Morning • Jazz Trio                 03:30      [♡ FAV_3] |
|  5   [PL_TRK_4] 🎵 Midnight Drive • Retro Pulse                    04:15      [♡ FAV_4] |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
| [GlobalMiniPlayer: Current Track | Scrubber | Play/Pause | Fullscreen Button]           |
+-----------------------------------------------------------------------------------------+
```

---

## 🎮 Focus ID Mapping & D-Pad Navigation

| Element Focus ID | Type | D-Pad Left | D-Pad Right | D-Pad Up | D-Pad Down | Action on Select (OK/Enter) |
|---|---|---|---|---|---|---|
| `PL_BTN_PLAY` | Primary Action | `NAV_RAIL` (Origin Tab) | `PL_BTN_SHUFFLE` | *Boundary* | `PL_TRK_0` | Starts playback from song 1 (or toggles pause). |
| `PL_BTN_SHUFFLE`| Toggle Action | `PL_BTN_PLAY` | `PL_BTN_LIKE` | *Boundary* | `PL_TRK_0` | Toggles random shuffle queue order. |
| `PL_BTN_LIKE` | Toggle Action | `PL_BTN_SHUFFLE` | *Boundary* | *Boundary* | `PL_FAV_0` | Toggles playlist like status (persisted to SQLite/Cloud). |
| `PL_TRK_{N}` | Track Row | `NAV_RAIL` | `PL_FAV_{N}` | `PL_TRK_{N-1}` or Header | `PL_TRK_{N+1}` | Plays track immediately and sets queue. |
| `PL_FAV_{N}` | Favorite Heart| `PL_TRK_{N}` | *Boundary* | `PL_FAV_{N-1}` | `PL_FAV_{N+1}` | Toggles song favorite status without interrupting audio. |

---

## 🧩 Key Features & Technical Details

1. **Animated 3-Bar Live Equalizer**:
   - The currently playing track replaces its numeric rank with three independently oscillating native vector equalizer bars running via `Animated.loop(Animated.sequence(...))`.
2. **Context-Preserved Remote Back Navigation**:
   - Pressing TV Remote Back (`KEYCODE_BACK`) checks the `origin` prop:
     - If opened from Library -> Returns focus to the specific Library card.
     - If opened from Favorites -> Returns focus to the Favorites hero/playlist card.
     - If opened from Home -> Returns focus to the corresponding Home carousel item.
3. **Optimized Row Memoization (`MemoizedTrackRow`)**:
   - Large playlists (100+ songs from USB drives) render at constant 60 FPS by isolating re-renders strictly to the active row and focused row.
