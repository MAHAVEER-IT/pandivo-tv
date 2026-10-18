# AI DJ & Natural Language Intent Functions 🤖🎧

## Overview

The AI DJ subsystem translates spoken natural-language queries into structured music parameters, constructs smooth multi-track session arcs (balancing mood, energy trajectories, BPM, and variety), and generates contextual DJ voiceover commentary. It implements a multi-tiered failover: **Amazon Bedrock (Nova Lite)** as the primary cloud orchestrator, **Google Gemini (Flash)** as secondary cloud fallback, and deterministic **on-device keyword extraction** when offline.

- **Intent Parser:** [`FireTVMusicPOC/src/services/geminiIntentService.ts`](../../../src/services/geminiIntentService.ts)
- **Continuous DJ Engine:** [`FireTVMusicPOC/src/services/aiDjSessionService.ts`](../../../src/services/aiDjSessionService.ts)
- **Song Insight Engine:** [`FireTVMusicPOC/src/services/geminiSongInfoService.ts`](../../../src/services/geminiSongInfoService.ts)
- **Error Classifier:** [`FireTVMusicPOC/src/services/aiDjErrorService.ts`](../../../src/services/aiDjErrorService.ts)

---

## 1. `parseMusicIntent(userPrompt, options?)`

### Purpose:
Parses a spoken or typed user prompt (e.g., *"Play upbeat 90s rock for a workout"* or *"No sad songs, keep it high energy"*) into a strongly-typed `MusicIntent` schema containing target action, mood, energy, era constraints, duration, and steering modifications.

### Function Signature:
```typescript
export async function parseMusicIntent(
  userPrompt: string,
  options?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<MusicIntent>
```

### Parameters & Return Value:
| Parameter | Type | Description |
|---|---|---|
| `userPrompt` | `string` | Spoken phrase or user text input |
| `options.signal` | `AbortSignal?` | Optional cancellation signal for remote requests |
| `options.timeoutMs` | `number?` | Network timeout threshold (default ~4000ms) |
| **Returns** | `Promise<MusicIntent>` | Validated JSON intent containing mood, energy, era, duration |

### Simple Example:
```typescript
import { parseMusicIntent } from 'FireTVMusicPOC/src/services/geminiIntentService';

async function handleVoiceInput() {
  const userSpeech = "Play energetic 90s rock for a 45 minute workout";
  
  const intent = await parseMusicIntent(userSpeech);
  
  console.log('Action:', intent.action);       // 'create_playlist'
  console.log('Mood:', intent.mood);           // 'energetic'
  console.log('Energy:', intent.energy);       // 'high'
  console.log('Era:', intent.era_start, '-', intent.era_end); // 1990 - 1999
  console.log('Duration (min):', intent.duration_minutes);    // 45
}
```

---

## 2. `initDJSession(intent, catalog?)`

### Purpose:
Initializes a new `AIDJSession` from a parsed `MusicIntent`. It selects an initial starter track, computes an adaptive lookahead queue (e.g. 8–18 tracks depending on requested duration), calculates energy progression steps, and generates context-aware welcome DJ commentary.

### Function Signature:
```typescript
export function initDJSession(
  intent: MusicIntent,
  catalog: MusicTrack[] = TRACK_CATALOG
): AIDJSession
```

### Parameters & Return Value:
| Parameter | Type | Description |
|---|---|---|
| `intent` | `MusicIntent` | Parsed user intent from `parseMusicIntent` |
| `catalog` | `MusicTrack[]` | Available song catalog (bundled or USB) |
| **Returns** | `AIDJSession` | Active session state with starter track, lookahead queue, and commentary |

### Simple Example:
```typescript
import { initDJSession } from 'FireTVMusicPOC/src/services/aiDjSessionService';
import { parseMusicIntent } from 'FireTVMusicPOC/src/services/geminiIntentService';

async function launchDjMode(prompt: string) {
  const intent = await parseMusicIntent(prompt);
  const session = initDJSession(intent);

  console.log('Session ID:', session.id);
  console.log('Now Playing:', session.currentTrack.title);
  console.log('Upcoming Tracks:', session.queue.map(t => t.title));
  console.log('DJ Commentary:', session.djCommentary);
}
```

---

## 3. `advanceToNextTrack(session, catalog?)`

