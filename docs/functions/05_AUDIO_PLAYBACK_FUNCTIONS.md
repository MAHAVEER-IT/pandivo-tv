# Audio Playback & Remote Controller Functions 🎵🎛️

## Overview

The Audio Playback engine powers gapless audio streaming, D-pad scrubber seeking, true Fisher-Yates random shuffle queues, and living-room fullscreen transitions on Android TV / Fire OS. It orchestrates hardware audio sessions via `expo-audio` while automatically recording playback events to local SQLite.

- **Playback Context & Queue:** [`FireTVMusicPOC/src/context/PlaybackContext.tsx`](../../src/context/PlaybackContext.tsx)
- **Fullscreen Controller:** [`FireTVMusicPOC/src/hooks/useFullscreenController.ts`](../../src/hooks/useFullscreenController.ts)
- **Music Catalog Data:** [`FireTVMusicPOC/src/services/musicCatalog.ts`](../../src/services/musicCatalog.ts)
- **Playlist Definitions:** [`FireTVMusicPOC/src/data/playlistData.ts`](../../src/data/playlistData.ts)

---

## 1. `handlePlayTrack(track)`

### Purpose:
Sets the active track, loads the remote audio stream into `expo-audio`, triggers immediate playback at full volume, records the track into SQLite `playback_history`, adds the track to the recently played cache, and displays a 10-foot TV HUD toast.

### Function Signature:
```typescript
export function handlePlayTrack(track: MusicTrack): void
```

### Simple Example:
```typescript
import { usePlayback } from 'FireTVMusicPOC/src/context';
import { TRACK_CATALOG } from 'FireTVMusicPOC/src/services/musicCatalog';

function PlayTrackButton() {
  const { handlePlayTrack } = usePlayback();

  const playFirstSong = () => {
    const selected = TRACK_CATALOG[0];
    handlePlayTrack(selected);
  };

  return <button onClick={playFirstSong}>Play Track</button>;
}
```

---

## 2. `handleTogglePlayPause()`

### Purpose:
Toggles between playing and paused states. Responds to the Fire TV remote's physical `MEDIA_PLAY_PAUSE` button, D-pad Center click on the player chassis, or Voice commands.

### Function Signature:
```typescript
export function handleTogglePlayPause(): void
```

### Simple Example:
```typescript
import { usePlayback } from 'FireTVMusicPOC/src/context';

function PlayPauseButton() {
  const { handleTogglePlayPause, playerStatus } = usePlayback();

  return (
    <button onClick={handleTogglePlayPause}>
      {playerStatus?.playing ? '⏸ Pause' : '▶ Play'}
    </button>
  );
}
```

---

## 3. `handleSeekDelta(deltaSeconds)`

### Purpose:
Performs smooth, debounced audio scrubbing when the user presses Left or Right on the D-pad scrubber or holds the remote's Fast-Forward/Rewind buttons. Uses an internal 180ms throttle window to prevent audio pipeline stuttering during rapid clicks.

### Function Signature:
```typescript
export function handleSeekDelta(deltaSeconds: number): void
```

### Parameters:
| Parameter | Type | Description |
|---|---|---|
| `deltaSeconds` | `number` | Offset in seconds (e.g. `+10` to jump ahead 10s, `-10` to rewind 10s) |

### Simple Example:
```typescript
import { usePlayback } from 'FireTVMusicPOC/src/context';

function RemoteScrubberControls() {
  const { handleSeekDelta } = usePlayback();

  // Jump forward 15 seconds
  const fastForward = () => handleSeekDelta(15);

  // Jump backward 15 seconds
  const rewind = () => handleSeekDelta(-15);

  return (
    <div>
      <button onClick={rewind}>⏪ -15s</button>
      <button onClick={fastForward}>⏩ +15s</button>
    </div>
  );
}
```

---

## 4. `handleToggleShuffle()`

### Purpose:
Toggles random shuffle playback mode using the **Fisher-Yates (Knuth)** shuffle algorithm. When enabled, it anchors the currently playing song at index 0 and randomizes the remaining playlist items without duplicates. When toggled off, it cleanly restores sequential album/playlist order.

### Function Signature:
```typescript
export function handleToggleShuffle(): void
```

### Simple Example:
```typescript
import { usePlayback } from 'FireTVMusicPOC/src/context';

function ShuffleWidget() {
  const { handleToggleShuffle, isShuffleActive, shuffledTrackIds } = usePlayback();

  return (
    <div>
      <button onClick={handleToggleShuffle}>
        🔀 Shuffle: {isShuffleActive ? 'ON' : 'OFF'}
      </button>
      {isShuffleActive && <span>Queue length: {shuffledTrackIds.length}</span>}
    </div>
  );
}
```

---

## 5. `handlePlayNext()` & `handlePlayPrev()`

### Purpose:
Skips to the next or previous track. If shuffle mode is active, advances along the randomized Fisher-Yates queue; otherwise, moves to the adjacent track in sequential order with boundary looping.

### Function Signatures:
```typescript
export function handlePlayNext(): void
export function handlePlayPrev(): void
```

### Simple Example:
```typescript
import { usePlayback } from 'FireTVMusicPOC/src/context';

function SkipControls() {
  const { handlePlayNext, handlePlayPrev } = usePlayback();

  return (
    <div>
      <button onClick={handlePlayPrev}>⏮ Previous</button>
      <button onClick={handlePlayNext}>⏭ Next</button>
    </div>
  );
}
```

---

## 6. `handleToggleFullscreen()`

### Purpose:
Smoothly transitions between the compact Mini Player / screen view and the immersive 10-foot living-room Fullscreen visualizer. Captures the previous focus target so returning from fullscreen returns focus to the exact originating UI element.

### Function Signature:
```typescript
export function handleToggleFullscreen(): void
```

### Simple Example:
```typescript
import { useFullscreenController } from 'FireTVMusicPOC/src/hooks/useFullscreenController';

function FullscreenToggleTrigger(props: any) {
  const { isFullscreenPlayer, handleToggleFullscreen } = useFullscreenController(props);

  return (
    <button onClick={handleToggleFullscreen}>
      {isFullscreenPlayer ? '🗗 Minimize' : '⛶ Fullscreen'}
    </button>
  );
}
```
