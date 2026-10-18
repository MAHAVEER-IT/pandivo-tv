# SQLite Local Database Storage Functions 💾⚡

## Overview

Pandivo TV uses local **SQLite with Write-Ahead Logging (WAL)** mode for sub-millisecond data persistence. Local storage powers offline television playback, instant boot-time hydration, and user state caching (favorites, avatar companion selection, recently played history, and search queries) without blocking 60 FPS TV rendering.

- **Connection & Schema Manager:** [`FireTVMusicPOC/src/database/connection.ts`](../../../src/database/connection.ts)
- **Favorites Repository:** [`FireTVMusicPOC/src/database/repositories/favoritesRepository.ts`](../../../src/database/repositories/favoritesRepository.ts)
- **Avatar Preference Repository:** [`FireTVMusicPOC/src/database/repositories/avatarPreferenceRepository.ts`](../../../src/database/repositories/avatarPreferenceRepository.ts)
- **Playback History Repository:** [`FireTVMusicPOC/src/database/repositories/playbackHistoryRepository.ts`](../../../src/database/repositories/playbackHistoryRepository.ts)
- **Search History Repository:** [`FireTVMusicPOC/src/database/repositories/searchHistoryRepository.ts`](../../../src/database/repositories/searchHistoryRepository.ts)

---

## 1. `initDatabase()`

### Purpose:
Opens `firetv_music.db`, configures SQLite `PRAGMA journal_mode = WAL`, and executes the master schema DDL (creating `liked_songs`, `user_preferences`, `playback_history`, `search_history`, and `app_metadata` tables). Safely memoizes the initialization promise so concurrent calls never produce race conditions.

### Function Signature:
```typescript
export async function initDatabase(): Promise<SQLite.SQLiteDatabase>
```

### Simple Example:
```typescript
import { initDatabase } from 'FireTVMusicPOC/src/database/connection';

async function bootstrapStorage() {
  const db = await initDatabase();
  console.log('Database initialized in WAL mode:', db.databasePath);
}
```

---

## 2. `getLikedSongIds()`

### Purpose:
Queries the `liked_songs` table and returns an array of track IDs ordered chronologically from most recently liked to oldest.

### Function Signature:
```typescript
export async function getLikedSongIds(): Promise<string[]>
```

### Simple Example:
```typescript
import { getLikedSongIds } from 'FireTVMusicPOC/src/database/repositories/favoritesRepository';

async function loadFavorites() {
  const favoriteIds = await getLikedSongIds();
  console.log('User has', favoriteIds.length, 'favorite songs.');
  console.log('Top favorite ID:', favoriteIds[0]);
}
```

---

## 3. `toggleSongLike(trackId)`

### Purpose:
Toggles a song's liked status in SQLite. If liked, it removes the row; if not liked, it inserts a new row with the current epoch timestamp. Automatically schedules a non-blocking debounced cloud sync push to Amazon DynamoDB.

### Function Signature:
```typescript
export async function toggleSongLike(trackId: string): Promise<boolean>
```

### Parameters & Return Value:
| Parameter | Type | Description |
|---|---|---|
| `trackId` | `string` | Unique track identifier (e.g. `'t1'`) |
| **Returns** | `Promise<boolean>` | `true` if the track is now liked; `false` if unliked |

### Simple Example:
```typescript
import { toggleSongLike } from 'FireTVMusicPOC/src/database/repositories/favoritesRepository';

async function handleRemoteHeartButton(currentSongId: string) {
  const isNowLiked = await toggleSongLike(currentSongId);
  
  if (isNowLiked) {
    console.log('❤️ Added to Favorites & queued for Cloud Sync');
  } else {
    console.log('🤍 Removed from Favorites & queued for Cloud Sync');
  }
}
```

---

## 4. `saveAvatarSelection(avatarId)` & `getSavedAvatarSelection()`

### Purpose:
Stores and retrieves the user's active 3D/2D visual avatar companion (`'bamboo'`, `'ember'`, `'frost'`, `'sunny'`, or `'shadow'`). Writes to both `user_preferences` and `app_metadata` tables to ensure bulletproof persistence across cold TV reboots and triggers background DynamoDB synchronization.

### Function Signatures:
```typescript
export async function saveAvatarSelection(avatarId: AvatarId): Promise<boolean>
export async function getSavedAvatarSelection(): Promise<AvatarId | null>
```

### Simple Example:
```typescript
import {
  saveAvatarSelection,
  getSavedAvatarSelection,
} from 'FireTVMusicPOC/src/database/repositories/avatarPreferenceRepository';

async function switchCompanion() {
  // Save chosen avatar
  await saveAvatarSelection('ember');
  console.log('Selected Ember (Fox) as active companion.');

  // Reload after app reboot
  const activeAvatar = await getSavedAvatarSelection();
  console.log('Loaded Companion:', activeAvatar); // 'ember'
}
```

---

## 5. `recordTrackPlay(trackId, context?)` & `getRecentlyPlayedTrackIds(limit?)`

### Purpose:
Maintains the user's listening history. `recordTrackPlay` inserts a playback event with timestamp and context (e.g. `'ai_dj'`, `'library'`), and automatically prunes entries older than 100 rows to keep the database footprint tiny. `getRecentlyPlayedTrackIds` retrieves distinct recently played track IDs for the TV home screen carousel.

### Function Signatures:
```typescript
export async function recordTrackPlay(trackId: string, context?: string): Promise<void>
export async function getRecentlyPlayedTrackIds(limit: number = 10): Promise<string[]>
```

### Simple Example:
```typescript
import {
  recordTrackPlay,
  getRecentlyPlayedTrackIds,
} from 'FireTVMusicPOC/src/database/repositories/playbackHistoryRepository';

async function onTrackStarted(songId: string) {
  // Record play event
  await recordTrackPlay(songId, 'home_carousel');

  // Fetch updated recent history for Home Screen
  const recentIds = await getRecentlyPlayedTrackIds(5);
  console.log('Recent 5 tracks:', recentIds);
}
```

---

## 6. `recordSearch(query)` & `getRecentSearches(limit?)`

### Purpose:
Tracks queries executed in the 10-foot TV Search keyboard. Deduplicates repeated searches by updating the timestamp (bubbling the query to the top) and prunes old searches beyond 30 items.

### Function Signatures:
```typescript
export async function recordSearch(query: string): Promise<void>
export async function getRecentSearches(limit: number = 5): Promise<string[]>
```

### Simple Example:
```typescript
import {
  recordSearch,
  getRecentSearches,
} from 'FireTVMusicPOC/src/database/repositories/searchHistoryRepository';

async function handleSearchSubmission(query: string) {
  await recordSearch(query);
  
  const topSearches = await getRecentSearches(4);
  console.log('Recent TV Search Bubbles:', topSearches);
}
```
