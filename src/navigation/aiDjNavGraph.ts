import { DPadDirection } from './playlistNavGraph';

export const AI_DJ_FOCUS_IDS = {
  MIC: 'AI_DJ_MIC',
  CANCEL_MIC: 'AI_DJ_CANCEL_MIC',
  DIAGNOSTIC_BTN: 'AI_DJ_DIAGNOSTIC_BTN',
  ERR_GENERAL: 'AI_DJ_ERR_GENERAL',
  ERR_NOTRACKS: 'AI_DJ_ERR_NOTRACKS',
  ERR_CONN: 'AI_DJ_ERR_CONN',
  ERR_AIDOWN: 'AI_DJ_ERR_AIDOWN',
  VIEW_ALL: 'AI_DJ_VIEW_ALL',
  CARD_0: 'AI_DJ_CARD_0',
  CARD_1: 'AI_DJ_CARD_1',
  CARD_2: 'AI_DJ_CARD_2',
  CARD_3: 'AI_DJ_CARD_3',
  CARD_4: 'AI_DJ_CARD_4',
  CARD_5: 'AI_DJ_CARD_5',
} as const;

export function getAiDjNextFocus(
  currentFocus: string,
  direction: DPadDirection,
  cardsCount: number = 0,
  isListening: boolean = false
): string | null {
  // 1. Left Sidebar Rail while on AI DJ Tab
  if (currentFocus.startsWith('NAV_')) {
    if (direction === 'right') {
      return AI_DJ_FOCUS_IDS.MIC;
    }
    if (direction === 'up') {
      if (currentFocus === 'NAV_SEARCH') return 'NAV_HOME';
      if (currentFocus === 'NAV_DJ') return 'NAV_SEARCH';
      if (currentFocus === 'NAV_LIBRARY') return 'NAV_DJ';
      if (currentFocus === 'NAV_FAV') return 'NAV_LIBRARY';
      if (currentFocus === 'NAV_SETTINGS') return 'NAV_FAV';
      return null;
    }
    if (direction === 'down') {
      if (currentFocus === 'NAV_HOME') return 'NAV_SEARCH';
      if (currentFocus === 'NAV_SEARCH') return 'NAV_DJ';
      if (currentFocus === 'NAV_DJ') return 'NAV_LIBRARY';
      if (currentFocus === 'NAV_LIBRARY') return 'NAV_FAV';
      if (currentFocus === 'NAV_FAV') return 'NAV_SETTINGS';
      return null;
    }
    return null;
  }

  // 2. Central Hero Microphone Button (AI_DJ_MIC)
  if (currentFocus === AI_DJ_FOCUS_IDS.MIC) {
    if (isListening && (direction === 'up' || direction === 'right')) {
      return AI_DJ_FOCUS_IDS.CANCEL_MIC;
    }
    if (direction === 'left') return 'NAV_DJ';
    if (direction === 'right') return AI_DJ_FOCUS_IDS.VIEW_ALL;
    if (direction === 'down') {
      return cardsCount > 0 ? AI_DJ_FOCUS_IDS.CARD_0 : null;
    }
    return null;
  }

  // 2b. Cancel Mic Button (AI_DJ_CANCEL_MIC)
  if (currentFocus === AI_DJ_FOCUS_IDS.CANCEL_MIC) {
    if (direction === 'left' || direction === 'down') return AI_DJ_FOCUS_IDS.MIC;
    if (direction === 'right') return AI_DJ_FOCUS_IDS.VIEW_ALL;
    return null;
  }

  // 3. View All Button (AI_DJ_VIEW_ALL)
  if (currentFocus === AI_DJ_FOCUS_IDS.VIEW_ALL) {
    if (direction === 'left') return AI_DJ_FOCUS_IDS.MIC;
    if (direction === 'up') return AI_DJ_FOCUS_IDS.MIC;
    if (direction === 'down') {
      return cardsCount > 0 ? `AI_DJ_CARD_${Math.min(cardsCount - 1, 5)}` : null;
    }
    return null;
  }

  // 4. Bottom Row: User-Generated AI Playlist History Cards
  if (currentFocus.startsWith('AI_DJ_CARD_')) {
    const idx = parseInt(currentFocus.replace('AI_DJ_CARD_', ''), 10);
    if (direction === 'left') {
      if (idx === 0) return 'NAV_DJ';
      return `AI_DJ_CARD_${idx - 1}`;
    }
    if (direction === 'right') {
      if (idx < cardsCount - 1) return `AI_DJ_CARD_${idx + 1}`;
      return null;
    }
    if (direction === 'up') {
      return AI_DJ_FOCUS_IDS.MIC;
    }
    return null;
  }

  return null;
}
