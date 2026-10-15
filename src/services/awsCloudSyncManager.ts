/**
 * AWS Cloud Sync Manager for Pandivo TV
 * Bridges local SQLite WAL mode storage with Amazon DynamoDB cloud backup.
 * Provides non-blocking, debounced background synchronization so 60 FPS
 * TV UI responsiveness is never compromised.
 */

import { cloudSyncPush, cloudSyncPull, CloudSyncPushPayload } from './awsBackendService';
import { getSavedAvatarSelection, saveAvatarSelection, AvatarId } from '../database/repositories/avatarPreferenceRepository';
import { getLikedSongIds, setSongLike } from '../database/repositories/favoritesRepository';

const DEFAULT_USER_ID = 'default_firetv_user';
let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let isSyncInProgress = false;

/**
 * Gathers the current state from SQLite and pushes to Amazon DynamoDB.
 */
export async function performCloudSyncPush(userId = DEFAULT_USER_ID): Promise<boolean> {
  if (isSyncInProgress) {
    return false;
  }

  isSyncInProgress = true;
  try {
    const [savedAvatar, likedSongIds] = await Promise.all([
      getSavedAvatarSelection(),
      getLikedSongIds(),
    ]);

    const payload: CloudSyncPushPayload = {
      userId,
      profile: {
        avatarId: savedAvatar || 'frost',
        updatedAt: Date.now(),
      },
      favorites: likedSongIds || [],
    };

    console.log(`[CloudSyncManager] Pushing local state to DynamoDB for ${userId}...`);
    const result = await cloudSyncPush(payload);

    if (result && result.status === 'synced') {
      console.log('[CloudSyncManager] DynamoDB sync push successful. Updated:', result.updatedEntities);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[CloudSyncManager] Cloud sync push failed (continuing on local SQLite):', err);
    return false;
  } finally {
    isSyncInProgress = false;
  }
}

/**
 * Debounced queue to push updates to DynamoDB without spamming requests.
 */
export function queueCloudSyncPush(delayMs = 1200, userId = DEFAULT_USER_ID): void {
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }

  syncDebounceTimer = setTimeout(() => {
    performCloudSyncPush(userId).catch((err) => {
      console.warn('[CloudSyncManager] Debounced push error:', err);
    });
  }, delayMs);
}

/**
 * Pulls cloud state from DynamoDB on cold boot to restore preferences
 * if local SQLite is empty (e.g. app freshly installed on a secondary Fire TV).
 */
export async function initializeCloudSyncOnBoot(userId = DEFAULT_USER_ID): Promise<void> {
  try {
    const existingAvatar = await getSavedAvatarSelection();
    const existingFavorites = await getLikedSongIds();

    // If local storage is already populated, push to cloud to ensure sync
    if (existingAvatar || (existingFavorites && existingFavorites.length > 0)) {
      console.log('[CloudSyncManager] Local state present; scheduling initial background sync push...');
      queueCloudSyncPush(2000, userId);
      return;
    }

    // Local storage is blank: attempt to restore from DynamoDB
    console.log('[CloudSyncManager] Local state empty; pulling backup from DynamoDB...');
    const remoteState = await cloudSyncPull(userId);

    if (remoteState && remoteState.totalEntities > 0) {
      if (remoteState.profile?.avatarId) {
        await saveAvatarSelection(remoteState.profile.avatarId as AvatarId);
        console.log(`[CloudSyncManager] Restored companion avatar from DynamoDB: ${remoteState.profile.avatarId}`);
      }

      if (remoteState.favorites && Array.isArray(remoteState.favorites)) {
        for (const trackId of remoteState.favorites) {
          await setSongLike(trackId, true);
        }
        console.log(`[CloudSyncManager] Restored ${remoteState.favorites.length} liked tracks from DynamoDB`);
      }
    }
  } catch (err) {
    console.warn('[CloudSyncManager] Cold boot cloud pull error (defaulting to local defaults):', err);
  }
}