### Purpose:
Advances the AI DJ session when the active song finishes or the user presses Skip on the remote. It pops the next track from the lookahead queue, shifts historical tracks, updates the sliding window of recent artists (to prevent artist repetition), smoothly nudges current energy toward target energy, and replenishes the lookahead queue.

### Function Signature:
```typescript
export function advanceToNextTrack(
  session: AIDJSession,
  catalog: MusicTrack[] = TRACK_CATALOG
): AIDJSession
```

### Simple Example:
```typescript
import { advanceToNextTrack } from 'FireTVMusicPOC/src/services/aiDjSessionService';

function onSongFinished(currentSession: AIDJSession) {
  const updatedSession = advanceToNextTrack(currentSession);
  
  console.log('Now Playing Next:', updatedSession.currentTrack.title);
  console.log('Transition Commentary:', updatedSession.djCommentary);
  console.log('Remaining Seconds:', updatedSession.remainingSeconds);
}
```

---

## 4. `applyLiveDJCommand(session, commandIntent, catalog?)`

### Purpose:
Performs real-time steering of an active DJ session when the user gives a mid-playback voice command like *"Make it more energetic"*, *"No sad songs"*, or *"Slow things down"*. It recalculates target energy levels, appends exclusion filters, recalculates the lookahead queue, and returns updated DJ voiceover commentary.

### Function Signature:
```typescript
export function applyLiveDJCommand(
  session: AIDJSession,
  commandIntent: MusicIntent,
  catalog: MusicTrack[] = TRACK_CATALOG
): AIDJSession
```

### Simple Example:
```typescript
import { applyLiveDJCommand } from 'FireTVMusicPOC/src/services/aiDjSessionService';
import { parseMusicIntent } from 'FireTVMusicPOC/src/services/geminiIntentService';

async function steerActiveSession(activeSession: AIDJSession, voiceCommand: string) {
  const intent = await parseMusicIntent(voiceCommand);
  const steeredSession = applyLiveDJCommand(activeSession, intent);

  console.log('New Target Energy:', steeredSession.targetEnergyValue);
  console.log('Steering Action:', steeredSession.lastSteeringAction);
  console.log('DJ Response:', steeredSession.djCommentary);
}
```

---

## 5. `fetchOrGetSongInfo(track, playlistTitle?)`

### Purpose:
Retrieves deep musicological context, emotional vibe, and production highlights for the currently playing track. It implements in-memory caching keyed by `track.id` and request deduplication to prevent duplicate network calls if the user rapidly presses the remote's `INFO` button.

### Function Signature:
```typescript
export async function fetchOrGetSongInfo(
  track: PlaylistTrack,
  playlistTitle?: string
): Promise<SongAiInsight>
```

### Simple Example:
```typescript
import { fetchOrGetSongInfo } from 'FireTVMusicPOC/src/services/geminiSongInfoService';

async function displaySongDetails(track: PlaylistTrack) {
  // First call fetches from Bedrock/Gemini; immediate second call returns cached insight
  const insight = await fetchOrGetSongInfo(track);

  console.log('Summary:', insight.summary);
  console.log('Musical Style:', insight.musicalStyle);
  console.log('Mood & Vibe:', insight.moodAndVibe);
  console.log('Production Highlight:', insight.productionHighlight);
}
```

---

## 6. `classifyAIDJError(err?, intent?, candidateCount?)`

### Purpose:
Translates raw network exceptions, HTTP errors (429, 503), offline states, or empty catalog search results into safe, user-friendly 10-foot TV notifications. Guarantees that stack traces, API keys, or raw JSON errors are never exposed on the living-room display.

### Function Signature:
```typescript
export function classifyAIDJError(
  err?: any,
  intent?: MusicIntent | null,
  candidateCount?: number
): AIDJErrorInfo
```

### Simple Example:
```typescript
import { classifyAIDJError } from 'FireTVMusicPOC/src/services/aiDjErrorService';

try {
  // Simulating an unexpected network drop during voice intent evaluation
  throw new Error('Network timeout: connection reset by peer');
} catch (err) {
  const errorInfo = classifyAIDJError(err);
  
  // Safe TV presentation UI state
  console.log('Error Title:', errorInfo.title);             // "Connection issue"
  console.log('Supporting Text:', errorInfo.supportingText); // "We couldn't reach the AI service..."
}
```
