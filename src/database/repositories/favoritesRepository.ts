import { getDatabase } from '../connection';
import { queueCloudSyncPush } from '../../services/awsCloudSyncManager';

export interface LikedSongRecord {
  track_id: string;
  liked_at: number;
}

export interface LikedPlaylistRecord {
  playlist_id: string;
  liked_at: number;
}

/**
 * Toggles the liked status of a song.
 * Returns the new liked state (true if now liked, false if unliked).
 */
export async function toggleSongLike(trackId: string): Promise<boolean> {
  if (!trackId) return false;
  try {
    const db = await getDatabase();
    const existing = await db.getFirstAsync<LikedSongRecord>(
      `SELECT track_id FROM liked_songs WHERE track_id = ?;`,
      [trackId]
    );

    if (existing) {
      await db.runAsync(`DELETE FROM liked_songs WHERE track_id = ?;`, [trackId]);
      queueCloudSyncPush();
      return false;
    } else {
      const now = Date.now();
      await db.runAsync(
        `INSERT INTO liked_songs (track_id, liked_at) VALUES (?, ?);`,
        [trackId, now]
      );
      queueCloudSyncPush();
      return true;
    }
  } catch (error) {
    console.error('[FavoritesRepo] Error toggling song like:', error);
    return false;
  }
}

/**
 * Explicitly sets the liked state of a song.
 */
export async function setSongLike(trackId: string, isLiked: boolean): Promise<void> {
  if (!trackId) return;
  try {
    const db = await getDatabase();
    if (isLiked) {
      const now = Date.now();
      await db.runAsync(
        `INSERT INTO liked_songs (track_id, liked_at) VALUES (?, ?)
         ON CONFLICT(track_id) DO UPDATE SET liked_at = excluded.liked_at;`,
        [trackId, now]
      );
    } else {
      await db.runAsync(`DELETE FROM liked_songs WHERE track_id = ?;`, [trackId]);
    }
    queueCloudSyncPush();
  } catch (error) {
    console.error('[FavoritesRepo] Error setting song like:', error);
  }
}

/**
 * Retrieves all liked track IDs, ordered by most recently liked first.
 */
export async function getLikedSongIds(): Promise<string[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ track_id: string }>(
      `SELECT track_id FROM liked_songs ORDER BY liked_at DESC;`
    );
    return rows.map((r) => r.track_id);
  } catch (error) {
    console.error('[FavoritesRepo] Error getting liked song IDs:', error);
    return [];
  }
}

/**
 * Toggles the liked status of a playlist.
 * Returns the new liked state (true if now liked, false if unliked).
 */
export async function togglePlaylistLike(playlistId: string): Promise<boolean> {
  if (!playlistId) return false;
  try {
    const db = await getDatabase();
    const existing = await db.getFirstAsync<LikedPlaylistRecord>(
      `SELECT playlist_id FROM liked_playlists WHERE playlist_id = ?;`,
      [playlistId]
    );

    if (existing) {
      await db.runAsync(`DELETE FROM liked_playlists WHERE playlist_id = ?;`, [playlistId]);
      return false;
    } else {
      const now = Date.now();
      await db.runAsync(
        `INSERT INTO liked_playlists (playlist_id, liked_at) VALUES (?, ?);`,
        [playlistId, now]
      );
      return true;
    }
  } catch (error) {
    console.error('[FavoritesRepo] Error toggling playlist like:', error);
    return false;
  }
}

/**
 * Explicitly sets the liked state of a playlist.
 */
export async function setPlaylistLike(playlistId: string, isLiked: boolean): Promise<void> {
  if (!playlistId) return;
  try {
    const db = await getDatabase();
    if (isLiked) {
      const now = Date.now();
      await db.runAsync(
        `INSERT INTO liked_playlists (playlist_id, liked_at) VALUES (?, ?)
         ON CONFLICT(playlist_id) DO UPDATE SET liked_at = excluded.liked_at;`,
        [playlistId, now]
      );
    } else {
      await db.runAsync(`DELETE FROM liked_playlists WHERE playlist_id = ?;`, [playlistId]);
    }
  } catch (error) {
    console.error('[FavoritesRepo] Error setting playlist like:', error);
  }
}

/**
 * Retrieves all liked playlist IDs, ordered by most recently liked first.
 */
export async function getLikedPlaylistIds(): Promise<string[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ playlist_id: string }>(
      `SELECT playlist_id FROM liked_playlists ORDER BY liked_at DESC;`
    );
    return rows.map((r) => r.playlist_id);
  } catch (error) {
    console.error('[FavoritesRepo] Error getting liked playlist IDs:', error);
    return [];
  }
}

/**
 * Clears all liked songs.
 */
export async function clearAllLikedSongs(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM liked_songs;`);
  } catch (error) {
    console.error('[FavoritesRepo] Error clearing liked songs:', error);
  }
}

/**
 * Clears all liked playlists.
 */
export async function clearAllLikedPlaylists(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM liked_playlists;`);
  } catch (error) {
    console.error('[FavoritesRepo] Error clearing liked playlists:', error);
  }
}

/**
 * Removes default seeded favorites (unlikes all songs and unlikes chill_vibes)
 * idempotently using the app_metadata table.
 */
export async function ensureDefaultFavoritesUnliked(): Promise<void> {
  try {
    const db = await getDatabase();
    const flag = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_metadata WHERE key = 'defaults_unliked_v1';`
    );
    if (!flag) {
      console.log('[FavoritesRepo] Resetting default favorites (unliking all songs and chill_vibes)...');
      await db.runAsync(`DELETE FROM liked_songs;`);
      await db.runAsync(`DELETE FROM liked_playlists WHERE playlist_id = 'chill_vibes';`);
      await db.runAsync(
        `INSERT OR REPLACE INTO app_metadata (key, value) VALUES ('defaults_unliked_v1', 'true');`
      );
    }
  } catch (error) {
    console.error('[FavoritesRepo] Error ensuring default favorites unliked:', error);
  }
}
