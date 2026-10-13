export type DPadDirection = 'left' | 'right' | 'up' | 'down';

export const FAVORITES_FOCUS_IDS = {
  LIKED_SONGS: 'FAV_LIKED_SONGS',
  PLAYLIST_PREFIX: 'FAV_PL_',
} as const;

/**
 * Deterministic Spatial Navigation Graph for Favorites Screen (NAV_FAV).
 *
 * LAYOUT:
 * - Top Section: Hero "Liked Songs" Card (FAV_LIKED_SONGS)
 * - Bottom Section: Horizontal row of Liked Playlist Cards (FAV_PL_0, FAV_PL_1, ...)
 *
 * NAVIGATION RULES:
 * - Left from FAV_LIKED_SONGS or FAV_PL_0 returns to sidebar NAV_FAV.
 * - Down from FAV_LIKED_SONGS moves to first available playlist card (FAV_PL_0) if present.
 * - Up from any playlist card moves to FAV_LIKED_SONGS.
 * - Left/Right traverses between playlist cards in the row.
 */
export function getFavoritesNextFocus(
  currentId: string,
  direction: DPadDirection,
  likedPlaylistsCount: number = 0
): string | null {
  // 1. Sidebar transitions into Favorites Screen
  if (currentId.startsWith('NAV_')) {
    if (direction === 'right') {
      return FAVORITES_FOCUS_IDS.LIKED_SONGS;
    }
    if (direction === 'up') {
      if (currentId === 'NAV_SETTINGS') return 'NAV_FAV';
      if (currentId === 'NAV_FAV') return 'NAV_LIBRARY';
      if (currentId === 'NAV_LIBRARY') return 'NAV_DJ';
      if (currentId === 'NAV_DJ') return 'NAV_SEARCH';
      if (currentId === 'NAV_SEARCH') return 'NAV_HOME';
      return null;
    }
    if (direction === 'down') {
      if (currentId === 'NAV_HOME') return 'NAV_SEARCH';
      if (currentId === 'NAV_SEARCH') return 'NAV_DJ';
      if (currentId === 'NAV_DJ') return 'NAV_LIBRARY';
      if (currentId === 'NAV_LIBRARY') return 'NAV_FAV';
      if (currentId === 'NAV_FAV') return 'NAV_SETTINGS';
      return null;
    }
    return null;
  }

  // 2. Hero "Liked Songs" Playlist Card
  if (currentId === FAVORITES_FOCUS_IDS.LIKED_SONGS) {
    if (direction === 'left') {
      return 'NAV_FAV';
    }
    if (direction === 'down') {
      return likedPlaylistsCount > 0 ? `${FAVORITES_FOCUS_IDS.PLAYLIST_PREFIX}0` : null;
    }
    return null;
  }

  // 3. Horizontal Liked Playlists Row (FAV_PL_0, FAV_PL_1, ...)
  if (currentId.startsWith(FAVORITES_FOCUS_IDS.PLAYLIST_PREFIX)) {
    const idx = parseInt(
      currentId.replace(FAVORITES_FOCUS_IDS.PLAYLIST_PREFIX, ''),
      10
    );
    if (isNaN(idx)) return FAVORITES_FOCUS_IDS.LIKED_SONGS;

    if (direction === 'left') {
      if (idx === 0) return 'NAV_FAV';
      return `${FAVORITES_FOCUS_IDS.PLAYLIST_PREFIX}${idx - 1}`;
    }
    if (direction === 'right') {
      if (idx < likedPlaylistsCount - 1) {
        return `${FAVORITES_FOCUS_IDS.PLAYLIST_PREFIX}${idx + 1}`;
      }
      return null;
    }
    if (direction === 'up') {
      return FAVORITES_FOCUS_IDS.LIKED_SONGS;
    }
    return null;
  }

  return null;
}
