/**
 * AWS Cloud Sync Manager for Pandivo TV
 * Bridges local SQLite WAL mode storage with Amazon DynamoDB cloud backup.
 * Provides non-blocking, debounced background synchronization so 60 FPS
 * TV UI responsiveness is never compromised.
 */

import { cloudSyncPush, cloudSyncPull, CloudSyncPushPayload } from './awsBackendService';
import {
  getSavedAvatarSelection,
  saveAvatarSelection,
  AvatarId,
} from '../database/repositories/avatarPreferenceRepository';
import {
  getLikedSongIds,
  setSongLike,
  getLikedPlaylistIds,
  setPlaylistLike,
} from '../database/repositories/favoritesRepository';
import {
  getAiDjPlaylists,
  saveAiDjPlaylist,
  StoredAiDjPlaylist,
} from '../database/repositories/aiDjRepository';

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
    const [savedAvatar, likedSongIds, likedPlaylistIds, aiDjPlaylists] = await Promise.all([
      getSavedAvatarSelection(),
      getLikedSongIds(),
      getLikedPlaylistIds(),
      getAiDjPlaylists(50),
    ]);

    const payload: CloudSyncPushPayload = {
      userId,
      profile: {
        avatarId: savedAvatar || 'frost',
        updatedAt: Date.now(),
      },
      favorites: likedSongIds || [],
      playlists: [
        ...(likedPlaylistIds || []).map((id) => ({ id, liked: true })),
        ...(aiDjPlaylists || []).map((p) => ({
          id: p.session_id,
          title: p.title,
          tracks: p.track_ids,
          userPrompt: p.user_prompt || undefined,
          mood: p.mood || undefined,
          coverImageKey: p.cover_image_key || undefined,
          createdAt: p.created_at,
          liked: (likedPlaylistIds || []).includes(p.session_id),
        })),
      ],
      aiDjSessions: (aiDjPlaylists || []).map((p) => ({
        sessionId: p.session_id,
        session_id: p.session_id,
        title: p.title,
        userPrompt: p.user_prompt || undefined,
        user_prompt: p.user_prompt || undefined,
        mood: p.mood || undefined,
        trackIds: p.track_ids,
        track_ids: p.track_ids,
        coverImageKey: p.cover_image_key || undefined,
        createdAt: p.created_at,
        created_at: p.created_at,
      })),
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

export type CloudSyncRestoreCallback = (restored: {
  avatarId?: AvatarId;
  favorites?: string[];
  likedPlaylists?: string[];
  playlists?: StoredAiDjPlaylist[];
}) => void;

const restoreListeners = new Set<CloudSyncRestoreCallback>();

export function subscribeToCloudRestore(callback: CloudSyncRestoreCallback): () => void {
  restoreListeners.add(callback);
  return () => {
    restoreListeners.delete(callback);
  };
}

function notifyCloudRestore(restored: {
  avatarId?: AvatarId;
  favorites?: string[];
  likedPlaylists?: string[];
  playlists?: StoredAiDjPlaylist[];
}) {
  restoreListeners.forEach((cb) => {
    try {
      cb(restored);
    } catch (e) {
      console.warn('[CloudSyncManager] Error in restore listener:', e);
    }
  });
}

let currentUserId = DEFAULT_USER_ID;

export function getSyncUserId(): string {
  return currentUserId;
}

export function setSyncUserId(userId: string): void {
  currentUserId = userId;
}

/**
 * Pulls cloud state from DynamoDB on cold boot to restore preferences
 * if local SQLite is empty (e.g. app freshly installed on a secondary Fire TV).
 */
export async function initializeCloudSyncOnBoot(userId = getSyncUserId()): Promise<void> {
  try {
    const [existingAvatar, existingFavorites, existingPlaylists, existingLikedPlaylists] =
      await Promise.all([
        getSavedAvatarSelection(),
        getLikedSongIds(),
        getAiDjPlaylists(1),
        getLikedPlaylistIds(),
      ]);

    const hasLocalData =
      !!existingAvatar ||
      (existingFavorites && existingFavorites.length > 0) ||
      (existingPlaylists && existingPlaylists.length > 0) ||
      (existingLikedPlaylists && existingLikedPlaylists.length > 0);

    // If local storage is already populated, push to cloud to ensure sync
    if (hasLocalData) {
      console.log('[CloudSyncManager] Local state present; scheduling initial background sync push...');
      queueCloudSyncPush(2000, userId);
      return;
    }

    // Local storage is blank: attempt to restore from DynamoDB
    console.log('[CloudSyncManager] Local state empty; pulling backup from DynamoDB...');
    const remoteState = await cloudSyncPull(userId);

    if (remoteState && remoteState.totalEntities > 0) {
      let restoredAvatar: AvatarId | undefined;
      let restoredFavorites: string[] | undefined;
      const restoredLikedPlaylists: string[] = [];
      const restoredStoredPlaylists: StoredAiDjPlaylist[] = [];
      const processedSessionIds = new Set<string>();

      // 1. Restore Avatar Profile
      if (remoteState.profile?.avatarId) {
        restoredAvatar = remoteState.profile.avatarId as AvatarId;
        await saveAvatarSelection(restoredAvatar, false);
        console.log(`[CloudSyncManager] Restored companion avatar from DynamoDB: ${restoredAvatar}`);
      }

      // 2. Restore Liked Song Favorites
      if (remoteState.favorites && Array.isArray(remoteState.favorites)) {
        restoredFavorites = remoteState.favorites;
        for (const trackId of remoteState.favorites) {
          await setSongLike(trackId, true, false);
        }
        console.log(`[CloudSyncManager] Restored ${remoteState.favorites.length} liked tracks from DynamoDB`);
      }

      // 3. Restore AI DJ Sessions
      if (remoteState.aiDjSessions && Array.isArray(remoteState.aiDjSessions)) {
        for (const session of remoteState.aiDjSessions) {
          const sessionId = session.sessionId || session.session_id;
          if (sessionId && !processedSessionIds.has(sessionId)) {
            processedSessionIds.add(sessionId);
            const item: StoredAiDjPlaylist = {
              session_id: sessionId,
              title: session.title || 'AI DJ Mix',
              user_prompt: session.userPrompt || session.user_prompt || null,
              mood: session.mood || null,
              track_ids: session.trackIds || session.track_ids || session.tracks || [],
              cover_image_key: session.coverImageKey || session.cover_image_key || null,
              created_at: session.createdAt || session.created_at || Date.now(),
            };
            await saveAiDjPlaylist(item, false);
            restoredStoredPlaylists.push(item);
          }
        }
        console.log(`[CloudSyncManager] Restored ${restoredStoredPlaylists.length} AI DJ sessions from DynamoDB`);
      }

      // 4. Restore Playlists (Liked status and any custom playlists)
      if (remoteState.playlists && Array.isArray(remoteState.playlists)) {
        for (const pl of remoteState.playlists) {
          const plId = typeof pl === 'string' ? pl : (pl.id || pl.sessionId || pl.session_id);
          if (!plId) continue;

          // Check if playlist was liked
          if (typeof pl === 'string' || pl.liked === true) {
            await setPlaylistLike(plId, true, false);
            if (!restoredLikedPlaylists.includes(plId)) {
              restoredLikedPlaylists.push(plId);
            }
          }

          // Check if it's a playlist entity with tracks not yet in stored
          if (typeof pl === 'object' && (pl.tracks || pl.track_ids) && !processedSessionIds.has(plId)) {
            processedSessionIds.add(plId);
            const item: StoredAiDjPlaylist = {
              session_id: plId,
              title: pl.title || 'Playlist',
              user_prompt: pl.userPrompt || pl.user_prompt || null,
              mood: pl.mood || null,
              track_ids: pl.tracks || pl.track_ids || [],
              cover_image_key: pl.coverImageKey || pl.cover_image_key || null,
              created_at: pl.createdAt || pl.created_at || Date.now(),
            };
            await saveAiDjPlaylist(item, false);
            restoredStoredPlaylists.push(item);
          }
        }
        console.log(`[CloudSyncManager] Restored ${restoredLikedPlaylists.length} liked playlists from DynamoDB`);
      }

      // Proactively notify React contexts so in-memory UI updates instantly
      notifyCloudRestore({
        avatarId: restoredAvatar,
        favorites: restoredFavorites,
        likedPlaylists: restoredLikedPlaylists.length > 0 ? restoredLikedPlaylists : undefined,
        playlists: restoredStoredPlaylists.length > 0 ? restoredStoredPlaylists : undefined,
      });
    }
  } catch (err) {
    console.warn('[CloudSyncManager] Cold boot cloud pull error (defaulting to local defaults):', err);
  }
}
