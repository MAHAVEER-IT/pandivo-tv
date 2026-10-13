import type { PlaylistTrack } from '../data/playlistData';

export interface ElasticTrackMatch {
  track: PlaylistTrack;
  score: number;
  matchType: 'exact' | 'prefix' | 'phonetic' | 'fuzzy' | 'ngram';
  matchedField: 'title' | 'artist' | 'album';
}

export interface ElasticPlaylistSearchResult {
  query: string;
  cleanedQuery: string;
  matches: ElasticTrackMatch[];
  tracks: PlaylistTrack[];
  topMatch: PlaylistTrack | null;
  isFuzzyCorrected: boolean;
  correctedToTitle: string | null;
}

/**
 * Voice command prefix filler words commonly captured by Speech-to-Text
 * (e.g., "play boukas breeze", "search for never be the same", "find song cielo").
 */
const VOICE_STOP_PREFIXES = [
  /^hey\s+pandivo\s+/i,
  /^ok\s+pandivo\s+/i,
  /^hey\s+sonic\s+/i,
  /^ok\s+sonic\s+/i,
  /^please\s+/i,
  /^can\s+you\s+/i,
  /^play\s+the\s+song\s+/i,
  /^play\s+song\s+/i,
  /^play\s+track\s+/i,
  /^search\s+for\s+song\s+/i,
  /^search\s+for\s+/i,
  /^search\s+song\s+/i,
  /^search\s+/i,
  /^find\s+the\s+song\s+/i,
  /^find\s+song\s+/i,
  /^find\s+/i,
  /^put\s+on\s+/i,
  /^listen\s+to\s+/i,
  /^play\s+/i,
];

/**
 * 1. Elasticsearch `asciifolding` + `lowercase` + punctuation normalizer.
 * Converts "Cielo De Azúcar" -> "cielo de azucar", "Boukas - Breeze" -> "boukas breeze"
 */
export function normalizeElasticText(raw: string): string {
  if (!raw) return '';
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Strip accents/diacritics
    .toLowerCase()
    .replace(/['’`]/g, '') // Strip apostrophes
    .replace(/[^a-z0-9\s]/g, ' ') // Replace punctuation/hyphens with spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strips common spoken voice-intent prefixes ("play ...", "search for ...")
 * while keeping the actual song title if the entire title happens to start with that word.
 */
export function cleanSpeechToTextQuery(rawQuery: string): string {
  let cleaned = rawQuery.trim();
  for (const regex of VOICE_STOP_PREFIXES) {
    const next = cleaned.replace(regex, '').trim();
    if (next.length >= 2) {
      cleaned = next;
    }
  }
  return cleaned;
}

/**
 * 2. Elasticsearch `phonetic` token encoder (Metaphone / Soundex hybrid).
 * Overcomes Speech-to-Text homophones and spelling mistakes:
 * - "bukas" == "boukas" -> "buks"
 * - "breze" == "breeze" == "breez" -> "brs"
 * - "sielo" == "cielo" -> "sil"
 * - "azukar" == "azucar" -> "asukr"
 * - "flai" == "fly" -> "fli"
 * - "hai" == "high" -> "hi"
 * - "seam" == "same" -> "sm"
 */
export function toPhoneticCode(word: string): string {
  const norm = normalizeElasticText(word).replace(/\s+/g, '');
  if (!norm) return '';

  let s = norm
    // Common vowel & diphthong phonetic collapses
    .replace(/igh/g, 'i')
    .replace(/ai|ay|ey/g, 'i')
    .replace(/ea|ee|ie/g, 'e')
    .replace(/ou|ow|oo/g, 'u')
    .replace(/au|aw/g, 'o')
    // Consonant phonetic collapses
    .replace(/ph/g, 'f')
    .replace(/ck|qu|q/g, 'k')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/c/g, 'k')
    .replace(/z/g, 's')
    .replace(/x/g, 'ks')
    .replace(/dg/g, 'j')
    .replace(/gh/g, 'g')
    .replace(/kn|gn/g, 'n')
    .replace(/wr/g, 'r')
    .replace(/wh/g, 'w')
    .replace(/y/g, 'i')
    // Collapse consecutive duplicate letters ("breeze" -> "brese", "bb" -> "b")
    .replace(/(.)\1+/g, '$1');

  // Keep first character (even if vowel) and strip non-leading vowels for consonant skeleton,
  // unless word is very short
  if (s.length > 3) {
    const first = s[0];
    const rest = s.slice(1).replace(/[aeiou]/g, '');
    s = first + rest;
  }

  return s;
}

/**
 * 3. True Damerau-Levenshtein Edit Distance.
 * Handles insertions, deletions, substitutions, AND adjacent character transpositions
 * (e.g., "brezee" <-> "breeze", "teh" <-> "the", "nevr" <-> "never").
 */
export function damerauLevenshteinDistance(a: string, b: string): number {
  const lenA = a.length;
  const lenB = b.length;
  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;
  if (a === b) return 0;

  const dp: number[][] = Array.from({ length: lenA + 1 }, () =>
    new Array(lenB + 1).fill(0)
  );

  for (let i = 0; i <= lenA; i++) dp[i][0] = i;
  for (let j = 0; j <= lenB; j++) dp[0][j] = j;

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );

      // Adjacent transposition check
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + cost);
      }
    }
  }

  return dp[lenA][lenB];
}

