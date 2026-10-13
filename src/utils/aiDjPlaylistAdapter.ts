import { AIDJSession } from '../services/aiDjSessionService';
import { MusicIntent } from '../services/geminiIntentService';
import { TRACK_CATALOG, MusicTrack } from '../services/musicCatalog';
import { PlaylistData, PlaylistTrack } from '../data/playlistData';

const AI_DJ_CARD_COVERS = [
  require('../../assets/ui/ai_dj_card_0.jpg'),
  require('../../assets/ui/ai_dj_card_1.jpg'),
  require('../../assets/ui/ai_dj_card_2.jpg'),
  require('../../assets/ui/ai_dj_card_3.jpg'),
  require('../../assets/ui/ai_dj_card_4.jpg'),
  require('../../assets/ui/ai_dj_card_5.jpg'),
];

const LOCAL_ARTWORKS = [
  require('../../assets/ui/rec_0_until_found_clean.png'),
  require('../../assets/ui/rec_1_sapphire_clean.png'),
  require('../../assets/ui/rec_2_slow_life_clean.png'),
  require('../../assets/ui/rec_3_beautiful_things_clean.png'),
  require('../../assets/ui/rec_4_golden_hour_clean.png'),
  require('../../assets/ui/rec_5_midnight_clean.png'),
];

export function formatTrackDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function formatTotalPlaylistDuration(tracks: PlaylistTrack[]): string {
  if (!tracks || tracks.length === 0) return '0m';
  const totalSec = tracks.reduce((sum, t) => sum + (t.durationSeconds || 180), 0);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.max(1, Math.round((totalSec % 3600) / 60));
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}

/**
 * Returns dynamic mood-matched theme accent color for badges, visualizer, and hero glow.
 */
export function getAiDjAccentColor(mood?: string | null, context?: string | null): string {
  const m = (mood || '').toLowerCase();
  const c = (context || '').toLowerCase();

  if (c.includes('workout') || m === 'energetic') {
    return '#EF4444'; // Vibrant Crimson / Flame
  }
  if (c.includes('focus') || c.includes('study') || m === 'focused') {
    return '#06B6D4'; // Electric Cyan / Ocean
  }
  if (c.includes('night') || c.includes('sleep') || m === 'dark') {
    return '#8B5CF6'; // Neon Violet / Twilight
  }
  if (c.includes('party') || m === 'party') {
    return '#F43F5E'; // Electric Magenta / Pink
  }
  if (m === 'happy' || c.includes('morning')) {
    return '#F59E0B'; // Golden Amber / Sunrise
  }
  if (m === 'calm' || m === 'chill' || c.includes('rain')) {
    return '#10B981'; // Warm Emerald / Sage
  }
  return '#6366F1'; // Signature Indigo
}

/**
 * Returns single fallback cover image (used if grid is not available)
 */
export function getAiDjCoverImage(mood?: string | null, context?: string | null): any {
  const m = (mood || '').toLowerCase();
  const c = (context || '').toLowerCase();

  if (c.includes('workout') || m === 'energetic') {
    return AI_DJ_CARD_COVERS[3]; // Workout Energy
  }
  if (c.includes('focus') || c.includes('study') || m === 'focused') {
    return AI_DJ_CARD_COVERS[1]; // Focus Flow
  }
  if (c.includes('night') || c.includes('sleep') || m === 'dark') {
    return AI_DJ_CARD_COVERS[2]; // Late Night Drive
  }
  if (m === 'happy' || c.includes('morning')) {
    return AI_DJ_CARD_COVERS[5]; // Feel Good
  }
  return AI_DJ_CARD_COVERS[0]; // Chill Vibes
}

/**
 * Formats a clean, readable playlist title directly from the user's explicit voice query.
 * For example:
 * - "create a travelling playlist" -> "Travelling Playlist"
 * - "chill playlist" -> "Chill Playlist"
 * - "make a workout playlist" -> "Workout Playlist"
 * - "play travelling music" -> "Travelling Music Mix"
 */
