import { PlaylistTrack } from '../data/playlistData';

/**
 * Reuse the existing project Gemini API setup (Section 21).
 */
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-3.5-flash';

export interface SongAiInsight {
  trackId: string;
  title: string;
  artist: string;
  album: string;
  summary: string;
  musicalStyle: string;
  moodAndVibe: string;
  productionHighlight: string;
  generatedAt: number;
}

/**
 * Mandatory Per-Song-ID Cache & Pending Request Deduplication Map (Sections 22–24).
 * Keyed strictly by `playingTrack.id`.
 */
const songInfoCache = new Map<string, SongAiInsight>();
const pendingAIRequests = new Map<string, Promise<SongAiInsight>>();

const SONG_INFO_SYSTEM_PROMPT = `
You are PANDIVO AI, a knowledgeable musicologist and curator for a Fire TV / Android TV music app.
Given a track's title, artist, album, and duration, return a concise, engaging JSON object describing the song.
Return ONLY valid JSON without markdown code fences.

Schema:
{
  "summary": "2-sentence engaging overview of the track's sonic character and artistic feel.",
  "musicalStyle": "Short phrase describing genre, tempo, and rhythmic signature (e.g., 'Warm Lo-Fi Chillhop • 86 BPM • Mellow Boom-Bap Groove').",
  "moodAndVibe": "Short phrase describing emotional tone and ideal listening moment (e.g., 'Golden hour relaxation, late-night focus, and serene unwinding').",
  "productionHighlight": "1-sentence highlight about the instrumentation, texture, or arrangement (e.g., 'Features Rhodes electric piano chords layered over dusty vinyl percussion and warm sub-bass.')."
}
`;

/**
 * Deterministic rich fallback generator if network/API is unreachable,
 * ensuring the overlay remains resilient while still caching per track.id.
 */
function buildRichSongInsight(track: PlaylistTrack, playlistTitle?: string): SongAiInsight {
  const lowerTitle = track.title.toLowerCase();
  const lowerAlbum = track.album.toLowerCase();

  let musicalStyle = 'Atmospheric Electronic & Chillhop • 88 BPM • Warm Analog Groove';
  let moodAndVibe = 'Late-night reflection, deep focus, and immersive living-room listening';
  let productionHighlight = `Blends expressive melodic phrasing by ${track.artist} with lush stereo textures and crisp rhythmic pocket from "${track.album}".`;

  if (lowerTitle.includes('acoustic') || lowerAlbum.includes('acoustic') || lowerAlbum.includes('sunrise')) {
    musicalStyle = 'Organic Acoustic & Indie Folk • 96 BPM • Natural Warmth';
    moodAndVibe = 'Bright morning energy, sunlit calm, and uplifting acoustic clarity';
    productionHighlight = `Showcases intimate fingerstyle guitar harmonics and airy room reverb crafted by ${track.artist}.`;
  } else if (lowerTitle.includes('breeze') || lowerAlbum.includes('chillhop') || lowerAlbum.includes('lo-fi')) {
    musicalStyle = 'Jazz-Infused Lo-Fi Chillhop • 84 BPM • Dusty Vinyl Pocket';
    moodAndVibe = 'Sunset unwinding, creative flow, and effortless relaxation';
    productionHighlight = `Pairs silky jazz-chord progressions with soft tape saturation and laid-back percussion on "${track.album}".`;
  } else if (lowerTitle.includes('mix') || lowerTitle.includes('live it up') || lowerAlbum.includes('bass')) {
    musicalStyle = 'High-Energy Progressive Electronic • 124 BPM • Driving Synth Pulse';
    moodAndVibe = 'Peak momentum, high-adrenaline focus, and dynamic forward motion';
    productionHighlight = `Built around punchy low-end basslines, wide arpeggiated synths, and crisp transient dynamics by ${track.artist}.`;
  } else if (lowerTitle.includes('ocean') || lowerTitle.includes('spark') || lowerTitle.includes('cielo')) {
    musicalStyle = 'Dreamy Ambient & Melodic Electronica • 90 BPM • Wide Soundstage';
    moodAndVibe = 'Weightless daydreaming, tranquil serenity, and panoramic calm';
    productionHighlight = `Layers shimmering vocal/synth textures over delicate sub-harmonic swells and crystalline reverb tails.`;
  }

  const contextLabel = playlistTitle ? ` curated for the "${playlistTitle}" collection` : '';

  return {
    trackId: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album,
    summary: `"${track.title}" by ${track.artist} is a standout track from the album "${track.album}" (${track.duration})${contextLabel}. It combines immersive sonic depth with an inviting melodic hook tailored for big-screen TV audio.`,
    musicalStyle,
    moodAndVibe,
    productionHighlight,
    generatedAt: Date.now(),
  };
}

