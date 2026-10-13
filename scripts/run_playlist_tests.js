const path = require('path');
const fs = require('fs');

const tracks = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../assets/data/tracks.json'), 'utf8')
);

// Fallback / Gemini intent parser
function normalizeMood(mood) {
  if (!mood) return '';
  const m = mood.toLowerCase().trim();
  if (m === 'romantic' || m === 'romance' || m === 'love songs') return 'love';
  if (m === 'chill' || m === 'relaxing' || m === 'peaceful' || m === 'ambient' || m === 'sleep') return 'calm';
  if (m === 'workout' || m === 'gym' || m === 'running' || m === 'upbeat' || m === 'party') return 'energetic';
  if (m === 'melancholic' || m === 'heartbreak' || m === 'crying' || m === 'depressed') return 'sad';
  if (m === 'joyful' || m === 'feel-good' || m === 'summer') return 'happy';
  return m;
}

function checkGenreMatch(track, genreTarget, genresTarget) {
  const targets = [];
  if (genreTarget) targets.push(genreTarget.toLowerCase());
  if (genresTarget && Array.isArray(genresTarget)) {
    genresTarget.forEach((g) => targets.push(g.toLowerCase()));
  }
  if (targets.length === 0) return 1.0;

  const trackGenre = (track.genre || '').toLowerCase();
  const trackTags = (track.tags || []).map((t) => t.toLowerCase());
  const trackVibe = (track.vibe || '').toLowerCase();

  for (const t of targets) {
    if (trackGenre.includes(t) || t.includes(trackGenre)) return 1.0;
    if (trackTags.some((tag) => tag.includes(t) || t.includes(tag))) return 0.9;
    if (trackVibe.includes(t)) return 0.8;
  }
  return 0.0;
}

function checkEraMatch(year, eraStart, eraEnd) {
  if (!eraStart && !eraEnd) return 1.0;
  const start = eraStart || 1970;
  const end = eraEnd || 2026;
  if (year >= start && year <= end) return 1.0;
  if (year >= start - 3 && year <= end + 3) return 0.5;
  return 0.0;
}

function checkContextMatch(track, context) {
  if (!context) return 1.0;
  const ctx = context.toLowerCase().replace(/_/g, ' ');
  const trackVibe = (track.vibe || '').toLowerCase();
  const trackTags = (track.tags || []).map((t) => t.toLowerCase());

  if (trackVibe.includes(ctx)) return 1.0;
  if (trackTags.some((tag) => tag.includes(ctx) || ctx.includes(tag))) return 1.0;
  if (ctx.includes('workout') && track.energy === 'high') return 0.9;
  if (ctx.includes('rain') && (track.mood === 'calm' || track.mood === 'sad')) return 0.9;
  if (ctx.includes('study') && track.mood === 'calm') return 0.9;
  if (ctx.includes('relax') && track.mood === 'calm') return 0.9;
  return 0.1;
}

function calculateScore(track, intent, currentTrack) {
  const normMood = normalizeMood(intent.mood);

  let moodMatch = 0.0;
  if (!normMood) {
    moodMatch = 0.8;
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

  let energyMatch = 0.0;
  const targetEnergy = (intent.modifications && intent.modifications.energy) || intent.energy;
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
    energyMatch = 0.0;
  }

  const genreMatch = checkGenreMatch(track, intent.genre, intent.genres);
  const eraMatch = checkEraMatch(track.year, intent.era_start, intent.era_end);
  const contextMatch = checkContextMatch(track, intent.context);

  let similarity = 0.5;
  if (currentTrack) {
    if (track.id === currentTrack.id) {
      similarity = 0.0;
    } else {
      let sim = 0;
      if (track.artist === currentTrack.artist) sim += 0.4;
      if (track.mood === currentTrack.mood) sim += 0.3;
      if (track.genre === currentTrack.genre) sim += 0.2;
      if (Math.abs(track.bpm - currentTrack.bpm) < 15) sim += 0.1;
      similarity = Math.min(1.0, sim);
    }
  }

  return (
    moodMatch * 0.30 +
    energyMatch * 0.20 +
    genreMatch * 0.15 +
    eraMatch * 0.15 +
    contextMatch * 0.10 +
    similarity * 0.10
  );
}

