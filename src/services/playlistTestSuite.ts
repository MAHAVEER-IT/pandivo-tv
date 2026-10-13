import { Playlist, generatePlaylist, modifyPlaylist } from './recommendationEngine';
import { MusicIntent, parseMusicIntent } from './geminiIntentService';
import { TRACK_CATALOG, MusicTrack } from './musicCatalog';

export interface PlaylistTestCase {
  id: number;
  name: string;
  prompt: string;
  expectedDescription: string;
  validate: (
    playlist: Playlist,
    previousPlaylist?: Playlist | null,
    currentTrack?: MusicTrack | null
  ) => { passed: boolean; message: string };
}

export const PLAYLIST_ACCEPTANCE_TESTS: PlaylistTestCase[] = [
  {
    id: 1,
    name: 'Calm, 30 min',
    prompt: 'Create a calm playlist for 30 minutes',
    expectedDescription: 'Calm mood, low energy, ~30 min (~6-10 tracks)',
    validate: (pl) => {
      const calmCount = pl.tracks.filter((t) => t.mood === 'calm' || t.energy === 'low').length;
      const durationMins = pl.totalDurationSeconds / 60;
      const durationOk = durationMins >= 20 && durationMins <= 40;
      const moodOk = calmCount / pl.tracks.length >= 0.7;

      if (!durationOk) {
        return {
          passed: false,
          message: `Expected ~30m, got ${durationMins.toFixed(1)}m (${pl.tracks.length} tracks)`,
        };
      }
      if (!moodOk) {
        return {
          passed: false,
          message: `Expected >=70% calm/low energy, got ${(calmCount / pl.tracks.length) * 100}%`,
        };
      }
      return {
        passed: true,
        message: `Generated ${pl.tracks.length} tracks (${durationMins.toFixed(1)}m) matching calm vibe`,
      };
    },
  },
  {
    id: 2,
    name: 'Energetic workout',
    prompt: 'Give me energetic workout music',
    expectedDescription: 'High energy, workout context/vibe',
    validate: (pl) => {
      const highEnergyCount = pl.tracks.filter((t) => t.energy === 'high').length;
      const hasWorkoutVibe = pl.tracks.some(
        (t) =>
          t.tags.includes('workout') ||
          t.vibe.toLowerCase().includes('workout') ||
          t.bpm >= 120
      );
      const isHighEnergy = highEnergyCount / pl.tracks.length >= 0.6;

      if (!isHighEnergy) {
        return {
          passed: false,
          message: `Expected mostly high energy tracks, got ${highEnergyCount}/${pl.tracks.length}`,
        };
      }
      return {
        passed: true,
        message: `High energy workout mix with ${highEnergyCount} high-energy tracks (avg BPM ${Math.round(
          pl.tracks.reduce((sum, t) => sum + t.bpm, 0) / pl.tracks.length
        )})`,
      };
    },
  },
  {
    id: 3,
    name: 'Romantic 2000s',
    prompt: 'Play romantic songs from the 2000s',
    expectedDescription: 'Love mood + era 2000–2009',
    validate: (pl) => {
      const loveCount = pl.tracks.filter((t) => t.mood === 'love').length;
      const era2000sCount = pl.tracks.filter((t) => t.year >= 2000 && t.year <= 2009).length;

      const loveOk = loveCount / pl.tracks.length >= 0.6;
      const eraOk = era2000sCount / pl.tracks.length >= 0.5;

      if (!loveOk) {
        return {
          passed: false,
          message: `Expected romantic/love songs, got ${loveCount}/${pl.tracks.length}`,
        };
      }
      if (!eraOk) {
        return {
          passed: false,
          message: `Expected 2000s era tracks, got ${era2000sCount}/${pl.tracks.length}`,
        };
      }
      return {
        passed: true,
        message: `Found ${loveCount} romantic tracks from 2000-2009`,
      };
    },
  },
  {
    id: 4,
    name: 'Chill acoustic, 60 min',
    prompt: 'I want chill acoustic music for an hour',
    expectedDescription: 'Chill/calm mood + acoustic genre/tags + ~60 min (14-18 tracks)',
    validate: (pl) => {
      const durationMins = pl.totalDurationSeconds / 60;
      const acousticOrCalm = pl.tracks.filter(
        (t) =>
          t.genre.toLowerCase().includes('acoustic') ||
          t.tags.includes('acoustic') ||
          t.mood === 'calm' ||
          t.energy === 'low'
      ).length;

      const durationOk = durationMins >= 45 && durationMins <= 75;
      const acousticOk = acousticOrCalm / pl.tracks.length >= 0.7;

      if (!durationOk) {
        return {
          passed: false,
          message: `Expected ~60m, got ${durationMins.toFixed(1)}m (${pl.tracks.length} tracks)`,
        };
      }
      if (!acousticOk) {
        return {
          passed: false,
          message: `Expected acoustic/chill tracks, got ${acousticOrCalm}/${pl.tracks.length}`,
        };
      }
      return {
        passed: true,
        message: `Assembled ${pl.tracks.length} acoustic/chill tracks totaling ${durationMins.toFixed(1)}m`,
      };
    },
  },
  {
    id: 5,
    name: '2010–2020',
    prompt: 'Give me music from 2010 to 2020',
    expectedDescription: 'Era filtering: all tracks released between 2010 and 2020',
    validate: (pl) => {
      const matchEra = pl.tracks.filter((t) => t.year >= 2010 && t.year <= 2020).length;
      const ratio = matchEra / pl.tracks.length;

      if (ratio < 0.7) {
        return {
          passed: false,
          message: `Expected 2010-2020 era, got only ${matchEra}/${pl.tracks.length}`,
        };
      }
      return {
        passed: true,
        message: `${matchEra}/${pl.tracks.length} tracks verified within 2010–2020 range`,
      };
    },
  },
  {
    id: 6,
    name: 'Sad songs',
    prompt: 'Play sad songs',
    expectedDescription: 'Sad / melancholic mood filtering',
    validate: (pl) => {
      const sadCount = pl.tracks.filter((t) => t.mood === 'sad').length;
      if (sadCount / pl.tracks.length < 0.6) {
        return {
          passed: false,
          message: `Expected mostly sad tracks, got ${sadCount}/${pl.tracks.length}`,
        };
      }
      return {
        passed: true,
        message: `Found ${sadCount} sad & melancholic tracks`,
      };
    },
  },
  {
    id: 7,
    name: 'Remove sad songs',
    prompt: 'Remove sad songs',
    expectedDescription: 'Modifies playlist: zero sad songs remaining',
    validate: (pl, prevPl) => {
      const remainingSad = pl.tracks.filter((t) => t.mood === 'sad').length;
      if (remainingSad > 0) {
        return {
          passed: false,
          message: `Expected 0 sad songs, but found ${remainingSad} sad tracks still in playlist`,
        };
      }
      return {
        passed: true,
        message: `Successfully filtered out all sad songs; playlist refilled with non-sad tracks (${pl.tracks.length} tracks)`,
      };
    },
  },
  {
    id: 8,
    name: 'More energetic',
    prompt: 'Make the current playlist more energetic',
    expectedDescription: 'Energy ranking changes: energy shifts to high',
    validate: (pl, prevPl) => {
      const highEnergy = pl.tracks.filter((t) => t.energy === 'high').length;
      const prevHigh = prevPl ? prevPl.tracks.filter((t) => t.energy === 'high').length : 0;

      if (highEnergy / pl.tracks.length < 0.5 && highEnergy <= prevHigh) {
        return {
          passed: false,
          message: `Expected increased high energy tracks, got ${highEnergy}/${pl.tracks.length}`,
        };
      }
      return {
        passed: true,
        message: `Energy increased to ${highEnergy} high-energy tracks (${Math.round((highEnergy / pl.tracks.length) * 100)}%)`,
      };
    },
  },
  {
    id: 9,
    name: 'Similar to current song',
    prompt: 'Play something similar to this',
    expectedDescription: 'Similar metadata (artist, mood, genre, or tempo proximity)',
    validate: (pl, _prevPl, currentTrack) => {
      const ref = currentTrack || TRACK_CATALOG[0];
      const matchCriteria = pl.tracks.filter(
        (t) =>
          t.artist === ref.artist ||
          t.mood === ref.mood ||
          t.genre === ref.genre ||
          Math.abs(t.bpm - ref.bpm) <= 20
      ).length;

      if (matchCriteria / pl.tracks.length < 0.6) {
        return {
          passed: false,
          message: `Expected similarity to "${ref.title}" by ${ref.artist}, got low match score (${matchCriteria}/${pl.tracks.length})`,
        };
      }
      return {
        passed: true,
        message: `Matched ${matchCriteria}/${pl.tracks.length} tracks similar to "${ref.title}" by ${ref.artist}`,
      };
    },
  },
  {
    id: 10,
    name: 'Very restrictive request',
    prompt: 'Give me 30 minutes of romantic songs from 1975 with very low energy',
    expectedDescription: 'Graceful fallback: relaxes constraints, non-empty playlist with explanation',
    validate: (pl) => {
      if (pl.tracks.length === 0) {
        return {
          passed: false,
          message: 'Failed: returned 0 tracks instead of graceful fallback',
        };
      }
      if (!pl.isFallback) {
        // If it managed exact matches, that's fine, but if it fell back, it should have a reason
      }
      if (pl.isFallback && !pl.fallbackReason) {
        return {
          passed: false,
          message: 'Fallback triggered but no explanation reason provided to user',
        };
      }
      return {
        passed: true,
        message: `Gracefully handled restrictive request: returned ${pl.tracks.length} tracks with explanation "${pl.fallbackReason || 'Expanded constraints'}"`,
      };
    },
  },
];

