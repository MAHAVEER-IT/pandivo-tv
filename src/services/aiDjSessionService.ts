import { TRACK_CATALOG, MusicTrack } from './musicCatalog';
import { MusicIntent } from './geminiIntentService';
import { fetchBedrockDjCommentary } from './awsBackendService';

export interface AIDJSession {
  id: string;
  isActive: boolean;
  totalDurationMinutes: number;
  remainingSeconds: number;

  // Session Preferences
  targetMood: string;
  targetEnergyLevel: 'low' | 'medium' | 'high';
  currentEnergyValue: number; // 0.0 (very low) to 1.0 (very high)
  targetEnergyValue: number;  // 0.0 to 1.0
  excludedMoods: string[];
  preferredGenres: string[];
  preferredEraStart?: number;
  preferredEraEnd?: number;

  // Real-time Playback State
  currentTrack: MusicTrack;
  queue: MusicTrack[]; // Lookahead queue (next 2-3 tracks)
  history: MusicTrack[]; // Tracks played in this session
  playedTrackIds: Set<string>;
  recentArtists: string[]; // Sliding window of last 3 artists

  // DJ Commentary
  djCommentary: string;
  lastSteeringAction?: string;
  startedAt: string;
}

/**
 * Convert energy string to numerical energy value (0.0 to 1.0)
 */
export function energyToNumeric(level?: 'low' | 'medium' | 'high' | string | null): number {
  switch (level?.toLowerCase()) {
    case 'high':
      return 0.85;
    case 'medium':
      return 0.55;
    case 'low':
      return 0.25;
    default:
      return 0.55;
  }
}

/**
 * Convert numerical energy value back to category
 */
export function numericToEnergyCategory(value: number): 'low' | 'medium' | 'high' {
  if (value >= 0.7) return 'high';
  if (value <= 0.4) return 'low';
  return 'medium';
}

/**
 * Generate context-aware DJ commentary for session events
 */
export function generateDJCommentary(
  event: 'start' | 'transition' | 'steer_energy_up' | 'steer_energy_down' | 'steer_exclude_sad' | 'steer_similar',
  session: {
    targetMood?: string;
    currentEnergyValue?: number;
    currentTrack?: MusicTrack;
    nextTrack?: MusicTrack;
  }
): string {
  const nextTrk = session.nextTrack;
  const currentTrk = session.currentTrack;

  switch (event) {
    case 'start':
      if (session.targetMood === 'energetic') {
        return `Welcome to your AI DJ session. We're launching into high gear with "${nextTrk?.title}" by ${nextTrk?.artist}. Let's build the momentum.`;
      }
      if (session.targetMood === 'calm' || session.targetMood === 'chill') {
        return `Setting the mood for a calm, relaxed session. Kicking things off with gentle acoustic vibes from "${nextTrk?.title}".`;
      }
      return `Your AI DJ is locked in. Starting your session with "${nextTrk?.title}" by ${nextTrk?.artist}.`;

    case 'transition':
      if (!nextTrk) return 'Continuing your session.';
      if (currentTrk && nextTrk.artist === currentTrk.artist) {
        return `Double shot of ${nextTrk.artist} coming up next with "${nextTrk.title}".`;
      }
      if (nextTrk.energy === 'high') {
        return `Keeping the intensity dialed up. Next up is "${nextTrk.title}" by ${nextTrk.artist}.`;
      }
      if (nextTrk.energy === 'low') {
        return `Bringing the intensity down smoothly for "${nextTrk.title}" by ${nextTrk.artist}.`;
      }
      return `Flowing smoothly into "${nextTrk.title}" by ${nextTrk.artist}.`;

    case 'steer_energy_up':
      return `Got it! Raising the tempo and energy curve for the upcoming tracks. Next up: "${nextTrk?.title}".`;

    case 'steer_energy_down':
      return `Understood. Easing back the tempo and mellowing out the groove. Next up: "${nextTrk?.title}".`;

    case 'steer_exclude_sad':
      return `No sad songs — you got it! Purged melancholic tracks from the queue. Only uplifting and energetic vibes ahead.`;

    case 'steer_similar':
      return `Locked onto the vibe of "${currentTrk?.title}". Spinning closely matched tracks with similar tempo and texture.`;

    default:
      return 'Session in progress.';
  }
}

