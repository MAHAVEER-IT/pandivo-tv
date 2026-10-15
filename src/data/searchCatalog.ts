import { PLAYLISTS, PlaylistTrack } from './playlistData';

export interface SearchResultItem {
  track: PlaylistTrack;
  score: number;
}

// Built-in catalog tracks incorporating PANDIVO playlists and popular demo tracks
export const DEMO_EXTRA_TRACKS: PlaylistTrack[] = [
  {
    id: 'DEMO_1',
    trackNumber: 1,
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    album: 'Divide',
    duration: '3:53',
    durationSeconds: 233,
    audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/0KoY3Oj/stream?app_name=firetvmusic',
    artwork: require('../../assets/playlists/cover_chill_vibes.jpg'),
  },
  {
    id: 'DEMO_2',
    trackNumber: 2,
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: '3:20',
    durationSeconds: 200,
    audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/WkgRN9o/stream?app_name=firetvmusic',
    artwork: require('../../assets/playlists/cover_midnight_dreams.jpg'),
  },
  {
    id: 'DEMO_3',
    trackNumber: 3,
    title: 'Shallow',
    artist: 'Lady Gaga & Bradley Cooper',
    album: 'A Star Is Born',
    duration: '3:35',
    durationSeconds: 215,
    audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/XgXz8BO/stream?app_name=firetvmusic',
    artwork: require('../../assets/playlists/cover_study_mix.jpg'),
  },
  {
    id: 'DEMO_4',
    trackNumber: 4,
    title: 'Starboy',
    artist: 'The Weeknd',
    album: 'Starboy',
    duration: '3:50',
    durationSeconds: 230,
    audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/ygvq57/stream?app_name=firetvmusic',
    artwork: require('../../assets/playlists/cover_midnight_dreams.jpg'),
  },
  {
    id: 'DEMO_5',
    trackNumber: 5,
    title: 'Perfect',
    artist: 'Ed Sheeran',
    album: 'Divide',
    duration: '4:23',
    durationSeconds: 263,
    audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/3mqd5PV/stream?app_name=firetvmusic',
    artwork: require('../../assets/playlists/cover_chill_vibes.jpg'),
  },
  {
    id: 'DEMO_6',
    trackNumber: 6,
    title: 'Someone Like You',
    artist: 'Adele',
    album: '21',
    duration: '4:45',
    durationSeconds: 285,
    audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/mgdAbBv/stream?app_name=firetvmusic',
    artwork: require('../../assets/playlists/cover_study_mix.jpg'),
  },
  {
    id: 'DEMO_7',
    trackNumber: 7,
    title: 'Shake It Off',
    artist: 'Taylor Swift',
    album: '1989',
    duration: '3:39',
    durationSeconds: 219,
    audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/vR8y4Gp/stream?app_name=firetvmusic',
    artwork: require('../../assets/playlists/cover_energize_morning.jpg'),
  },
  {
    id: 'DEMO_8',
    trackNumber: 8,
    title: 'Save Your Tears',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: '3:35',
    durationSeconds: 215,
    audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/vGl9Y78/stream?app_name=firetvmusic',
    artwork: require('../../assets/playlists/cover_midnight_dreams.jpg'),
  },
  {
    id: 'DEMO_9',
    trackNumber: 9,
    title: 'Sunflower',
    artist: 'Post Malone',
    album: 'Spider-Man: Into the Spider-Verse',
    duration: '2:38',
    durationSeconds: 158,
    audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/pPl4q4M/stream?app_name=firetvmusic',
    artwork: require('../../assets/playlists/cover_chill_vibes.jpg'),
  },
  {
    id: 'DEMO_10',
    trackNumber: 10,
    title: 'Stay',
    artist: 'Justin Bieber',
    album: 'F*ck Love 3',
    duration: '2:21',
    durationSeconds: 141,
    audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/agBM8jj/stream?app_name=firetvmusic',
    artwork: require('../../assets/playlists/cover_energize_morning.jpg'),
  },
  {
    id: 'DEMO_11',
    trackNumber: 11,
    title: 'Senorita',
    artist: 'Shawn Mendes & Camila Cabello',
    album: 'Shawn Mendes',
    duration: '3:11',
    durationSeconds: 191,
    audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/3EZbQxZ/stream?app_name=firetvmusic',
    artwork: require('../../assets/playlists/cover_chill_vibes.jpg'),
  },
  {
    id: 'DEMO_12',
    trackNumber: 12,
    title: 'Sorry',
    artist: 'Justin Bieber',
    album: 'Purpose',
    duration: '3:20',
    durationSeconds: 200,
    audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/0KoY3Oj/stream?app_name=firetvmusic',
    artwork: require('../../assets/playlists/cover_energize_morning.jpg'),
  },
];

/**
 * Get unified master catalog of tracks across all playlists and library items
 */
export function getAllCatalogTracks(): PlaylistTrack[] {
  const seenTitles = new Set<string>();
  const catalog: PlaylistTrack[] = [];

  // 1. Add demo wireframe tracks first for exact matching
  for (const t of DEMO_EXTRA_TRACKS) {
    seenTitles.add(t.title.toLowerCase());
    catalog.push(t);
  }

  // 2. Add all tracks from application playlists
  Object.values(PLAYLISTS).forEach((pl) => {
    pl.tracks.forEach((t) => {
      const lower = t.title.toLowerCase();
      if (!seenTitles.has(lower)) {
        seenTitles.add(lower);
        catalog.push(t);
      }
    });
  });

  return catalog;
}

/**
 * Strict scoring engine matching Section 5 of tv-song-search-plan.md
 */
export function calculateMatchScore(title: string, artist: string, queryText: string): number {
  const q = queryText.toLowerCase().trim();
  if (!q) return 0;
  const t = title.toLowerCase();
  const a = artist.toLowerCase();

  // Priority 1: Title starts with query -> ~100
  if (t.startsWith(q)) {
    return Math.round(100 - t.length * 0.1);
  }
  // Priority 2: Artist starts with query -> 90
  if (a.startsWith(q)) {
    return 90;
  }
  // Priority 3: Title contains query -> 75
  if (t.includes(q)) {
    return 75;
  }
  // Priority 4: Artist contains query -> 65
  if (a.includes(q)) {
    return 65;
  }

  // Priority 5: Partial character overlap -> up to 40
  let matchedChars = 0;
  for (const c of q) {
    if (t.includes(c) || a.includes(c)) matchedChars++;
  }
  return Math.round((matchedChars / q.length) * 40);
}

/**
 * Perform ranked search against master catalog
 */
export function searchRankedTracks(queryText: string): SearchResultItem[] {
  if (!queryText.trim()) return [];
  const catalog = getAllCatalogTracks();
  const results: SearchResultItem[] = [];

  for (const track of catalog) {
    const sc = calculateMatchScore(track.title, track.artist, queryText);
    if (sc >= 30) {
      results.push({ track, score: sc });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}