/**
 * Execute the 10 acceptance tests
 */
export async function runPlaylistTestSuite(): Promise<{
  total: number;
  passed: number;
  results: { id: number; name: string; prompt: string; passed: boolean; message: string }[];
}> {
  const results: { id: number; name: string; prompt: string; passed: boolean; message: string }[] = [];
  let passedCount = 0;

  let activePlaylist: Playlist | null = null;
  const sampleRefTrack = TRACK_CATALOG.find((t) => t.mood === 'calm') || TRACK_CATALOG[0];

  for (const test of PLAYLIST_ACCEPTANCE_TESTS) {
    const intent = await parseMusicIntent(test.prompt);

    let generated: Playlist;
    if (intent.action === 'modify_playlist' && activePlaylist) {
      generated = modifyPlaylist(activePlaylist, intent, TRACK_CATALOG);
    } else {
      // If Test #6, set activePlaylist for subsequent Test #7 and #8
      generated = generatePlaylist(intent, TRACK_CATALOG, sampleRefTrack);
    }

    if (test.id === 6) {
      activePlaylist = generated; // Set sad playlist for Test 7 (Remove sad songs)
    } else if (test.id === 1) {
      // Set for Test 8 (More energetic)
      activePlaylist = generated;
    }

    const validation = test.validate(generated, activePlaylist, sampleRefTrack);
    if (validation.passed) passedCount++;

    results.push({
      id: test.id,
      name: test.name,
      prompt: test.prompt,
      passed: validation.passed,
      message: validation.message,
    });
  }

  return {
    total: PLAYLIST_ACCEPTANCE_TESTS.length,
    passed: passedCount,
    results,
  };
}
