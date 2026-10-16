import { getDatabase } from '../connection';
import { queueCloudSyncPush } from '../../services/awsCloudSyncManager';

export interface StoredAiDjPlaylist {
  session_id: string;
  title: string;
  user_prompt?: string | null;
  mood?: string | null;
  track_ids: string[];
  cover_image_key?: string | null;
  created_at: number;
}

interface RawAiDjRow {
  session_id: string;
  title: string;
  user_prompt: string | null;
  mood: string | null;
  track_ids_json: string;
  cover_image_key: string | null;
  created_at: number;
}

/**
 * Saves an AI DJ generated playlist session to local SQLite storage.
 */
export async function saveAiDjPlaylist(
  playlist: StoredAiDjPlaylist,
  shouldSync = true
): Promise<void> {
  if (!playlist.session_id) return;
  try {
    const db = await getDatabase();
    const trackIdsJson = JSON.stringify(playlist.track_ids || []);
    await db.runAsync(
      `INSERT INTO ai_dj_playlists (
        session_id, title, user_prompt, mood, track_ids_json, cover_image_key, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        title = excluded.title,
        user_prompt = excluded.user_prompt,
        mood = excluded.mood,
        track_ids_json = excluded.track_ids_json,
        cover_image_key = excluded.cover_image_key,
        created_at = excluded.created_at;`,
      [
        playlist.session_id,
        playlist.title,
        playlist.user_prompt || null,
        playlist.mood || null,
        trackIdsJson,
        playlist.cover_image_key || null,
        playlist.created_at || Date.now(),
      ]
    );

    // Keep history lean (< 50 sessions)
    await db.runAsync(
      `DELETE FROM ai_dj_playlists WHERE session_id NOT IN (
        SELECT session_id FROM ai_dj_playlists ORDER BY created_at DESC LIMIT 50
      );`
    );

    if (shouldSync) {
      queueCloudSyncPush();
    }
  } catch (error) {
    console.error('[AiDjRepo] Error saving AI DJ playlist:', error);
  }
}

/**
 * Retrieves all stored AI DJ playlists, ordered by newest first.
 */
export async function getAiDjPlaylists(limit: number = 30): Promise<StoredAiDjPlaylist[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<RawAiDjRow>(
      `SELECT session_id, title, user_prompt, mood, track_ids_json, cover_image_key, created_at
       FROM ai_dj_playlists
       ORDER BY created_at DESC
       LIMIT ?;`,
      [limit]
    );

    return rows.map((r) => {
      let trackIds: string[] = [];
      try {
        trackIds = JSON.parse(r.track_ids_json || '[]');
      } catch (e) {
        trackIds = [];
      }
      return {
        session_id: r.session_id,
        title: r.title,
        user_prompt: r.user_prompt,
        mood: r.mood,
        track_ids: trackIds,
        cover_image_key: r.cover_image_key,
        created_at: r.created_at,
      };
    });
  } catch (error) {
    console.error('[AiDjRepo] Error getting AI DJ playlists:', error);
    return [];
  }
}

/**
 * Deletes an AI DJ playlist by session ID.
 */
export async function deleteAiDjPlaylist(sessionId: string): Promise<void> {
  if (!sessionId) return;
  try {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM ai_dj_playlists WHERE session_id = ?;`, [sessionId]);
    queueCloudSyncPush();
  } catch (error) {
    console.error('[AiDjRepo] Error deleting AI DJ playlist:', error);
  }
}

/**
 * Clears all AI DJ playlists from local SQLite storage.
 */
export async function clearAllAiDjPlaylists(shouldSync = true): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM ai_dj_playlists;`);
    if (shouldSync) {
      queueCloudSyncPush();
    }
  } catch (error) {
    console.error('[AiDjRepo] Error clearing AI DJ playlists:', error);
  }
}
