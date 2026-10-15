/**
 * AWS Backend Integration Service for Pandivo TV
 * Connects to Amazon Bedrock (Nova Lite) & Amazon DynamoDB Cloud Sync.
 * Engineered with non-blocking failover, AbortController timeout protection,
 * and zero Google Play Services dependencies.
 */

// Dynamic resolution of AWS Lambda endpoint:
// In React Native / Expo, EXPO_PUBLIC_AWS_LAMBDA_URL is injected from .env.
// In Node.js testing environments, it is read from process.env or local .env.
let resolvedAwsUrl = process.env.EXPO_PUBLIC_AWS_LAMBDA_URL || '';

if (!resolvedAwsUrl && typeof process !== 'undefined' && typeof process.cwd === 'function') {
  try {
    const fs = require('fs');
    const path = require('path');
    const rootPath = path.resolve(process.cwd(), '.env');
    const subPath = path.resolve(process.cwd(), 'FireTVMusicPOC/.env');
    const envPath = fs.existsSync(rootPath) ? rootPath : (fs.existsSync(subPath) ? subPath : null);

    if (envPath) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/EXPO_PUBLIC_AWS_LAMBDA_URL\s*=\s*(.+)/);
      if (match && match[1]) {
        resolvedAwsUrl = match[1].trim();
      }
    }
  } catch (_e) {
    // Non-fatal in React Native mobile/TV runtime where node fs is absent
  }
}

export const AWS_LAMBDA_URL = resolvedAwsUrl;

export interface AwsHealthResult {
  status: string;
  service: string;
  defaultModel: string;
  dynamoTable: string;
  region: string;
  latencyMs: number;
}

export interface BedrockIntentResponse {
  action: string;
  mood?: string | null;
  energy?: 'low' | 'medium' | 'high' | null;
  duration_minutes?: number | null;
  era_start?: number | null;
  era_end?: number | null;
  genre?: string | null;
  genres?: string[] | null;
  context?: string | null;
  theme?: string | null;
  artist?: string | null;
  modifications?: any;
  needs_clarification?: boolean;
  clarification?: string | null;
  confidence: number;
  reason: string;
  suggested_title?: string | null;
  editorial_description?: string | null;
  modelUsed?: string;
  latencyMs?: number;
}

export interface BedrockSongInsightResponse {
  summary: string;
  musicalStyle: string;
  moodAndVibe: string;
  productionHighlight: string;
  trackId?: string;
  generatedAt?: number;
  modelUsed?: string;
  latencyMs?: number;
}

export interface BedrockDjCommentaryResponse {
  commentary: string;
  vibe?: string;
  energyCue?: 'up' | 'down' | 'steady';
  modelUsed?: string;
  latencyMs?: number;
}

export interface CloudSyncPushPayload {
  userId?: string;
  profile?: {
    avatarId: string;
    themeId?: string;
    updatedAt?: number;
  };
  favorites?: string[];
  playlists?: any[];
  aiDjSessions?: any[];
}

export interface CloudSyncPullResult {
  userId: string;
  profile: {
    avatarId: string;
    themeId: string;
    updatedAt?: number;
  };
  favorites: string[];
  playlists: any[];
  aiDjSessions: any[];
  totalEntities: number;
  latencyMs?: number;
}

/**
 * Universal safe POST request wrapper with timeout protection.
 */
async function callAwsLambda<T>(payload: Record<string, any>, timeoutMs = 4000): Promise<T | null> {
  if (!AWS_LAMBDA_URL) {
    // AWS Lambda URL is not configured (e.g. public GitHub clone without personal .env)
    // Gracefully return null so caller falls back to Gemini or local engine
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(AWS_LAMBDA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      console.warn(`[AWS Backend] HTTP error ${response.status} for action: ${payload.action}`);
      return null;
    }

    const data = await response.json();
    return data as T;
  } catch (err: any) {
    clearTimeout(timer);
    console.warn(`[AWS Backend] Request failed for action "${payload.action}":`, err?.message || err);
    return null;
  }
}

/**
 * Health check to verify live connectivity to Amazon Bedrock & DynamoDB.
 */
export async function checkAwsHealth(timeoutMs = 3000): Promise<AwsHealthResult | null> {
  return callAwsLambda<AwsHealthResult>({ action: 'health' }, timeoutMs);
}

/**
 * Parse natural language voice/text query into structured intent via Amazon Bedrock (Nova Lite).
 */
export async function fetchBedrockMusicIntent(
  query: string,
  timeoutMs = 4000
): Promise<BedrockIntentResponse | null> {
  if (!query || !query.trim()) return null;
  return callAwsLambda<BedrockIntentResponse>(
    {
      action: 'parse_intent',
      query: query.trim(),
    },
    timeoutMs
  );
}

/**
 * Generates musicological song insight for fullscreen TV playback via Amazon Bedrock.
 */
export async function fetchBedrockSongInsight(
  track: { id: string; title: string; artist: string; album: string; duration: number | string },
  timeoutMs = 4000
): Promise<BedrockSongInsightResponse | null> {
  if (!track || !track.id) return null;
  return callAwsLambda<BedrockSongInsightResponse>(
    {
      action: 'song_insight',
      track,
    },
    timeoutMs
  );
}

/**
 * Generates spoken DJ commentary for track transitions via Amazon Bedrock.
 */
export async function fetchBedrockDjCommentary(
  event: string,
  targetMood: string,
  currentEnergyValue: number,
  currentTrack?: any,
  nextTrack?: any,
  timeoutMs = 3500
): Promise<BedrockDjCommentaryResponse | null> {
  return callAwsLambda<BedrockDjCommentaryResponse>(
    {
      action: 'dj_commentary',
      event,
      targetMood,
      currentEnergyValue,
      currentTrack,
      nextTrack,
    },
    timeoutMs
  );
}

/**
 * Pushes local SQLite state to Amazon DynamoDB for cloud backup.
 */
export async function cloudSyncPush(
  payload: CloudSyncPushPayload,
  timeoutMs = 4000
): Promise<{ status: string; updatedEntities: string[] } | null> {
  return callAwsLambda<{ status: string; updatedEntities: string[] }>(
    {
      action: 'cloud_sync_push',
      ...payload,
    },
    timeoutMs
  );
}

/**
 * Pulls cloud-backed user state from Amazon DynamoDB.
 */
export async function cloudSyncPull(
  userId = 'default_firetv_user',
  timeoutMs = 4000
): Promise<CloudSyncPullResult | null> {
  return callAwsLambda<CloudSyncPullResult>(
    {
      action: 'cloud_sync_pull',
      userId,
    },
    timeoutMs
  );
}
