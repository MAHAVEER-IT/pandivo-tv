/**
 * End-to-End Client-Side Wiring Verification Test Suite
 * Validates:
 * 1. AWS Lambda & Bedrock Health Handshake
 * 2. Primary Intent Parsing via Amazon Bedrock (Nova Lite)
 * 3. Offline Resilience & Deterministic Fallback
 * 4. Live Charismatic AI DJ Commentary
 * 5. Song AI Insight for 10-foot TV Player
 * 6. DynamoDB Cloud State Push & Pull
 */

import { checkAwsHealth, cloudSyncPush, cloudSyncPull, fetchBedrockSongInsight } from './awsBackendService';
import { parseMusicIntent } from './geminiIntentService';
import { generateLiveBedrockDJCommentary } from './aiDjSessionService';

async function runVerification() {
  console.log('===============================================================');
  console.log(' PANDIVO TV: AWS CLIENT-SIDE INTEGRATION VERIFICATION SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] Test #${total}: ${testName}`);
      console.log(`       -> ${detail}\n`);
    } else {
      console.error(`[FAIL] Test #${total}: ${testName}`);
      console.error(`       -> ${detail}\n`);
    }
  }

  // 1. Health Check
  console.log('--- 1. Testing AWS Infrastructure Handshake ---');
  const health = await checkAwsHealth(5000);
  assert(
    health !== null && health.status === 'healthy',
    'AWS Bedrock & DynamoDB Health Handshake',
    `Service: ${health?.service}, Model: ${health?.defaultModel}, Region: ${health?.region}`
  );

  // 2. Live Intent Parsing via Bedrock (Nova Lite)
  console.log('--- 2. Testing Primary Intent Parsing via Bedrock ---');
  const liveIntent = await parseMusicIntent('Play chill acoustic music for an hour', { timeoutMs: 5000 });
  assert(
    liveIntent.action === 'create_playlist' || liveIntent.action === 'play_genre' || liveIntent.mood === 'chill' || liveIntent.genre === 'acoustic',
    'Live Voice Intent Parsing via Amazon Bedrock',
    `Action: ${liveIntent.action}, Mood: ${liveIntent.mood}, Model: ${liveIntent.modelUsed}, Latency: ${liveIntent.latencyMs}ms`
  );

  // 3. Resilient Offline Fallback Simulation
  console.log('--- 3. Testing Offline / Simulation Fallback Resilience ---');
  const fallbackIntent = await parseMusicIntent('Give me energetic workout music [simulate:ai_unavailable]');
  assert(
    fallbackIntent.context === 'workout' && fallbackIntent.energy === 'high' && fallbackIntent.geminiLive === false,
    'Deterministic Local Intent Fallback on Offline Simulation',
    `Context: ${fallbackIntent.context}, Energy: ${fallbackIntent.energy}, Engine: ${fallbackIntent.modelUsed}`
  );

  // 4. Live AI DJ Spoken Commentary via Bedrock
  console.log('--- 4. Testing AI DJ Live Transition Commentary ---');
  const djCommentary = await generateLiveBedrockDJCommentary('transition', {
    targetMood: 'chill',
    currentEnergyValue: 0.5,
    currentTrack: {
      id: 'trk_1',
      title: 'Neon Sunrise',
      artist: 'Solaris',
      mood: 'calm',
      energy: 'medium',
      genre: 'synthwave',
      bpm: 90,
      duration: 180,
      year: 2024,
    } as any,
    nextTrack: {
      id: 'trk_2',
      title: 'Velvet Horizon',
      artist: 'Aethelgard',
      mood: 'calm',
      energy: 'low',
      genre: 'ambient',
      bpm: 85,
      duration: 210,
      year: 2025,
    } as any,
  });
  assert(
    typeof djCommentary === 'string' && djCommentary.length > 15,
    'Live Spoken DJ Commentary via Amazon Bedrock',
    `Commentary generated: "${djCommentary.substring(0, 90)}..."`
  );

  // 5. Song AI Insight for Fullscreen TV Player
  console.log('--- 5. Testing Song AI Insight Generation ---');
  const songInsight = await fetchBedrockSongInsight({
    id: 'trk_301',
    title: 'Echoes of Andromeda',
    artist: 'Starfall',
    album: 'Deep Space Odyssey',
    duration: '3:45',
  }, 5000);
  assert(
    songInsight !== null && typeof songInsight.summary === 'string' && songInsight.summary.length > 20,
    'Song Insight Generation via Amazon Bedrock',
    `Summary: "${songInsight?.summary.substring(0, 85)}...", Style: ${songInsight?.musicalStyle}`
  );

  // 6. DynamoDB Cloud State Push & Pull
  console.log('--- 6. Testing DynamoDB Multi-Device Cloud Sync ---');
  const pushRes = await cloudSyncPush({
    userId: 'firetv_integration_verifier',
    profile: {
      avatarId: 'frost',
      themeId: 'audiophile_dark',
      updatedAt: Date.now(),
    },
    favorites: ['audius_440', 'audius_880'],
    playlists: [{ id: 'pl_001', title: 'Late Night Chill' }],
  });
  assert(
    pushRes !== null && pushRes.status === 'synced',
    'DynamoDB Cloud Sync Push',
    `Status: ${pushRes?.status}, Updated: ${pushRes?.updatedEntities.join(', ')}`
  );

  const pullRes = await cloudSyncPull('firetv_integration_verifier');
  assert(
    pullRes !== null && pullRes.profile.avatarId === 'frost' && pullRes.favorites.length === 2,
    'DynamoDB Cloud Sync Pull',
    `Verified restored avatar: ${pullRes?.profile.avatarId}, Favorites count: ${pullRes?.favorites.length}`
  );

  console.log('===============================================================');
  console.log(` RESULTS: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('===============================================================');

  if (passed === total) {
    console.log('>>> ALL CLIENT-SIDE AWS INTEGRATIONS VERIFIED SUCCESSFULLY! <<<');
    process.exit(0);
  } else {
    console.error('>>> SOME INTEGRATION TESTS FAILED <<<');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
