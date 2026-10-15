/**
 * Audius Music Service
 * Provides free, full-length music streaming from the Audius decentralized network.
 * No API key required.
 */

import { MusicTrack } from './musicCatalog';

const AUDIUS_APP_NAME = 'firetvmusic';
const AUDIUS_DISCOVERY_NODES = [
  'https://discoveryprovider.audius.co',
  'https://api.audius.co',
  'https://audius-discovery-1.altego.net',
];

let currentHostIndex = 0;

function getDiscoveryHost(): string {
  return AUDIUS_DISCOVERY_NODES[currentHostIndex % AUDIUS_DISCOVERY_NODES.length];
}

function rotateDiscoveryHost() {
  currentHostIndex++;
}

export interface AudiusRawTrack {
  id: string;
  title: string;
  description?: string;
  genre: string;
  mood?: string;
  release_date?: string;
  duration: number;
  play_count?: number;
  artwork?: {
    '150x150'?: string;
    '480x480'?: string;
    '1000x1000'?: string;
  };
  user?: {
    id: string;
    name: string;
    handle: string;
  };
}

/**
 * Returns direct stream URL for an Audius track ID
 */
export function getAudiusStreamUrl(trackId: string): string {
  return `${getDiscoveryHost()}/v1/tracks/${trackId}/stream?app_name=${AUDIUS_APP_NAME}`;
}

/**
 * Pre-cached verified Audius tracks for immediate offline/instant loading
 */