export function formatTitleFromUserRequest(userRequest?: string): string | null {
  if (!userRequest) return null;
  let cleaned = userRequest.trim();
  // Strip simulated test tags: [simulate:...]
  cleaned = cleaned.replace(/\[simulate:[^\]]+\]/gi, '').trim();
  // Strip leading action verbs and phrases
  cleaned = cleaned
    .replace(
      /^(please\s+)?(create|make|generate|build|give me|put on|play|start|be my dj for|listen to)\s+(a|an|me a|me an|some)?\s*/i,
      ''
    )
    .trim();
  // Strip trailing punctuation
  cleaned = cleaned.replace(/[.?!]+$/, '').trim();

  // If empty, too short, or just generic words like "music" / "songs"
  if (
    cleaned.length < 3 ||
    /^(music|songs|song|playlist|tracks|track)$/i.test(cleaned)
  ) {
    return null;
  }

  // Capitalize words properly
  const words = cleaned
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  let title = words.join(' ');

  // If title doesn't already contain a suffix like Playlist, Mix, Flow, Session, or Vibes, append "Mix"
  if (!/(\bplaylist\b|\bmix\b|\bflow\b|\bsession\b|\bvibes\b)/i.test(title)) {
    title = `${title} Mix`;
  }

  return title;
}

/**
 * Resolves a dynamic, generative AI DJ playlist title.
 * Prioritizes the user's explicit request title first, followed by Gemini's suggested_title and procedural titles.
 */
export function getAiDjPlaylistTitle(
  intent?: MusicIntent,
  userRequest?: string,
  session?: AIDJSession
): string {
  // 1. Direct title extracted from what the user explicitly requested (e.g. "Travelling Playlist", "Chill Playlist")
  const userTitle = formatTitleFromUserRequest(userRequest);
  if (userTitle) {
    return userTitle;
  }

  // 2. Direct generative title from Gemini if available
  if (intent?.suggested_title && intent.suggested_title.trim().length > 3) {
    return intent.suggested_title.trim();
  }

  // 2. Procedural evocative titles based on context / mood
  const context = (intent?.context || '').toLowerCase();
  const mood = (intent?.mood || session?.targetMood || '').toLowerCase();

  if (context.includes('workout') || mood === 'energetic') {
    return 'Hyperdrive Neon Cardio';
  }
  if (context.includes('study') || context.includes('focus') || mood === 'focused') {
    return 'Deep Flow State';
  }
  if (context.includes('night') || mood === 'dark') {
    return 'Midnight Neon Drive';
  }
  if (context.includes('rain')) {
    return 'Raindrops & Lo-Fi Reverie';
  }
  if (context.includes('party')) {
    return 'Electric Sunset Groove';
  }
  if (mood === 'calm' || mood === 'chill') {
    return 'Golden Hour Acoustic Flow';
  }
  if (mood === 'happy') {
    return 'Feel-Good Horizon';
  }
  if (mood === 'love' || mood === 'romantic') {
    return 'Velvet Twilight Romance';
  }
  if (mood === 'sad') {
    return 'Soulful Midnight Reflections';
  }

  if (intent?.genres && intent.genres.length > 0) {
    const genre = intent.genres[0];
    const capGenre = genre.charAt(0).toUpperCase() + genre.slice(1);
    return `${capGenre} Session Flow`;
  }

  if (userRequest && userRequest.length < 32 && !userRequest.includes('[')) {
    const cleaned = userRequest.replace(/^(play|start|put on|be my dj for)\s+/i, '').trim();
    if (cleaned.length > 2) {
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1) + ' Flow';
    }
  }

  return 'AI DJ Dynamic Flow';
}

export function getAiDjPlaylistTagline(
  intent?: MusicIntent,
  session?: AIDJSession
): string {
  if (intent?.reason) return intent.reason;
  const mood = session?.targetMood || intent?.mood || 'chill';
  return `Curated continuous ${mood} flow with dynamic energy balancing.`;
}

export function getAiDjPlaylistDescription(
  intent?: MusicIntent,
  session?: AIDJSession,
  starterTrackTitle?: string,
  starterArtist?: string
): string {
  // 1. Direct editorial narrative from Gemini
  if (intent?.editorial_description && intent.editorial_description.trim().length > 15) {
    return intent.editorial_description.trim();
  }

  // 2. DJ commentary from session engine
  if (session?.djCommentary && session.djCommentary.length > 15) {
    return session.djCommentary;
  }

  // 3. Procedural contextual narrative
  const mood = session?.targetMood || intent?.mood || 'calm';
  if (starterTrackTitle && starterArtist) {
    return `AI-curated ${mood} journey opening with "${starterTrackTitle}" by ${starterArtist}, sequenced with continuous energy balancing and smooth transitions.`;
  }

  return `Specially curated continuous ${mood} soundscape engineered by AI DJ with dynamic tempo matching and energy balancing.`;
}

/**
 * Converts a completed AIDJSession into full PlaylistData for PlaylistScreen.
 * Includes:
 * - 4-track 2x2 album art collage coverGrid
 * - Dynamic generative title & editorial storytelling
 * - Mood-matched dynamic theme accent
 * - 100% of generated session tracks
 */
