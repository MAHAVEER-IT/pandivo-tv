import { TRACK_CATALOG, MusicTrack } from '../services/musicCatalog';
import { PLAYLISTS } from '../data/playlistData';
import { DEMO_EXTRA_TRACKS } from '../data/searchCatalog';

export type RecentlyPlayedTrackItem = MusicTrack & {
  displayArtist: string;
  displayTitle: string;
  localArtwork: any;
};

// Helper to resolve recently played track metadata dynamically from catalog or playlists
export function resolveRecentlyPlayedTrack(trackId: string): RecentlyPlayedTrackItem | null {
  const catalogMatch = TRACK_CATALOG.find((t) => t.id === trackId);
  if (catalogMatch) {
    return {
      ...catalogMatch,
      displayTitle: catalogMatch.title,
      displayArtist: catalogMatch.artist,
      localArtwork:
        catalogMatch.artworkUrl && catalogMatch.artworkUrl.startsWith('http')
          ? { uri: catalogMatch.artworkUrl }
          : (catalogMatch as any).artwork || require('../../assets/ui/rec_0_until_found_clean.png'),
    };
  }

  for (const pl of Object.values(PLAYLISTS)) {
    const found = pl.tracks.find((t) => t.id === trackId);
    if (found) {
      return {
        id: found.id,
        title: found.title,
        artist: found.artist,
        album: found.album,
        year: 2024,
        era: '2020s',
        mood: 'calm',
        energy: 'medium',
        bpm: 100,
        vibe: found.title,
        genre: 'Pop',
        audioUrl: found.audioUrl,
        artworkUrl: '',
        duration: found.durationSeconds,
        tags: ['playlist'],
        displayTitle: found.title,
        displayArtist: found.artist,
        localArtwork: (found as any).artwork || require('../../assets/ui/rec_0_until_found_clean.png'),
      };
    }
  }

  const demoMatch = DEMO_EXTRA_TRACKS.find((t) => t.id === trackId);
  if (demoMatch) {
    return {
      id: demoMatch.id,
      title: demoMatch.title,
      artist: demoMatch.artist,
      album: demoMatch.album || 'Single',
      year: 2024,
      era: '2020s',
      mood: 'calm',
      energy: 'medium',
      bpm: 100,
      vibe: demoMatch.title,
      genre: 'Pop',
      audioUrl: demoMatch.audioUrl,
      artworkUrl: '',
      duration: demoMatch.durationSeconds,
      tags: ['search'],
      displayTitle: demoMatch.title,
      displayArtist: demoMatch.artist,
      localArtwork: demoMatch.artwork || require('../../assets/ui/rec_0_until_found_clean.png'),
    };
  }

  return null;
}