/**
 * 4. Character N-Gram (2-gram and 3-gram) Dice Similarity Coefficient.
 * Captures partial/compound word overlaps ("chillhop" vs "chill hop", "azukar" vs "azucar").
 */
export function ngramSimilarity(a: string, b: string, n: number = 2): number {
  const cleanA = a.replace(/\s+/g, '');
  const cleanB = b.replace(/\s+/g, '');
  if (!cleanA || !cleanB) return 0;
  if (cleanA === cleanB) return 1;
  if (cleanA.length < n || cleanB.length < n) {
    return cleanA[0] === cleanB[0] ? 0.5 : 0;
  }

  const gramsA: string[] = [];
  for (let i = 0; i <= cleanA.length - n; i++) {
    gramsA.push(cleanA.slice(i, i + n));
  }
  const gramsB: string[] = [];
  for (let i = 0; i <= cleanB.length - n; i++) {
    gramsB.push(cleanB.slice(i, i + n));
  }

  const bCounts = new Map<string, number>();
  for (const g of gramsB) {
    bCounts.set(g, (bCounts.get(g) || 0) + 1);
  }

  let intersection = 0;
  for (const g of gramsA) {
    const count = bCounts.get(g) || 0;
    if (count > 0) {
      intersection++;
      bCounts.set(g, count - 1);
    }
  }

  return (2 * intersection) / (gramsA.length + gramsB.length);
}

/**
 * Computes Elasticsearch-style fuzzy token score between a single query token
 * and a list of candidate field tokens.
 */
