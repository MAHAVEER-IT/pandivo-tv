export type DPadDirection = 'left' | 'right' | 'up' | 'down';

export const LIBRARY_CARD_IDS = {
  CHILL: 'LIB_CARD_CHILL',
  FOCUS: 'LIB_CARD_FOCUS',
  WORKOUT: 'LIB_CARD_WORKOUT',
  STUDY: 'LIB_CARD_STUDY',
  ENERGIZE: 'LIB_CARD_ENERGIZE',
  MIDNIGHT: 'LIB_CARD_MIDNIGHT',
  USB: 'LIB_CARD_USB',
} as const;

/**
 * Directional Navigation Graph for the Library Playlist-Selection Screen (Search Removed).
 *
 * Implements deterministic TV D-Pad spatial navigation (3x2 grid + USB row):
 *
 * ELEMENT               LEFT               RIGHT              UP                 DOWN
 * NAV_LIBRARY           —                  LIB_CARD_CHILL     NAV_DJ             NAV_FAV
 * LIB_BACK              NAV_LIBRARY        LIB_CARD_FOCUS     —                  LIB_CARD_CHILL
 * LIB_CARD_CHILL        NAV_LIBRARY        LIB_CARD_FOCUS     LIB_BACK           LIB_CARD_WORKOUT
 * LIB_CARD_FOCUS        LIB_CARD_CHILL     —                  LIB_BACK           LIB_CARD_STUDY
 * LIB_CARD_WORKOUT      NAV_LIBRARY        LIB_CARD_STUDY     LIB_CARD_CHILL     LIB_CARD_ENERGIZE
 * LIB_CARD_STUDY        LIB_CARD_WORKOUT   —                  LIB_CARD_FOCUS     LIB_CARD_MIDNIGHT
 * LIB_CARD_ENERGIZE     NAV_LIBRARY        LIB_CARD_MIDNIGHT  LIB_CARD_WORKOUT   LIB_CARD_USB
 * LIB_CARD_MIDNIGHT     LIB_CARD_ENERGIZE  —                  LIB_CARD_STUDY     LIB_CARD_USB
 * LIB_CARD_USB          NAV_LIBRARY        —                  LIB_CARD_ENERGIZE  —
 */
export function getLibraryNextFocus(
  currentId: string,
  direction: DPadDirection
): string | null {
  // Top Navigation Bar (Back Button Only)
  if (currentId === 'LIB_BACK') {
    if (direction === 'left') return 'NAV_LIBRARY';
    if (direction === 'right') return LIBRARY_CARD_IDS.FOCUS;
    if (direction === 'down') return LIBRARY_CARD_IDS.CHILL;
    return null;
  }

  // 1. CHILL VIBES (Row 1, Left)
  if (currentId === LIBRARY_CARD_IDS.CHILL) {
    if (direction === 'right') return LIBRARY_CARD_IDS.FOCUS;
    if (direction === 'down') return LIBRARY_CARD_IDS.WORKOUT;
    if (direction === 'up') return 'LIB_BACK';
    if (direction === 'left') return 'NAV_LIBRARY';
    return null;
  }

  // 2. FOCUS MIX (Row 1, Right)
  if (currentId === LIBRARY_CARD_IDS.FOCUS) {
    if (direction === 'left') return LIBRARY_CARD_IDS.CHILL;
    if (direction === 'down') return LIBRARY_CARD_IDS.STUDY;
    if (direction === 'up') return 'LIB_BACK';
    return null;
  }

  // 3. WORKOUT MIX (Row 2, Left)
  if (currentId === LIBRARY_CARD_IDS.WORKOUT) {
    if (direction === 'up') return LIBRARY_CARD_IDS.CHILL;
    if (direction === 'down') return LIBRARY_CARD_IDS.ENERGIZE;
    if (direction === 'right') return LIBRARY_CARD_IDS.STUDY;
    if (direction === 'left') return 'NAV_LIBRARY';
    return null;
  }

  // 4. STUDY MIX (Row 2, Right)
  if (currentId === LIBRARY_CARD_IDS.STUDY) {
    if (direction === 'up') return LIBRARY_CARD_IDS.FOCUS;
    if (direction === 'down') return LIBRARY_CARD_IDS.MIDNIGHT;
    if (direction === 'left') return LIBRARY_CARD_IDS.WORKOUT;
    return null;
  }

  // 5. ENERGIZE & WAKE UP (Row 3, Left)
  if (currentId === LIBRARY_CARD_IDS.ENERGIZE) {
    if (direction === 'up') return LIBRARY_CARD_IDS.WORKOUT;
    if (direction === 'right') return LIBRARY_CARD_IDS.MIDNIGHT;
    if (direction === 'down') return LIBRARY_CARD_IDS.USB;
    if (direction === 'left') return 'NAV_LIBRARY';
    return null;
  }

  // 6. MIDNIGHT DREAMS (Row 3, Right)
  if (currentId === LIBRARY_CARD_IDS.MIDNIGHT) {
    if (direction === 'up') return LIBRARY_CARD_IDS.STUDY;
    if (direction === 'left') return LIBRARY_CARD_IDS.ENERGIZE;
    if (direction === 'down') return LIBRARY_CARD_IDS.USB;
    return null;
  }

  // 7. USB STORAGE CARD (Row 4)
  if (currentId === LIBRARY_CARD_IDS.USB) {
    if (direction === 'up') return LIBRARY_CARD_IDS.ENERGIZE;
    if (direction === 'left') return 'NAV_LIBRARY';
    return null;
  }

  // Left Drawer Items Navigation while on Library screen
  if (currentId.startsWith('NAV_')) {
    if (direction === 'right') {
      if (currentId === 'NAV_SETTINGS') {
        return LIBRARY_CARD_IDS.USB;
      }
      if (currentId === 'NAV_FAV') {
        return LIBRARY_CARD_IDS.WORKOUT;
      }
      return LIBRARY_CARD_IDS.CHILL;
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
  }

  return null;
}
