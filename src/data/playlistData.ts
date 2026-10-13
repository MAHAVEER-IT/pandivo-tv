import { AUDIUS_CURATED_TRACKS } from '../services/audiusMusicService';
import {
  GENERATED_AUDIUS_CATALOG,
  GeneratedCatalogTrack,
} from './generatedAudiusCatalog';

export interface PlaylistTrack {
  id: string;
  trackNumber: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  durationSeconds: number;
  audioUrl: string;
  artwork: any;
  isFavorite?: boolean;
  license?: string;
}

export interface PlaylistData {
  id: string;
  title: string;
  tagline: string;
  creator: string;
  creatorAvatar: any;
  songsCount: string;
  totalDuration: string;
  description: string;
  coverImage: any;
  coverGrid?: any[];
  isHeartCover?: boolean;
  bannerAccentColor: string;
  badgeText: string;
  quoteText: string;
  tracks: PlaylistTrack[];
}

const LOCAL_ARTWORKS = [
  require('../../assets/ui/rec_0_until_found_clean.png'),
  require('../../assets/ui/rec_1_sapphire_clean.png'),
  require('../../assets/ui/rec_2_slow_life_clean.png'),
  require('../../assets/ui/rec_3_beautiful_things_clean.png'),
  require('../../assets/ui/rec_4_golden_hour_clean.png'),
  require('../../assets/ui/rec_5_midnight_clean.png'),
];

export function formatTotalPlaylistDuration(tracks: PlaylistTrack[]): string {
  const totalSec = tracks.reduce((sum, t) => sum + (t.durationSeconds || 180), 0);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.max(1, Math.round((totalSec % 3600) / 60));
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}

function buildFullPlaylistTracks(
  playlistKey: string,
  idPrefix: string,
  seedTracks: Omit<PlaylistTrack, 'id' | 'trackNumber'>[],
  targetTotal: number
): PlaylistTrack[] {
  const generatedList: GeneratedCatalogTrack[] =
    GENERATED_AUDIUS_CATALOG[playlistKey] || [];
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const combined: Omit<PlaylistTrack, 'id' | 'trackNumber'>[] = [];

  for (const s of seedTracks) {
    seenUrls.add(s.audioUrl);
    seenTitles.add(s.title.toLowerCase().trim());
    combined.push(s);
  }

  for (const g of generatedList) {
    if (combined.length >= targetTotal) break;
    const normTitle = g.title.toLowerCase().trim();
    if (seenUrls.has(g.audioUrl) || seenTitles.has(normTitle)) continue;
    seenUrls.add(g.audioUrl);
    seenTitles.add(normTitle);
    combined.push({
      title: g.title,
      artist: g.artist,
      album: g.album,
      duration: g.duration,
      durationSeconds: g.durationSeconds,
      audioUrl: g.audioUrl,
      artwork: LOCAL_ARTWORKS[g.artworkIndex % LOCAL_ARTWORKS.length],
      isFavorite: false,
      license: g.license,
    });
  }

  return combined.map((item, idx) => ({
    ...item,
    id: `${idPrefix}_${idx + 1}`,
    trackNumber: idx + 1,
  }));
}

