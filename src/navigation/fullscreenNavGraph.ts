export type DPadDirection = 'left' | 'right' | 'up' | 'down';

/**
 * Isolated Focus ID Namespace for the Full Screen Player Page (Section 7).
 * Completely separate from Playlist Detail focus IDs.
 */
export const FULLSCREEN_FOCUS_IDS = {
  BACK: 'FS_BACK',
  PLAY_PAUSE: 'FS_PLAY_PAUSE',
  PREVIOUS: 'FS_PREVIOUS',
  NEXT: 'FS_NEXT',
  LIKE: 'FS_LIKE',
  PALETTE: 'FS_PALETTE',
  SONG_INFO: 'FS_SONG_INFO',
  SCRUBBER: 'FS_SCRUBBER',
  UPCOMING_ENTRY: 'FS_UPCOMING_TRACK_1',
  UPCOMING_TRACK_1: 'FS_UPCOMING_TRACK_1',
  UPCOMING_TRACK_2: 'FS_UPCOMING_TRACK_2',
  UPCOMING_TRACK_3: 'FS_UPCOMING_TRACK_3',
  UPCOMING_TRACK_4: 'FS_UPCOMING_TRACK_4',
  AI_OVERLAY_BACK: 'FS_AI_OVERLAY_BACK',
  BG_OVERLAY_CLOSE: 'FS_BG_OVERLAY_CLOSE',
  BG_THUMB_0: 'FS_BG_THUMB_0',
  BG_THUMB_1: 'FS_BG_THUMB_1',
  BG_THUMB_2: 'FS_BG_THUMB_2',
  BG_THUMB_3: 'FS_BG_THUMB_3',
  BG_THUMB_4: 'FS_BG_THUMB_4',
  BG_THUMB_5: 'FS_BG_THUMB_5',
  BG_THUMB_6: 'FS_BG_THUMB_6',
} as const;

export const UPCOMING_TRACK_FOCUS_IDS = [
  FULLSCREEN_FOCUS_IDS.UPCOMING_TRACK_1,
  FULLSCREEN_FOCUS_IDS.UPCOMING_TRACK_2,
  FULLSCREEN_FOCUS_IDS.UPCOMING_TRACK_3,
  FULLSCREEN_FOCUS_IDS.UPCOMING_TRACK_4,
] as const;

export const BG_THUMB_FOCUS_IDS = [
  FULLSCREEN_FOCUS_IDS.BG_THUMB_0,
  FULLSCREEN_FOCUS_IDS.BG_THUMB_1,
  FULLSCREEN_FOCUS_IDS.BG_THUMB_2,
  FULLSCREEN_FOCUS_IDS.BG_THUMB_3,
  FULLSCREEN_FOCUS_IDS.BG_THUMB_4,
  FULLSCREEN_FOCUS_IDS.BG_THUMB_5,
  FULLSCREEN_FOCUS_IDS.BG_THUMB_6,
] as const;

/**
 * Authoritative Full Screen Navigation Table with Palette and Background Selection Overlay:
 */
