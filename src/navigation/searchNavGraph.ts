export type DPadDirection = 'left' | 'right' | 'up' | 'down';

export const SEARCH_FOCUS_IDS = {
  // Screen 1: Search Landing
  BACK: 'SRC_BACK',
  VOICE: 'SRC_VOICE',
  // Keyboard keys
  KEY_A: 'KEY_A', KEY_B: 'KEY_B', KEY_C: 'KEY_C', KEY_D: 'KEY_D', KEY_E: 'KEY_E', KEY_F: 'KEY_F', KEY_G: 'KEY_G',
  KEY_H: 'KEY_H', KEY_I: 'KEY_I', KEY_J: 'KEY_J', KEY_K: 'KEY_K', KEY_L: 'KEY_L', KEY_M: 'KEY_M', KEY_N: 'KEY_N',
  KEY_O: 'KEY_O', KEY_P: 'KEY_P', KEY_Q: 'KEY_Q', KEY_R: 'KEY_R', KEY_S: 'KEY_S', KEY_T: 'KEY_T', KEY_U: 'KEY_U',
  KEY_V: 'KEY_V', KEY_W: 'KEY_W', KEY_X: 'KEY_X', KEY_Y: 'KEY_Y', KEY_Z: 'KEY_Z', KEY_1: 'KEY_1', KEY_2: 'KEY_2',
  KEY_3: 'KEY_3', KEY_4: 'KEY_4', KEY_5: 'KEY_5', KEY_6: 'KEY_6', KEY_7: 'KEY_7', KEY_8: 'KEY_8', KEY_9: 'KEY_9',
  KEY_0: 'KEY_0', KEY_SPACE: 'KEY_SPACE', KEY_DEL: 'KEY_DEL',
  KEY_SEARCH: 'KEY_SEARCH',

  // Right Panel: Empty State (Recs & History)
  REC_0: 'SRC_REC_0',
  REC_1: 'SRC_REC_1',
  REC_2: 'SRC_REC_2',
  HIST_0: 'SRC_HIST_0',
  HIST_1: 'SRC_HIST_1',
  HIST_2: 'SRC_HIST_2',
  HIST_3: 'SRC_HIST_3',
  HIST_CLEAR: 'SRC_HIST_CLEAR',

  // Right Panel: Typing State (Live Suggestions)
  SUG_0: 'SRC_SUG_0',
  SUG_1: 'SRC_SUG_1',
  SUG_2: 'SRC_SUG_2',
  SUG_3: 'SRC_SUG_3',
  SUG_4: 'SRC_SUG_4',
  SUG_ALL: 'SRC_SUG_ALL',

  // Screen 2: Results
  RES_BACK: 'RES_BACK',
  RES_VOICE: 'RES_VOICE',
  RES_EDIT: 'RES_EDIT',
  RES_CARD_PREFIX: 'RES_CARD_',
  RES_LIKE_PREFIX: 'RES_LIKE_',

  // Voice Overlay
  VOICE_BACK: 'VOICE_BACK',
  VOICE_CANCEL: 'VOICE_CANCEL',
} as const;

// 7-column keyboard matrix
export const KEYBOARD_ROWS = [
  ['KEY_A', 'KEY_B', 'KEY_C', 'KEY_D', 'KEY_E', 'KEY_F', 'KEY_G'],
  ['KEY_H', 'KEY_I', 'KEY_J', 'KEY_K', 'KEY_L', 'KEY_M', 'KEY_N'],
  ['KEY_O', 'KEY_P', 'KEY_Q', 'KEY_R', 'KEY_S', 'KEY_T', 'KEY_U'],
  ['KEY_V', 'KEY_W', 'KEY_X', 'KEY_Y', 'KEY_Z', 'KEY_1', 'KEY_2'],
  ['KEY_3', 'KEY_4', 'KEY_5', 'KEY_6', 'KEY_7', 'KEY_8', 'KEY_9'],
];