/**
 * Asynchronously generates charismatic spoken DJ commentary via Amazon Bedrock (Nova Lite),
 * seamlessly falling back to synchronous templates on timeout or network loss.
 */
export async function generateLiveBedrockDJCommentary(
  event: 'start' | 'transition' | 'steer_energy_up' | 'steer_energy_down' | 'steer_exclude_sad' | 'steer_similar',
  session: {
    targetMood?: string;
    currentEnergyValue?: number;
    currentTrack?: MusicTrack;
    nextTrack?: MusicTrack;
  }
): Promise<string> {
  try {
    const bedrockResponse = await fetchBedrockDjCommentary(
      event,
      session.targetMood || 'chill',
      session.currentEnergyValue ?? 0.5,
      session.currentTrack,
      session.nextTrack,
      3000
    );

    if (bedrockResponse && bedrockResponse.commentary) {
      console.log(`[AI DJ] Live commentary generated via Amazon Bedrock: "${bedrockResponse.commentary}"`);
      return bedrockResponse.commentary;
    }
  } catch (err) {
    console.warn('[AI DJ] Bedrock commentary call failed, falling back to local template:', err);
  }

  // Instant fallback to deterministic template
  return generateDJCommentary(event, session);
}


/**
 * Score a track specifically for continuous AI DJ session
 * Balances:
 * 1. Mood alignment (0.25)
 * 2. Energy trajectory / smooth progression (0.25)
 * 3. Tempo / BPM compatibility (0.15)
 * 4. Variety / Artist repetition penalty (0.20)
 * 5. Era / Genre preference (0.15)
 */
export function scoreDJCandidate(
  track: MusicTrack,
  session: AIDJSession,
  stepTargetEnergy: number
): number {
  // 1. Strict Exclusion Checks
  if (session.playedTrackIds.has(track.id)) {
    return 0.0; // Never repeat in the same session
  }
  if (session.excludedMoods.includes(track.mood.toLowerCase())) {
    return 0.0; // Strictly exclude forbidden moods (e.g. "sad")
  }
  // Hard rejection: never play the exact same artist back-to-back
  if (session.currentTrack && session.currentTrack.artist.toLowerCase() === track.artist.toLowerCase()) {
    return 0.0;
  }
  if (session.recentArtists.length > 0 && session.recentArtists[session.recentArtists.length - 1].toLowerCase() === track.artist.toLowerCase()) {
    return 0.0;
  }

  // 2. Mood Alignment (0.25)
  let moodScore = 0.5;
  if (!session.targetMood || session.targetMood === 'general') {
    moodScore = 0.8;
  } else if (track.mood.toLowerCase() === session.targetMood.toLowerCase()) {
    moodScore = 1.0;
  } else if (
    (session.targetMood === 'calm' && track.mood === 'love') ||
    (session.targetMood === 'energetic' && track.mood === 'happy')
  ) {
    moodScore = 0.6;
  } else {
    moodScore = 0.2;
  }

  // 3. Smooth Energy Progression (0.25)
  // Penalize jumping too far from current energy step
  const trackEnergyNum = energyToNumeric(track.energy);
  const energyDiff = Math.abs(trackEnergyNum - stepTargetEnergy);
  const energyScore = Math.max(0, 1.0 - energyDiff * 1.5);

  // 4. Tempo / BPM Compatibility (0.15)
  let bpmScore = 0.8;
  if (session.currentTrack && session.currentTrack.bpm && track.bpm) {
    const bpmDiff = Math.abs(track.bpm - session.currentTrack.bpm);
    if (bpmDiff <= 10) bpmScore = 1.0;
    else if (bpmDiff <= 25) bpmScore = 0.7;
    else bpmScore = 0.4;
  }

  // 5. Variety & Artist Buffer (0.20)
  let varietyScore = 1.0;
  // If track artist was played in the last 3 tracks, penalize heavily
  if (session.recentArtists.includes(track.artist)) {
    varietyScore = 0.1;
  }
  // Never play the exact same artist back-to-back
  if (session.currentTrack && session.currentTrack.artist === track.artist) {
    varietyScore = 0.0;
  }

  // 6. Era / Genre Preference (0.15)
  let eraGenreScore = 0.7;
  if (session.preferredGenres.length > 0) {
    const match = session.preferredGenres.some((g) =>
      track.genre.toLowerCase().includes(g.toLowerCase())
    );
    if (match) eraGenreScore += 0.3;
  }
  if (session.preferredEraStart && session.preferredEraEnd) {
    if (track.year >= session.preferredEraStart && track.year <= session.preferredEraEnd) {
      eraGenreScore += 0.3;
    }
  }
  eraGenreScore = Math.min(1.0, eraGenreScore);

  return (
    moodScore * 0.25 +
    energyScore * 0.25 +
    bpmScore * 0.15 +
    varietyScore * 0.20 +
    eraGenreScore * 0.15
  );
}