export const AUDIUS_CURATED_TRACKS: Record<string, MusicTrack[]> = {
  chill_vibes: [
    {
      id: 'aud_0KoY3Oj',
      title: 'Boukas - Breeze',
      artist: 'Chillhop Music',
      album: 'Chillhop Essentials',
      year: 2024,
      era: '2020s',
      mood: 'calm',
      energy: 'low',
      bpm: 85,
      vibe: 'Warm Lo-Fi & chill breeze',
      genre: 'Lo-Fi',
      audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/0KoY3Oj/stream?app_name=firetvmusic',
      artworkUrl: 'https://audius-02.staked.cloud/content/baeaaaiqseawv4ixjqcdccwhbf3uwuqcuyxbnbbnlfug5zosgyoipdm4uhoia2/480x480.jpg',
      duration: 123,
      tags: ['chill', 'lo-fi', 'calm', 'relax'],
    },
    {
      id: 'aud_WkgRN9o',
      title: 'Bmb Spacekid - Never be the Same',
      artist: 'Chillhop Music',
      album: 'Chillhop Lo-Fi',
      year: 2024,
      era: '2020s',
      mood: 'calm',
      energy: 'medium',
      bpm: 88,
      vibe: 'Mellow sunset beats',
      genre: 'Lo-Fi',
      audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/WkgRN9o/stream?app_name=firetvmusic',
      artworkUrl: 'https://audius-05.staked.cloud/content/baeaaaiqseajxxntuo3iveiapiw2kxckr5f6yhp35sgppv4nwprojvp5ucxjtq/480x480.jpg',
      duration: 208,
      tags: ['chill', 'sunset', 'lo-fi'],
    },
    {
      id: 'aud_XgXz8BO',
      title: 'Fly High Zuly Sky Mix',
      artist: 'ICT - DJ Lexo',
      album: 'Skyline Lo-Fi',
      year: 2023,
      era: '2020s',
      mood: 'calm',
      energy: 'medium',
      bpm: 90,
      vibe: 'Dreamy atmospheric beats',
      genre: 'Lo-Fi',
      audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/XgXz8BO/stream?app_name=firetvmusic',
      artworkUrl: 'https://audius-creator-4.theblueprint.xyz/content/baeaaaiqsecwvhgz325ljemstembcf6yhki52aal5smh55afbgzj6zjm3yrz4e/480x480.jpg',
      duration: 264,
      tags: ['chill', 'lo-fi', 'dreamy'],
    },
    {
      id: 'aud_ygvq57',
      title: 'Cielo De Azúcar',
      artist: 'Oscaribarraflorez',
      album: 'Dulce Horizonte',
      year: 2023,
      era: '2020s',
      mood: 'calm',
      energy: 'low',
      bpm: 80,
      vibe: 'Gentle acoustic serenity',
      genre: 'Lo-Fi',
      audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/ygvq57/stream?app_name=firetvmusic',
      artworkUrl: 'https://val011.open-audio-validator.com/content/baeaaaiqseaotcuag6kjurtyogetzo447vztopytvsceq7icktbv7qofszlnno/480x480.jpg',
      duration: 198,
      tags: ['calm', 'relax', 'peaceful'],
    },
    {
      id: 'aud_3mqd5PV',
      title: 'Demon Planet Blues v2',
      artist: 'Oscaribarraflorez',
      album: 'Echoes of Calm',
      year: 2024,
      era: '2020s',
      mood: 'sad',
      energy: 'low',
      bpm: 76,
      vibe: 'Late night reflective vibes',
      genre: 'Lo-Fi',
      audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/3mqd5PV/stream?app_name=firetvmusic',
      artworkUrl: 'https://audius-content-11.figment.io/content/baeaaaiqsedqh7l2fghtuz5qqqc7va2vqqrtu7f2wjk6tsvg2lw3t42eadgpi4/480x480.jpg',
      duration: 166,
      tags: ['blues', 'lo-fi', 'night'],
    },
  ],

  focus_mix: [
    {
      id: 'aud_mgdAbBv',
      title: 'dear ocean (ft. NATURE)',
      artist: 'Petit Biscuit',
      album: 'Presence',
      year: 2024,
      era: '2020s',
      mood: 'calm',
      energy: 'medium',
      bpm: 105,
      vibe: 'Deep ocean focus & clarity',
      genre: 'Ambient',
      audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/mgdAbBv/stream?app_name=firetvmusic',
      artworkUrl: 'https://validator.soundmaxx.xyz/content/baeaaaiqsealh3kgaxd57dwcdwhu7tuvgh5q6bqq2vivntpaqpjp777ylrbadk/480x480.jpg',
      duration: 206,
      tags: ['focus', 'ambient', 'ocean'],
    },
    {
      id: 'aud_vR8y4Gp',
      title: 'your spark remains',
      artist: 'Petit Biscuit',
      album: 'Parachute',
      year: 2024,
      era: '2020s',
      mood: 'calm',
      energy: 'medium',
      bpm: 100,
      vibe: 'Uplifting ambient flow',
      genre: 'Ambient',
      audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/vR8y4Gp/stream?app_name=firetvmusic',
      artworkUrl: 'https://v.monophonic.digital/content/baeaaaiqsebgrskg6nkysuu6ntb2mvvv5afentaydkgdz6e4ip2oazwrtsm7y4/480x480.jpg',
      duration: 126,
      tags: ['focus', 'ambient', 'work'],
    },
    {
      id: 'aud_vGl9Y78',
      title: 'Unwritten Promises',
      artist: 'Oscaribarraflorez',
      album: 'Inner Light',
      year: 2023,
      era: '2020s',
      mood: 'calm',
      energy: 'low',
      bpm: 82,
      vibe: 'Deep meditative concentration',
      genre: 'Ambient',
      audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/vGl9Y78/stream?app_name=firetvmusic',
      artworkUrl: 'https://audius-creator-5.theblueprint.xyz/content/baeaaaiqseavp6su3qx4m2uqfahifthoethhx72e5fcgd3nmhve44u253vicg4/480x480.jpg',
      duration: 175,
      tags: ['meditation', 'focus', 'deep work'],
    },
    {
      id: 'aud_pPl4q4M',
      title: 'Goodnight',
      artist: 'Jeff Sleeman',
      album: 'Sleep & Focus',
      year: 2023,
      era: '2020s',
      mood: 'calm',
      energy: 'low',
      bpm: 70,
      vibe: 'Peaceful sonic rest',
      genre: 'Ambient',
      audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/pPl4q4M/stream?app_name=firetvmusic',
      artworkUrl: 'https://v.monophonic.digital/content/baeaaaiqseb2odwcpdpdkfobcjbxqvql26cdawvp4ztidynb4he3wwgisvjqxw/480x480.jpg',
      duration: 98,
      tags: ['focus', 'calm', 'night'],
    },
  ],

  workout_mix: [
    {
      id: 'aud_agBM8jj',
      title: 'Does Anybody Have Any Water? (feat. Paytra)',
      artist: 'BLACKTYDE',
      album: 'Hydrate EP',
      year: 2024,
      era: '2020s',
      mood: 'energetic',
      energy: 'high',
      bpm: 128,
      vibe: 'Pumping festival energy',
      genre: 'Electronic',
      audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/agBM8jj/stream?app_name=firetvmusic',
      artworkUrl: 'https://v.monophonic.digital/content/baeaaaiqseaxn2z37irk4qvuhaya3sjrtom7nnpuhfs3fksfjfbskald2kbene/480x480.jpg',
      duration: 186,
      tags: ['workout', 'electronic', 'high energy'],
    },
    {
      id: 'aud_3EZbQxZ',
      title: 'Live It Up (Original Mix)',
      artist: 'GORDO DJ (BR)',
      album: 'Bassline Heat',
      year: 2024,
      era: '2020s',
      mood: 'energetic',
      energy: 'high',
      bpm: 130,
      vibe: 'High tempo cardio rhythm',
      genre: 'Electronic',
      audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/3EZbQxZ/stream?app_name=firetvmusic',
      artworkUrl: 'https://v.monophonic.digital/content/baeaaaiqsecbz4lua3honyomemtfxk5vq7yadkxz6lq6dnvfvulfyt4hjeskhm/480x480.jpg',
      duration: 244,
      tags: ['workout', 'cardio', 'pump'],
    },
    {
      id: 'aud_Q40dQrw',
      title: 'Watch',
      artist: 'sayara 🦋',
      album: 'Future Beat',
      year: 2024,
      era: '2020s',
      mood: 'energetic',
      energy: 'high',
      bpm: 125,
      vibe: 'Electric momentum & power',
      genre: 'Electronic',
      audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/Q40dQrw/stream?app_name=firetvmusic',
      artworkUrl: 'https://v.monophonic.digital/content/baeaaaiqsecgue6jjcm7tqyj4ygukinaguvwr5ttjwulsz2d5hj74j322dj5mi/480x480.jpg',
      duration: 174,
      tags: ['workout', 'gym', 'electronic'],
    },
    {
      id: 'aud_1O97MXY',
      title: 'August Glow (with Saly Betli)',
      artist: 'zaza',
      album: 'Summer Beat',
      year: 2024,
      era: '2020s',
      mood: 'happy',
      energy: 'medium',
      bpm: 118,
      vibe: 'Brisk warm up energy',
      genre: 'Electronic',
      audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/1O97MXY/stream?app_name=firetvmusic',
      artworkUrl: 'https://v.monophonic.digital/content/baeaaaiqseczdpvbqwtdtqbrl2ed7sywefqnq4xcmaqk4yebbud3scovkrmdqa/480x480.jpg',
      duration: 113,
      tags: ['workout', 'running', 'upbeat'],
    },
  ],

  study_mix: [
    {
      id: 'aud_0KoY3Oj',
      title: 'Boukas - Breeze',
      artist: 'Chillhop Music',
      album: 'Study Essentials',
      year: 2024,
      era: '2020s',
      mood: 'calm',
      energy: 'low',
      bpm: 85,
      vibe: 'Soft vinyl study session',
      genre: 'Lo-Fi',
      audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/0KoY3Oj/stream?app_name=firetvmusic',
      artworkUrl: 'https://audius-02.staked.cloud/content/baeaaaiqseawv4ixjqcdccwhbf3uwuqcuyxbnbbnlfug5zosgyoipdm4uhoia2/480x480.jpg',
      duration: 123,
      tags: ['study', 'lo-fi', 'reading'],
    },
    {
      id: 'aud_WkgRN9o',
      title: 'Bmb Spacekid - Never be the Same',
      artist: 'Chillhop Music',
      album: 'Late Study Session',
      year: 2024,
      era: '2020s',
      mood: 'calm',
      energy: 'medium',
      bpm: 88,
      vibe: 'Warm coffee & textbook rhythm',
      genre: 'Lo-Fi',
      audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/WkgRN9o/stream?app_name=firetvmusic',
      artworkUrl: 'https://audius-05.staked.cloud/content/baeaaaiqseajxxntuo3iveiapiw2kxckr5f6yhp35sgppv4nwprojvp5ucxjtq/480x480.jpg',
      duration: 208,
      tags: ['study', 'reading', 'focus'],
    },
    {
      id: 'aud_ygvq57',
      title: 'Cielo De Azúcar',
      artist: 'Oscaribarraflorez',
      album: 'Peaceful Pages',
      year: 2023,
      era: '2020s',
      mood: 'calm',
      energy: 'low',
      bpm: 80,
      vibe: 'Rain on the window',
      genre: 'Lo-Fi',
      audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/ygvq57/stream?app_name=firetvmusic',
      artworkUrl: 'https://val011.open-audio-validator.com/content/baeaaaiqseaotcuag6kjurtyogetzo447vztopytvsceq7icktbv7qofszlnno/480x480.jpg',
      duration: 198,
      tags: ['study', 'calm', 'rain'],
    },
    {
      id: 'aud_3mqd5PV',
      title: 'Demon Planet Blues v2',
      artist: 'Oscaribarraflorez',
      album: 'Midnight Notebook',
      year: 2024,
      era: '2020s',
      mood: 'sad',
      energy: 'low',
      bpm: 76,
      vibe: 'Exam prep serenity',
      genre: 'Lo-Fi',
      audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/3mqd5PV/stream?app_name=firetvmusic',
      artworkUrl: 'https://audius-content-11.figment.io/content/baeaaaiqsedqh7l2fghtuz5qqqc7va2vqqrtu7f2wjk6tsvg2lw3t42eadgpi4/480x480.jpg',
      duration: 166,
      tags: ['study', 'late night', 'lo-fi'],
    },
  ],

  energize_morning: [
    {
      id: 'aud_3Rv7o0Z',
      title: 'Breathing Underwater (Acoustic)',
      artist: 'Jason Langvee',
      album: 'Morning Coffee Acoustic',
      year: 2024,
      era: '2020s',
      mood: 'happy',
      energy: 'medium',
      bpm: 104,
      vibe: 'Sunlight through curtains',
      genre: 'Acoustic',
      audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/3Rv7o0Z/stream?app_name=firetvmusic',
      artworkUrl: 'https://v.monophonic.digital/content/baeaaaiqsec6nkdcmcgrqhctrivr64jkxyethdtgmopxppoy2njaq2j6kkkgko/480x480.jpg',
      duration: 165,
      tags: ['morning', 'acoustic', 'wake up'],
    },
    {
      id: 'aud_wPAgPgk',
      title: 'Deleite Camalú',
      artist: 'Oscaribarraflorez',
      album: 'Sunrise Acoustic',
      year: 2023,
      era: '2020s',
      mood: 'happy',
      energy: 'medium',
      bpm: 98,
      vibe: 'Fresh dawn acoustic warmth',
      genre: 'Acoustic',
      audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/wPAgPgk/stream?app_name=firetvmusic',
      artworkUrl: 'https://validator.soundmaxx.xyz/content/baeaaaiqseaj4izmccqg2dke62f3p3eyxek6zojrxwibohx3yjx5ktlcligyom/480x480.jpg',
      duration: 189,
      tags: ['morning', 'dawn', 'acoustic'],
    },
    {
      id: 'aud_wayj8Z',
      title: 'Tall Trees (Acoustic)',
      artist: 'Jason Langvee',
      album: 'Coastline Acoustic',
      year: 2024,
      era: '2020s',
      mood: 'happy',
      energy: 'medium',
      bpm: 108,
      vibe: 'Brisk morning trail stroll',
      genre: 'Acoustic',
      audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/wayj8Z/stream?app_name=firetvmusic',
      artworkUrl: 'https://audius-creator-12.theblueprint.xyz/content/baeaaaiqsed2ck7eu7fx64dhuzqwhy64qpu5u3ybean5q35ynju4gn2x2you5k/480x480.jpg',
      duration: 120,
      tags: ['morning', 'outdoors', 'acoustic'],
    },
    {
      id: 'aud_Jg6M8ZY',
      title: 'If You Want It (Acoustic)',
      artist: 'Jason Langvee',
      album: 'Golden Mornings',
      year: 2024,
      era: '2020s',
      mood: 'happy',
      energy: 'medium',
      bpm: 102,
      vibe: 'Optimistic morning melody',
      genre: 'Acoustic',
      audioUrl: 'https://discoveryprovider.audius.co/v1/tracks/Jg6M8ZY/stream?app_name=firetvmusic',
      artworkUrl: 'https://audius-content-2.figment.io/content/baeaaaiqsec6nkdcmcgrqhctrivr64jkxyethdtgmopxppoy2njaq2j6kkkgko/480x480.jpg',
      duration: 161,
      tags: ['morning', 'acoustic', 'energize'],
    },
  ],
};

