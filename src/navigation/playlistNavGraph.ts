import type { PlaylistTrack } from '../data/playlistData';

export type DPadDirection = 'left' | 'right' | 'up' | 'down';

/**
 * Authoritative Navigation Table for the Playlist Detail Page (Clean Layout without Top Search Bar).
 *
 * Focus                 | LEFT         | RIGHT             | UP         | DOWN
 * ----------------------|--------------|-------------------|------------|--------------
 * DRAWER_LIBRARY        | BLOCK        | Play              | Nav Up     | Nav Down
 * BACK (PL_BACK)        | Drawer       | Player Play/Pause | BLOCK      | Play
 * PLAY (PL_PLAY_ALL)    | Drawer       | Shuffle           | Back       | Track 1
 * SHUFFLE (PL_SHUFFLE)  | Play         | Playlist Like     | Back       | Track 1
 * PLAYLIST LIKE (PL_FAV)| Shuffle      | Player Play/Pause | Back       | Track 1
 * TRACK 1               | Drawer       | Player Play/Pause | Play       | Track 2
 * TRACK N               | Drawer       | Player Play/Pause | Track N-1  | Track N+1
 * FINAL TRACK           | Drawer       | Player Play/Pause | Track N-1  | BLOCK
 * PLAYER SONG LIKE      | Origin Track | Previous          | Back       | Scrubber
 * PLAYER PREVIOUS       | Song Like    | Play/Pause        | Back       | Scrubber
 * PLAYER PLAY/PAUSE     | Previous     | Next              | Back       | Scrubber
 * PLAYER NEXT           | Play/Pause   | Fullscreen        | Back       | Scrubber
 * PLAYER FULLSCREEN     | Next         | BLOCK             | Back       | Scrubber
 * PLAYER SCRUBBER       | Seek -10s    | Seek +10s         | Play/Pause | BLOCK
 */