function filterCandidates(catalog, intent, minTracks = 6) {
  let pool = [...catalog];
  const excludeMoods = (intent.modifications && intent.modifications.exclude_moods) || [];
  if (excludeMoods.length > 0) {
    const normExcluded = excludeMoods.map(normalizeMood);
    pool = pool.filter((t) => !normExcluded.includes(t.mood));
  }

  const normMood = normalizeMood(intent.mood);
  const targetEnergy = (intent.modifications && intent.modifications.energy) || intent.energy;
  const eraStart = intent.era_start;
  const eraEnd = intent.era_end;

  // Stage 1: Exact matches
  let stage1 = pool.filter((t) => {
    if (normMood && t.mood !== normMood) return false;
    if (targetEnergy && t.energy !== targetEnergy) return false;
    if (eraStart && t.year < eraStart) return false;
    if (eraEnd && t.year > eraEnd) return false;
    if (intent.genre && !checkGenreMatch(t, intent.genre)) return false;
    return true;
  });

  if (stage1.length >= minTracks) {
    return { candidates: stage1, isFallback: false };
  }

  // Stage 2: Relax Energy
  let stage2 = pool.filter((t) => {
    if (normMood && t.mood !== normMood) return false;
    if (eraStart && t.year < eraStart) return false;
    if (eraEnd && t.year > eraEnd) return false;
    if (intent.genre && !checkGenreMatch(t, intent.genre)) return false;
    return true;
  });

  if (stage2.length >= minTracks) {
    return {
      candidates: stage2,
      isFallback: true,
      fallbackMessage: `Expanded energy levels to build a full playlist while preserving ${normMood || 'requested'} mood.`,
    };
  }

  // Stage 3: Relax Era (+- 8 years)
  let stage3 = pool.filter((t) => {
    if (normMood && t.mood !== normMood) return false;
    if (eraStart && t.year < eraStart - 8) return false;
    if (eraEnd && t.year > eraEnd + 8) return false;
    return true;
  });

  if (stage3.length >= minTracks) {
    return {
      candidates: stage3,
      isFallback: true,
      fallbackMessage: `Expanded era range slightly to include top-rated tracks matching ${normMood || 'your requested style'}.`,
    };
  }

  // Stage 4: Relax Mood
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

  if (stage4.length >= minTracks) {
    return {
      candidates: stage4,
      isFallback: true,
      fallbackMessage: `Expanded selection with closely related tracks.`,
    };
  }

  return {
    candidates: pool.slice(0, 20),
    isFallback: true,
    fallbackMessage: `Curated best-rated selections from our catalog matching your vibe.`,
  };
}