export interface SearchNavContext {
  subScreen: 'landing' | 'results';
  isVoiceOpen: boolean;
  hasQuery: boolean;
  historyCount: number;
  suggestionsCount: number;
  resultsCount: number;
}

/**
 * Deterministic Spatial D-Pad Navigation Graph for TV Song Search
 */
export function getSearchNextFocus(
  currentId: string,
  direction: DPadDirection,
  context: SearchNavContext
): string | null {
  const { subScreen, isVoiceOpen, hasQuery, historyCount, suggestionsCount, resultsCount } = context;

  // 1. VOICE OVERLAY
  if (isVoiceOpen) {
    if (currentId === SEARCH_FOCUS_IDS.VOICE_BACK) {
      if (direction === 'down') return SEARCH_FOCUS_IDS.VOICE_CANCEL;
      return null;
    }
    if (currentId === SEARCH_FOCUS_IDS.VOICE_CANCEL) {
      if (direction === 'up') return SEARCH_FOCUS_IDS.VOICE_BACK;
      return null;
    }
    return SEARCH_FOCUS_IDS.VOICE_BACK;
  }

  // 2. SCREEN 2: RESULTS
  if (subScreen === 'results') {
    // Top Bar
    if (currentId === SEARCH_FOCUS_IDS.RES_BACK) {
      if (direction === 'left') return 'NAV_SEARCH';
      if (direction === 'right') return SEARCH_FOCUS_IDS.RES_VOICE;
      if (direction === 'down' && resultsCount > 0) return 'RES_CARD_0';
      return null;
    }
    if (currentId === SEARCH_FOCUS_IDS.RES_VOICE) {
      if (direction === 'left') return SEARCH_FOCUS_IDS.RES_BACK;
      if (direction === 'right') return SEARCH_FOCUS_IDS.RES_EDIT;
      if (direction === 'down' && resultsCount > 0) return 'RES_CARD_0';
      return null;
    }
    if (currentId === SEARCH_FOCUS_IDS.RES_EDIT) {
      if (direction === 'left') return SEARCH_FOCUS_IDS.RES_VOICE;
      if (direction === 'down' && resultsCount > 0) return 'RES_CARD_0';
      return null;
    }

    // Results Card List (RES_CARD_0 .. RES_CARD_{N-1})
    if (currentId.startsWith(SEARCH_FOCUS_IDS.RES_CARD_PREFIX)) {
      const idx = parseInt(currentId.replace(SEARCH_FOCUS_IDS.RES_CARD_PREFIX, ''), 10);
      if (direction === 'up') {
        if (idx === 0) return SEARCH_FOCUS_IDS.RES_BACK;
        return `${SEARCH_FOCUS_IDS.RES_CARD_PREFIX}${idx - 1}`;
      }
      if (direction === 'down') {
        if (idx < resultsCount - 1) return `${SEARCH_FOCUS_IDS.RES_CARD_PREFIX}${idx + 1}`;
        return null;
      }
      if (direction === 'left') return 'NAV_SEARCH';
      if (direction === 'right') return `${SEARCH_FOCUS_IDS.RES_LIKE_PREFIX}${idx}`;
      return null;
    }

    // Results Like Button (RES_LIKE_0 .. RES_LIKE_{N-1})
    if (currentId.startsWith(SEARCH_FOCUS_IDS.RES_LIKE_PREFIX)) {
      const idx = parseInt(currentId.replace(SEARCH_FOCUS_IDS.RES_LIKE_PREFIX, ''), 10);
      if (direction === 'left') return `${SEARCH_FOCUS_IDS.RES_CARD_PREFIX}${idx}`;
      if (direction === 'up') {
        if (idx === 0) return SEARCH_FOCUS_IDS.RES_VOICE;
        return `${SEARCH_FOCUS_IDS.RES_LIKE_PREFIX}${idx - 1}`;
      }
      if (direction === 'down') {
        if (idx < resultsCount - 1) return `${SEARCH_FOCUS_IDS.RES_LIKE_PREFIX}${idx + 1}`;
        return null;
      }
      return null;
    }
    return SEARCH_FOCUS_IDS.RES_BACK;
  }

  // 3. SCREEN 1: SEARCH LANDING

  // Top Bar & Voice Button
  if (currentId === SEARCH_FOCUS_IDS.BACK) {
    if (direction === 'left') return 'NAV_SEARCH';
    if (direction === 'right') {
      return hasQuery
        ? (suggestionsCount > 0 ? SEARCH_FOCUS_IDS.SUG_0 : SEARCH_FOCUS_IDS.SUG_ALL)
        : (historyCount > 0 ? SEARCH_FOCUS_IDS.HIST_0 : null);
    }
    if (direction === 'down') return SEARCH_FOCUS_IDS.KEY_A;
    return null;
  }

  if (currentId === SEARCH_FOCUS_IDS.VOICE) {
    if (direction === 'left') return SEARCH_FOCUS_IDS.BACK;
    if (direction === 'right') {
      return hasQuery
        ? (suggestionsCount > 0 ? SEARCH_FOCUS_IDS.SUG_0 : SEARCH_FOCUS_IDS.SUG_ALL)
        : (historyCount > 0 ? SEARCH_FOCUS_IDS.HIST_0 : null);
    }
    if (direction === 'down') return SEARCH_FOCUS_IDS.KEY_D;
    if (direction === 'up') return SEARCH_FOCUS_IDS.BACK;
    return null;
  }

  // Keyboard Rows 1–5 (KEY_A .. KEY_9)
  for (let r = 0; r < KEYBOARD_ROWS.length; r++) {
    const row = KEYBOARD_ROWS[r];
    const c = row.indexOf(currentId);
    if (c !== -1) {
      // Horizontal
      if (direction === 'left') {
        if (c === 0) return 'NAV_SEARCH';
        return row[c - 1];
      }
      if (direction === 'right') {
        if (c === row.length - 1) {
          // Jump into right pane
          return getRightPaneTarget(r, hasQuery, suggestionsCount, historyCount);
        }
        return row[c + 1];
      }
      // Vertical
      if (direction === 'up') {
        if (r === 0) {
          return c < 4 ? SEARCH_FOCUS_IDS.BACK : SEARCH_FOCUS_IDS.VOICE;
        }
        return KEYBOARD_ROWS[r - 1][c];
      }
      if (direction === 'down') {
        if (r === KEYBOARD_ROWS.length - 1) {
          // Going down from row 5 (3..9) to row 6 (0, SPACE, DEL, SEARCH)
          if (c === 0) return SEARCH_FOCUS_IDS.KEY_0;
          if (c >= 1 && c <= 2) return SEARCH_FOCUS_IDS.KEY_SPACE;
          if (c >= 3 && c <= 4) return SEARCH_FOCUS_IDS.KEY_DEL;
          return SEARCH_FOCUS_IDS.KEY_SEARCH;
        }
        return KEYBOARD_ROWS[r + 1][c];
      }
    }
  }

  // Keyboard Row 6: KEY_0 (1 col), KEY_SPACE (2 cols), KEY_DEL (2 cols), KEY_SEARCH (2 cols)
  if (currentId === SEARCH_FOCUS_IDS.KEY_0) {
    if (direction === 'left') return 'NAV_SEARCH';
    if (direction === 'right') return SEARCH_FOCUS_IDS.KEY_SPACE;
    if (direction === 'up') return SEARCH_FOCUS_IDS.KEY_3;
    return null;
  }
  if (currentId === SEARCH_FOCUS_IDS.KEY_SPACE) {
    if (direction === 'left') return SEARCH_FOCUS_IDS.KEY_0;
    if (direction === 'right') return SEARCH_FOCUS_IDS.KEY_DEL;
    if (direction === 'up') return SEARCH_FOCUS_IDS.KEY_5;
    return null;
  }
  if (currentId === SEARCH_FOCUS_IDS.KEY_DEL) {
    if (direction === 'left') return SEARCH_FOCUS_IDS.KEY_SPACE;
    if (direction === 'right') return SEARCH_FOCUS_IDS.KEY_SEARCH;
    if (direction === 'up') return SEARCH_FOCUS_IDS.KEY_7;
    return null;
  }
  if (currentId === SEARCH_FOCUS_IDS.KEY_SEARCH) {
    if (direction === 'left') return SEARCH_FOCUS_IDS.KEY_DEL;
    if (direction === 'right') {
      return getRightPaneTarget(5, hasQuery, suggestionsCount, historyCount);
    }
    if (direction === 'up') return SEARCH_FOCUS_IDS.KEY_9;
    return null;
  }

  // RIGHT PANE: Empty State (History)
  if (!hasQuery) {
    // Recent Searches List (HIST_0 .. HIST_{N-1})
    if (currentId.startsWith('SRC_HIST_') && currentId !== SEARCH_FOCUS_IDS.HIST_CLEAR) {
      const idx = parseInt(currentId.replace('SRC_HIST_', ''), 10);
      if (direction === 'left') {
        const rowIdx = Math.min(idx, KEYBOARD_ROWS.length - 1);
        return KEYBOARD_ROWS[rowIdx][KEYBOARD_ROWS[rowIdx].length - 1];
      }
      if (direction === 'up') {
        if (idx === 0) return SEARCH_FOCUS_IDS.BACK;
        return `SRC_HIST_${idx - 1}`;
      }
      if (direction === 'down') {
        if (idx < historyCount - 1) return `SRC_HIST_${idx + 1}`;
        return SEARCH_FOCUS_IDS.HIST_CLEAR;
      }
      return null;
    }

    if (currentId === SEARCH_FOCUS_IDS.HIST_CLEAR) {
      if (direction === 'left') return SEARCH_FOCUS_IDS.KEY_SEARCH;
      if (direction === 'up') {
        return historyCount > 0 ? `SRC_HIST_${historyCount - 1}` : SEARCH_FOCUS_IDS.BACK;
      }
      return null;
    }
  }

  // RIGHT PANE: Typing State (Live Suggestions)
  if (hasQuery) {
    if (currentId.startsWith('SRC_SUG_') && currentId !== SEARCH_FOCUS_IDS.SUG_ALL) {
      const idx = parseInt(currentId.replace('SRC_SUG_', ''), 10);
      if (direction === 'left') return KEYBOARD_ROWS[Math.min(idx, 4)][6]; // Rightmost key
      if (direction === 'up') {
        if (idx === 0) return SEARCH_FOCUS_IDS.BACK;
        return `SRC_SUG_${idx - 1}`;
      }
      if (direction === 'down') {
        if (idx < suggestionsCount - 1) return `SRC_SUG_${idx + 1}`;
        return SEARCH_FOCUS_IDS.SUG_ALL;
      }
      return null;
    }

    if (currentId === SEARCH_FOCUS_IDS.SUG_ALL) {
      if (direction === 'left') return SEARCH_FOCUS_IDS.KEY_SEARCH;
      if (direction === 'up') {
        return suggestionsCount > 0 ? `SRC_SUG_${suggestionsCount - 1}` : SEARCH_FOCUS_IDS.BACK;
      }
      return null;
    }
  }

  return SEARCH_FOCUS_IDS.KEY_A;
}

function getRightPaneTarget(
  fromRow: number,
  hasQuery: boolean,
  suggestionsCount: number,
  historyCount: number
): string | null {
  if (hasQuery) {
    if (suggestionsCount === 0) return SEARCH_FOCUS_IDS.SUG_ALL;
    const targetIdx = Math.min(fromRow, suggestionsCount - 1);
    return `SRC_SUG_${targetIdx}`;
  } else {
    // Empty state: history items or clear button
    if (historyCount > 0) {
      if (fromRow < historyCount) {
        return `SRC_HIST_${fromRow}`;
      }
      return SEARCH_FOCUS_IDS.HIST_CLEAR;
    }
    return null;
  }
}