/**
 * Map raw Audius track to MusicTrack format
 */
export function mapAudiusToMusicTrack(t: AudiusRawTrack): MusicTrack {
  const artwork =
    t.artwork?.['480x480'] ||
    t.artwork?.['1000x1000'] ||
    t.artwork?.['150x150'] ||
    '';

  const genre = t.genre || 'Electronic';
  let mood: 'love' | 'sad' | 'calm' | 'energetic' | 'happy' = 'calm';
  let energy: 'low' | 'medium' | 'high' = 'medium';

  const lowerGenre = genre.toLowerCase();
  const lowerMood = (t.mood || '').toLowerCase();

  if (lowerMood.includes('energetic') || lowerGenre.includes('electronic') || lowerGenre.includes('dance')) {
    mood = 'energetic';
    energy = 'high';
  } else if (lowerMood.includes('peaceful') || lowerGenre.includes('ambient') || lowerGenre.includes('lo-fi')) {
    mood = 'calm';
    energy = 'low';
  } else if (lowerMood.includes('happy') || lowerGenre.includes('pop') || lowerGenre.includes('acoustic')) {
    mood = 'happy';
    energy = 'medium';
  } else if (lowerMood.includes('melancholy') || lowerMood.includes('sad')) {
    mood = 'sad';
    energy = 'low';
  }

  return {
    id: `aud_${t.id}`,
    title: t.title || 'Untitled Track',
    artist: t.user?.name || 'Audius Artist',
    album: t.genre ? `${t.genre} Essentials` : 'Audius Beats',
    year: t.release_date ? new Date(t.release_date).getFullYear() : 2024,
    era: '2020s',
    mood,
    energy,
    bpm: energy === 'high' ? 128 : energy === 'medium' ? 100 : 80,
    vibe: t.description?.slice(0, 50) || `${genre} streaming on Audius`,
    genre,
    audioUrl: getAudiusStreamUrl(t.id),
    artworkUrl: artwork,
    duration: t.duration || 180,
    tags: [genre.toLowerCase(), mood, energy, 'audius'],
  };
}

