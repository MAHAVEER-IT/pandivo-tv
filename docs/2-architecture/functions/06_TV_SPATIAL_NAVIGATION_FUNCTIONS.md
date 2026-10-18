# TV Spatial Navigation & D-Pad State Machine Functions 🎮🧭

## Overview

Unlike touchscreens or mouse pointers, Android TV and Fire TV rely entirely on directional D-pad controls (`LEFT`, `RIGHT`, `UP`, `DOWN`, `CENTER`, `BACK`). Pandivo TV uses deterministic, mathematical state machines across each page to guarantee that remote focus is never lost ("focus trap"), carousels scroll into view smoothly, and spatial context is restored when dismissing overlays.

- **Master Navigation Controller:** [`FireTVMusicPOC/src/hooks/useNavigationController.ts`](../../../src/hooks/useNavigationController.ts)
- **Playlist Navigation Graph:** [`FireTVMusicPOC/src/navigation/playlistNavGraph.ts`](../../../src/navigation/playlistNavGraph.ts)
- **Library Navigation Graph:** [`FireTVMusicPOC/src/navigation/libraryNavGraph.ts`](../../../src/navigation/libraryNavGraph.ts)
- **AI DJ Navigation Graph:** [`FireTVMusicPOC/src/navigation/aiDjNavGraph.ts`](../../../src/navigation/aiDjNavGraph.ts)
- **Search Navigation Graph:** [`FireTVMusicPOC/src/navigation/searchNavGraph.ts`](../../../src/navigation/searchNavGraph.ts)
- **Fullscreen Navigation Graph:** [`FireTVMusicPOC/src/navigation/fullscreenNavGraph.ts`](../../../src/navigation/fullscreenNavGraph.ts)

---

## 1. `getHomeNextFocus(currentId, direction)`

### Purpose:
Calculates the next target element when the user navigates the Home Screen. Handles transitions across the vertical hierarchy: Left Collapsible Nav Rail (`NAV_*`), Top Header Bar (`HDR_*`), Hero Banner (`HERO_*`), Recently Played horizontal carousel (`REC_*`), and For You Mixes (`MIX_*`).

### Function Signature:
```typescript
export function getHomeNextFocus(
  currentId: string,
  direction: DPadDirection
): string | null
```

### Simple Example:
```typescript
import { useNavigationController } from 'FireTVMusicPOC/src/hooks/useNavigationController';

function simulateRemoteMove(controller: any) {
  // User is currently focusing the AI Voice Hero button and presses DOWN
  const current = 'HERO_VOICE';
  const next = controller.getHomeNextFocus(current, 'down');

  console.log('Next Focus Target:', next); // Moves to 'REC_0' (first recent song) or 'MIX_0'
}
```

---

## 2. `getPlaylistNextFocus(currentId, direction, tracks, playerOriginTrackId?, isUsbPlaylist?)`

### Purpose:
Manages D-pad movement inside the Playlist Detail Screen between the left collapsible drawer, playlist action pills (`PL_PLAY_ALL`, `PL_SHUFFLE`, `PL_FAV`), the vertical track listing (`TRK_0` ... `TRK_N`), and the mini-player control strip. Remembers the user's `playerOriginTrackId` so pressing Left from the player returns focus directly to the originating track.

### Function Signature:
```typescript
export function getPlaylistNextFocus(
  currentId: string,
  direction: DPadDirection,
  tracks: PlaylistTrack[],
  playerOriginTrackId?: string | null,
  isUsbPlaylist: boolean = false
): string | null
```

### Simple Example:
```typescript
import { getPlaylistNextFocus } from 'FireTVMusicPOC/src/navigation/playlistNavGraph';
import { PLAYLISTS } from 'FireTVMusicPOC/src/data/playlistData';

const tracks = PLAYLISTS.chill_vibes.tracks;

// From the first track, pressing UP moves to the Play All pill
const nextUp = getPlaylistNextFocus('TRK_t1', 'up', tracks);
console.log('From TRK_t1 UP:', nextUp); // 'PL_PLAY_ALL'

// From the Play All pill, pressing RIGHT moves to the Shuffle pill
const nextRight = getPlaylistNextFocus('PL_PLAY_ALL', 'right', tracks);
console.log('From PL_PLAY_ALL RIGHT:', nextRight); // 'PL_SHUFFLE'
```

---

## 3. `getLibraryNextFocus(currentId, direction)`

