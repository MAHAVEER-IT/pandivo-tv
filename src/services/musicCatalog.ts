import { AUDIUS_CURATED_TRACKS } from './audiusMusicService';

const tracksData = require('../../assets/data/tracks.json');

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  year: number;
  era: '70s' | '80s' | '90s' | '2000s' | '2010s' | '2020s';
  mood: 'love' | 'sad' | 'calm' | 'energetic' | 'happy';
  energy: 'low' | 'medium' | 'high';
  bpm: number;
  vibe: string;
  genre: string;
  audioUrl: string;
  artworkUrl: string;
  duration: number;
  tags: string[];
}

const audiusAllCurated: MusicTrack[] = [
  ...AUDIUS_CURATED_TRACKS.chill_vibes,
  ...AUDIUS_CURATED_TRACKS.focus_mix,
  ...AUDIUS_CURATED_TRACKS.workout_mix,
  ...AUDIUS_CURATED_TRACKS.study_mix,
  ...AUDIUS_CURATED_TRACKS.energize_morning,
];

export const TRACK_CATALOG: MusicTrack[] = [
  ...audiusAllCurated,
  ...(tracksData as MusicTrack[]),
];

export interface MusicFilterCriteria {
  mood?: 'love' | 'sad' | 'calm' | 'energetic' | 'happy';
  era?: '70s' | '80s' | '90s' | '2000s' | '2010s' | '2020s';
  energy?: 'low' | 'medium' | 'high';
  query?: string;
}

/**
 * Filter tracks based on user query or AI session parameters
 */
export function filterTracks(criteria: MusicFilterCriteria): MusicTrack[] {
  let filtered = [...TRACK_CATALOG];

  if (criteria.mood) {
    filtered = filtered.filter((t) => t.mood === criteria.mood);
  }

  if (criteria.era) {
    filtered = filtered.filter((t) => t.era === criteria.era);
  }

  if (criteria.energy) {
    filtered = filtered.filter((t) => t.energy === criteria.energy);
  }

  if (criteria.query) {
    const q = criteria.query.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.vibe.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }

  return filtered;
}

/**
 * Match best track from Gemini AI session output
 */
export function matchTrackForAISession(session: {
  energy?: string;
  mood?: string;
  theme?: string;
}): MusicTrack {
  // Try exact match on energy and mood/theme keywords
  const themeLower = (session.theme || '').toLowerCase();

  let candidates = TRACK_CATALOG.filter((t) => {
    let match = true;
    if (session.energy && t.energy !== session.energy.toLowerCase()) {
      match = false;
    }
    return match;
  });

  if (candidates.length === 0) {
    candidates = TRACK_CATALOG;
  }

  // Prioritize tracks matching theme keywords
  if (themeLower) {
    const themeMatches = candidates.filter(
      (t) =>
        themeLower.includes(t.mood) ||
        themeLower.includes(t.era) ||
        t.vibe.toLowerCase().includes(themeLower) ||
        t.title.toLowerCase().includes(themeLower)
    );
    if (themeMatches.length > 0) {
      return themeMatches[Math.floor(Math.random() * themeMatches.length)];
    }
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}