/**
 * Pick the top N candidate tracks for the lookahead queue
 */
export function selectNextDJTracks(
  session: AIDJSession,
  count: number = 3,
  catalog: MusicTrack[] = TRACK_CATALOG
): MusicTrack[] {
  const chosen: MusicTrack[] = [];

  // Temporary state for sequential lookahead planning
  const tempPlayedIds = new Set<string>(session.playedTrackIds);
  if (session.queue && Array.isArray(session.queue)) {
    session.queue.forEach((q) => tempPlayedIds.add(q.id));
  }
  const tempRecentArtists = [...session.recentArtists];
  let tempCurrentEnergy = session.currentEnergyValue;

  for (let i = 0; i < count; i++) {
    // Smooth energy step: move 25% closer to target energy per track
    const stepTargetEnergy =
      tempCurrentEnergy + (session.targetEnergyValue - tempCurrentEnergy) * 0.35;

    const scored = catalog
      .filter((t) => !tempPlayedIds.has(t.id) && !chosen.some((c) => c.id === t.id))
      .map((t) => ({
        track: t,
        score: scoreDJCandidate(
          t,
          {
            ...session,
            playedTrackIds: tempPlayedIds,
            recentArtists: tempRecentArtists,
            currentEnergyValue: tempCurrentEnergy,
          },
          stepTargetEnergy
        ),
      }))
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0 && scored[0].score > 0) {
      const best = scored[0].track;
      chosen.push(best);
      tempPlayedIds.add(best.id);
      tempRecentArtists.push(best.artist);
      if (tempRecentArtists.length > 4) tempRecentArtists.shift();
      tempCurrentEnergy = stepTargetEnergy;
    } else {
      // Fallback: pick any track not played
      const fallback = catalog.find(
        (t) => !tempPlayedIds.has(t.id) && !chosen.some((c) => c.id === t.id)
      );
      if (fallback) {
        chosen.push(fallback);
        tempPlayedIds.add(fallback.id);
      }
    }
  }

  return chosen;
}

/**
 * Initialize a brand new Continuous AI DJ Session
 */