export function getPlaylistNextFocus(
  currentId: string,
  direction: DPadDirection,
  tracks: PlaylistTrack[],
  playerOriginTrackId?: string | null,
  isUsbPlaylist: boolean = false
): string | null {
  const trackIds = tracks.map((t) => `TRK_${t.id}`);
  const trackCount = trackIds.length;
  const firstTrackId = trackCount > 0 ? trackIds[0] : null;

  // Resolve valid origin track (always fallback to TRACK_1 or PL_FAV/PL_PLAY_ALL if missing or invalid)
  const validOriginTrackId =
    playerOriginTrackId && trackIds.includes(playerOriginTrackId)
      ? playerOriginTrackId
      : firstTrackId || (isUsbPlaylist ? 'PL_PLAY_ALL' : 'PL_FAV');

  // 1. LEFT DRAWER ('NAV_HOME', 'NAV_SEARCH', 'NAV_DJ', 'NAV_LIBRARY', 'NAV_FAV', 'NAV_SETTINGS')
  if (currentId.startsWith('NAV_') || currentId === 'DRAWER_LIBRARY') {
    const normalizedId = currentId === 'DRAWER_LIBRARY' ? 'NAV_LIBRARY' : currentId;
    if (direction === 'right') return 'PL_PLAY_ALL';
    if (direction === 'up') {
      if (normalizedId === 'NAV_SETTINGS') return 'NAV_FAV';
      if (normalizedId === 'NAV_FAV') return 'NAV_LIBRARY';
      if (normalizedId === 'NAV_LIBRARY') return 'NAV_DJ';
      if (normalizedId === 'NAV_DJ') return 'NAV_SEARCH';
      if (normalizedId === 'NAV_SEARCH') return 'NAV_HOME';
      return null;
    }
    if (direction === 'down') {
      if (normalizedId === 'NAV_HOME') return 'NAV_SEARCH';
      if (normalizedId === 'NAV_SEARCH') return 'NAV_DJ';
      if (normalizedId === 'NAV_DJ') return 'NAV_LIBRARY';
      if (normalizedId === 'NAV_LIBRARY') return 'NAV_FAV';
      if (normalizedId === 'NAV_FAV') return 'NAV_SETTINGS';
      return null;
    }
    return null; // LEFT -> BLOCKED
  }

  // 2. BACK ('PL_BACK')
  if (currentId === 'PL_BACK') {
    if (direction === 'left') return 'NAV_LIBRARY';
    if (direction === 'right') return 'PL_PLAYER_PLAY'; // RIGHT -> Jumps directly to Right Player Card
    if (direction === 'up') return null; // BLOCKED
    if (direction === 'down') return 'PL_PLAY_ALL'; // DOWN -> PLAY
    return null;
  }

  // 3. PLAY ('PL_PLAY_ALL')
  if (currentId === 'PL_PLAY_ALL') {
    if (direction === 'left') return 'NAV_LIBRARY';
    if (direction === 'right') return 'PL_SHUFFLE';
    if (direction === 'up') return 'PL_BACK'; // UP -> BACK
    if (direction === 'down') return firstTrackId; // DOWN -> TRACK_1
    return null;
  }

  // 4. SHUFFLE ('PL_SHUFFLE')
  if (currentId === 'PL_SHUFFLE') {
    if (direction === 'left') return 'PL_PLAY_ALL';
    if (direction === 'right') return isUsbPlaylist ? 'PL_PLAYER_PLAY' : 'PL_FAV';
    if (direction === 'up') return 'PL_BACK'; // UP -> BACK
    if (direction === 'down') return firstTrackId; // DOWN -> TRACK_1
    return null;
  }

  // 5. PLAYLIST LIKE ('PL_FAV')
  if (currentId === 'PL_FAV') {
    if (direction === 'left') return 'PL_SHUFFLE';
    if (direction === 'right') return 'PL_PLAYER_PLAY'; // RIGHT -> PLAYER_PLAY_PAUSE
    if (direction === 'up') return 'PL_BACK'; // UP -> BACK
    if (direction === 'down') return firstTrackId; // DOWN -> TRACK_1
    return null;
  }

  // 6, 7, 8. TRACK LIST (TRACK_1, TRACK_N, FINAL_TRACK)
  const trkIdx = trackIds.indexOf(currentId);
  if (trkIdx !== -1) {
    if (direction === 'left') {
      return 'NAV_LIBRARY'; // LEFT -> DRAWER_LIBRARY
    }
    if (direction === 'right') {
      return 'PL_PLAYER_PLAY'; // RIGHT -> PLAYER_PLAY_PAUSE
    }
    if (direction === 'up') {
      if (trkIdx === 0) return 'PL_PLAY_ALL'; // TRACK_1 UP -> PLAY
      return trackIds[trkIdx - 1]; // TRACK_N UP -> TRACK_(N-1)
    }
    if (direction === 'down') {
      if (trkIdx === trackCount - 1) return null; // FINAL_TRACK DOWN -> BLOCKED
      return trackIds[trkIdx + 1]; // TRACK_N DOWN -> TRACK_(N+1)
    }
    return null;
  }

  // 9. PLAYER SONG LIKE ('PL_PLAYER_HEART')
  if (currentId === 'PL_PLAYER_HEART') {
    if (direction === 'left') return validOriginTrackId; // LEFT -> PLAYER_ORIGIN_TRACK
    if (direction === 'right') return 'PL_PLAYER_PREV'; // RIGHT -> PLAYER_PREVIOUS
    if (direction === 'up') return 'PL_BACK'; // UP -> BACK
    if (direction === 'down') return 'PL_PLAYER_SCRUB'; // DOWN -> PLAYER_SCRUBBER
    return null;
  }

  // 10. PLAYER PREVIOUS ('PL_PLAYER_PREV')
  if (currentId === 'PL_PLAYER_PREV') {
    if (direction === 'left') return isUsbPlaylist ? validOriginTrackId : 'PL_PLAYER_HEART'; // LEFT -> PLAYER_SONG_LIKE (or Origin Track on USB)
    if (direction === 'right') return 'PL_PLAYER_PLAY'; // RIGHT -> PLAYER_PLAY_PAUSE
    if (direction === 'up') return 'PL_BACK'; // UP -> BACK
    if (direction === 'down') return 'PL_PLAYER_SCRUB'; // DOWN -> PLAYER_SCRUBBER
    return null;
  }

  // 11. PLAYER PLAY/PAUSE ('PL_PLAYER_PLAY')
  if (currentId === 'PL_PLAYER_PLAY') {
    if (direction === 'left') return 'PL_PLAYER_PREV'; // LEFT -> PLAYER_PREVIOUS
    if (direction === 'right') return 'PL_PLAYER_NEXT'; // RIGHT -> PLAYER_NEXT
    if (direction === 'up') return 'PL_BACK'; // UP -> BACK
    if (direction === 'down') return 'PL_PLAYER_SCRUB'; // DOWN -> PLAYER_SCRUBBER
    return null;
  }

  // 12. PLAYER NEXT ('PL_PLAYER_NEXT')
  if (currentId === 'PL_PLAYER_NEXT') {
    if (direction === 'left') return 'PL_PLAYER_PLAY'; // LEFT -> PLAYER_PLAY_PAUSE
    if (direction === 'right') return 'PL_PLAYER_FULLSCREEN'; // RIGHT -> PLAYER_FULLSCREEN
    if (direction === 'up') return 'PL_BACK'; // UP -> BACK
    if (direction === 'down') return 'PL_PLAYER_SCRUB'; // DOWN -> PLAYER_SCRUBBER
    return null;
  }

  // 13. PLAYER FULLSCREEN ('PL_PLAYER_FULLSCREEN')
  if (currentId === 'PL_PLAYER_FULLSCREEN') {
    if (direction === 'left') return 'PL_PLAYER_NEXT'; // LEFT -> PLAYER_NEXT
    if (direction === 'right') return null; // RIGHT -> BLOCKED
    if (direction === 'up') return 'PL_BACK'; // UP -> BACK
    if (direction === 'down') return 'PL_PLAYER_SCRUB'; // DOWN -> PLAYER_SCRUBBER
    return null;
  }

  // 14. PLAYER SCRUBBER ('PL_PLAYER_SCRUB')
  if (currentId === 'PL_PLAYER_SCRUB') {
    if (direction === 'up') return 'PL_PLAYER_PLAY'; // UP -> PLAYER_PLAY_PAUSE
    if (direction === 'down') return null; // DOWN -> BLOCKED
    return null; // LEFT/RIGHT handled as seek -10s / +10s without changing focus
  }

  return null;
}