### Purpose:
Navigates the 3x2 grid of curated mood playlists (`LIB_CARD_CHILL`, `LIB_CARD_FOCUS`, `LIB_CARD_WORKOUT`, `LIB_CARD_STUDY`, `LIB_CARD_ENERGIZE`, `LIB_CARD_MIDNIGHT`) and the dedicated bottom USB drive card (`LIB_CARD_USB`).

### Function Signature:
```typescript
export function getLibraryNextFocus(
  currentId: string,
  direction: DPadDirection
): string | null
```

### Simple Example:
```typescript
import { getLibraryNextFocus, LIBRARY_CARD_IDS } from 'FireTVMusicPOC/src/navigation/libraryNavGraph';

// Moving RIGHT from Chill Vibes moves across to Focus Mix
const rightTarget = getLibraryNextFocus(LIBRARY_CARD_IDS.CHILL, 'right');
console.log('Chill -> Right:', rightTarget); // 'LIB_CARD_FOCUS'

// Moving DOWN from Energize moves to the USB card
const downTarget = getLibraryNextFocus(LIBRARY_CARD_IDS.ENERGIZE, 'down');
console.log('Energize -> Down:', downTarget); // 'LIB_CARD_USB'
```

---

## 4. `getAiDjNextFocus(currentFocus, direction, cardsCount?, isListening?)`

### Purpose:
Controls focus within the AI DJ screen. When voice recording is active (`isListening: true`), pressing UP or RIGHT routes focus straight to the `AI_DJ_CANCEL_MIC` button. When idle, DOWN moves focus to generated AI playlist cards (`AI_DJ_CARD_*`).

### Function Signature:
```typescript
export function getAiDjNextFocus(
  currentFocus: string,
  direction: DPadDirection,
  cardsCount: number = 0,
  isListening: boolean = false
): string | null
```

### Simple Example:
```typescript
import { getAiDjNextFocus, AI_DJ_FOCUS_IDS } from 'FireTVMusicPOC/src/navigation/aiDjNavGraph';

// When listening is active, pressing UP cancels microphone capture
const cancelTarget = getAiDjNextFocus(AI_DJ_FOCUS_IDS.MIC, 'up', 4, true);
console.log('Listening Active UP:', cancelTarget); // 'AI_DJ_CANCEL_MIC'

// When idle, pressing DOWN navigates into the generated AI playlist cards
const cardTarget = getAiDjNextFocus(AI_DJ_FOCUS_IDS.MIC, 'down', 4, false);
console.log('Idle DOWN:', cardTarget); // 'AI_DJ_CARD_0'
```

---

## 5. `getSearchNextFocus(currentFocus, direction, context)`

### Purpose:
Calculates navigation on the Search Screen across the 7-column on-screen virtual keyboard matrix (`KEY_A` to `KEY_SEARCH`), speech search button (`SRC_VOICE`), search history pills (`SRC_HIST_*`), live autocomplete suggestions (`SRC_SUG_*`), and search result cards (`RES_CARD_*`).

### Function Signature:
```typescript
export function getSearchNextFocus(
  currentFocus: string,
  direction: DPadDirection,
  context: SearchNavContext
): string | null
```

### Simple Example:
```typescript
import { getSearchNextFocus } from 'FireTVMusicPOC/src/navigation/searchNavGraph';

const searchContext = {
  subScreen: 'landing' as const,
  isVoiceOpen: false,
  hasQuery: false,
  historyCount: 3,
  suggestionsCount: 0,
  resultsCount: 0,
};

// From the rightmost key 'KEY_G' in Row 1, pressing RIGHT jumps to the first History pill
const next = getSearchNextFocus('KEY_G', 'right', searchContext);
console.log('From KEY_G RIGHT:', next); // 'SRC_HIST_0'
```

---

## 6. Self-Healing Focus Restoration

### Purpose:
If a screen re-renders, a playlist is deleted, or an overlay is dismissed leaving `focusedId` pointing to an unmounted element, the navigation controller automatically heals focus to the nearest visible container default (e.g. `'HERO_VOICE'`, `'NAV_HOME'`, or `'PL_PLAY_ALL'`).

### Simple Example:
```typescript
// Fallback guard used across TV remote handlers
function sanitizeFocus(candidateId: string | null, fallbackId: string = 'HERO_VOICE'): string {
  if (!candidateId || candidateId.trim() === '') {
    console.warn(`Focus lost! Self-healing to default: ${fallbackId}`);
    return fallbackId;
  }
  return candidateId;
}
```