const CHILL_TRACKS = buildFullPlaylistTracks(
  'chill_vibes',
  'trk_chill',
  [
    {
      title: 'Boukas - Breeze',
      artist: 'Chillhop Music',
      album: 'Chillhop Essentials',
      duration: '2:03',
      durationSeconds: 123,
      audioUrl: AUDIUS_CURATED_TRACKS.chill_vibes[0].audioUrl,
      artwork: LOCAL_ARTWORKS[0],
      isFavorite: false,
    },
    {
      title: 'Never be the Same',
      artist: 'Bmb Spacekid',
      album: 'Chillhop Lo-Fi',
      duration: '3:28',
      durationSeconds: 208,
      audioUrl: AUDIUS_CURATED_TRACKS.chill_vibes[1].audioUrl,
      artwork: LOCAL_ARTWORKS[1],
      isFavorite: false,
    },
    {
      title: 'Fly High Zuly Sky Mix',
      artist: 'ICT - DJ Lexo',
      album: 'Skyline Lo-Fi',
      duration: '4:24',
      durationSeconds: 264,
      audioUrl: AUDIUS_CURATED_TRACKS.chill_vibes[2].audioUrl,
      artwork: LOCAL_ARTWORKS[2],
      isFavorite: false,
    },
    {
      title: 'Cielo De Azúcar',
      artist: 'Oscaribarraflorez',
      album: 'Dulce Horizonte',
      duration: '3:18',
      durationSeconds: 198,
      audioUrl: AUDIUS_CURATED_TRACKS.chill_vibes[3].audioUrl,
      artwork: LOCAL_ARTWORKS[3],
      isFavorite: false,
    },
    {
      title: 'Demon Planet Blues v2',
      artist: 'Oscaribarraflorez',
      album: 'Echoes of Calm',
      duration: '2:46',
      durationSeconds: 166,
      audioUrl: AUDIUS_CURATED_TRACKS.chill_vibes[4].audioUrl,
      artwork: LOCAL_ARTWORKS[4],
      isFavorite: false,
    },
  ],
  78
);

const FOCUS_TRACKS = buildFullPlaylistTracks(
  'focus_mix',
  'trk_foc',
  [
    {
      title: 'dear ocean (ft. NATURE)',
      artist: 'Petit Biscuit',
      album: 'Presence',
      duration: '3:26',
      durationSeconds: 206,
      audioUrl: AUDIUS_CURATED_TRACKS.focus_mix[0].audioUrl,
      artwork: LOCAL_ARTWORKS[1],
      isFavorite: false,
    },
    {
      title: 'your spark remains',
      artist: 'Petit Biscuit',
      album: 'Parachute',
      duration: '2:06',
      durationSeconds: 126,
      audioUrl: AUDIUS_CURATED_TRACKS.focus_mix[1].audioUrl,
      artwork: LOCAL_ARTWORKS[2],
      isFavorite: false,
    },
    {
      title: 'Unwritten Promises',
      artist: 'Oscaribarraflorez',
      album: 'Inner Light',
      duration: '2:55',
      durationSeconds: 175,
      audioUrl: AUDIUS_CURATED_TRACKS.focus_mix[2].audioUrl,
      artwork: LOCAL_ARTWORKS[0],
      isFavorite: false,
    },
    {
      title: 'Goodnight',
      artist: 'Jeff Sleeman',
      album: 'Sleep & Focus',
      duration: '1:38',
      durationSeconds: 98,
      audioUrl: AUDIUS_CURATED_TRACKS.focus_mix[3].audioUrl,
      artwork: LOCAL_ARTWORKS[5],
      isFavorite: false,
    },
  ],
  75
);

const WORKOUT_TRACKS = buildFullPlaylistTracks(
  'workout_mix',
  'trk_wrk',
  [
    {
      title: 'Does Anybody Have Any Water?',
      artist: 'BLACKTYDE',
      album: 'Hydrate EP',
      duration: '3:06',
      durationSeconds: 186,
      audioUrl: AUDIUS_CURATED_TRACKS.workout_mix[0].audioUrl,
      artwork: LOCAL_ARTWORKS[3],
      isFavorite: false,
    },
    {
      title: 'Live It Up (Original Mix)',
      artist: 'GORDO DJ (BR)',
      album: 'Bassline Heat',
      duration: '4:04',
      durationSeconds: 244,
      audioUrl: AUDIUS_CURATED_TRACKS.workout_mix[1].audioUrl,
      artwork: LOCAL_ARTWORKS[4],
      isFavorite: false,
    },
    {
      title: 'Watch',
      artist: 'sayara 🦋',
      album: 'Future Beat',
      duration: '2:54',
      durationSeconds: 174,
      audioUrl: AUDIUS_CURATED_TRACKS.workout_mix[2].audioUrl,
      artwork: LOCAL_ARTWORKS[1],
      isFavorite: false,
    },
    {
      title: 'August Glow',
      artist: 'zaza',
      album: 'Summer Beat',
      duration: '1:53',
      durationSeconds: 113,
      audioUrl: AUDIUS_CURATED_TRACKS.workout_mix[3].audioUrl,
      artwork: LOCAL_ARTWORKS[5],
      isFavorite: false,
    },
  ],
  75
);