export function convertAiDjSessionToPlaylist(
  session: AIDJSession,
  userRequest?: string,
  intent?: MusicIntent
): PlaylistData {
  // Combine starter track + all queue tracks (e.g. 18 tracks)
  const allTracks: MusicTrack[] = [
    session.currentTrack,
    ...(session.queue || []),
  ];

  const playlistTracks: PlaylistTrack[] = allTracks.map((trk, idx) => ({
    id: trk.id,
    trackNumber: idx + 1,
    title: trk.title,
    artist: trk.artist,
    album: trk.album || 'AI DJ Curated Session',
    duration: formatTrackDuration(trk.duration || 240),
    durationSeconds: trk.duration || 240,
    audioUrl: trk.audioUrl,
    artwork:
      trk.artworkUrl && trk.artworkUrl.startsWith('http')
        ? { uri: trk.artworkUrl }
        : LOCAL_ARTWORKS[idx % LOCAL_ARTWORKS.length],
    isFavorite: false,
  }));

  // Dynamic 4-track 2x2 collage grid extracted from the first 4 unique tracks
  const coverGrid = playlistTracks.slice(0, 4).map((t) => t.artwork);

  const title = getAiDjPlaylistTitle(intent, userRequest, session);
  const tagline = getAiDjPlaylistTagline(intent, session);
  const description = getAiDjPlaylistDescription(
    intent,
    session,
    session.currentTrack?.title,
    session.currentTrack?.artist
  );
  const coverImage = getAiDjCoverImage(session.targetMood, intent?.context);
  const bannerAccentColor = getAiDjAccentColor(session.targetMood, intent?.context);

  return {
    id: `aidj_${session.id}`,
    title,
    tagline,
    creator: 'AI DJ',
    creatorAvatar: require('../../assets/ui/avatar_clean.png'),
    songsCount: `${playlistTracks.length} songs`,
    totalDuration: formatTotalPlaylistDuration(playlistTracks),
    description,
    coverImage,
    coverGrid: coverGrid.length >= 4 ? coverGrid : undefined,
    bannerAccentColor,
    badgeText: 'AI DJ MIX',
    quoteText: 'Good Music\nBetter Days ♥',
    tracks: playlistTracks,
  };
}

/**
 * Reconstructs a full PlaylistData object from an AI DJ session stored in SQLite.
 */
export function convertStoredAiDjToPlaylist(stored: {
  session_id: string;
  title: string;
  user_prompt?: string | null;
  mood?: string | null;
  track_ids: string[];
  created_at: number;
}): PlaylistData {
  const tracks: PlaylistTrack[] = (stored.track_ids || []).map((id, idx) => {
    const trk =
      TRACK_CATALOG.find((t) => t.id === id) ||
      TRACK_CATALOG[idx % TRACK_CATALOG.length];
    return {
      id: trk.id,
      trackNumber: idx + 1,
      title: trk.title,
      artist: trk.artist,
      album: trk.album || 'AI DJ Curated Session',
      duration: formatTrackDuration(trk.duration || 240),
      durationSeconds: trk.duration || 240,
      audioUrl: trk.audioUrl,
      artwork:
        trk.artworkUrl && trk.artworkUrl.startsWith('http')
          ? { uri: trk.artworkUrl }
          : LOCAL_ARTWORKS[idx % LOCAL_ARTWORKS.length],
      isFavorite: false,
    };
  });

  const coverGrid = tracks.slice(0, 4).map((t) => t.artwork);
  const coverImage = getAiDjCoverImage(stored.mood);
  const bannerAccentColor = getAiDjAccentColor(stored.mood);
  const playlistId = stored.session_id.startsWith('aidj_')
    ? stored.session_id
    : `aidj_${stored.session_id}`;

  return {
    id: playlistId,
    title: stored.title,
    tagline: `Curated continuous ${stored.mood || 'chill'} flow with dynamic energy balancing.`,
    creator: 'AI DJ',
    creatorAvatar: require('../../assets/ui/avatar_clean.png'),
    songsCount: `${tracks.length} songs`,
    totalDuration: formatTotalPlaylistDuration(tracks),
    description: `AI-curated ${stored.mood || 'chill'} journey sequenced with continuous energy balancing and smooth transitions.`,
    coverImage,
    coverGrid: coverGrid.length >= 4 ? coverGrid : undefined,
    bannerAccentColor,
    badgeText: 'AI DJ MIX',
    quoteText: 'Good Music\nBetter Days ♥',
    tracks,
  };
}

