# Catalog Search & Recommendation Engine Functions 🔍🎯

## Overview

The Catalog Search & Recommendation subsystem provides sub-100ms full-text fuzzy and phonetic music search, smart voice-query stripping, and multi-dimensional recommendation scoring (mood, energy, era, genre, BPM compatibility, and artist anti-repetition rules).

- **Fuzzy Search Engine:** [`FireTVMusicPOC/src/services/elasticSearchEngine.ts`](../../src/services/elasticSearchEngine.ts)
- **Recommendation Engine:** [`FireTVMusicPOC/src/services/recommendationEngine.ts`](../../src/services/recommendationEngine.ts)
- **Track Catalog:** [`FireTVMusicPOC/src/services/musicCatalog.ts`](../../src/services/musicCatalog.ts)
- **Audius Open Catalog:** [`FireTVMusicPOC/src/data/generatedAudiusCatalog.ts`](../../src/data/generatedAudiusCatalog.ts)

---

## 1. `searchPlaylistTracksElastic(tracks, rawQuery)`

### Purpose:
Executes an Elasticsearch-inspired search across song titles, artists, and album names. Applies multi-field boosting (Title: `1.35x`, Artist: `0.85x`, Album: `0.65x`), N-gram bigram similarity, diacritic stripping, and phonetic matching to overcome voice STT spelling mistakes (e.g. *"bukas"* matches *"boukas"*, *"cielo de azucar"* matches *"Cielo De Azúcar"*).

### Function Signature:
```typescript
export function searchPlaylistTracksElastic(
  tracks: PlaylistTrack[],
  rawQuery: string
): ElasticPlaylistSearchResult
```

### Return Data Structure:
```typescript
export interface ElasticPlaylistSearchResult {
  query: string;
  cleanedQuery: string;
  matches: ElasticTrackMatch[];
  tracks: PlaylistTrack[];
  topMatch: PlaylistTrack | null;
  isFuzzyCorrected: boolean;
  correctedToTitle: string | null;
}
```

### Simple Example:
```typescript
import { searchPlaylistTracksElastic } from 'FireTVMusicPOC/src/services/elasticSearchEngine';
import { PLAYLISTS } from 'FireTVMusicPOC/src/data/playlistData';

function findSongs(spokenQuery: string) {
  const allTracks = PLAYLISTS.chill_vibes.tracks;
  
  // User says "play boukas" with voice filler or spelling errors
  const result = searchPlaylistTracksElastic(allTracks, spokenQuery);

  console.log('Top Match:', result.topMatch?.title); // "Breeze" by Boukas
  console.log('Total Results:', result.tracks.length);
  console.log('Fuzzy Corrected:', result.isFuzzyCorrected);
}
```

---

## 2. `cleanSpeechToTextQuery(rawQuery)`

### Purpose:
Cleans speech-to-text transcripts by stripping conversational filler prefixes (*"hey pandivo"*, *"play song"*, *"search for"*, *"can you put on"*) while protecting actual song titles that legitimately start with those words.

### Function Signature:
```typescript
export function cleanSpeechToTextQuery(rawQuery: string): string
```

### Simple Example:
```typescript
import { cleanSpeechToTextQuery } from 'FireTVMusicPOC/src/services/elasticSearchEngine';

const rawVoice1 = "Hey Pandivo play Boukas Breeze";
console.log(cleanSpeechToTextQuery(rawVoice1)); // "Boukas Breeze"

const rawVoice2 = "Search for relaxing chillhop music";
console.log(cleanSpeechToTextQuery(rawVoice2)); // "relaxing chillhop music"
```

---

## 3. `calculateRelevanceScore(track, intent, currentTrack?)`

### Purpose:
Calculates a multi-dimensional relevance score (0.0 to 1.0) evaluating how well a track fits the user's intent. Evaluates:
- Mood Match: `30%` weight
- Energy Match: `20%` weight
- Genre Match: `15%` weight
- Era / Release Year Match: `15%` weight
- Context Match (e.g. workout, bedtime): `10%` weight
- BPM / Sonic Similarity to current track: `10%` weight

### Function Signature:
```typescript
export function calculateRelevanceScore(
  track: MusicTrack,
  intent: MusicIntent,
  currentTrack?: MusicTrack | null
): ScoredTrack
```

### Simple Example:
```typescript
import { calculateRelevanceScore } from 'FireTVMusicPOC/src/services/recommendationEngine';
import { TRACK_CATALOG } from 'FireTVMusicPOC/src/services/musicCatalog';

const testTrack = TRACK_CATALOG[0];
const targetIntent = {
  action: 'create_playlist' as const,
  mood: 'calm',
  energy: 'low' as const,
  confidence: 0.95,
  reason: 'User requested bedtime calm songs',
};

const scored = calculateRelevanceScore(testTrack, targetIntent);
console.log('Track:', scored.track.title);
console.log('Score:', scored.score); // e.g. 0.8850
console.log('Breakdown:', scored.breakdown);
```

---

## 4. `filterCandidatesWithFallback(catalog, intent, minTracksNeeded?)`

### Purpose:
Applies **Progressive Constraint Relaxation** to prevent returning zero search results:
- **Stage 1**: Strict exact match (mood + era + energy + genre).
- **Stage 2**: Relax energy constraint if candidate pool < `minTracksNeeded`.
- **Stage 3**: Relax era bounds (+/- 8 years).
- **Stage 4**: Relax genre requirements while preserving core emotional mood.

### Function Signature:
```typescript
export function filterCandidatesWithFallback(
  catalog: MusicTrack[],
  intent: MusicIntent,
  minTracksNeeded: number = 6
): { candidates: MusicTrack[]; isFallback: boolean; fallbackMessage?: string }
```

### Simple Example:
```typescript
import { filterCandidatesWithFallback } from 'FireTVMusicPOC/src/services/recommendationEngine';
import { TRACK_CATALOG } from 'FireTVMusicPOC/src/services/musicCatalog';

const tightIntent = {
  action: 'create_playlist' as const,
  genre: 'hyperpop', // Very rare or limited in bundled catalog
  mood: 'energetic',
  confidence: 0.8,
  reason: 'Rare genre search',
};

const result = filterCandidatesWithFallback(TRACK_CATALOG, tightIntent, 6);
console.log('Candidate Count:', result.candidates.length);
console.log('Did Engine Fallback:', result.isFallback);
if (result.isFallback) {
  console.log('Reason:', result.fallbackMessage);
}
```

---

## 5. `generatePlaylist(intent, catalog?, currentTrack?)`

### Purpose:
End-to-end playlist assembler. Applies candidate filtering, multi-dimensional scoring, duration optimization (assembling ~30–75 minutes of music), and anti-repetition rules (no back-to-back artist repeats, max 2 tracks per artist). Produces a complete `Playlist` object ready for playback.

### Function Signature:
```typescript
export function generatePlaylist(
  intent: MusicIntent,
  catalog: MusicTrack[] = TRACK_CATALOG,
  currentTrack?: MusicTrack | null
): Playlist
```

### Simple Example:
```typescript
import { generatePlaylist } from 'FireTVMusicPOC/src/services/recommendationEngine';
import { parseMusicIntent } from 'FireTVMusicPOC/src/services/geminiIntentService';

async function buildAiMix(speech: string) {
  const intent = await parseMusicIntent(speech);
  const playlist = generatePlaylist(intent);

  console.log('Playlist Title:', playlist.title); // e.g. "High Energy Workout Session"
  console.log('Total Duration:', playlist.totalDurationFormatted); // e.g. "31:40 • 8 tracks"
  console.log('Track Titles:', playlist.tracks.map(t => t.title));
}
```
