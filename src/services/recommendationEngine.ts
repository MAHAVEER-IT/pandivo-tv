import { TRACK_CATALOG, MusicTrack } from './musicCatalog';
import { MusicIntent } from './geminiIntentService';

export interface Playlist {
  title: string;
  description: string;
  tracks: MusicTrack[];
  totalDurationSeconds: number;
  totalDurationFormatted: string;
  trackCount: number;
  matchedCriteria: {
    mood?: string;
    energy?: string;
    targetDurationMinutes?: number;
    era?: string;
    genre?: string;
    context?: string;
  };
  isFallback: boolean;
  fallbackReason?: string;
  generatedAt: string;
}

export interface ScoredTrack {
  track: MusicTrack;
  score: number;
  breakdown: {
    moodMatch: number;
    energyMatch: number;
    genreMatch: number;
    eraMatch: number;
    contextMatch: number;
    similarity: number;
  };
}

/**
 * Format seconds to MM:SS string
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/**
 * Format total playlist duration (e.g. "29:42 • 8 tracks")
 */
export function formatPlaylistDuration(totalSeconds: number, trackCount: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs} • ${trackCount} track${trackCount === 1 ? '' : 's'}`;
}

/**
 * Helper to normalize moods and check semantic affinity
 */
function normalizeMood(mood?: string | null): string {
  if (!mood) return '';
  const m = mood.toLowerCase().trim();
  if (m === 'romantic' || m === 'romance' || m === 'love songs') return 'love';
  if (m === 'chill' || m === 'relaxing' || m === 'peaceful' || m === 'ambient' || m === 'sleep') return 'calm';
  if (m === 'workout' || m === 'gym' || m === 'running' || m === 'upbeat' || m === 'party') return 'energetic';
  if (m === 'melancholic' || m === 'heartbreak' || m === 'crying' || m === 'depressed') return 'sad';
  if (m === 'joyful' || m === 'feel-good' || m === 'summer') return 'happy';
  return m;
}

/**
 * Helper to check era matching
 */
function checkEraMatch(year: number, eraStart?: number | null, eraEnd?: number | null): number {
  if (!eraStart && !eraEnd) return 1.0;
  const start = eraStart || 1970;
  const end = eraEnd || 2026;

  if (year >= start && year <= end) {
    return 1.0;
  }
  // Proximity within 3 years
  if (year >= start - 3 && year <= end + 3) {
    return 0.5;
  }
  return 0.0;
}

/**
 * Helper to check genre matching
 */
function checkGenreMatch(track: MusicTrack, genreTarget?: string | null, genresTarget?: string[] | null): number {
  const targets: string[] = [];
  if (genreTarget) targets.push(genreTarget.toLowerCase());
  if (genresTarget && Array.isArray(genresTarget)) {
    genresTarget.forEach((g) => targets.push(g.toLowerCase()));
  }

  if (targets.length === 0) return 1.0;

  const trackGenre = track.genre.toLowerCase();
  const trackTags = track.tags.map((t) => t.toLowerCase());
  const trackVibe = track.vibe.toLowerCase();

  for (const t of targets) {
    if (trackGenre.includes(t) || t.includes(trackGenre)) return 1.0;
    if (trackTags.some((tag) => tag.includes(t) || t.includes(tag))) return 0.9;
    if (trackVibe.includes(t)) return 0.8;
  }

  return 0.0;
}

/**
 * Helper to check context match (e.g. workout, rainy_evening, studying)
 */
function checkContextMatch(track: MusicTrack, context?: string | null): number {
  if (!context) return 1.0;
  const ctx = context.toLowerCase().replace(/_/g, ' ');
  const trackVibe = track.vibe.toLowerCase();
  const trackTags = track.tags.map((t) => t.toLowerCase());

  if (trackVibe.includes(ctx)) return 1.0;
  if (trackTags.some((tag) => tag.includes(ctx) || ctx.includes(tag))) return 1.0;

  if (ctx.includes('workout') && track.energy === 'high') return 0.9;
  if (ctx.includes('rain') && (track.mood === 'calm' || track.mood === 'sad')) return 0.9;
  if (ctx.includes('study') && track.mood === 'calm') return 0.9;
  if (ctx.includes('relax') && track.mood === 'calm') return 0.9;

  return 0.1;
}

/**
 * Calculate multi-dimensional relevance score:
 * score =
 *     mood_match    × 0.30
 *   + energy_match  × 0.20
 *   + genre_match   × 0.15
 *   + era_match     × 0.15
 *   + context_match × 0.10
 *   + similarity    × 0.10
 */
export function calculateRelevanceScore(
  track: MusicTrack,
  intent: MusicIntent,
  currentTrack?: MusicTrack | null
): ScoredTrack {
  const normMood = normalizeMood(intent.mood);

  // 1. Mood match (0.30)
  let moodMatch = 0.0;
  if (!normMood) {
    moodMatch = 0.8; // neutral when unspecified
  } else if (track.mood === normMood) {
    moodMatch = 1.0;
  } else if (
    (normMood === 'calm' && track.mood === 'love') ||
    (normMood === 'energetic' && track.mood === 'happy') ||
    (normMood === 'love' && track.mood === 'calm')
  ) {
    moodMatch = 0.5;
  } else {
    moodMatch = 0.0;
  }

  // 2. Energy match (0.20)
  let energyMatch = 0.0;
  const targetEnergy = intent.modifications?.energy || intent.energy;
  if (!targetEnergy) {
    energyMatch = 0.8;
  } else if (track.energy === targetEnergy) {
    energyMatch = 1.0;
  } else if (
    (targetEnergy === 'high' && track.energy === 'medium') ||
    (targetEnergy === 'low' && track.energy === 'medium') ||
    (targetEnergy === 'medium' && track.energy !== 'medium')
  ) {
    energyMatch = 0.5;
  } else {
    energyMatch = 0.0; // direct opposite (low vs high)
  }

  // 3. Genre match (0.15)
  const genreMatch = checkGenreMatch(track, intent.genre, intent.genres);

  // 4. Era match (0.15)
  const eraMatch = checkEraMatch(track.year, intent.era_start, intent.era_end);

  // 5. Context match (0.10)
  const contextMatch = checkContextMatch(track, intent.context);

  // 6. Similarity (0.10)
  let similarity = 0.5;
  if (currentTrack) {
    if (track.id === currentTrack.id) {
      similarity = 0.0; // avoid duplicating currently playing track
    } else {
      let simPoints = 0;
      if (track.artist === currentTrack.artist) simPoints += 0.4;
      if (track.mood === currentTrack.mood) simPoints += 0.3;
      if (track.genre === currentTrack.genre) simPoints += 0.2;
      if (Math.abs(track.bpm - currentTrack.bpm) < 15) simPoints += 0.1;
      similarity = Math.min(1.0, simPoints);
    }
  }

  // Weighted sum
  const score =
    moodMatch * 0.30 +
    energyMatch * 0.20 +
    genreMatch * 0.15 +
    eraMatch * 0.15 +
    contextMatch * 0.10 +
    similarity * 0.10;

  return {
    track,
    score: Number(score.toFixed(4)),
    breakdown: {
      moodMatch,
      energyMatch,
      genreMatch,
      eraMatch,
      contextMatch,
      similarity,
    },
  };
}

/**
 * Filter candidates with Progressive Constraint Relaxation:
 * Stage 1: Exact matches (mood + era + energy + genre)
 * Stage 2: Relax energy
 * Stage 3: Relax era bounds (+- 5 years)
 * Stage 4: Relax genre
 * Stage 5: Broader recommendation
 */
export function filterCandidatesWithFallback(
  catalog: MusicTrack[],
  intent: MusicIntent,
  minTracksNeeded: number = 6
): { candidates: MusicTrack[]; isFallback: boolean; fallbackMessage?: string } {
  let pool = [...catalog];

  // Apply explicit exclusions first (e.g. "Remove sad songs")
  const excludeMoods = intent.modifications?.exclude_moods || [];
  if (excludeMoods.length > 0) {
    const normExcluded = excludeMoods.map((m) => normalizeMood(m));
    pool = pool.filter((t) => !normExcluded.includes(t.mood));
  }

  const normMood = normalizeMood(intent.mood);
  const targetEnergy = intent.modifications?.energy || intent.energy;
  const eraStart = intent.era_start;
  const eraEnd = intent.era_end;

  // STAGE 1: Exact constraint matching
  let stage1 = pool.filter((t) => {
    let match = true;
    if (normMood && t.mood !== normMood) match = false;
    if (targetEnergy && t.energy !== targetEnergy) match = false;
    if (eraStart && t.year < eraStart) match = false;
    if (eraEnd && t.year > eraEnd) match = false;
    if (intent.genre && !checkGenreMatch(t, intent.genre)) match = false;
    return match;
  });

  if (stage1.length >= minTracksNeeded) {
    return { candidates: stage1, isFallback: false };
  }

  // STAGE 2: Relax Energy constraint
  let stage2 = pool.filter((t) => {
    let match = true;
    if (normMood && t.mood !== normMood) match = false;
    if (eraStart && t.year < eraStart) match = false;
    if (eraEnd && t.year > eraEnd) match = false;
    if (intent.genre && !checkGenreMatch(t, intent.genre)) match = false;
    return match;
  });

  if (stage2.length >= minTracksNeeded) {
    return {
      candidates: stage2,
      isFallback: true,
      fallbackMessage: `Expanded energy levels to build a full playlist while preserving ${normMood || 'requested'} mood.`,
    };
  }

  // STAGE 3: Relax Era constraint (+- 8 years)
  let stage3 = pool.filter((t) => {
    let match = true;
    if (normMood && t.mood !== normMood) match = false;
    if (eraStart && t.year < eraStart - 8) match = false;
    if (eraEnd && t.year > eraEnd + 8) match = false;
    return match;
  });

  if (stage3.length >= minTracksNeeded) {
    return {
      candidates: stage3,
      isFallback: true,
      fallbackMessage: `Expanded era range slightly to include top-rated tracks matching ${normMood || 'your requested style'}.`,
    };
  }

  // STAGE 4: Relax Mood to related moods or broader energy match
  let stage4 = pool.filter((t) => {
    if (normMood) {
      if (t.mood === normMood) return true;
      if (normMood === 'calm' && t.energy === 'low') return true;
      if (normMood === 'energetic' && t.energy === 'high') return true;
      if (normMood === 'love' && (t.mood === 'calm' || t.mood === 'happy')) return true;
      return false;
    }
    return true;
  });

  if (stage4.length >= minTracksNeeded) {
    return {
      candidates: stage4,
      isFallback: true,
      fallbackMessage: `Couldn't find enough exact matches, so expanded with closely related tracks.`,
    };
  }

  // STAGE 5: Complete pool fallback
  return {
    candidates: pool.slice(0, 20),
    isFallback: true,
    fallbackMessage: `Curated best-rated selections from our catalog matching your vibe.`,
  };
}