/**
 * Fetch trending tracks from Audius API
 */
export async function fetchTrendingTracks(genre?: string, limit: number = 10): Promise<MusicTrack[]> {
  try {
    const host = getDiscoveryHost();
    const url = genre
      ? `${host}/v1/tracks/trending?genre=${encodeURIComponent(genre)}&limit=${limit}&app_name=${AUDIUS_APP_NAME}`
      : `${host}/v1/tracks/trending?limit=${limit}&app_name=${AUDIUS_APP_NAME}`;

    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      rotateDiscoveryHost();
      throw new Error(`Audius API responded with status ${res.status}`);
    }

    const json = await res.json();
    const data = json.data as AudiusRawTrack[];
    if (!data || !Array.isArray(data) || data.length === 0) {
      return genre && AUDIUS_CURATED_TRACKS[genre] ? AUDIUS_CURATED_TRACKS[genre] : AUDIUS_CURATED_TRACKS.chill_vibes;
    }

    return data.map(mapAudiusToMusicTrack);
  } catch (err) {
    console.warn('[Audius] fetchTrendingTracks error, falling back to curated tracks:', err);
    return genre && AUDIUS_CURATED_TRACKS[genre] ? AUDIUS_CURATED_TRACKS[genre] : AUDIUS_CURATED_TRACKS.chill_vibes;
  }
}

/**
 * Search tracks on Audius API
 */
export async function searchAudiusTracks(query: string, limit: number = 10): Promise<MusicTrack[]> {
  try {
    const host = getDiscoveryHost();
    const url = `${host}/v1/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}&app_name=${AUDIUS_APP_NAME}`;

    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      rotateDiscoveryHost();
      throw new Error(`Audius search failed with status ${res.status}`);
    }

    const json = await res.json();
    const data = json.data as AudiusRawTrack[];
    return (data || []).map(mapAudiusToMusicTrack);
  } catch (err) {
    console.warn('[Audius] searchAudiusTracks error:', err);
    return [];
  }
}

/**
 * Resolve direct audio CDN stream URL by following redirects
 */
export async function resolvePlayableAudioUrl(url: string): Promise<string> {
  if (!url || !url.includes('audius.co')) {
    return url;
  }

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-10' },
      redirect: 'follow',
    });
    if (res.ok && res.url) {
      return res.url;
    }
  } catch (err) {
    console.warn('[Audius] Direct stream URL resolution skipped, using base stream URL:', err);
  }
  return url;
}