const STUDY_TRACKS = buildFullPlaylistTracks(
  'study_mix',
  'trk_std',
  [],
  75
);

const ENERGIZE_TRACKS = buildFullPlaylistTracks(
  'energize_morning',
  'trk_enrg',
  [
    {
      title: 'Breathing Underwater (Acoustic)',
      artist: 'Jason Langvee',
      album: 'Morning Coffee Acoustic',
      duration: '2:45',
      durationSeconds: 165,
      audioUrl: AUDIUS_CURATED_TRACKS.energize_morning[0].audioUrl,
      artwork: LOCAL_ARTWORKS[4],
      isFavorite: false,
    },
    {
      title: 'Deleite Camalú',
      artist: 'Oscaribarraflorez',
      album: 'Sunrise Acoustic',
      duration: '3:09',
      durationSeconds: 189,
      audioUrl: AUDIUS_CURATED_TRACKS.energize_morning[1].audioUrl,
      artwork: LOCAL_ARTWORKS[3],
      isFavorite: false,
    },
    {
      title: 'Tall Trees (Acoustic)',
      artist: 'Jason Langvee',
      album: 'Coastline Acoustic',
      duration: '2:00',
      durationSeconds: 120,
      audioUrl: AUDIUS_CURATED_TRACKS.energize_morning[2].audioUrl,
      artwork: LOCAL_ARTWORKS[2],
      isFavorite: false,
    },
    {
      title: 'If You Want It (Acoustic)',
      artist: 'Jason Langvee',
      album: 'Golden Mornings',
      duration: '2:41',
      durationSeconds: 161,
      audioUrl: AUDIUS_CURATED_TRACKS.energize_morning[3].audioUrl,
      artwork: LOCAL_ARTWORKS[0],
      isFavorite: false,
    },
  ],
  75
);

const MIDNIGHT_TRACKS = buildFullPlaylistTracks(
  'midnight_dreams',
  'trk_mid',
  [],
  75
);