/**
 * Duration Optimizer:
 * Assembles a realistic sequence of tracks approximating target duration in minutes
 * (e.g. target 30 min -> ~28-32 min, 8-9 tracks).
 * Applies variety filtering so the same artist is not scheduled back-to-back.
 */
export function optimizeDuration(
  scoredCandidates: ScoredTrack[],
  targetMinutes: number = 30
): MusicTrack[] {
  const targetSeconds = targetMinutes * 60;
  // Sort candidate tracks by relevance score descending
  const sorted = [...scoredCandidates].sort((a, b) => b.score - a.score);

  const playlist: MusicTrack[] = [];
  let currentTotal = 0;
  const artistCount: { [artist: string]: number } = {};

  for (const item of sorted) {
    const t = item.track;

    // Skip tracks longer than 8 minutes (480s) or 45% of requested playlist duration
    if (t.duration > 480 || (targetSeconds > 600 && t.duration > targetSeconds * 0.45)) {
      continue;
    }

    const count = artistCount[t.artist] || 0;

    // Avoid artist repeat back-to-back
    const lastTrack = playlist[playlist.length - 1];
    if (lastTrack && lastTrack.artist === t.artist) {
      continue;
    }

    // Cap artist occurrences at 2 per playlist for variety
    if (count >= 2) {
      continue;
    }

    playlist.push(t);
    currentTotal += t.duration;
    artistCount[t.artist] = count + 1;

    // Check if we reached target range (within 90 seconds or minimum track count)
    if (currentTotal >= targetSeconds - 90 && playlist.length >= 6) {
      break;
    }
    // Hard cap at 25 tracks or 1.1x duration to prevent runaway playlists
    if (playlist.length >= 25 || currentTotal >= targetSeconds * 1.1) {
      break;
    }
  }

  // If candidate pool was small, ensure we have at least 4 tracks
  if (playlist.length < 4 && sorted.length >= 4) {
    for (const item of sorted) {
      if (!playlist.some((p) => p.id === item.track.id)) {
        playlist.push(item.track);
        if (playlist.length >= 6) break;
      }
    }
  }

  return playlist;
}