export function initDJSession(
  intent: MusicIntent,
  catalog: MusicTrack[] = TRACK_CATALOG
): AIDJSession {
  const totalDurationMinutes = intent.duration_minutes || 72; // default ~72 min full session
  const targetMood = intent.mood || (intent.context === 'workout' ? 'energetic' : 'calm');
  const targetEnergyLevel = intent.energy || (targetMood === 'energetic' ? 'high' : 'medium');
  const targetEnergyValue = energyToNumeric(targetEnergyLevel);

  // Initial starting energy: start slightly lower to allow a smooth build-up
  const initialEnergyValue = Math.max(0.2, targetEnergyValue - 0.2);

  const initialSession: AIDJSession = {
    id: `session_${Date.now()}`,
    isActive: true,
    totalDurationMinutes,
    remainingSeconds: totalDurationMinutes * 60,
    targetMood,
    targetEnergyLevel,
    currentEnergyValue: initialEnergyValue,
    targetEnergyValue,
    excludedMoods: intent.modifications?.exclude_moods || [],
    preferredGenres: intent.genres || (intent.genre ? [intent.genre] : []),
    preferredEraStart: intent.era_start || undefined,
    preferredEraEnd: intent.era_end || undefined,
    currentTrack: catalog[0], // temporary placeholder
    queue: [],
    history: [],
    playedTrackIds: new Set<string>(),
    recentArtists: [],
    djCommentary: 'Initializing your AI DJ session...',
    startedAt: new Date().toISOString(),
  };

  // Find optimal starter track
  const starterCandidates = catalog
    .filter((t) => !initialSession.excludedMoods.includes(t.mood.toLowerCase()))
    .map((t) => ({
      track: t,
      score: scoreDJCandidate(t, initialSession, initialEnergyValue),
    }))
    .sort((a, b) => b.score - a.score);

  const starter = starterCandidates.length > 0 ? starterCandidates[0].track : catalog[0];

  initialSession.currentTrack = starter;
  initialSession.playedTrackIds.add(starter.id);
  initialSession.recentArtists.push(starter.artist);
  initialSession.currentEnergyValue = energyToNumeric(starter.energy);

  // Adaptive queue length based on user intent duration (e.g. 30m -> 8 tracks, 45m -> 12 tracks, 60m -> 16 tracks, default -> 18 tracks)
  let queueCount = 17;
  if (intent.duration_minutes) {
    if (intent.duration_minutes <= 30) queueCount = 7; // 1 starter + 7 queue = 8 tracks (~30 min)
    else if (intent.duration_minutes <= 45) queueCount = 11; // 1 starter + 11 queue = 12 tracks (~45 min)
    else if (intent.duration_minutes <= 60) queueCount = 15; // 1 starter + 15 queue = 16 tracks (~60 min)
    else queueCount = Math.min(24, Math.max(7, Math.round(intent.duration_minutes / 4) - 1));
  }

  // Pre-compute full session lookahead queue with energy balancing
  initialSession.queue = selectNextDJTracks(initialSession, queueCount, catalog);

  // Generate welcome DJ announcement
  initialSession.djCommentary = generateDJCommentary('start', {
    targetMood,
    currentEnergyValue: initialEnergyValue,
    nextTrack: starter,
  });

  return initialSession;
}

/**
 * Advance session to next track (called automatically when track finishes or user skips)
 */
