# Library Screen (`LibraryScreen.tsx`) 📚💾

## Overview

The **Library Screen** is the central catalog repository for all curated music collections, user-saved playlists, and offline hardware storage. It hosts the **USB Storage Card** with native multi-tier volume discovery, allowing living room users to connect thumb drives to their Fire TV and browse MP3/FLAC music with zero cloud dependencies.

- **Component Path:** [`FireTVMusicPOC/src/components/LibraryScreen.tsx`](../../../src/components/LibraryScreen.tsx)
- **Navigation Graph:** [`FireTVMusicPOC/src/navigation/libraryNavGraph.ts`](../../../src/navigation/libraryNavGraph.ts)
- **Navigation Key:** `LIBRARY`
- **Associated Nav Rail Item:** `NAV_LIBRARY`

---

## 🖼️ UI Layout & Visual Elements

```text
+-----------------------------------------------------------------------------------------+
| [TopHeaderBar: Pandivo Logo, Clock, Companion Avatar]                                   |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  LIBRARY & PLAYLIST CATALOG                                                             |
|                                                                                         |
|  +-- 2-COLUMN PLAYLIST GRID ---------------------------------------------------------+  |
|  |  +-----------------------------------+   +-----------------------------------+    |  |
|  |  | [LIB_CARD_CHILL]                  |   | [LIB_CARD_FOCUS]                  |    |  |
|  |  | Banner: Chill Vibes               |   | Banner: Focus Mix                 |    |  |
|  |  | "Relax. Focus. Feel good."        |   | "Deep focus for productivity."    |    |  |
|  |  | 14 Songs • 48 min • [CHILLHOP]    |   | 18 Songs • 62 min • [INSTRUMENTAL]|    |  |
|  |  +-----------------------------------+   +-----------------------------------+    |  |
|  |                                                                                   |  |
|  |  +-----------------------------------+   +-----------------------------------+    |  |
|  |  | [LIB_CARD_WORKOUT]                |   | [LIB_CARD_STUDY]                  |    |  |
|  |  | Banner: Workout Mix               |   | Banner: Study Mix                 |    |  |
|  |  | 20 Songs • [HIGH ENERGY]          |   | 16 Songs • [LO-FI STUDY]          |    |  |
|  |  +-----------------------------------+   +-----------------------------------+    |  |
|  |                                                                                   |  |
|  |  +-----------------------------------+   +-----------------------------------+    |  |
|  |  | [LIB_CARD_ENERGIZE]               |   | [LIB_CARD_MIDNIGHT]               |    |  |
|  |  | Banner: Energize Morning          |   | Banner: Midnight Ambient          |    |  |
|  |  +-----------------------------------+   +-----------------------------------+    |  |
|  +-----------------------------------------------------------------------------------+  |
|                                                                                         |
|  +-- USB LOCAL HARDWARE STORAGE CARD ------------------------------------------------+  |
|  |  [💾 LIB_CARD_USB]                                                                |  |
|  |  USB Drive: SanDisk 64GB • Status: CONNECTED (Ready) • 124 Tracks Indexed         |  |
|  |  "Browse local MP3 / FLAC / WAV audio files directly from TV hardware"            |  |
|  +-----------------------------------------------------------------------------------+  |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
| [GlobalMiniPlayer: Current Track | Scrubber | Play/Pause | Fullscreen Button]           |
+-----------------------------------------------------------------------------------------+
```

---

## 🎮 Focus ID Mapping & D-Pad Navigation

| Element Focus ID | Type | D-Pad Left | D-Pad Right | D-Pad Up | D-Pad Down | Action on Select (OK/Enter) |
|---|---|---|---|---|---|---|
| `LIB_CARD_CHILL` | Playlist Card | `NAV_LIBRARY` (Nav Rail) | `LIB_CARD_FOCUS` | *Boundary* | `LIB_CARD_WORKOUT` | Opens Chill Vibes playlist detail screen. |
| `LIB_CARD_FOCUS` | Playlist Card | `LIB_CARD_CHILL` | *Boundary* | *Boundary* | `LIB_CARD_STUDY` | Opens Focus Mix playlist detail screen. |
| `LIB_CARD_WORKOUT`| Playlist Card | `NAV_LIBRARY` | `LIB_CARD_STUDY` | `LIB_CARD_CHILL` | `LIB_CARD_ENERGIZE`| Opens Workout Mix playlist detail screen. |
| `LIB_CARD_STUDY` | Playlist Card | `LIB_CARD_WORKOUT` | *Boundary* | `LIB_CARD_FOCUS` | `LIB_CARD_MIDNIGHT`| Opens Study Mix playlist detail screen. |
| `LIB_CARD_ENERGIZE`| Playlist Card| `NAV_LIBRARY` | `LIB_CARD_MIDNIGHT`| `LIB_CARD_WORKOUT` | `LIB_CARD_USB` | Opens Energize playlist detail screen. |
| `LIB_CARD_MIDNIGHT`| Playlist Card| `LIB_CARD_ENERGIZE`| *Boundary* | `LIB_CARD_STUDY` | `LIB_CARD_USB` | Opens Midnight playlist detail screen. |
| `LIB_CARD_USB` | Storage Card | `NAV_LIBRARY` | *Boundary* | `LIB_CARD_ENERGIZE`| `MINI_PLAY` (MiniPlayer) | Opens USB Browser modal or shows connection prompt. |

---

## 🧩 Key Features & Technical Details

1. **USB Storage Integration (`UsbStorageModule.kt`)**:
   - Implements native 3-tier volume discovery for Fire OS (`StorageManager.storageVolumes`, `/proc/mounts`, and fallback `/storage/XXXX-XXXX`).
   - Automatically polls device mount events without freezing the TV interface.
   - Parses local ID3 tags (Title, Artist, Album, Duration, Bitrate) and creates temporary playlists for offline listening.
2. **Dynamic Like Status**:
   - Each playlist card reflects real-time like/heart indicators synchronized with SQLite and Amazon DynamoDB.
3. **Card Glow Visual Hierarchy**:
   - Focused cards scale up by 2% (`transform: [{ scale: 1.02 }]`) with glowing neon borders matching the playlist's accent color (Indigo, Sky, Rose, Teal, Amber, Violet).
