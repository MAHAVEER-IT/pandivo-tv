export * from './connection';
export * from './databaseSchema';
export * from './repositories/playbackHistoryRepository';
export * from './repositories/searchHistoryRepository';
export * from './repositories/favoritesRepository';
export * from './repositories/aiDjRepository';
export * from './repositories/avatarPreferenceRepository';

import { getDatabase } from './connection';

export async function dumpDatabaseState(): Promise<{
  history: any[];
  likedSongs: any[];
  likedPlaylists: any[];
}> {
  try {
    const db = await getDatabase();
    const history = await db.getAllAsync(`SELECT * FROM playback_history ORDER BY played_at DESC LIMIT 10;`);
    const likedSongs = await db.getAllAsync(`SELECT * FROM liked_songs ORDER BY liked_at DESC;`);
    const likedPlaylists = await db.getAllAsync(`SELECT * FROM liked_playlists ORDER BY liked_at DESC;`);
    console.log('[SQLite Diagnostic] Playback History (' + history.length + ' rows):', JSON.stringify(history));
    console.log('[SQLite Diagnostic] Liked Songs (' + likedSongs.length + ' rows):', JSON.stringify(likedSongs));
    console.log('[SQLite Diagnostic] Liked Playlists (' + likedPlaylists.length + ' rows):', JSON.stringify(likedPlaylists));
    return { history, likedSongs, likedPlaylists };
  } catch (err) {
    console.error('[SQLite Diagnostic] Error dumping state:', err);
    return { history: [], likedSongs: [], likedPlaylists: [] };
  }
}

