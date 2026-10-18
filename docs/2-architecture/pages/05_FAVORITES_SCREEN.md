# Favorites Screen (`FavoritesScreen.tsx`) ❤️⭐

## Overview

The **Favorites Screen** aggregates all user-hearted songs and liked playlists across Pandivo TV into a single, high-contrast living room space. It provides an immediate hero entry point into the user's personal "Liked Songs" collection, complete with aggregate play counts, total listening duration, and auto-scrolling playlist carousels.

- **Component Path:** [`FireTVMusicPOC/src/components/FavoritesScreen.tsx`](../../../src/components/FavoritesScreen.tsx)
- **Navigation Graph:** [`FireTVMusicPOC/src/navigation/favoritesNavGraph.ts`](../../../src/navigation/favoritesNavGraph.ts)
- **Navigation Key:** `FAVORITES`
- **Associated Nav Rail Item:** `NAV_FAV`

---

## 🖼️ UI Layout & Visual Elements

```text
+-----------------------------------------------------------------------------------------+
| [TopHeaderBar: Pandivo Logo, Clock, Companion Avatar]                                   |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  YOUR FAVORITES (Letter-by-Letter Gradient: Sky Blue -> Indigo -> Royal Purple)         |
|  "All your liked songs and playlists in one place."                                     |
|                                                                                         |
|  +-- SECTION 1: HERO LIKED SONGS CARD -----------------------------------------------+  |
|  |  +-----------------------------------------------------------------------------+  |  |
|  |  | [FAV_HERO_LIKED_SONGS]                                                      |  |  |
|  |  | [💖 Large Gradient Heart]  Liked Songs Collection                           |  |  |
|  |  |                             24 Songs • 1 hr 28 min • Auto-Synced to Cloud   |  |  |
|  |  |                                                                             |  |  |
|  |  |  [▶ Play Liked Songs]       [🔀 Shuffle All Favorites]                      |  |  |
|  |  +-----------------------------------------------------------------------------+  |  |
|  +-----------------------------------------------------------------------------------+  |
|                                                                                         |
|  LIKED PLAYLISTS (Auto-Scrolling Horizontal Row)                                        |
|  +--------------+  +--------------+  +--------------+  +--------------+                 |
|  | [FAV_PL_0]   |  | [FAV_PL_1]   |  | [FAV_PL_2]   |  | [FAV_PL_3]   |                 |
|  | Chill Vibes  |  | Focus Mix    |  | Workout Mix  |  | Study Mix    |                 |
|  | 14 Songs     |  | 18 Songs     |  | 20 Songs     |  | 16 Songs     |                 |
|  | [💖 Liked]   |  | [💖 Liked]   |  | [💖 Liked]   |  | [💖 Liked]   |                 |
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
| `FAV_HERO_LIKED_SONGS` | Hero Card | `NAV_FAV` (Nav Rail) | *Boundary* | *Boundary* | `FAV_PL_0` (or MiniPlayer) | Opens Liked Songs playlist detail view. |
| `FAV_PL_0` | Playlist Card | `NAV_FAV` | `FAV_PL_1` | `FAV_HERO_LIKED_SONGS`| `MINI_PLAY` (MiniPlayer) | Opens liked playlist detail view. |
| `FAV_PL_{N}` | Playlist Card | `FAV_PL_{N-1}` | `FAV_PL_{N+1}` | `FAV_HERO_LIKED_SONGS`| `MINI_PLAY` (MiniPlayer) | Opens liked playlist detail view. |

---

## 🧩 Key Features & Technical Details

1. **Auto-Centering Horizontal Carousel**:
   - As users move the D-pad left/right across `FAV_PL_0` through `FAV_PL_N`, the horizontal `ScrollView` automatically scrolls smoothly by `CARD_WIDTH_WITH_GAP` (222px) to keep the focused card centered in the TV viewport.
2. **Instant Pub/Sub Cloud Sync**:
   - Subscribes to `awsCloudSyncManager` events. When cloud restore completes during cold boot or multi-user switching, the favorites count and playlist row instantly hydrate without refreshing the page.
3. **Graceful Empty State**:
   - If no songs or playlists are liked yet, displays an encouraging living room empty state: *"Your favorites are waiting. Press the heart icon on any track or playlist to collect your favorites here."*