function scoreQueryTokenAgainstFieldTokens(
  qToken: string,
  fieldTokens: string[],
  fieldPhonetics: string[]
): { score: number; type: ElasticTrackMatch['matchType'] } {
  if (!qToken || fieldTokens.length === 0) {
    return { score: 0, type: 'fuzzy' };
  }

  const qPhonetic = toPhoneticCode(qToken);
  let bestScore = 0;
  let bestType: ElasticTrackMatch['matchType'] = 'fuzzy';

  for (let idx = 0; idx < fieldTokens.length; idx++) {
    const fToken = fieldTokens[idx];
    const fPhonetic = fieldPhonetics[idx];

    // 1. Exact token match
    if (fToken === qToken) {
      return { score: 1.0, type: 'exact' };
    }

    // 2. Prefix / Edge N-Gram match (e.g., "bree" -> "breeze")
    if (fToken.startsWith(qToken) || (qToken.length >= 3 && qToken.startsWith(fToken))) {
      const ratio = Math.min(qToken.length, fToken.length) / Math.max(qToken.length, fToken.length);
      const prefixScore = 0.88 + ratio * 0.1;
      if (prefixScore > bestScore) {
        bestScore = prefixScore;
        bestType = 'prefix';
      }
      continue;
    }

    // 3. Substring containment within token
    if (qToken.length >= 3 && fToken.includes(qToken)) {
      const subScore = 0.84;
      if (subScore > bestScore) {
        bestScore = subScore;
        bestType = 'prefix';
      }
    }

    // 4. Phonetic match (Metaphone/Soundex equivalence: "bukas" == "boukas", "sielo" == "cielo")
    if (qPhonetic.length >= 2 && fPhonetic.length >= 2) {
      if (qPhonetic === fPhonetic) {
        const phonScore = 0.86;
        if (phonScore > bestScore) {
          bestScore = phonScore;
          bestType = 'phonetic';
        }
      } else {
        const phonDist = damerauLevenshteinDistance(qPhonetic, fPhonetic);
        const maxPhonLen = Math.max(qPhonetic.length, fPhonetic.length);
        if (phonDist === 1 && maxPhonLen >= 3) {
          const nearPhonScore = 0.76;
          if (nearPhonScore > bestScore) {
            bestScore = nearPhonScore;
            bestType = 'phonetic';
          }
        }
      }
    }

    // 5. Damerau-Levenshtein Edit Distance (Elasticsearch fuzziness: "AUTO")
    const dist = damerauLevenshteinDistance(qToken, fToken);
    const maxLen = Math.max(qToken.length, fToken.length);
    // Allowed edit distance based on token length
    const allowedEdits = qToken.length <= 2 ? 0 : qToken.length <= 5 ? 2 : 3;

    if (dist <= allowedEdits && maxLen > 0) {
      const editSimilarity = 1 - dist / maxLen;
      // Scale into [0.55 .. 0.85]
      const fuzzyScore = 0.45 + editSimilarity * 0.42;
      if (fuzzyScore > bestScore) {
        bestScore = fuzzyScore;
        bestType = 'fuzzy';
      }
    }

    // 6. Bigram similarity fallback for split/compound words
    const biSim = ngramSimilarity(qToken, fToken, 2);
    if (biSim >= 0.55) {
      const ngScore = biSim * 0.8;
      if (ngScore > bestScore) {
        bestScore = ngScore;
        bestType = 'ngram';
      }
    }
  }

  return { score: bestScore, type: bestType };
}

/**
 * Evaluates a single field (e.g., track.title, track.artist, track.album)
 * against the normalized query and query tokens.
 */
function evaluateFieldMatch(
  queryNorm: string,
  queryTokens: string[],
  fieldRaw: string,
  fieldWeight: number
): { score: number; matchType: ElasticTrackMatch['matchType'] } {
  const fieldNorm = normalizeElasticText(fieldRaw);
  if (!fieldNorm || !queryNorm) return { score: 0, matchType: 'fuzzy' };

  // Full phrase exact or substring match
  if (fieldNorm === queryNorm) {
    return { score: 100 * fieldWeight, matchType: 'exact' };
  }
  if (fieldNorm.startsWith(queryNorm)) {
    return { score: 94 * fieldWeight, matchType: 'prefix' };
  }
  if (fieldNorm.includes(queryNorm)) {
    return { score: 88 * fieldWeight, matchType: 'exact' };
  }

  const fieldTokens = fieldNorm.split(' ').filter(Boolean);
  const fieldPhonetics = fieldTokens.map(toPhoneticCode);

  // Token-by-token Elasticsearch multi-match scoring
  let totalTokenScore = 0;
  let matchedTokenCount = 0;
  let dominantType: ElasticTrackMatch['matchType'] = 'exact';

  for (const qTok of queryTokens) {
    const { score, type } = scoreQueryTokenAgainstFieldTokens(
      qTok,
      fieldTokens,
      fieldPhonetics
    );
    totalTokenScore += score;
    if (score >= 0.52) {
      matchedTokenCount++;
    }
    if (type !== 'exact' && dominantType === 'exact') {
      dominantType = type;
    }
  }

  const avgTokenScore =
    queryTokens.length > 0 ? totalTokenScore / queryTokens.length : 0;
  const coverageRatio =
    queryTokens.length > 0 ? matchedTokenCount / queryTokens.length : 0;

  // Whole-phrase N-Gram similarity boost (handles joined/split words like "spacekid" vs "space kid")
  const phraseBigramSim = ngramSimilarity(queryNorm, fieldNorm, 2);

  const combined =
    (avgTokenScore * 0.72 + coverageRatio * 0.18 + phraseBigramSim * 0.1) *
    85 *
    fieldWeight;

  return {
    score: combined,
    matchType: dominantType,
  };
}