export function getFullscreenNextFocus(
  currentId: string,
  direction: DPadDirection,
  isAiOverlayOpen: boolean = false,
  upcomingCount: number = 4,
  isBgOverlayOpen: boolean = false,
  isUsbTrack: boolean = false
): string | null {
  // When AI Song Info Overlay is open, focus stays locked on FS_AI_OVERLAY_BACK
  if (isAiOverlayOpen) {
    return null;
  }

  // When Background Selection Overlay is open, navigate within the overlay only
  if (isBgOverlayOpen) {
    if (currentId === FULLSCREEN_FOCUS_IDS.BG_OVERLAY_CLOSE) {
      if (direction === 'down') return FULLSCREEN_FOCUS_IDS.BG_THUMB_0;
      return null;
    }

    // Row 0: Thumb 0 (Classical Cello), Thumb 1 (Cyan Ribbon), Thumb 2 (Disco Ball)
    if (currentId === FULLSCREEN_FOCUS_IDS.BG_THUMB_0) {
      if (direction === 'up') return FULLSCREEN_FOCUS_IDS.BG_OVERLAY_CLOSE;
      if (direction === 'right') return FULLSCREEN_FOCUS_IDS.BG_THUMB_1;
      if (direction === 'down') return FULLSCREEN_FOCUS_IDS.BG_THUMB_3;
      return null;
    }
    if (currentId === FULLSCREEN_FOCUS_IDS.BG_THUMB_1) {
      if (direction === 'up') return FULLSCREEN_FOCUS_IDS.BG_OVERLAY_CLOSE;
      if (direction === 'left') return FULLSCREEN_FOCUS_IDS.BG_THUMB_0;
      if (direction === 'right') return FULLSCREEN_FOCUS_IDS.BG_THUMB_2;
      if (direction === 'down') return FULLSCREEN_FOCUS_IDS.BG_THUMB_4;
      return null;
    }
    if (currentId === FULLSCREEN_FOCUS_IDS.BG_THUMB_2) {
      if (direction === 'up') return FULLSCREEN_FOCUS_IDS.BG_OVERLAY_CLOSE;
      if (direction === 'left') return FULLSCREEN_FOCUS_IDS.BG_THUMB_1;
      if (direction === 'down') return FULLSCREEN_FOCUS_IDS.BG_THUMB_5;
      return null;
    }

    // Row 1: Thumb 3 (Emerald Nature), Thumb 4 (Starlight Helix), Thumb 5 (Warm Amber)
    if (currentId === FULLSCREEN_FOCUS_IDS.BG_THUMB_3) {
      if (direction === 'up') return FULLSCREEN_FOCUS_IDS.BG_THUMB_0;
      if (direction === 'right') return FULLSCREEN_FOCUS_IDS.BG_THUMB_4;
      if (direction === 'down') return FULLSCREEN_FOCUS_IDS.BG_THUMB_6;
      return null;
    }
    if (currentId === FULLSCREEN_FOCUS_IDS.BG_THUMB_4) {
      if (direction === 'up') return FULLSCREEN_FOCUS_IDS.BG_THUMB_1;
      if (direction === 'left') return FULLSCREEN_FOCUS_IDS.BG_THUMB_3;
      if (direction === 'right') return FULLSCREEN_FOCUS_IDS.BG_THUMB_5;
      if (direction === 'down') return FULLSCREEN_FOCUS_IDS.BG_THUMB_6;
      return null;
    }
    if (currentId === FULLSCREEN_FOCUS_IDS.BG_THUMB_5) {
      if (direction === 'up') return FULLSCREEN_FOCUS_IDS.BG_THUMB_2;
      if (direction === 'left') return FULLSCREEN_FOCUS_IDS.BG_THUMB_4;
      if (direction === 'down') return FULLSCREEN_FOCUS_IDS.BG_THUMB_6;
      return null;
    }

    // Row 2: Thumb 6 (Workout Tunnel)
    if (currentId === FULLSCREEN_FOCUS_IDS.BG_THUMB_6) {
      if (direction === 'up') return FULLSCREEN_FOCUS_IDS.BG_THUMB_3;
      return null;
    }

    // Fallback if currentId is not one of overlay controls: set to Thumb 0
    return FULLSCREEN_FOCUS_IDS.BG_THUMB_0;
  }

  const maxUpcomingIdx = Math.max(0, Math.min(3, upcomingCount - 1));

  // 1. FS_BACK
  if (currentId === FULLSCREEN_FOCUS_IDS.BACK) {
    if (direction === 'left') return null; // BLOCK
    if (direction === 'right') return FULLSCREEN_FOCUS_IDS.UPCOMING_TRACK_1; // UPCOMING_ENTRY
    if (direction === 'up') return null; // BLOCK
    if (direction === 'down') return FULLSCREEN_FOCUS_IDS.PLAY_PAUSE;
    return null;
  }

  // 2. FS_PLAY_PAUSE
  if (currentId === FULLSCREEN_FOCUS_IDS.PLAY_PAUSE) {
    if (direction === 'left') return FULLSCREEN_FOCUS_IDS.PREVIOUS;
    if (direction === 'right') return FULLSCREEN_FOCUS_IDS.NEXT;
    if (direction === 'up') return FULLSCREEN_FOCUS_IDS.BACK;
    if (direction === 'down') return FULLSCREEN_FOCUS_IDS.SCRUBBER;
    return null;
  }

  // 3. FS_PREVIOUS
  if (currentId === FULLSCREEN_FOCUS_IDS.PREVIOUS) {
    if (direction === 'left') return null; // BLOCK (do not wrap or escape)
    if (direction === 'right') return FULLSCREEN_FOCUS_IDS.PLAY_PAUSE;
    if (direction === 'up') return FULLSCREEN_FOCUS_IDS.BACK;
    if (direction === 'down') return FULLSCREEN_FOCUS_IDS.SCRUBBER;
    return null;
  }

  // 4. FS_NEXT
  if (currentId === FULLSCREEN_FOCUS_IDS.NEXT) {
    if (direction === 'left') return FULLSCREEN_FOCUS_IDS.PLAY_PAUSE;
    if (direction === 'right') return isUsbTrack ? FULLSCREEN_FOCUS_IDS.PALETTE : FULLSCREEN_FOCUS_IDS.LIKE;
    if (direction === 'up') return FULLSCREEN_FOCUS_IDS.BACK;
    if (direction === 'down') return FULLSCREEN_FOCUS_IDS.SCRUBBER;
    return null;
  }

  // 5. FS_LIKE: Right goes to PALETTE
  if (currentId === FULLSCREEN_FOCUS_IDS.LIKE) {
    if (direction === 'left') return FULLSCREEN_FOCUS_IDS.NEXT;
    if (direction === 'right') return FULLSCREEN_FOCUS_IDS.PALETTE;
    if (direction === 'up') return FULLSCREEN_FOCUS_IDS.UPCOMING_TRACK_1;
    if (direction === 'down') return FULLSCREEN_FOCUS_IDS.SCRUBBER;
    return null;
  }

  // 5b. FS_PALETTE: Between LIKE and SONG_INFO
  if (currentId === FULLSCREEN_FOCUS_IDS.PALETTE) {
    if (direction === 'left') return isUsbTrack ? FULLSCREEN_FOCUS_IDS.NEXT : FULLSCREEN_FOCUS_IDS.LIKE;
    if (direction === 'right') return FULLSCREEN_FOCUS_IDS.SONG_INFO;
    if (direction === 'up') return FULLSCREEN_FOCUS_IDS.UPCOMING_TRACK_1;
    if (direction === 'down') return FULLSCREEN_FOCUS_IDS.SCRUBBER;
    return null;
  }

  // 6. FS_SONG_INFO: Left goes to PALETTE
  if (currentId === FULLSCREEN_FOCUS_IDS.SONG_INFO) {
    if (direction === 'left') return FULLSCREEN_FOCUS_IDS.PALETTE;
    if (direction === 'right') return null; // BLOCK
    if (direction === 'up') return FULLSCREEN_FOCUS_IDS.UPCOMING_TRACK_1;
    if (direction === 'down') return FULLSCREEN_FOCUS_IDS.SCRUBBER;
    return null;
  }

  // 7. FS_SCRUBBER
  if (currentId === FULLSCREEN_FOCUS_IDS.SCRUBBER) {
    if (direction === 'up') return FULLSCREEN_FOCUS_IDS.PLAY_PAUSE;
    if (direction === 'down') return null; // BLOCK
    // LEFT/RIGHT perform -10s / +10s seek without changing focus
    return null;
  }

  // 8. UPCOMING TRACKS 1..4
  const upcomingIdx = (UPCOMING_TRACK_FOCUS_IDS as readonly string[]).indexOf(currentId);
  if (upcomingIdx !== -1) {
    if (direction === 'left') return FULLSCREEN_FOCUS_IDS.BACK;
    if (direction === 'right') return null; // BLOCK
    if (direction === 'up') {
      if (upcomingIdx === 0) return null; // UPCOMING_TRACK_1 UP -> BLOCK
      return UPCOMING_TRACK_FOCUS_IDS[upcomingIdx - 1];
    }
    if (direction === 'down') {
      if (upcomingIdx >= maxUpcomingIdx) return null; // UPCOMING_TRACK_4 DOWN -> BLOCK
      return UPCOMING_TRACK_FOCUS_IDS[upcomingIdx + 1];
    }
    return null;
  }

  return null;
}