/**
 * Generate Title for playlist
 */
function createPlaylistTitle(intent: MusicIntent, isFallback: boolean): string {
  if (intent.context) {
    const ctx = intent.context.replace(/_/g, ' ');
    return `${ctx.charAt(0).toUpperCase() + ctx.slice(1)} Session`;
  }
  if (intent.genre) {
    const g = intent.genre.charAt(0).toUpperCase() + intent.genre.slice(1);
    if (intent.mood) {
      return `${intent.mood.charAt(0).toUpperCase() + intent.mood.slice(1)} ${g}`;
    }
    return `${g} Collection`;
  }
  if (intent.era_start && intent.era_end) {
    return `${intent.era_start}s–${intent.era_end}s Flashback`;
  }
  if (intent.mood) {
    const m = intent.mood.charAt(0).toUpperCase() + intent.mood.slice(1);
    if (intent.energy === 'high') return `High Energy ${m}`;
    if (intent.energy === 'low') return `Calm & Gentle ${m}`;
    return `${m} Vibes`;
  }
  if (intent.energy === 'high') return 'High Energy Mix';
  if (intent.energy === 'low') return 'Chill Out Mix';
  return 'Personalized AI Mix';
}

/**
 * Main 6E Playlist Generation Engine
 */
export function generatePlaylist(
  intent: MusicIntent,
  catalog: MusicTrack[] = TRACK_CATALOG,
  currentTrack?: MusicTrack | null
): Playlist {
  const targetDurationMinutes = intent.duration_minutes || 30;

  // 1. Filter candidates with progressive fallback
  const { candidates, isFallback, fallbackMessage } = filterCandidatesWithFallback(
    catalog,
    intent,
    6
  );

  // 2. Score candidate tracks with multi-dimensional weighted scoring
  const scoredTracks = candidates.map((t) => calculateRelevanceScore(t, intent, currentTrack));

  // 3. Optimize duration and assemble final tracklist
  const selectedTracks = optimizeDuration(scoredTracks, targetDurationMinutes);

  // 4. Calculate total seconds
  const totalDurationSeconds = selectedTracks.reduce((sum, t) => sum + t.duration, 0);

  const title = createPlaylistTitle(intent, isFallback);
  const description = intent.reason || `Curated ${selectedTracks.length} tracks based on your voice request.`;

  return {
    title,
    description,
    tracks: selectedTracks,
    totalDurationSeconds,
    totalDurationFormatted: formatPlaylistDuration(totalDurationSeconds, selectedTracks.length),
    trackCount: selectedTracks.length,
    matchedCriteria: {
      mood: intent.mood || undefined,
      energy: (intent.modifications?.energy || intent.energy) || undefined,
      targetDurationMinutes,
      era: intent.era_start && intent.era_end ? `${intent.era_start}–${intent.era_end}` : undefined,
      genre: intent.genre || undefined,
      context: intent.context || undefined,
    },
    isFallback,
    fallbackReason: fallbackMessage,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Modify an existing playlist (e.g. "Remove sad songs", "Make it more energetic")
 */
export function modifyPlaylist(
  currentPlaylist: Playlist,
  modificationIntent: MusicIntent,
  catalog: MusicTrack[] = TRACK_CATALOG
): Playlist {
  let updatedTracks = [...currentPlaylist.tracks];
  let changesNote = '';

  // 1. Exclude moods (e.g. "Remove sad songs")
  const excludeMoods = modificationIntent.modifications?.exclude_moods || [];
  if (excludeMoods.length > 0) {
    const normExcluded = excludeMoods.map((m) => normalizeMood(m));
    const beforeCount = updatedTracks.length;
    updatedTracks = updatedTracks.filter((t) => !normExcluded.includes(t.mood));
    const removedCount = beforeCount - updatedTracks.length;
    changesNote += `Removed ${removedCount} ${excludeMoods.join(', ')} track${removedCount === 1 ? '' : 's'}. `;

    // Fill freed duration with matching replacement tracks
    const replacementPool = catalog.filter(
      (t) =>
        !normExcluded.includes(t.mood) &&
        !updatedTracks.some((existing) => existing.id === t.id)
    );
    const scoredReplacements = replacementPool
      .map((t) => calculateRelevanceScore(t, modificationIntent))
      .sort((a, b) => b.score - a.score);

    while (updatedTracks.length < currentPlaylist.trackCount && scoredReplacements.length > 0) {
      const best = scoredReplacements.shift();
      if (best) updatedTracks.push(best.track);
    }
  }

  // 2. Adjust energy (e.g. "Make it more energetic")
  const newEnergy = modificationIntent.modifications?.energy;
  if (newEnergy) {
    // Re-score all tracks with new energy preference
    const scoredCurrent = catalog
      .filter((t) => t.energy === newEnergy || t.energy === 'medium')
      .map((t) => calculateRelevanceScore(t, { ...modificationIntent, energy: newEnergy }))
      .sort((a, b) => b.score - a.score);

    updatedTracks = optimizeDuration(scoredCurrent, currentPlaylist.matchedCriteria.targetDurationMinutes || 30);
    changesNote += `Boosted energy level to ${newEnergy.toUpperCase()}. `;
  }

  const totalDurationSeconds = updatedTracks.reduce((sum, t) => sum + t.duration, 0);

  return {
    ...currentPlaylist,
    title: currentPlaylist.title + (newEnergy ? ` (${newEnergy.toUpperCase()})` : ' (Modified)'),
    description: changesNote + currentPlaylist.description,
    tracks: updatedTracks,
    totalDurationSeconds,
    totalDurationFormatted: formatPlaylistDuration(totalDurationSeconds, updatedTracks.length),
    trackCount: updatedTracks.length,
    matchedCriteria: {
      ...currentPlaylist.matchedCriteria,
      energy: newEnergy || currentPlaylist.matchedCriteria.energy,
    },
    generatedAt: new Date().toISOString(),
  };
}
