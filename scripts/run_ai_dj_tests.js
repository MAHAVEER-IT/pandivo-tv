const path = require('path');
const fs = require('fs');

const tracks = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../assets/data/tracks.json'), 'utf8')
);

function energyToNumeric(level) {
  switch (level ? level.toLowerCase() : '') {
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

function generateDJCommentary(event, session) {
  const nextTrk = session.nextTrack;
  const currentTrk = session.currentTrack;

  switch (event) {
    case 'start':
      if (session.targetMood === 'energetic') {
        return `Welcome to your AI DJ session. We're launching into high gear with "${nextTrk ? nextTrk.title : ''}" by ${nextTrk ? nextTrk.artist : ''}. Let's build the momentum.`;
      }
      return `Your AI DJ is locked in. Starting your session with "${nextTrk ? nextTrk.title : ''}" by ${nextTrk ? nextTrk.artist : ''}.`;
    case 'transition':
      if (nextTrk && nextTrk.energy === 'high') {
        return `Keeping the intensity dialed up. Next up is "${nextTrk.title}" by ${nextTrk.artist}.`;
      }
      return `Flowing smoothly into "${nextTrk ? nextTrk.title : ''}" by ${nextTrk ? nextTrk.artist : ''}.`;
    case 'steer_energy_up':
      return `Got it! Raising the tempo and energy curve for the upcoming tracks. Next up: "${nextTrk ? nextTrk.title : ''}".`;
    case 'steer_energy_down':
      return `Understood. Easing back the tempo and mellowing out the groove. Next up: "${nextTrk ? nextTrk.title : ''}".`;
    case 'steer_exclude_sad':
      return `No sad songs — you got it! Purged melancholic tracks from the queue. Only uplifting and energetic vibes ahead.`;
    default:
      return 'Session in progress.';
  }
}

function scoreDJCandidate(track, session, stepTargetEnergy) {
  if (session.playedTrackIds.has(track.id)) return 0.0;
  if (session.excludedMoods.includes(track.mood.toLowerCase())) return 0.0;

  let moodScore = 0.5;
  if (!session.targetMood || session.targetMood === 'general') {
    moodScore = 0.8;
  } else if (track.mood.toLowerCase() === session.targetMood.toLowerCase()) {
    moodScore = 1.0;
  } else {
    moodScore = 0.3;
  }

  const trackEnergyNum = energyToNumeric(track.energy);
  const energyDiff = Math.abs(trackEnergyNum - stepTargetEnergy);
  const energyScore = Math.max(0, 1.0 - energyDiff * 1.5);

  let bpmScore = 0.8;
  if (session.currentTrack && session.currentTrack.bpm && track.bpm) {
    const bpmDiff = Math.abs(track.bpm - session.currentTrack.bpm);
    if (bpmDiff <= 10) bpmScore = 1.0;
    else if (bpmDiff <= 25) bpmScore = 0.7;
    else bpmScore = 0.4;
  }

  let varietyScore = 1.0;
  if (session.recentArtists.includes(track.artist)) varietyScore = 0.1;
  // Hard rejection: never play the exact same artist back-to-back
  if (session.currentTrack && session.currentTrack.artist.toLowerCase() === track.artist.toLowerCase()) {
    return 0.0;
  }
  if (session.recentArtists.length > 0 && session.recentArtists[session.recentArtists.length - 1].toLowerCase() === track.artist.toLowerCase()) {
    return 0.0;
  }

  return moodScore * 0.25 + energyScore * 0.25 + bpmScore * 0.15 + varietyScore * 0.20 + 0.15 * 0.7;
}

function selectNextDJTracks(session, count = 3, catalog = tracks) {
  const chosen = [];
  const tempPlayed = new Set(session.playedTrackIds);
  if (session.queue && Array.isArray(session.queue)) {
    session.queue.forEach((q) => tempPlayed.add(q.id));
  }
  const tempRecentArtists = [...session.recentArtists];
  let tempCurrentEnergy = session.currentEnergyValue;

  for (let i = 0; i < count; i++) {
    const stepTargetEnergy = tempCurrentEnergy + (session.targetEnergyValue - tempCurrentEnergy) * 0.35;
    const scored = catalog
      .filter((t) => !tempPlayed.has(t.id) && !chosen.some((c) => c.id === t.id))
      .map((t) => ({
        track: t,
        score: scoreDJCandidate(
          t,
          {
            ...session,
            playedTrackIds: tempPlayed,
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
      tempPlayed.add(best.id);
      tempRecentArtists.push(best.artist);
      if (tempRecentArtists.length > 4) tempRecentArtists.shift();
      tempCurrentEnergy = stepTargetEnergy;
    } else {
      const fallback = catalog.find((t) => !tempPlayed.has(t.id) && !chosen.some((c) => c.id === t.id));
      if (fallback) {
        chosen.push(fallback);
        tempPlayed.add(fallback.id);
      }
    }
  }
  return chosen;
}

function initDJSession(intent, catalog = tracks) {
  const duration = intent.duration_minutes || 120;
  const mood = intent.mood || (intent.context === 'workout' ? 'energetic' : 'calm');
  const targetEnergyLevel = intent.energy || (mood === 'energetic' ? 'high' : 'medium');
  const targetEnergyValue = energyToNumeric(targetEnergyLevel);
  const initialEnergyValue = Math.max(0.2, targetEnergyValue - 0.2);

  const session = {
    id: `session_${Date.now()}`,
    totalDurationMinutes: duration,
    remainingSeconds: duration * 60,
    targetMood: mood,
    targetEnergyLevel,
    currentEnergyValue: initialEnergyValue,
    targetEnergyValue,
    excludedMoods: (intent.modifications && intent.modifications.exclude_moods) || [],
    preferredGenres: [],
    currentTrack: null,
    queue: [],
    history: [],
    playedTrackIds: new Set(),
    recentArtists: [],
    djCommentary: '',
  };

  const starterCandidates = catalog
    .filter((t) => !session.excludedMoods.includes(t.mood.toLowerCase()))
    .map((t) => ({ track: t, score: scoreDJCandidate(t, session, initialEnergyValue) }))
    .sort((a, b) => b.score - a.score);

  const starter = starterCandidates.length > 0 ? starterCandidates[0].track : catalog[0];
  session.currentTrack = starter;
  session.playedTrackIds.add(starter.id);
  session.recentArtists.push(starter.artist);
  session.currentEnergyValue = energyToNumeric(starter.energy);
  session.queue = selectNextDJTracks(session, 3, catalog);
  session.djCommentary = generateDJCommentary('start', {
    targetMood: mood,
    currentEnergyValue: initialEnergyValue,
    nextTrack: starter,
  });

  return session;
}

function advanceToNextTrack(session, catalog = tracks) {
  const prevTrack = session.currentTrack;
  const newHistory = [prevTrack, ...session.history.slice(0, 15)];
  const remainingSeconds = Math.max(0, session.remainingSeconds - prevTrack.duration);

  let nextTrack = session.queue.length > 0 ? session.queue[0] : selectNextDJTracks(session, 1, catalog)[0];
  const remainingQueue = session.queue.slice(1);

  const newPlayedIds = new Set(session.playedTrackIds);
  newPlayedIds.add(nextTrack.id);
  const newRecentArtists = [...session.recentArtists, nextTrack.artist];
  if (newRecentArtists.length > 4) newRecentArtists.shift();

  const newCurrentEnergy = session.currentEnergyValue + (session.targetEnergyValue - session.currentEnergyValue) * 0.3;

  const tempSession = {
    ...session,
    remainingSeconds,
    currentTrack: nextTrack,
    currentEnergyValue: Number(newCurrentEnergy.toFixed(3)),
    history: newHistory,
    playedTrackIds: newPlayedIds,
    recentArtists: newRecentArtists,
    queue: remainingQueue,
  };

  const replenished = selectNextDJTracks(tempSession, 3 - remainingQueue.length, catalog);
  const fullQueue = [...remainingQueue, ...replenished];

  return {
    ...tempSession,
    queue: fullQueue,
    djCommentary: generateDJCommentary('transition', { currentTrack: prevTrack, nextTrack, currentEnergyValue: newCurrentEnergy }),
  };
}

function applyLiveDJCommand(session, commandIntent, catalog = tracks) {
  let targetEnergy = session.targetEnergyValue;
  let targetEnergyLevel = session.targetEnergyLevel;
  let excludedMoods = [...session.excludedMoods];
  let commentaryEvent = 'steer_energy_up';

  if (commandIntent.modifications?.energy === 'high' || commandIntent.energy === 'high') {
    targetEnergy = Math.min(1.0, session.targetEnergyValue + 0.25);
    targetEnergyLevel = 'high';
    commentaryEvent = 'steer_energy_up';
  } else if (commandIntent.modifications?.energy === 'low' || commandIntent.energy === 'low' || commandIntent.reason?.includes('slow')) {
    targetEnergy = Math.max(0.15, session.targetEnergyValue - 0.25);
    targetEnergyLevel = 'low';
    commentaryEvent = 'steer_energy_down';
  }

  const ex = commandIntent.modifications?.exclude_moods || [];
  if (ex.length > 0) {
    ex.forEach((m) => { if (!excludedMoods.includes(m.toLowerCase())) excludedMoods.push(m.toLowerCase()); });
    commentaryEvent = 'steer_exclude_sad';
  }

  const updatedState = {
    ...session,
    targetEnergyValue: Number(targetEnergy.toFixed(3)),
    targetEnergyLevel,
    excludedMoods,
  };

  const newQueue = selectNextDJTracks(updatedState, 3, catalog);
  return {
    ...updatedState,
    queue: newQueue,
    djCommentary: generateDJCommentary(commentaryEvent, { currentTrack: session.currentTrack, nextTrack: newQueue[0] }),
  };
}

// 8 Tests
console.log('🎧 RUNNING 8 ACCEPTANCE TESTS FOR PHASE 6F (CONTINUOUS AI DJ)...');
let passed = 0;

// Test 1: Start 2-Hour DJ Session
const s1 = initDJSession({ action: 'start_ai_dj', duration_minutes: 120, mood: 'energetic', energy: 'high' });
const t1Ok = s1.totalDurationMinutes === 120 && s1.queue.length === 3 && s1.currentTrack && s1.djCommentary.length > 15;
if (t1Ok) passed++;
console.log(`[Test 1/8] ${t1Ok ? '✅ PASS' : '❌ FAIL'}: Start 2-Hour DJ Session -> 120m, Starter: "${s1.currentTrack.title}", Queue: ${s1.queue.length}`);

// Test 2: Continuous Auto-Transition
const s2PrevId = s1.currentTrack.id;
const s2NextId = s1.queue[0].id;
const s2 = advanceToNextTrack(s1);
const t2Ok = s2.currentTrack.id === s2NextId && s2.history.some((t) => t.id === s2PrevId) && s2.queue.length === 3;
if (t2Ok) passed++;
console.log(`[Test 2/8] ${t2Ok ? '✅ PASS' : '❌ FAIL'}: Auto-Transition -> Switched to "${s2.currentTrack.title}", History: ${s2.history.length}, Queue: ${s2.queue.length}`);

// Test 3: Smooth Energy Progression
let s3 = initDJSession({ action: 'start_ai_dj', duration_minutes: 60, mood: 'calm', energy: 'low' });
s3 = applyLiveDJCommand(s3, { action: 'modify_playlist', modifications: { energy: 'high' } });
const traj = [s3.currentEnergyValue];
for (let i = 0; i < 3; i++) {
  s3 = advanceToNextTrack(s3);
  traj.push(s3.currentEnergyValue);
}
let maxStep = 0;
for (let i = 1; i < traj.length; i++) {
  const diff = Math.abs(traj[i] - traj[i - 1]);
  if (diff > maxStep) maxStep = diff;
}
const t3Ok = maxStep <= 0.40;
if (t3Ok) passed++;
console.log(`[Test 3/8] ${t3Ok ? '✅ PASS' : '❌ FAIL'}: Smooth Energy Progression -> [${traj.map((v) => v.toFixed(2)).join(' -> ')}] (max jump ${maxStep.toFixed(2)})`);

// Test 4: Steering - "Make it more energetic"
const s4Init = initDJSession({ action: 'start_ai_dj', duration_minutes: 120, mood: 'calm', energy: 'low' });
const s4Prev = s4Init.targetEnergyValue;
const s4 = applyLiveDJCommand(s4Init, { action: 'modify_playlist', modifications: { energy: 'high' } });
const t4Ok = s4.targetEnergyValue > s4Prev && s4.djCommentary.toLowerCase().includes('energy');
if (t4Ok) passed++;
console.log(`[Test 4/8] ${t4Ok ? '✅ PASS' : '❌ FAIL'}: Steering "More energetic" -> Target raised ${s4Prev.toFixed(2)} -> ${s4.targetEnergyValue.toFixed(2)}`);

// Test 5: Steering - "No sad songs"
const s5Init = initDJSession({ action: 'start_ai_dj', duration_minutes: 90, mood: 'general' });
const s5 = applyLiveDJCommand(s5Init, { action: 'modify_playlist', modifications: { exclude_moods: ['sad'] } });
const t5Ok = s5.excludedMoods.includes('sad') && !s5.queue.some((t) => t.mood === 'sad');
if (t5Ok) passed++;
console.log(`[Test 5/8] ${t5Ok ? '✅ PASS' : '❌ FAIL'}: Steering "No sad songs" -> Excluded moods: [${s5.excludedMoods.join(', ')}], 0 sad in queue`);

// Test 6: Steering - "Slow things down"
const s6Init = initDJSession({ action: 'start_ai_dj', duration_minutes: 90, energy: 'high' });
const s6Prev = s6Init.targetEnergyValue;
const s6 = applyLiveDJCommand(s6Init, { action: 'modify_playlist', modifications: { energy: 'low' }, reason: 'slow down' });
const t6Ok = s6.targetEnergyValue < s6Prev;
if (t6Ok) passed++;
console.log(`[Test 6/8] ${t6Ok ? '✅ PASS' : '❌ FAIL'}: Steering "Slow things down" -> Target reduced ${s6Prev.toFixed(2)} -> ${s6.targetEnergyValue.toFixed(2)}`);

// Test 7: 10-Track Zero Repetition & Variety
let s7 = initDJSession({ action: 'start_ai_dj', duration_minutes: 120, mood: 'energetic', energy: 'high' });
const playedIds = [s7.currentTrack.id];
const playedArtists = [s7.currentTrack.artist];
for (let i = 0; i < 9; i++) {
  s7 = advanceToNextTrack(s7);
  playedIds.push(s7.currentTrack.id);
  playedArtists.push(s7.currentTrack.artist);
}
const uniqueIds = new Set(playedIds);
let consecutiveArtist = false;
for (let i = 1; i < playedArtists.length; i++) {
  if (playedArtists[i] === playedArtists[i - 1]) consecutiveArtist = true;
}
const t7Ok = uniqueIds.size === 10 && !consecutiveArtist;
if (t7Ok) passed++;
console.log(`[Test 7/8] ${t7Ok ? '✅ PASS' : '❌ FAIL'}: 10-Track Variety -> ${uniqueIds.size}/10 unique IDs, 0 consecutive repeats (${new Set(playedArtists).size} artists)`);

// Test 8: Dynamic AI DJ Commentary
const s8 = initDJSession({ action: 'start_ai_dj', duration_minutes: 60, mood: 'energetic' });
const s8Next = advanceToNextTrack(s8);
const t8Ok = s8.djCommentary.length > 20 && s8Next.djCommentary.length > 20;
if (t8Ok) passed++;
console.log(`[Test 8/8] ${t8Ok ? '✅ PASS' : '❌ FAIL'}: Dynamic Commentary -> "${s8Next.djCommentary}"`);

console.log(`\n🏆 RESULT: ${passed} / 8 PASSED (${Math.round((passed / 8) * 100)}%)`);
if (passed === 8) process.exit(0);
else process.exit(1);