function optimizeDuration(scored, targetMinutes = 30) {
  const targetSeconds = targetMinutes * 60;
  const sorted = [...scored].sort((a, b) => b.score - a.score);

  const playlist = [];
  let currentTotal = 0;
  const artistCount = {};

  for (const item of sorted) {
    const t = item.track;
    if (t.duration > 480 || (targetSeconds > 600 && t.duration > targetSeconds * 0.45)) continue;
    const count = artistCount[t.artist] || 0;
    const lastTrack = playlist[playlist.length - 1];
    if (lastTrack && lastTrack.artist === t.artist) continue;
    if (count >= 2) continue;

    playlist.push(t);
    currentTotal += t.duration;
    artistCount[t.artist] = count + 1;

    if (currentTotal >= targetSeconds - 90 && playlist.length >= 6) break;
    if (playlist.length >= 25 || currentTotal >= targetSeconds * 1.1) break;
  }

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

function generate(intent, catalog, currentTrack) {
  const targetDuration = intent.duration_minutes || 30;
  const { candidates, isFallback, fallbackMessage } = filterCandidates(catalog, intent, 6);
  const scored = candidates.map((t) => ({ track: t, score: calculateScore(t, intent, currentTrack) }));
  const selected = optimizeDuration(scored, targetDuration);
  const totalSecs = selected.reduce((sum, t) => sum + t.duration, 0);

  return {
    tracks: selected,
    totalDurationSeconds: totalSecs,
    isFallback,
    fallbackReason: fallbackMessage,
  };
}

function modify(current, modIntent, catalog) {
  let updated = [...current.tracks];
  const excludeMoods = (modIntent.modifications && modIntent.modifications.exclude_moods) || [];
  if (excludeMoods.length > 0) {
    const normExcluded = excludeMoods.map(normalizeMood);
    updated = updated.filter((t) => !normExcluded.includes(t.mood));
    const repPool = catalog.filter((t) => !normExcluded.includes(t.mood) && !updated.some((u) => u.id === t.id));
    const scored = repPool.map((t) => ({ track: t, score: calculateScore(t, modIntent) })).sort((a, b) => b.score - a.score);
    while (updated.length < current.tracks.length && scored.length > 0) {
      updated.push(scored.shift().track);
    }
  }

  const newEnergy = modIntent.modifications && modIntent.modifications.energy;
  if (newEnergy) {
    const scored = catalog
      .filter((t) => t.energy === newEnergy || t.energy === 'medium')
      .map((t) => ({ track: t, score: calculateScore(t, { ...modIntent, energy: newEnergy }) }))
      .sort((a, b) => b.score - a.score);
    updated = optimizeDuration(scored, 30);
  }

  const totalSecs = updated.reduce((sum, t) => sum + t.duration, 0);
  return {
    tracks: updated,
    totalDurationSeconds: totalSecs,
    isFallback: false,
  };
}

// 10 Tests Definition
const tests = [
  {
    id: 1,
    name: 'Calm, 30 min',
    intent: { action: 'create_playlist', mood: 'calm', energy: 'low', duration_minutes: 30 },
    validate: (pl) => {
      const calm = pl.tracks.filter((t) => t.mood === 'calm' || t.energy === 'low').length;
      const mins = pl.totalDurationSeconds / 60;
      return mins >= 20 && mins <= 40 && calm / pl.tracks.length >= 0.7;
    },
  },
  {
    id: 2,
    name: 'Energetic workout',
    intent: { action: 'create_playlist', energy: 'high', context: 'workout' },
    validate: (pl) => {
      const high = pl.tracks.filter((t) => t.energy === 'high').length;
      return high / pl.tracks.length >= 0.6;
    },
  },
  {
    id: 3,
    name: 'Romantic 2000s',
    intent: { action: 'create_playlist', mood: 'love', era_start: 2000, era_end: 2009 },
    validate: (pl) => {
      const love = pl.tracks.filter((t) => t.mood === 'love').length;
      const era = pl.tracks.filter((t) => t.year >= 2000 && t.year <= 2009).length;
      return love / pl.tracks.length >= 0.6 && era / pl.tracks.length >= 0.5;
    },
  },
  {
    id: 4,
    name: 'Chill acoustic, 60 min',
    intent: { action: 'create_playlist', mood: 'calm', genre: 'acoustic', duration_minutes: 60 },
    validate: (pl) => {
      const mins = pl.totalDurationSeconds / 60;
      const acoustic = pl.tracks.filter(
        (t) => (t.tags && t.tags.includes('acoustic')) || t.mood === 'calm' || t.energy === 'low'
      ).length;
      return mins >= 45 && mins <= 75 && acoustic / pl.tracks.length >= 0.7;
    },
  },
  {
    id: 5,
    name: '2010–2020',
    intent: { action: 'create_playlist', era_start: 2010, era_end: 2020 },
    validate: (pl) => {
      const era = pl.tracks.filter((t) => t.year >= 2010 && t.year <= 2020).length;
      return era / pl.tracks.length >= 0.7;
    },
  },
  {
    id: 6,
    name: 'Sad songs',
    intent: { action: 'create_playlist', mood: 'sad' },
    validate: (pl) => {
      const sad = pl.tracks.filter((t) => t.mood === 'sad').length;
      return sad / pl.tracks.length >= 0.6;
    },
  },
  {
    id: 7,
    name: 'Remove sad songs',
    intent: { action: 'modify_playlist', modifications: { exclude_moods: ['sad'] } },
    validate: (pl) => {
      const sad = pl.tracks.filter((t) => t.mood === 'sad').length;
      return sad === 0;
    },
  },
  {
    id: 8,
    name: 'More energetic',
    intent: { action: 'modify_playlist', modifications: { energy: 'high' } },
    validate: (pl) => {
      const high = pl.tracks.filter((t) => t.energy === 'high').length;
      return high / pl.tracks.length >= 0.5;
    },
  },
  {
    id: 9,
    name: 'Similar to current song',
    intent: { action: 'play_similar' },
    validate: (pl, _prev, current) => {
      const ref = current || tracks[0];
      const match = pl.tracks.filter(
        (t) => t.artist === ref.artist || t.mood === ref.mood || t.genre === ref.genre || Math.abs(t.bpm - ref.bpm) <= 20
      ).length;
      return match / pl.tracks.length >= 0.6;
    },
  },
  {
    id: 10,
    name: 'Very restrictive request',
    intent: { action: 'create_playlist', mood: 'love', era_start: 1975, era_end: 1975, energy: 'low', duration_minutes: 30 },
    validate: (pl) => {
      return pl.tracks.length >= 4 && pl.isFallback === true && Boolean(pl.fallbackReason);
    },
  },
];

console.log('🧪 RUNNING 10 ACCEPTANCE TESTS FOR PHASE 6E (PLAYLIST GENERATION)...');
let passed = 0;
let activePl = null;
const refTrack = tracks.find((t) => t.mood === 'calm') || tracks[0];

tests.forEach((t) => {
  let pl;
  if (t.intent.action === 'modify_playlist' && activePl) {
    pl = modify(activePl, t.intent, tracks);
  } else {
    pl = generate(t.intent, tracks, refTrack);
  }

  if (t.id === 6 || t.id === 1) {
    activePl = pl;
  }

  const ok = t.validate(pl, activePl, refTrack);
  if (ok) passed++;
  const dur = (pl.totalDurationSeconds / 60).toFixed(1);
  console.log(
    `[Test ${t.id}/10] ${ok ? '✅ PASS' : '❌ FAIL'}: ${t.name} -> ${pl.tracks.length} tracks (${dur}m) ${
      pl.isFallback ? '[FALLBACK TRIGGERED: ' + pl.fallbackReason + ']' : ''
    }`
  );
});

console.log(`\n🏆 RESULT: ${passed} / ${tests.length} PASSED (${Math.round((passed / tests.length) * 100)}%)`);
if (passed === tests.length) {
  process.exit(0);
} else {
  process.exit(1);
}
