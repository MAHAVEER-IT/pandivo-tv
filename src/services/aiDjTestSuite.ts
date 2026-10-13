import {
  AIDJSession,
  initDJSession,
  advanceToNextTrack,
  applyLiveDJCommand,
} from './aiDjSessionService';
import { MusicIntent, parseMusicIntent } from './geminiIntentService';
import { TRACK_CATALOG, MusicTrack } from './musicCatalog';

export interface AIDJTestCase {
  id: number;
  name: string;
  command: string;
  expectedDescription: string;
  run: () => Promise<{ passed: boolean; message: string }>;
}

export const AI_DJ_ACCEPTANCE_TESTS: AIDJTestCase[] = [
  {
    id: 1,
    name: 'Start 2-Hour DJ Session',
    command: 'Be my DJ for the next two hours. Keep it energetic but not aggressive.',
    expectedDescription: 'Session memory: 120 min, energetic mood, starter track, lookahead queue',
    run: async () => {
      const intent: MusicIntent = {
        action: 'start_ai_dj',
        duration_minutes: 120,
        mood: 'energetic',
        energy: 'high',
        confidence: 0.98,
        reason: 'User requested 2-hour energetic AI DJ session',
      };
      const session = initDJSession(intent, TRACK_CATALOG);

      const durationOk = session.totalDurationMinutes === 120;
      const hasCurrent = Boolean(session.currentTrack && session.currentTrack.id);
      const hasQueue = session.queue.length === 3;
      const commentaryOk = session.djCommentary.length > 20;

      if (!durationOk || !hasCurrent || !hasQueue || !commentaryOk) {
        return {
          passed: false,
          message: `Failed: duration=${session.totalDurationMinutes}m, queue=${session.queue.length}`,
        };
      }

      return {
        passed: true,
        message: `Session initialized (120m, Starter: "${session.currentTrack.title}", Queue: ${session.queue.length} tracks)`,
      };
    },
  },
  {
    id: 2,
    name: 'Continuous Auto-Transition',
    command: 'Next track completion event',
    expectedDescription: 'Appends to history, updates remaining time, replenishes lookahead queue',
    run: async () => {
      const intent: MusicIntent = {
        action: 'start_ai_dj',
        duration_minutes: 120,
        mood: 'energetic',
        energy: 'high',
        confidence: 0.98,
        reason: 'Session test',
      };
      const initial = initDJSession(intent, TRACK_CATALOG);
      const initialTrackId = initial.currentTrack.id;
      const expectedNextId = initial.queue[0].id;

      const updated = advanceToNextTrack(initial, TRACK_CATALOG);

      const currentMatchesQueue = updated.currentTrack.id === expectedNextId;
      const historyHasPrev = updated.history.some((t) => t.id === initialTrackId);
      const playedIdsHasPrev = updated.playedTrackIds.has(initialTrackId);
      const queueReplenished = updated.queue.length === 3;

      if (!currentMatchesQueue || !historyHasPrev || !playedIdsHasPrev || !queueReplenished) {
        return {
          passed: false,
          message: `Auto-transition failed: nextId=${updated.currentTrack.id}, historyLen=${updated.history.length}`,
        };
      }

      return {
        passed: true,
        message: `Advanced to "${updated.currentTrack.title}", history updated (${updated.history.length}), queue replenished (3)`,
      };
    },
  },
  {
    id: 3,
    name: 'Smooth Energy Progression',
    command: 'Progressive energy ramp from calm to energetic',
    expectedDescription: 'Gradual transition steps without abrupt energy jarring',
    run: async () => {
      // Start calm session
      const intent: MusicIntent = {
        action: 'start_ai_dj',
        duration_minutes: 60,
        mood: 'calm',
        energy: 'low',
        confidence: 0.95,
        reason: 'Calm initial',
      };
      let session = initDJSession(intent, TRACK_CATALOG);

      // Steer to high energy
      const steerIntent: MusicIntent = {
        action: 'modify_playlist',
        modifications: { energy: 'high' },
        confidence: 0.95,
        reason: 'Increase energy',
      };
      session = applyLiveDJCommand(session, steerIntent, TRACK_CATALOG);

      // Advance 3 tracks and track energy values
      const energyTrajectory: number[] = [session.currentEnergyValue];
      for (let i = 0; i < 3; i++) {
        session = advanceToNextTrack(session, TRACK_CATALOG);
        energyTrajectory.push(session.currentEnergyValue);
      }

      // Check if energy increases gradually (no individual step exceeds 0.40 jump)
      let maxStep = 0;
      for (let i = 1; i < energyTrajectory.length; i++) {
        const step = Math.abs(energyTrajectory[i] - energyTrajectory[i - 1]);
        if (step > maxStep) maxStep = step;
      }

      const isSmooth = maxStep <= 0.40;
      return {
        passed: isSmooth,
        message: `Energy trajectory: [${energyTrajectory.map((v) => v.toFixed(2)).join(' -> ')}] (max single step: ${maxStep.toFixed(2)})`,
      };
    },
  },
  {
    id: 4,
    name: 'Steering: "Make it more energetic"',
    command: 'Make the session more energetic',
    expectedDescription: 'Boosts target energy, re-scores lookahead queue immediately',
    run: async () => {
      const initialIntent: MusicIntent = {
        action: 'start_ai_dj',
        duration_minutes: 120,
        mood: 'calm',
        energy: 'low',
        confidence: 0.95,
        reason: 'Calm session',
      };
      const initial = initDJSession(initialIntent, TRACK_CATALOG);
      const prevTarget = initial.targetEnergyValue;

      const steerIntent: MusicIntent = {
        action: 'modify_playlist',
        modifications: { energy: 'high' },
        confidence: 0.95,
        reason: 'Make it more energetic',
      };
      const steered = applyLiveDJCommand(initial, steerIntent, TRACK_CATALOG);

      const energyIncreased = steered.targetEnergyValue > prevTarget;
      const commentaryGenerated = steered.djCommentary.toLowerCase().includes('energy') || steered.djCommentary.toLowerCase().includes('tempo');

      if (!energyIncreased || !commentaryGenerated) {
        return {
          passed: false,
          message: `Energy not boosted: prev=${prevTarget}, new=${steered.targetEnergyValue}`,
        };
      }

      return {
        passed: true,
        message: `Target energy raised: ${prevTarget.toFixed(2)} -> ${steered.targetEnergyValue.toFixed(2)} with commentary: "${steered.djCommentary.slice(0, 50)}..."`,
      };
    },
  },
  {
    id: 5,
    name: 'Steering: "No sad songs"',
    command: 'No sad songs',
    expectedDescription: 'Applies excludedMoods, purges sad songs from lookahead queue',
    run: async () => {
      const intent: MusicIntent = {
        action: 'start_ai_dj',
        duration_minutes: 90,
        mood: 'general',
        confidence: 0.95,
        reason: 'General session',
      };
      const initial = initDJSession(intent, TRACK_CATALOG);

      const excludeIntent: MusicIntent = {
        action: 'modify_playlist',
        modifications: { exclude_moods: ['sad'] },
        confidence: 0.96,
        reason: 'Remove sad tracks',
      };
      const steered = applyLiveDJCommand(initial, excludeIntent, TRACK_CATALOG);

      const hasSadExcluded = steered.excludedMoods.includes('sad');
      const queueHasSad = steered.queue.some((t) => t.mood === 'sad');

      if (!hasSadExcluded || queueHasSad) {
        return {
          passed: false,
          message: `Queue still contains sad tracks after exclusion`,
        };
      }

      return {
        passed: true,
        message: `Excluded moods: [${steered.excludedMoods.join(', ')}], verified 0 sad tracks in upcoming queue`,
      };
    },
  },
  {
    id: 6,
    name: 'Steering: "Slow things down"',
    command: 'Slow things down',
    expectedDescription: 'Reduces target energy, shifts queue towards chill/low-tempo tracks',
    run: async () => {
      const intent: MusicIntent = {
        action: 'start_ai_dj',
        duration_minutes: 90,
        mood: 'energetic',
        energy: 'high',
        confidence: 0.95,
        reason: 'Energetic session',
      };
      const initial = initDJSession(intent, TRACK_CATALOG);
      const prevEnergy = initial.targetEnergyValue;

      const slowIntent: MusicIntent = {
        action: 'modify_playlist',
        modifications: { energy: 'low' },
        confidence: 0.95,
        reason: 'Slow things down',
      };
      const steered = applyLiveDJCommand(initial, slowIntent, TRACK_CATALOG);

      const energyDecreased = steered.targetEnergyValue < prevEnergy;
      if (!energyDecreased) {
        return {
          passed: false,
          message: `Energy not decreased: prev=${prevEnergy}, new=${steered.targetEnergyValue}`,
        };
      }

      return {
        passed: true,
        message: `Target energy reduced: ${prevEnergy.toFixed(2)} -> ${steered.targetEnergyValue.toFixed(2)}`,
      };
    },
  },
  {
    id: 7,
    name: '10-Track Zero Repetition & Variety',
    command: 'Simulate 10 continuous track transitions',
    expectedDescription: 'Zero repeat track IDs, no consecutive same artist in 10 plays',
    run: async () => {
      const intent: MusicIntent = {
        action: 'start_ai_dj',
        duration_minutes: 120,
        mood: 'energetic',
        energy: 'high',
        confidence: 0.98,
        reason: 'Long session variety test',
      };
      let session = initDJSession(intent, TRACK_CATALOG);

      const playedIds = [session.currentTrack.id];
      const playedArtists = [session.currentTrack.artist];

      for (let i = 0; i < 9; i++) {
        session = advanceToNextTrack(session, TRACK_CATALOG);
        playedIds.push(session.currentTrack.id);
        playedArtists.push(session.currentTrack.artist);
      }

      // 1. Check for duplicates
      const uniqueIds = new Set(playedIds);
      const hasDuplicates = uniqueIds.size !== playedIds.length;

      // 2. Check for consecutive same artist
      let hasConsecutiveArtist = false;
      for (let i = 1; i < playedArtists.length; i++) {
        if (playedArtists[i] === playedArtists[i - 1]) {
          hasConsecutiveArtist = true;
          break;
        }
      }

      if (hasDuplicates) {
        return {
          passed: false,
          message: `Found duplicate tracks in 10-song sequence: ${playedIds.length - uniqueIds.size} duplicates`,
        };
      }
      if (hasConsecutiveArtist) {
        return {
          passed: false,
          message: `Found consecutive tracks by same artist`,
        };
      }

      return {
        passed: true,
        message: `10 tracks played: 10/10 unique IDs, 0 consecutive artist repeats across ${new Set(playedArtists).size} distinct artists`,
      };
    },
  },
  {
    id: 8,
    name: 'Dynamic AI DJ Commentary',
    command: 'Generate commentary across transitions',
    expectedDescription: 'Informative spoken/text commentary introducing next artist/mood',
    run: async () => {
      const intent: MusicIntent = {
        action: 'start_ai_dj',
        duration_minutes: 60,
        mood: 'energetic',
        energy: 'high',
        confidence: 0.98,
        reason: 'Commentary test',
      };
      const session = initDJSession(intent, TRACK_CATALOG);
      const startCommentary = session.djCommentary;

      const advanced = advanceToNextTrack(session, TRACK_CATALOG);
      const transitionCommentary = advanced.djCommentary;

      const validStart = startCommentary.length > 20;
      const validTransition = transitionCommentary.length > 15;

      if (!validStart || !validTransition) {
        return {
          passed: false,
          message: `Commentary too short or empty: start="${startCommentary}", trans="${transitionCommentary}"`,
        };
      }

      return {
        passed: true,
        message: `Dynamic commentary verified: "${transitionCommentary}"`,
      };
    },
  },
];

/**
 * Execute the 8 acceptance tests
 */
export async function runAIDJTestSuite(): Promise<{
  total: number;
  passed: number;
  results: { id: number; name: string; command: string; passed: boolean; message: string }[];
}> {
  const results: { id: number; name: string; command: string; passed: boolean; message: string }[] = [];
  let passedCount = 0;

  for (const test of AI_DJ_ACCEPTANCE_TESTS) {
    const outcome = await test.run();
    if (outcome.passed) passedCount++;

    results.push({
      id: test.id,
      name: test.name,
      command: test.command,
      passed: outcome.passed,
      message: outcome.message,
    });
  }

  return {
    total: AI_DJ_ACCEPTANCE_TESTS.length,
    passed: passedCount,
    results,
  };
}
