/**
 * AI DJ Module 1 Error Handling Service
 * Strictly maps all expected AI and session-generation failures into user-friendly error states.
 * 
 * Guarantees:
 * - NEVER exposes technical errors, HTTP status codes, API keys, stack traces, or internal details.
 * - Categorizes every failure into one of 4 exact user-facing specifications.
 */

import { MusicIntent } from './geminiIntentService';

export type AIDJErrorType = 
  | 'AI_UNAVAILABLE'
  | 'GENERAL_FAILURE'
  | 'NO_TRACKS'
  | 'NETWORK_TIMEOUT'
  | 'NO_SPEECH'
  | 'SPEECH_NOT_RECOGNIZED'
  | 'MIC_UNAVAILABLE';

export interface AIDJErrorInfo {
  type: AIDJErrorType;
  title: string;
  supportingText: string;
}

export const AIDJ_ERROR_DEFINITIONS: Record<AIDJErrorType, { title: string; supportingText: string }> = {
  // 1. AI / Model Unavailable (Quota, rate limit, overloaded, HTTP 429 / 503 / 500)
  AI_UNAVAILABLE: {
    title: 'AI DJ is temporarily unavailable',
    supportingText: 'Something went wrong while creating your session. Please try again in a moment.',
  },

  // 2. General Processing Failure (Invalid JSON, unsupported intent, session engine failure, runtime error)
  GENERAL_FAILURE: {
    title: "We couldn't create your session",
    supportingText: 'Something went wrong while preparing your AI DJ session.',
  },

  // 3. No Suitable Tracks (Empty candidates, filtering found no match)
  NO_TRACKS: {
    title: "We couldn't find the right mix",
    supportingText: 'Try changing your request or choosing a different vibe.',
  },

  // 4. Network / Timeout (Network failure, fetch aborted, connection refused, DNS error)
  NETWORK_TIMEOUT: {
    title: 'Connection issue',
    supportingText: "We couldn't reach the AI service. Check your connection and try again.",
  },

  // 5. No Speech Detected
  NO_SPEECH: {
    title: "We couldn't hear you.",
    supportingText: 'Please try speaking again.',
  },

  // 6. Speech Not Recognized
  SPEECH_NOT_RECOGNIZED: {
    title: "We couldn't understand your request.",
    supportingText: "Try again and tell me what you'd like to hear.",
  },

  // 7. Microphone or Recognition Error
  MIC_UNAVAILABLE: {
    title: 'Voice input is temporarily unavailable.',
    supportingText: 'Please try again.',
  },
};

/**
 * Classifies speech recognition failures into clean AIDJErrorInfo.
 */
export function classifySpeechError(
  reason: 'no_speech' | 'not_recognized' | 'mic_error'
): AIDJErrorInfo {
  switch (reason) {
    case 'no_speech':
      return {
        type: 'NO_SPEECH',
        ...AIDJ_ERROR_DEFINITIONS.NO_SPEECH,
      };
    case 'not_recognized':
      return {
        type: 'SPEECH_NOT_RECOGNIZED',
        ...AIDJ_ERROR_DEFINITIONS.SPEECH_NOT_RECOGNIZED,
      };
    case 'mic_error':
    default:
      return {
        type: 'MIC_UNAVAILABLE',
        ...AIDJ_ERROR_DEFINITIONS.MIC_UNAVAILABLE,
      };
  }
}

/**
 * Classifies any error, intent, or catalog condition into a clean AIDJErrorInfo.
 * NEVER returns technical details to the user.
 */
export function classifyAIDJError(
  err?: any,
  intent?: MusicIntent | null,
  candidateCount?: number
): AIDJErrorInfo {
  // 1. Explicit track shortage / recommendation engine empty result
  if (candidateCount !== undefined && candidateCount <= 0) {
    return {
      type: 'NO_TRACKS',
      ...AIDJ_ERROR_DEFINITIONS.NO_TRACKS,
    };
  }

  // 2. Intent-level classification
  if (intent) {
    // Unrelated query or empty/unsupported music intent
    if (intent.action === 'unsupported' || intent.action === undefined) {
      return {
        type: 'GENERAL_FAILURE',
        ...AIDJ_ERROR_DEFINITIONS.GENERAL_FAILURE,
      };
    }

    // Error detected during intent parsing
    if (intent.error) {
      const errStr = String(intent.error).toLowerCase();

      // Network / Timeout
      if (
        errStr.includes('network') ||
        errStr.includes('timeout') ||
        errStr.includes('timed out') ||
        errStr.includes('abort') ||
        errStr.includes('connection') ||
        errStr.includes('failed to fetch') ||
        errStr.includes('offline') ||
        errStr.includes('econnrefused')
      ) {
        return {
          type: 'NETWORK_TIMEOUT',
          ...AIDJ_ERROR_DEFINITIONS.NETWORK_TIMEOUT,
        };
      }

      // AI / Model unavailable / Rate limit / Quota / 429 / 503
      if (
        errStr.includes('429') ||
        errStr.includes('quota') ||
        errStr.includes('resource_exhausted') ||
        errStr.includes('rate limit') ||
        errStr.includes('503') ||
        errStr.includes('unavailable') ||
        errStr.includes('overloaded') ||
        errStr.includes('500') ||
        errStr.includes('502') ||
        errStr.includes('504') ||
        errStr.includes('model')
      ) {
        return {
          type: 'AI_UNAVAILABLE',
          ...AIDJ_ERROR_DEFINITIONS.AI_UNAVAILABLE,
        };
      }
    }
  }

  // 3. Exception object inspection
  if (err) {
    const errStr = (
      (err.message || '') +
      ' ' +
      (err.status || '') +
      ' ' +
      (err.code || '') +
      ' ' +
      (err.name || '') +
      ' ' +
      String(err)
    ).toLowerCase();

    // No suitable tracks
    if (
      errStr.includes('no_tracks') ||
      errStr.includes('no suitable tracks') ||
      errStr.includes('empty candidates')
    ) {
      return {
        type: 'NO_TRACKS',
        ...AIDJ_ERROR_DEFINITIONS.NO_TRACKS,
      };
    }

    // Network / Timeout
    if (
      errStr.includes('timeout') ||
      errStr.includes('timed out') ||
      errStr.includes('network') ||
      errStr.includes('abort') ||
      errStr.includes('connection') ||
      errStr.includes('fetch') ||
      errStr.includes('offline') ||
      errStr.includes('econnrefused') ||
      err.name === 'AbortError'
    ) {
      return {
        type: 'NETWORK_TIMEOUT',
        ...AIDJ_ERROR_DEFINITIONS.NETWORK_TIMEOUT,
      };
    }

    // AI unavailable (Rate limit, quota, 429, 503, etc.)
    if (
      errStr.includes('429') ||
      errStr.includes('quota') ||
      errStr.includes('resource_exhausted') ||
      errStr.includes('rate') ||
      errStr.includes('503') ||
      errStr.includes('unavailable') ||
      errStr.includes('overloaded') ||
      errStr.includes('500') ||
      errStr.includes('502') ||
      errStr.includes('504') ||
      errStr.includes('model')
    ) {
      return {
        type: 'AI_UNAVAILABLE',
        ...AIDJ_ERROR_DEFINITIONS.AI_UNAVAILABLE,
      };
    }
  }

  // 4. Default: General Processing Failure
  return {
    type: 'GENERAL_FAILURE',
    ...AIDJ_ERROR_DEFINITIONS.GENERAL_FAILURE,
  };
}
