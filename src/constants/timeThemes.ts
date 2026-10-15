import { TRACK_CATALOG } from '../services/musicCatalog';

// Dynamic Time-of-Day Themes with User's Uploaded Scenic Banners
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface TimeTheme {
  id: TimeOfDay;
  label: string;
  iconName: 'sunrise' | 'sun' | 'sunset' | 'moon';
  iconColor: string;
  greeting: string;
  bannerImage: any;
  gradientOverlay: any;
  quickCardTag: string;
  quickCardTitle: string;
  hearAccent: string;
  textColor: string;
  subtextColor: string;
  trackToPlay: any;
}

export const TIME_THEMES: Record<TimeOfDay, TimeTheme> = {
  morning: {
    id: 'morning',
    label: 'Morning',
    iconName: 'sunrise',
    iconColor: '#F59E0B',
    greeting: 'GOOD MORNING',
    bannerImage: require('../../assets/banners/banner_morning.webp'),
    gradientOverlay: require('../../assets/ui/gradient_morning.png'),
    quickCardTag: 'For Your Morning',
    quickCardTitle: 'Energize & Wake Up',
    hearAccent: '#F59E0B',
    textColor: '#0F172A',
    subtextColor: '#475569',
    trackToPlay: TRACK_CATALOG[1],
  },
  afternoon: {
    id: 'afternoon',
    label: 'Afternoon',
    iconName: 'sun',
    iconColor: '#0284C7',
    greeting: 'GOOD AFTERNOON',
    bannerImage: require('../../assets/banners/banner_afternoon.webp'),
    gradientOverlay: require('../../assets/ui/gradient_afternoon.png'),
    quickCardTag: 'For Your Afternoon',
    quickCardTitle: 'Focus & Flow',
    hearAccent: '#0284C7',
    textColor: '#0F172A',
    subtextColor: '#475569',
    trackToPlay: TRACK_CATALOG[2],
  },
  evening: {
    id: 'evening',
    label: 'Evening',
    iconName: 'sunset',
    iconColor: '#8B5CF6',
    greeting: 'GOOD EVENING',
    bannerImage: require('../../assets/banners/banner_evening.webp'),
    gradientOverlay: require('../../assets/ui/gradient_evening.png'),
    quickCardTag: 'For Your Evening',
    quickCardTitle: 'Chill & Unwind',
    hearAccent: '#8B5CF6',
    textColor: '#0F172A',
    subtextColor: '#475569',
    trackToPlay: TRACK_CATALOG[0],
  },
  night: {
    id: 'night',
    label: 'Night',
    iconName: 'moon',
    iconColor: '#818CF8',
    greeting: 'GOOD NIGHT',
    bannerImage: require('../../assets/banners/banner_night.webp'),
    gradientOverlay: require('../../assets/ui/gradient_night.png'),
    quickCardTag: 'For Late Night',
    quickCardTitle: 'Deep Sleep & Calm',
    hearAccent: '#A78BFA',
    textColor: '#FFFFFF',
    subtextColor: '#CBD5E1',
    trackToPlay: TRACK_CATALOG[5],
  },
};

export const getAutoTimeOfDay = (hours: number): TimeOfDay => {
  if (hours >= 5 && hours < 12) return 'morning';
  if (hours >= 12 && hours < 17) return 'afternoon';
  if (hours >= 17 && hours < 22) return 'evening';
  return 'night';
};

// Reusable Contextual Time & Mood Model for AI DJ Sessions
export type TimeContext = 'morning' | 'afternoon' | 'evening' | 'night';

export interface ContextualAIDJIntent {
  action: 'create_playlist';
  context: TimeContext;
  mood: string;
  energy?: 'low' | 'medium' | 'high';
}

export interface ContextualAIDJConfig {
  context: TimeContext;
  mood: string;
  ctaText: string;
  sessionTitle: string;
  prompt: string;
  intent: ContextualAIDJIntent;
}

export const CONTEXTUAL_AIDJ_CONFIGS: Record<TimeContext, ContextualAIDJConfig> = {
  morning: {
    context: 'morning',
    mood: 'focus',
    ctaText: 'Create Your Morning Focus with AI DJ',
    sessionTitle: 'Creating your morning session',
    prompt: 'Create a morning focus playlist',
    intent: {
      action: 'create_playlist',
      context: 'morning',
      mood: 'focus',
      energy: 'medium',
    },
  },
  afternoon: {
    context: 'afternoon',
    mood: 'energetic',
    ctaText: 'Create Your Afternoon Energy Mix with AI DJ',
    sessionTitle: 'Creating your afternoon session',
    prompt: 'Create an afternoon energy mix playlist',
    intent: {
      action: 'create_playlist',
      context: 'afternoon',
      mood: 'energetic',
      energy: 'high',
    },
  },
  evening: {
    context: 'evening',
    mood: 'chill',
    ctaText: 'Create Your Evening Chill with AI DJ',
    sessionTitle: 'Creating your evening chill session',
    prompt: 'Create an evening chill playlist',
    intent: {
      action: 'create_playlist',
      context: 'evening',
      mood: 'chill',
      energy: 'low',
    },
  },
  night: {
    context: 'night',
    mood: 'chill',
    ctaText: 'Create Your Night Chill Mix with AI DJ',
    sessionTitle: 'Creating your night session',
    prompt: 'Create a relaxing night playlist',
    intent: {
      action: 'create_playlist',
      context: 'night',
      mood: 'chill',
      energy: 'low',
    },
  },
};

export function getAIDJCTA(params: { context: TimeContext; mood?: string }): string {
  const cfg = CONTEXTUAL_AIDJ_CONFIGS[params.context];
  return cfg ? cfg.ctaText : 'Create Your Mix with AI DJ';
}
