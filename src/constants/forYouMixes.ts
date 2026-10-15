export interface ForYouMix {
  id: string;
  playlistKey: string;
  title: string;
  subtitle: string;
  mood: string;
  bgColor: string;
  localArtwork: any;
}

// For You Curated Mixes
export const FOR_YOU_MIXES: ForYouMix[] = [
  {
    id: 'mix_chill',
    playlistKey: 'chill_vibes',
    title: 'Chill Vibes',
    subtitle: 'Relax and unwind',
    mood: 'calm',
    bgColor: '#4F46E5',
    localArtwork: require('../../assets/playlists/cover_chill_vibes.jpg'),
  },
  {
    id: 'mix_focus',
    playlistKey: 'focus_mix',
    title: 'Focus Mix',
    subtitle: 'Stay in the zone',
    mood: 'focused',
    bgColor: '#0284C7',
    localArtwork: require('../../assets/playlists/cover_focus_mix.jpg'),
  },
  {
    id: 'mix_energize',
    playlistKey: 'energize_morning',
    title: 'Energize & Wake Up',
    subtitle: 'High energy beats',
    mood: 'energetic',
    bgColor: '#F59E0B',
    localArtwork: require('../../assets/playlists/cover_energize_morning.jpg'),
  },
  {
    id: 'mix_study',
    playlistKey: 'study_mix',
    title: 'Study Mix',
    subtitle: 'Calm focus music',
    mood: 'calm',
    bgColor: '#0D9488',
    localArtwork: require('../../assets/playlists/cover_study_mix.jpg'),
  },
  {
    id: 'mix_travel',
    playlistKey: 'travel_mix',
    title: 'Travel Mix',
    subtitle: 'On the go',
    mood: 'energetic',
    bgColor: '#EA580C',
    localArtwork: require('../../assets/playlists/cover_travel_mix_clean.png'),
  },
];