/**
 * Synchronous check for an existing cached song insight by track.id.
 */
export function getCachedSongInfo(trackId: string): SongAiInsight | null {
  return songInfoCache.get(trackId) ?? null;
}

/**
 * Fetches or returns cached AI song information for `track.id`.
 * - Immediate cache hit if `songInfoCache.has(track.id)`
 * - Deduplicates concurrent calls via `pendingAIRequests.get(track.id)`
 */
export async function fetchOrGetSongInfo(
  track: PlaylistTrack,
  playlistTitle?: string
): Promise<SongAiInsight> {
  const trackId = track.id;

  // 1. Check primary cache by stable playingTrack.id
  const cached = songInfoCache.get(trackId);
  if (cached) {
    console.log(`[AI Song Info] Cache HIT for track.id="${trackId}" ("${track.title}")`);
    return cached;
  }

  // 2. Check pending requests map to prevent duplicate Gemini calls on rapid INFO presses
  const existingPromise = pendingAIRequests.get(trackId);
  if (existingPromise) {
    console.log(`[AI Song Info] Reusing in-flight Gemini request for track.id="${trackId}"`);
    return existingPromise;
  }

  // 3. Create single in-flight request and store in pendingAIRequests
  console.log(`[AI Song Info] Cache MISS for track.id="${trackId}" -> Requesting Gemini insight...`);
  const requestPromise = (async (): Promise<SongAiInsight> => {
    try {
      const userPrompt = `Generate song insight for:
Track ID: ${track.id}
Title: "${track.title}"
Artist: "${track.artist}"
Album: "${track.album}"
Duration: ${track.duration}
Playlist Context: "${playlistTitle || 'PANDIVO Featured Playlist'}"`;

      const payload = JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        systemInstruction: {
          parts: [{ text: SONG_INFO_SYSTEM_PROMPT }],
        },
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: payload,
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (parsed && parsed.summary) {
            const insight: SongAiInsight = {
              trackId,
              title: track.title,
              artist: track.artist,
              album: track.album,
              summary: String(parsed.summary),
              musicalStyle: String(parsed.musicalStyle || 'Curated Sonic Selection'),
              moodAndVibe: String(parsed.moodAndVibe || 'Immersive TV Audio Experience'),
              productionHighlight: String(
                parsed.productionHighlight ||
                  `Mastered for rich dynamic range on "${track.album}".`
              ),
              generatedAt: Date.now(),
            };
            songInfoCache.set(trackId, insight);
            return insight;
          }
        }
      }
    } catch (err) {
      console.warn(`[AI Song Info] Gemini API fallback triggered for ${trackId}:`, err);
    }

    // Store deterministic insight in cache so subsequent opens are instant cache hits
    const fallbackInsight = buildRichSongInsight(track, playlistTitle);
    songInfoCache.set(trackId, fallbackInsight);
    return fallbackInsight;
  })();

  pendingAIRequests.set(trackId, requestPromise);

  try {
    const result = await requestPromise;
    return result;
  } finally {
    pendingAIRequests.delete(trackId);
  }
}
