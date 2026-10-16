import { getDatabase } from '../connection';
import { queueCloudSyncPush } from '../../services/awsCloudSyncManager';

export const VALID_AVATAR_IDS = [
  'bamboo',
  'ember',
  'frost',
  'sunny',
  'shadow',
] as const;

export type AvatarId = (typeof VALID_AVATAR_IDS)[number];

export interface AvatarCompanionInfo {
  id: AvatarId;
  name: string;
  species: string;
}

export const AVATAR_COMPANIONS: Record<AvatarId, AvatarCompanionInfo> = {
  bamboo: { id: 'bamboo', name: 'Bamboo', species: 'Panda' },
  ember: { id: 'ember', name: 'Ember', species: 'Orange Fox' },
  frost: { id: 'frost', name: 'Frost', species: 'White Wolf' },
  sunny: { id: 'sunny', name: 'Sunny', species: 'Golden Dog' },
  shadow: { id: 'shadow', name: 'Shadow', species: 'Dark Cat' },
};

export function isValidAvatarId(id: unknown): id is AvatarId {
  return typeof id === 'string' && VALID_AVATAR_IDS.includes(id as AvatarId);
}

export const PREF_KEY_SELECTED_AVATAR = 'user_selected_avatar_companion';

/**
 * Loads the saved avatar selection from SQLite storage.
 * Checks user_preferences first, then falls back to app_metadata.
 * Returns null if no selection exists or if stored ID is invalid.
 */
export async function getSavedAvatarSelection(): Promise<AvatarId | null> {
  try {
    const db = await getDatabase();

    // 1. Primary check: user_preferences table
    try {
      const row = await db.getFirstAsync<{ pref_value: string }>(
        `SELECT pref_value FROM user_preferences WHERE pref_key = ? LIMIT 1;`,
        [PREF_KEY_SELECTED_AVATAR]
      );
      if (row && isValidAvatarId(row.pref_value)) {
        return row.pref_value;
      }
    } catch (_err) {
      // Table may be migrating, continue to fallback
    }

    // 2. Secondary check: app_metadata table
    try {
      const metaRow = await db.getFirstAsync<{ value: string }>(
        `SELECT value FROM app_metadata WHERE key = ? LIMIT 1;`,
        [PREF_KEY_SELECTED_AVATAR]
      );
      if (metaRow && isValidAvatarId(metaRow.value)) {
        return metaRow.value;
      }
    } catch (_err) {
      // Ignore
    }

    return null;
  } catch (error) {
    console.error('[AvatarPreferenceRepo] Error loading avatar selection:', error);
    return null;
  }
}

/**
 * Persists the user's selected avatar companion into SQLite storage.
 * Writes to both user_preferences and app_metadata for maximum consistency and safety.
 */
export async function saveAvatarSelection(
  avatarId: AvatarId,
  shouldSync = true
): Promise<boolean> {
  if (!isValidAvatarId(avatarId)) {
    console.warn('[AvatarPreferenceRepo] Attempted to save invalid avatar ID:', avatarId);
    return false;
  }

  try {
    const db = await getDatabase();
    const now = Date.now();

    // Write to user_preferences
    try {
      await db.runAsync(
        `INSERT INTO user_preferences (pref_key, pref_value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(pref_key) DO UPDATE SET
           pref_value = excluded.pref_value,
           updated_at = excluded.updated_at;`,
        [PREF_KEY_SELECTED_AVATAR, avatarId, now]
      );
    } catch (prefErr) {
      console.warn('[AvatarPreferenceRepo] Warning writing to user_preferences:', prefErr);
    }

    // Write to app_metadata as resilience guarantee
    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO app_metadata (key, value)
         VALUES (?, ?);`,
        [PREF_KEY_SELECTED_AVATAR, avatarId]
      );
    } catch (metaErr) {
      console.warn('[AvatarPreferenceRepo] Warning writing to app_metadata:', metaErr);
    }

    console.log('[AvatarPreferenceRepo] Successfully persisted avatar selection:', avatarId);
    if (shouldSync) {
      queueCloudSyncPush();
    }
    return true;
  } catch (error) {
    console.error('[AvatarPreferenceRepo] Error persisting avatar selection:', error);
    return false;
  }
}

/**
 * Clears the saved avatar selection (useful for testing or resetting first-launch onboarding).
 */
export async function clearSavedAvatarSelection(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `DELETE FROM user_preferences WHERE pref_key = ?;`,
      [PREF_KEY_SELECTED_AVATAR]
    );
    await db.runAsync(
      `DELETE FROM app_metadata WHERE key = ?;`,
      [PREF_KEY_SELECTED_AVATAR]
    );
    console.log('[AvatarPreferenceRepo] Cleared saved avatar selection.');
  } catch (error) {
    console.error('[AvatarPreferenceRepo] Error clearing avatar selection:', error);
  }
}