export function advanceToNextTrack(
  session: AIDJSession,
  catalog: MusicTrack[] = TRACK_CATALOG
): AIDJSession {
  if (!session.isActive) return session;

  const previousTrack = session.currentTrack;
  const newHistory = [previousTrack, ...session.history.slice(0, 15)];

  // Deduct previous track duration from remaining time
  const remainingSeconds = Math.max(0, session.remainingSeconds - previousTrack.duration);

  // Next track from lookahead queue
  let nextTrack: MusicTrack;
  let remainingQueue: MusicTrack[] = [];

  if (session.queue.length > 0) {
    nextTrack = session.queue[0];
    remainingQueue = session.queue.slice(1);
  } else {
    const emergencyNext = selectNextDJTracks(session, 1, catalog);
    nextTrack = emergencyNext[0] || catalog[0];
  }

  // Update played IDs and recent artists
  const newPlayedIds = new Set<string>(session.playedTrackIds);
  newPlayedIds.add(nextTrack.id);

  const newRecentArtists = [...session.recentArtists, nextTrack.artist];
  if (newRecentArtists.length > 4) newRecentArtists.shift();

  // Smooth energy transition: shift current energy toward target
  const newCurrentEnergy =
    session.currentEnergyValue + (session.targetEnergyValue - session.currentEnergyValue) * 0.3;

  // Replenish lookahead queue so there are always 3 tracks pre-queued
  const updatedSessionWithoutQueue: AIDJSession = {
    ...session,
    remainingSeconds,
    currentTrack: nextTrack,
    currentEnergyValue: Number(newCurrentEnergy.toFixed(3)),
    history: newHistory,
    playedTrackIds: newPlayedIds,
    recentArtists: newRecentArtists,
    queue: remainingQueue,
  };

  const replenished = selectNextDJTracks(
    updatedSessionWithoutQueue,
    3 - remainingQueue.length,
    catalog
  );
  const fullQueue = [...remainingQueue, ...replenished];

  // Generate transition DJ commentary
  const commentary = generateDJCommentary('transition', {
    currentTrack: previousTrack,
    nextTrack,
    currentEnergyValue: newCurrentEnergy,
  });

  return {
    ...updatedSessionWithoutQueue,
    queue: fullQueue,
    djCommentary: commentary,
  };
}

/**
 * Apply live mid-session voice command steering
 * e.g. "Make it more energetic", "No sad songs", "Slow things down"
 */
export function applyLiveDJCommand(
  session: AIDJSession,
  commandIntent: MusicIntent,
  catalog: MusicTrack[] = TRACK_CATALOG
): AIDJSession {
  let updatedTargetEnergy = session.targetEnergyValue;
  let updatedTargetEnergyLevel = session.targetEnergyLevel;
  let updatedExcludedMoods = [...session.excludedMoods];
  let commentaryEvent: 'steer_energy_up' | 'steer_energy_down' | 'steer_exclude_sad' | 'steer_similar' =
    'steer_energy_up';

  // 1. Energy modification
  if (commandIntent.modifications?.energy === 'high' || commandIntent.energy === 'high') {
    updatedTargetEnergy = Math.min(1.0, session.targetEnergyValue + 0.25);
    updatedTargetEnergyLevel = 'high';
    commentaryEvent = 'steer_energy_up';
  } else if (
    commandIntent.modifications?.energy === 'low' ||
    commandIntent.energy === 'low' ||
    commandIntent.reason?.toLowerCase().includes('slow')
  ) {
    updatedTargetEnergy = Math.max(0.15, session.targetEnergyValue - 0.25);
    updatedTargetEnergyLevel = 'low';
    commentaryEvent = 'steer_energy_down';
  }

  // 2. Exclude moods (e.g. "No sad songs")
  const excludeMoods = commandIntent.modifications?.exclude_moods || [];
  if (excludeMoods.length > 0) {
    excludeMoods.forEach((m) => {
      const norm = m.toLowerCase();
      if (!updatedExcludedMoods.includes(norm)) updatedExcludedMoods.push(norm);
    });
    commentaryEvent = 'steer_exclude_sad';
  }

  // 3. Similar to current song
  if (commandIntent.action === 'play_similar') {
    commentaryEvent = 'steer_similar';
  }

  // Prepare updated session state
  const updatedSessionState: AIDJSession = {
    ...session,
    targetEnergyValue: Number(updatedTargetEnergy.toFixed(3)),
    targetEnergyLevel: updatedTargetEnergyLevel,
    excludedMoods: updatedExcludedMoods,
    lastSteeringAction: commandIntent.reason || commandIntent.action,
  };

  // Re-compute entire lookahead queue immediately to reflect new steering
  const newQueue = selectNextDJTracks(updatedSessionState, 3, catalog);
  const commentary = generateDJCommentary(commentaryEvent, {
    currentTrack: session.currentTrack,
    nextTrack: newQueue[0],
    currentEnergyValue: session.currentEnergyValue,
  });

  return {
    ...updatedSessionState,
    queue: newQueue,
    djCommentary: commentary,
  };
}