export const PLAYLISTS: Record<string, PlaylistData> = {
  chill_vibes: {
    id: 'chill_vibes',
    title: 'Chill Vibes',
    tagline: 'Relax. Focus. Feel good.',
    creator: 'Mahaveer K',
    creatorAvatar: require('../../assets/ui/avatar_clean.png'),
    songsCount: `${CHILL_TRACKS.length} songs`,
    totalDuration: formatTotalPlaylistDuration(CHILL_TRACKS),
    description: 'A collection of peaceful and uplifting tracks to keep you chill throughout the day.',
    coverImage: require('../../assets/playlists/cover_chill_vibes.jpg'),
    bannerAccentColor: '#6366F1',
    badgeText: 'PLAYLIST',
    quoteText: 'Good Music\nBetter Days ♥',
    tracks: CHILL_TRACKS,
  },

  focus_mix: {
    id: 'focus_mix',
    title: 'Focus Mix',
    tagline: 'Stay in the zone. Deep instrumental flow.',
    creator: 'Mahaveer K',
    creatorAvatar: require('../../assets/ui/avatar_clean.png'),
    songsCount: `${FOCUS_TRACKS.length} songs`,
    totalDuration: formatTotalPlaylistDuration(FOCUS_TRACKS),
    description: 'Ambient electronica, lo-fi rhythms, and acoustic textures engineered for deep work and concentration.',
    coverImage: require('../../assets/playlists/cover_focus_mix.jpg'),
    bannerAccentColor: '#0284C7',
    badgeText: 'CURATED MIX',
    quoteText: 'Focus & Flow\nDeep Mind ⚡',
    tracks: FOCUS_TRACKS,
  },

  workout_mix: {
    id: 'workout_mix',
    title: 'Workout Mix',
    tagline: 'High energy beats. Maximum adrenaline.',
    creator: 'Mahaveer K',
    creatorAvatar: require('../../assets/ui/avatar_clean.png'),
    songsCount: `${WORKOUT_TRACKS.length} songs`,
    totalDuration: formatTotalPlaylistDuration(WORKOUT_TRACKS),
    description: 'High-octane basslines, driving synth rhythms, and heart-pumping beats to power through your workout.',
    coverImage: require('../../assets/playlists/cover_workout_mix.jpg'),
    bannerAccentColor: '#E11D48',
    badgeText: 'HIGH ENERGY',
    quoteText: 'Push The Limit\nNo Excuses 🔥',
    tracks: WORKOUT_TRACKS,
  },

  study_mix: {
    id: 'study_mix',
    title: 'Study Mix',
    tagline: 'Warm vinyl, rainy days, calm minds.',
    creator: 'Mahaveer K',
    creatorAvatar: require('../../assets/ui/avatar_clean.png'),
    songsCount: `${STUDY_TRACKS.length} songs`,
    totalDuration: formatTotalPlaylistDuration(STUDY_TRACKS),
    description: 'Gentle lo-fi hip-hop, soft vinyl crackle, and melodic chillhop to help you study and unwind peacefully.',
    coverImage: require('../../assets/playlists/cover_study_mix.jpg'),
    bannerAccentColor: '#0D9488',
    badgeText: 'LO-FI STUDY',
    quoteText: 'Warm Coffee\nRainy Pages ☕',
    tracks: STUDY_TRACKS,
  },

  energize_morning: {
    id: 'energize_morning',
    title: 'Energize & Wake Up',
    tagline: 'Start your morning with bright acoustic energy.',
    creator: 'Mahaveer K',
    creatorAvatar: require('../../assets/ui/avatar_clean.png'),
    songsCount: `${ENERGIZE_TRACKS.length} songs`,
    totalDuration: formatTotalPlaylistDuration(ENERGIZE_TRACKS),
    description: 'Bright acoustic melodies, upbeat folk pop, and warm morning sunrise harmonies to kickstart your day.',
    coverImage: require('../../assets/playlists/cover_energize_morning.jpg'),
    bannerAccentColor: '#F59E0B',
    badgeText: 'MORNING SUNRISE',
    quoteText: 'Bright Dawn\nNew Energy ☀️',
    tracks: ENERGIZE_TRACKS,
  },

  midnight_dreams: {
    id: 'midnight_dreams',
    title: 'Midnight Dreams',
    tagline: 'Dreamy synthwave, starry skies, and late-night calm.',
    creator: 'Mahaveer K',
    creatorAvatar: require('../../assets/ui/avatar_clean.png'),
    songsCount: `${MIDNIGHT_TRACKS.length} songs`,
    totalDuration: formatTotalPlaylistDuration(MIDNIGHT_TRACKS),
    description: 'Atmospheric synth melodies, nocturnal chillwave, and dreamy ambient grooves crafted for late-night drives and starlit unwinding.',
    coverImage: require('../../assets/playlists/cover_midnight_dreams.jpg'),
    bannerAccentColor: '#7C3AED',
    badgeText: 'NIGHT SYNTH & CHILL',
    quoteText: 'Starlit Skies\nMidnight Flow 🌙',
    tracks: MIDNIGHT_TRACKS,
  },

  travel_mix: {
    id: 'travel_mix',
    title: 'Travel Mix',
    tagline: 'On the go. Golden sunset wanderlust.',
    creator: 'Mahaveer K',
    creatorAvatar: require('../../assets/ui/avatar_clean.png'),
    songsCount: `${CHILL_TRACKS.length} songs`,
    totalDuration: formatTotalPlaylistDuration(CHILL_TRACKS),
    description: 'Scenic sunset drives, open highway beats, and acoustic wanderlust tunes for your journey.',
    coverImage: require('../../assets/playlists/cover_travel_mix_clean.png'),
    bannerAccentColor: '#EA580C',
    badgeText: 'TRAVEL & ROAD',
    quoteText: 'Open Road\nSunset Drive 🚗',
    tracks: CHILL_TRACKS,
  },
};

export function getPlaylistById(id: string): PlaylistData {
  return PLAYLISTS[id] || PLAYLISTS.chill_vibes;
}
