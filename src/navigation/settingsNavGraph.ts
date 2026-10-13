export type DPadDirection = 'left' | 'right' | 'up' | 'down';

export const SETTINGS_FOCUS_IDS = {
  CHANGE_AVATAR: 'SETTINGS_CHANGE_AVATAR',
  QR_CARD: 'SETTINGS_QR_CARD',
} as const;

/**
 * Deterministic Spatial Navigation Graph for Settings Screen (NAV_SETTINGS).
 *
 * LAYOUT:
 * - Left Side: User Profile & Companion Avatar Card with "Change Companion Avatar" Button
 * - Right Side: Privacy & Policy Highlights + Scannable QR Code Card
 *
 * NAVIGATION RULES:
 * - From Drawer (NAV_SETTINGS): RIGHT moves to SETTINGS_CHANGE_AVATAR.
 * - From SETTINGS_CHANGE_AVATAR:
 *     LEFT -> returns to Left Navigation Rail (NAV_SETTINGS)
 *     RIGHT -> moves to Privacy/QR Card (SETTINGS_QR_CARD)
 * - From SETTINGS_QR_CARD:
 *     LEFT -> moves back to SETTINGS_CHANGE_AVATAR
 *     RIGHT -> null (boundary)
 */
export function getSettingsNextFocus(
  currentId: string,
  direction: DPadDirection
): string | null {
  // 1. Sidebar transitions into Settings Screen
  if (currentId.startsWith('NAV_')) {
    if (direction === 'right') {
      return SETTINGS_FOCUS_IDS.CHANGE_AVATAR;
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

  // 2. Change Avatar Action Button
  if (currentId === SETTINGS_FOCUS_IDS.CHANGE_AVATAR) {
    if (direction === 'left') {
      return 'NAV_SETTINGS';
    }
    if (direction === 'right') {
      return SETTINGS_FOCUS_IDS.QR_CARD;
    }
    return null;
  }

  // 3. Privacy & QR Code Card
  if (currentId === SETTINGS_FOCUS_IDS.QR_CARD) {
    if (direction === 'left') {
      return SETTINGS_FOCUS_IDS.CHANGE_AVATAR;
    }
    return null;
  }

  return null;
}
