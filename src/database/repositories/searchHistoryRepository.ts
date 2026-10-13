import { getDatabase } from '../connection';

export interface SearchHistoryRecord {
  id: number;
  query_text: string;
  searched_at: number;
}

/**
 * Records a search query into history.
 * If the query already exists, updates its searched_at timestamp to bubble it to the top.
 */
export async function recordSearch(query: string): Promise<void> {
  const trimmed = query.trim();
  if (!trimmed) return;
  try {
    const db = await getDatabase();
    const now = Date.now();
    await db.runAsync(
      `INSERT INTO search_history (query_text, searched_at)
       VALUES (?, ?)
       ON CONFLICT(query_text) DO UPDATE SET searched_at = excluded.searched_at;`,
      [trimmed, now]
    );

    // Keep search history table compact (< 30 rows)
    await db.runAsync(
      `DELETE FROM search_history WHERE id NOT IN (
        SELECT id FROM search_history ORDER BY searched_at DESC LIMIT 30
      );`
    );
  } catch (error) {
    console.error('[SearchHistoryRepo] Error recording search query:', error);
  }
}

/**
 * Retrieves the most recent search queries.
 */
export async function getRecentSearches(limit: number = 5): Promise<string[]> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ query_text: string }>(
      `SELECT query_text FROM search_history ORDER BY searched_at DESC LIMIT ?;`,
      [limit]
    );
    return rows.map((r) => r.query_text);
  } catch (error) {
    console.error('[SearchHistoryRepo] Error getting recent searches:', error);
    return [];
  }
}

/**
 * Clears search history.
 */
export async function clearSearchHistory(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM search_history;`);
  } catch (error) {
    console.error('[SearchHistoryRepo] Error clearing search history:', error);
  }
}

/**
 * Removes default/test search history idempotently using app_metadata.
 */
export async function ensureDefaultSearchHistoryCleaned(): Promise<void> {
  try {
    const db = await getDatabase();
    const flag = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_metadata WHERE key = 'search_history_cleaned_v1';`
    );
    if (!flag) {
      console.log('[SearchHistoryRepo] Resetting default search history...');
      await db.runAsync(`DELETE FROM search_history;`);
      await db.runAsync(
        `INSERT OR REPLACE INTO app_metadata (key, value) VALUES ('search_history_cleaned_v1', 'true');`
      );
    }
  } catch (error) {
    console.error('[SearchHistoryRepo] Error resetting default search history:', error);
  }
}