/**
 * Main Elasticsearch-style search across a playlist's tracks.
 * Prioritizes Song Title (`boost: 1.35`), then Artist (`boost: 0.85`), then Album (`boost: 0.65`).
 * Automatically handles speech-to-text phonetic variations, accents, and spelling mistakes.
 */
export function searchPlaylistTracksElastic(
  tracks: PlaylistTrack[],
  rawQuery: string
): ElasticPlaylistSearchResult {
  const trimmed = rawQuery.trim();
  if (!trimmed) {
    return {
      query: '',
      cleanedQuery: '',
      matches: tracks.map((t) => ({
        track: t,
        score: 100,
        matchType: 'exact',
        matchedField: 'title',
      })),
      tracks,
      topMatch: tracks[0] || null,
      isFuzzyCorrected: false,
      correctedToTitle: null,
    };
  }

  const cleanedQuery = cleanSpeechToTextQuery(trimmed);
  const queryNorm = normalizeElasticText(cleanedQuery || trimmed);
  const queryTokens = queryNorm.split(' ').filter(Boolean);

  if (queryTokens.length === 0) {
    return {
      query: trimmed,
      cleanedQuery: trimmed,
      matches: [],
      tracks,
      topMatch: tracks[0] || null,
      isFuzzyCorrected: false,
      correctedToTitle: null,
    };
  }

  const scoredMatches: ElasticTrackMatch[] = [];

  for (const track of tracks) {
    // Evaluate Song Title (Primary target with 1.35x boost as requested)
    const titleEval = evaluateFieldMatch(
      queryNorm,
      queryTokens,
      track.title,
      1.35
    );

    // Evaluate Artist (Secondary target with 0.85x boost)
    const artistEval = evaluateFieldMatch(
      queryNorm,
      queryTokens,
      track.artist,
      0.85
    );

    // Evaluate Album (Tertiary target with 0.65x boost)
    const albumEval = evaluateFieldMatch(
      queryNorm,
      queryTokens,
      track.album,
      0.65
    );

    let bestScore = titleEval.score;
    let bestType = titleEval.matchType;
    let bestField: ElasticTrackMatch['matchedField'] = 'title';

    if (artistEval.score > bestScore) {
      bestScore = artistEval.score;
      bestType = artistEval.matchType;
      bestField = 'artist';
    }
    if (albumEval.score > bestScore) {
      bestScore = albumEval.score;
      bestType = albumEval.matchType;
      bestField = 'album';
    }

    scoredMatches.push({
      track,
      score: bestScore,
      matchType: bestType,
      matchedField: bestField,
    });
  }

  // Sort descending by Elasticsearch relevance score
  scoredMatches.sort((a, b) => b.score - a.score);

  // Dynamic minimum relevance threshold so typos still match while irrelevant tracks are filtered out
  const topScore = scoredMatches[0]?.score ?? 0;
  const minThreshold = Math.max(46, topScore * 0.58);

  let filteredMatches = scoredMatches.filter((m) => m.score >= minThreshold);

  // If the user made a very heavy typo where even the best score is between 32 and 46,
  // still return the top 5 closest fuzzy matches so the user is never stuck on an empty list!
  if (filteredMatches.length === 0 && topScore >= 28) {
    filteredMatches = scoredMatches.slice(0, 5);
  }

  const topHit = filteredMatches[0] || null;
  const isFuzzyCorrected =
    !!topHit &&
    (topHit.matchType === 'phonetic' ||
      topHit.matchType === 'fuzzy' ||
      topHit.matchType === 'ngram' ||
      !normalizeElasticText(topHit.track.title).includes(queryNorm));

  return {
    query: trimmed,
    cleanedQuery,
    matches: filteredMatches,
    tracks: filteredMatches.map((m) => m.track),
    topMatch: topHit?.track || null,
    isFuzzyCorrected,
    correctedToTitle: topHit ? topHit.track.title : null,
  };
}
