import { getDatabase } from '../connection';

export interface PlaybackHistoryRecord {
  id: number;
  track_id: string;
  played_at: number;
  context?: string | null;
}

/**
 * Records a playback event for a track.
 * Automatically runs in the background with zero UI blocking.
 */
export async function recordTrackPlay(trackId: string, context?: string): Promise<void> {
  if (!trackId) return;
  try {
    const db = await getDatabase();
    const now = Date.now();
    await db.runAsync(
      `INSERT INTO playback_history (track_id, played_at, context) VALUES (?, ?, ?);`,
      [trackId, now, context || null]
    );

    // Auto-prune older history records to keep table compact (< 100 rows)
    await db.runAsync(
      `DELETE FROM playback_history WHERE id NOT IN (
        SELECT id FROM playback_history ORDER BY played_at DESC LIMIT 100
      );`
    );
  } catch (error) {
    console.error('[PlaybackHistoryRepo] Error recording track play:', error);
  }
}

/**
 * Retrieves the most recent distinct track IDs, ordered by most recently played first.
 */
export async function getRecentlyPlayedTrackIds(limit: number = 10): Promise<string[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ track_id: string }>(
      `SELECT track_id, MAX(played_at) as last_played
       FROM playback_history
       GROUP BY track_id
       ORDER BY last_played DESC
       LIMIT ?;`,
      [limit]
    );
    return rows.map((r) => r.track_id);
  } catch (error) {
    console.error('[PlaybackHistoryRepo] Error getting recent track IDs:', error);
    return [];
  }
}

/**
 * Clears all playback history.
 */
export async function clearPlaybackHistory(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM playback_history;`);
  } catch (error) {
    console.error('[PlaybackHistoryRepo] Error clearing playback history:', error);
  }
}

/**
 * Removes default/test playback history idempotently using app_metadata.
 */
export async function ensureDefaultPlaybackHistoryCleaned(): Promise<void> {
  try {
    const db = await getDatabase();
    const flag = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_metadata WHERE key = 'playback_history_cleaned_v1';`
    );
    if (!flag) {
      console.log('[PlaybackHistoryRepo] Resetting default playback history...');
      await db.runAsync(`DELETE FROM playback_history;`);
      await db.runAsync(
        `INSERT OR REPLACE INTO app_metadata (key, value) VALUES ('playback_history_cleaned_v1', 'true');`
      );
    }
  } catch (error) {
    console.error('[PlaybackHistoryRepo] Error resetting default playback history:', error);
  }
}

