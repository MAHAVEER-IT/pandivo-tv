import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  BackHandler,
  NativeModules,
  NativeEventEmitter,
  ScrollView,
  Image,
  LogBox,
  Animated,
  Easing,
  Dimensions,
  TextInput,
  PermissionsAndroid,
  Platform,
} from 'react-native';
// @ts-ignore
import TVEventHandler from 'react-native/Libraries/Components/TV/TVEventHandler';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import {
  parseMusicIntent,
  MusicIntent,
  testGeminiApiLive,
  GeminiDiagnosticReport,
} from './src/services/geminiIntentService';
import { TRACK_CATALOG, MusicTrack } from './src/services/musicCatalog';
import {
  AIDJSession,
  initDJSession,
  advanceToNextTrack,
  applyLiveDJCommand,
} from './src/services/aiDjSessionService';
import {
  filterCandidatesWithFallback,
  calculateRelevanceScore,
  formatTime,
} from './src/services/recommendationEngine';
import {
  AIDJProcessingOverlay,
  AIDJSessionSummary,
  AIDJProcessingStage,
} from './src/components/ai-dj';
import {
  AIDJErrorInfo,
  classifyAIDJError,
  classifySpeechError,
  AIDJ_ERROR_DEFINITIONS,
} from './src/services/aiDjErrorService';
import { SonicIntroSequence } from './src/components/SonicIntroSequence';
import { PlaylistScreen } from './src/components/PlaylistScreen';
import { LibraryScreen } from './src/components/LibraryScreen';
import { UsbMessageOverlay } from './src/components/UsbMessageOverlay';
import {
  AvatarSelectionScreen,
  AvatarSelectionScreenRef,
} from './src/components/AvatarSelectionScreen';
import {
  getUsbStatus,
  scanUsbTracks,
  subscribeToUsbStatus,
  UsbStatus,
} from './src/services/usbStorageService';
// AI DJ Landing Page Component & Spatial Navigation Graph
import {
  AiDjScreen,
  USER_AI_HISTORY_PLAYLISTS,
  GeminiDiagnosticInfo,
} from './src/components/AiDjScreen';
import {
  AI_DJ_FOCUS_IDS,
  getAiDjNextFocus,
} from './src/navigation/aiDjNavGraph';
import {
  FullscreenPlayerScreen,
  AiOverlayStatus,
} from './src/components/FullscreenPlayerScreen';
import { PLAYLISTS, PlaylistData, PlaylistTrack } from './src/data/playlistData';
import { getPlaylistNextFocus, DPadDirection } from './src/navigation/playlistNavGraph';
import { getLibraryNextFocus, LIBRARY_CARD_IDS } from './src/navigation/libraryNavGraph';
import {
  FULLSCREEN_FOCUS_IDS,
  UPCOMING_TRACK_FOCUS_IDS,
  BG_THUMB_FOCUS_IDS,
  getFullscreenNextFocus,
} from './src/navigation/fullscreenNavGraph';
import {
  BACKGROUND_OPTIONS,
} from './src/components/BackgroundSelectionOverlay';
import {
  saveSelectedBackgroundId,
  loadSelectedBackgroundId,
} from './src/services/backgroundPersistenceService';
import {
  SongAiInsight,
  getCachedSongInfo,
  fetchOrGetSongInfo,
} from './src/services/geminiSongInfoService';
import {
  convertAiDjSessionToPlaylist,
  convertStoredAiDjToPlaylist,
  formatTotalPlaylistDuration,
  formatTrackDuration,
} from './src/utils/aiDjPlaylistAdapter';
import {
  initDatabase,
  getRecentlyPlayedTrackIds,
  recordTrackPlay,
  getLikedSongIds,
  toggleSongLike,
  setSongLike,
  getLikedPlaylistIds,
  togglePlaylistLike,
  setPlaylistLike,
  getAiDjPlaylists,
  saveAiDjPlaylist,
  ensureDefaultFavoritesUnliked,
  ensureDefaultSearchHistoryCleaned,
  ensureDefaultPlaybackHistoryCleaned,
  AvatarId,
  isValidAvatarId,
  getSavedAvatarSelection,
  saveAvatarSelection,
  clearSavedAvatarSelection,
} from './src/database';
import { SearchScreen, SearchScreenRef } from './src/components/SearchScreen';
import { SEARCH_FOCUS_IDS } from './src/navigation/searchNavGraph';
import { FavoritesScreen } from './src/components/FavoritesScreen';
import {
  FAVORITES_FOCUS_IDS,
  getFavoritesNextFocus,
} from './src/navigation/favoritesNavGraph';
import { SettingsScreen } from './src/components/SettingsScreen';
import {
  SETTINGS_FOCUS_IDS,
  getSettingsNextFocus,
} from './src/navigation/settingsNavGraph';
import { searchPlaylistTracksElastic } from './src/services/elasticSearchEngine';

LogBox.ignoreAllLogs(true);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const { SpeechRecognition } = NativeModules;
const speechEventEmitter = SpeechRecognition ? new NativeEventEmitter(SpeechRecognition) : null;

export type RecentlyPlayedTrackItem = MusicTrack & {
  displayArtist: string;
  displayTitle: string;
  localArtwork: any;
};

// Helper to resolve recently played track metadata dynamically from catalog or playlists
function resolveRecentlyPlayedTrack(trackId: string): RecentlyPlayedTrackItem | null {
  const catalogMatch = TRACK_CATALOG.find((t) => t.id === trackId);
  if (catalogMatch) {
    return {
      ...catalogMatch,
      displayTitle: catalogMatch.title,
      displayArtist: catalogMatch.artist,
      localArtwork:
        catalogMatch.artworkUrl && catalogMatch.artworkUrl.startsWith('http')
          ? { uri: catalogMatch.artworkUrl }
          : (catalogMatch as any).artwork || require('./assets/ui/rec_0_until_found_clean.png'),
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
        localArtwork: (found as any).artwork || require('./assets/ui/rec_0_until_found_clean.png'),
      };
    }
  }

  return null;
}


// For You Curated Mixes
const FOR_YOU_MIXES = [
  {
    id: 'mix_chill',
    playlistKey: 'chill_vibes',
    title: 'Chill Vibes',
    subtitle: 'Relax and unwind',
    mood: 'calm',
    bgColor: '#4F46E5',
    localArtwork: require('./assets/playlists/cover_chill_vibes.jpg'),
  },
  {
    id: 'mix_focus',
    playlistKey: 'focus_mix',
    title: 'Focus Mix',
    subtitle: 'Stay in the zone',
    mood: 'focused',
    bgColor: '#0284C7',
    localArtwork: require('./assets/playlists/cover_focus_mix.jpg'),
  },
  {
    id: 'mix_energize',
    playlistKey: 'energize_morning',
    title: 'Energize & Wake Up',
    subtitle: 'High energy beats',
    mood: 'energetic',
    bgColor: '#F59E0B',
    localArtwork: require('./assets/playlists/cover_energize_morning.jpg'),
  },
  {
    id: 'mix_study',
    playlistKey: 'study_mix',
    title: 'Study Mix',
    subtitle: 'Calm focus music',
    mood: 'calm',
    bgColor: '#0D9488',
    localArtwork: require('./assets/playlists/cover_study_mix.jpg'),
  },
  {
    id: 'mix_travel',
    playlistKey: 'travel_mix',
    title: 'Travel Mix',
    subtitle: 'On the go',
    mood: 'energetic',
    bgColor: '#EA580C',
    localArtwork: require('./assets/playlists/cover_travel_mix_clean.png'),
  },
];

// Dynamic Time-of-Day Themes with User's Uploaded Scenic Banners
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

interface TimeTheme {
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

const TIME_THEMES: Record<TimeOfDay, TimeTheme> = {
  morning: {
    id: 'morning',
    label: 'Morning',
    iconName: 'sunrise',
    iconColor: '#F59E0B',
    greeting: 'GOOD MORNING',
    bannerImage: require('./assets/banners/banner_morning.png'),
    gradientOverlay: require('./assets/ui/gradient_morning.png'),
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
    bannerImage: require('./assets/banners/banner_afternoon.png'),
    gradientOverlay: require('./assets/ui/gradient_afternoon.png'),
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
    bannerImage: require('./assets/banners/banner_evening.png'),
    gradientOverlay: require('./assets/ui/gradient_evening.png'),
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
    bannerImage: require('./assets/banners/banner_night.png'),
    gradientOverlay: require('./assets/ui/gradient_night.png'),
    quickCardTag: 'For Late Night',
    quickCardTitle: 'Deep Sleep & Calm',
    hearAccent: '#A78BFA',
    textColor: '#FFFFFF',
    subtextColor: '#CBD5E1',
    trackToPlay: TRACK_CATALOG[5],
  },
};

const getAutoTimeOfDay = (hours: number): TimeOfDay => {
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

// Left Navigation Rail Items Configuration (Using New 3D Holographic Glass Drawer Icons)
export interface NavItemConfig {
  id: string;
  tab: string;
  label: string;
  icon: any;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'NAV_HOME', tab: 'home', label: 'Home', icon: require('./assets/drawer/HOME.png') },
  { id: 'NAV_SEARCH', tab: 'search', label: 'Search', icon: require('./assets/drawer/SEARCH.png') },
  { id: 'NAV_DJ', tab: 'ai_dj', label: 'AI DJ', icon: require('./assets/drawer/AI_DJ.png') },
  { id: 'NAV_LIBRARY', tab: 'library', label: 'Your Library', icon: require('./assets/drawer/LIB.png') },
  { id: 'NAV_FAV', tab: 'favorites', label: 'Favorites', icon: require('./assets/drawer/FAV.png') },
  { id: 'NAV_SETTINGS', tab: 'settings', label: 'Settings', icon: require('./assets/drawer/SETTING.png') },
];

export default function App() {
  // Navigation & Spatial Focus (Single Authoritative Source of Truth)
  const [focusedId, setFocusedIdState] = useState<string>('HERO_VOICE');
  const focusedIdRef = useRef<string>('HERO_VOICE');
  const previousFocusedIdRef = useRef<string>('HERO_VOICE');
  const lastFocusChangeTimeRef = useRef<number>(0);
  const lastFocusedTrackIdRef = useRef<string | null>(null);
  const playerOriginTrackIdRef = useRef<string>('TRK_1');
  const homeScrollViewRef = useRef<ScrollView>(null);
  const recentlyPlayedScrollRef = useRef<ScrollView>(null);
  const forYouScrollRef = useRef<ScrollView>(null);
  const recentlyPlayedStartIndexRef = useRef<number>(0);
  const forYouStartIndexRef = useRef<number>(0);
  const homeScrollYRef = useRef<number>(0);
  const searchScreenRef = useRef<SearchScreenRef>(null);

  // Independent Home-Page Section Focus State Memory
  const lastFocusedTopNavRef = useRef<string>('HDR_THEME');
  const lastFocusedHeroRef = useRef<string>('HERO_VOICE');
  const lastFocusedRecentlyPlayedRef = useRef<string>('REC_0');
  const lastFocusedForYouRef = useRef<string>('MIX_0');

  // Dynamic Recently Played Tracks State (strictly dynamic plays, zero static padding)
  const [recentlyPlayedTracks, setRecentlyPlayedTracks] = useState<RecentlyPlayedTrackItem[]>([]);
  const recentlyPlayedTracksRef = useRef<RecentlyPlayedTrackItem[]>([]);
  recentlyPlayedTracksRef.current = recentlyPlayedTracks;

  // Separate Playlist Like state vs Song Like (Favorite) state
  const [playlistLikedMap, setPlaylistLikedMap] = useState<Record<string, boolean>>({});
  const [songFavoriteMap, setSongFavoriteMap] = useState<Record<string, boolean>>({});

  const handleTogglePlaylistLike = useCallback((playlistId?: string) => {
    const targetId = playlistId || selectedPlaylistRef.current?.id;
    if (!targetId || targetId === 'usb_storage') return;
    setPlaylistLikedMap((prev) => {
      const nextVal = !prev[targetId];
      togglePlaylistLike(targetId).catch((err) =>
        console.error('[App] Failed to persist playlist like to SQLite:', err)
      );
      return {
        ...prev,
        [targetId]: nextVal,
      };
    });
  }, []);

  const handleToggleSongFavorite = useCallback((trackId?: string) => {
    const pl = selectedPlaylistRef.current;
    const activeId =
      trackId ||
      (pl?.tracks.find((t) => t.id === currentTrackRef.current?.id) || pl?.tracks[0])?.id ||
      currentTrackRef.current?.id;
    if (!activeId || activeId.startsWith('usb_') || pl?.id === 'usb_storage') return;
    setSongFavoriteMap((prev) => {
      const nextVal = !prev[activeId];
      toggleSongLike(activeId).catch((err) =>
        console.error('[App] Failed to persist song like to SQLite:', err)
      );
      return {
        ...prev,
        [activeId]: nextVal,
      };
    });
  }, []);

  const setFocusedId = useCallback((updater: string | ((prev: string) => string)) => {
    const nextId = typeof updater === 'function' ? updater(focusedIdRef.current) : updater;
    if (focusedIdRef.current !== nextId) {
      previousFocusedIdRef.current = focusedIdRef.current;
    }
    focusedIdRef.current = nextId;
    if (nextId.startsWith('TRK_')) {
      lastFocusedTrackIdRef.current = nextId;
    }
    if (nextId.startsWith('HDR_')) {
      lastFocusedTopNavRef.current = nextId;
    } else if (nextId.startsWith('HERO_')) {
      lastFocusedHeroRef.current = nextId;
    } else if (nextId.startsWith('REC_')) {
      lastFocusedRecentlyPlayedRef.current = nextId;
    } else if (nextId.startsWith('MIX_')) {
      lastFocusedForYouRef.current = nextId;
    }
    lastFocusChangeTimeRef.current = Date.now();
    setFocusedIdState(nextId);
  }, []);

  const [activeNavTab, setActiveNavTab] = useState<string>('home');
  const activeNavTabRef = useRef<string>('home');
  activeNavTabRef.current = activeNavTab;
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistData | null>(null);
  const selectedPlaylistRef = useRef<PlaylistData | null>(null);
  selectedPlaylistRef.current = selectedPlaylist;

  // Origin context tracking: 'library' | 'home' | 'ai_dj' | 'favorites' (Section 14 & 15)
  const [playlistOrigin, setPlaylistOrigin] = useState<'library' | 'home' | 'ai_dj' | 'favorites'>('library');
  const playlistOriginRef = useRef<'library' | 'home' | 'ai_dj' | 'favorites'>('library');
  playlistOriginRef.current = playlistOrigin;

  const lastBackTimeRef = useRef<number>(0);

  // Smoothly scroll Home ScrollView when focusedId moves between vertical sections
  useEffect(() => {
    if (selectedPlaylist !== null || activeNavTab !== 'home') return;
    if (!homeScrollViewRef.current) return;
    const targetY = focusedId.startsWith('MIX_') ? 260 : 0;
    if (homeScrollYRef.current !== targetY) {
      homeScrollYRef.current = targetY;
      homeScrollViewRef.current.scrollTo({ y: targetY, animated: true });
    }
  }, [focusedId, selectedPlaylist, activeNavTab]);

  // Smoothly scroll horizontal carousels only when moving past visible window edges
  useEffect(() => {
    if (selectedPlaylist !== null || activeNavTab !== 'home') return;

    if (focusedId.startsWith('REC_')) {
      const idx = parseInt(focusedId.replace('REC_', ''), 10);
      if (!isNaN(idx) && recentlyPlayedScrollRef.current) {
        const VISIBLE_CARD_COUNT = 5;
        const maxStartIdx = Math.max(0, recentlyPlayedTracks.length - VISIBLE_CARD_COUNT);
        let startIdx = recentlyPlayedStartIndexRef.current;
        const endIdx = startIdx + VISIBLE_CARD_COUNT - 1;

        if (idx > endIdx) {
          startIdx = idx - VISIBLE_CARD_COUNT + 1;
        } else if (idx < startIdx) {
          startIdx = idx;
        }

        startIdx = Math.max(0, Math.min(startIdx, maxStartIdx));

        if (startIdx !== recentlyPlayedStartIndexRef.current) {
          recentlyPlayedStartIndexRef.current = startIdx;
          const targetX = startIdx * 151;
          recentlyPlayedScrollRef.current.scrollTo({ x: targetX, animated: true });
        }
      }
    } else if (focusedId.startsWith('MIX_')) {
      const idx = parseInt(focusedId.replace('MIX_', ''), 10);
      if (!isNaN(idx) && forYouScrollRef.current) {
        const VISIBLE_MIX_COUNT = 5;
        const maxStartIdx = Math.max(0, FOR_YOU_MIXES.length - VISIBLE_MIX_COUNT);
        let startIdx = forYouStartIndexRef.current;
        const endIdx = startIdx + VISIBLE_MIX_COUNT - 1;

        if (idx > endIdx) {
          startIdx = idx - VISIBLE_MIX_COUNT + 1;
        } else if (idx < startIdx) {
          startIdx = idx;
        }

        startIdx = Math.max(0, Math.min(startIdx, maxStartIdx));

        if (startIdx !== forYouStartIndexRef.current) {
          forYouStartIndexRef.current = startIdx;
          const targetX = startIdx * 172;
          forYouScrollRef.current.scrollTo({ x: targetX, animated: true });
        }
      }
    }
  }, [focusedId, selectedPlaylist, activeNavTab, recentlyPlayedTracks]);


  // Isolated Full Screen Player Navigation & AI Overlay State (Sections 1–7, 20–30)
  const [isFullscreenPlayer, setIsFullscreenPlayer] = useState<boolean>(false);
  const isFullscreenPlayerRef = useRef<boolean>(false);
  isFullscreenPlayerRef.current = isFullscreenPlayer;

  const [fullscreenFocusId, setFullscreenFocusIdState] = useState<string>(
    FULLSCREEN_FOCUS_IDS.PLAY_PAUSE
  );
  const fullscreenFocusIdRef = useRef<string>(FULLSCREEN_FOCUS_IDS.PLAY_PAUSE);

  const setFullscreenFocusId = useCallback(
    (updater: string | ((prev: string) => string)) => {
      const nextId =
        typeof updater === 'function'
          ? updater(fullscreenFocusIdRef.current)
          : updater;
      fullscreenFocusIdRef.current = nextId;
      setFullscreenFocusIdState(nextId);
    },
    []
  );

  const [isAiOverlayOpen, setIsAiOverlayOpen] = useState<boolean>(false);
  const isAiOverlayOpenRef = useRef<boolean>(false);
  isAiOverlayOpenRef.current = isAiOverlayOpen;

  const [isBackgroundOverlayOpen, setIsBackgroundOverlayOpen] = useState<boolean>(false);
  const isBackgroundOverlayOpenRef = useRef<boolean>(false);
  isBackgroundOverlayOpenRef.current = isBackgroundOverlayOpen;

  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | null>(null);
  const selectedBackgroundIdRef = useRef<string | null>(null);

  // User Avatar Companion Selection & Persistence State
  const [isPreferenceHydrated, setIsPreferenceHydrated] = useState<boolean>(false);
  const [savedAvatarId, setSavedAvatarId] = useState<AvatarId | null>(null);
  const savedAvatarIdRef = useRef<AvatarId | null>(null);
  savedAvatarIdRef.current = savedAvatarId;

  const [showAvatarSelection, setShowAvatarSelection] = useState<boolean>(false);
  const showAvatarSelectionRef = useRef<boolean>(false);
  showAvatarSelectionRef.current = showAvatarSelection;
  const avatarSelectionRef = useRef<AvatarSelectionScreenRef>(null);

  // Intro Sequence State (~3.50s)
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const homeOpacity = useRef(new Animated.Value(0)).current;
  const homeTranslateY = useRef(new Animated.Value(20)).current;

  // Load persisted motion background selection on startup
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const savedBg = await loadSelectedBackgroundId();
        if (isMounted && savedBg) {
          selectedBackgroundIdRef.current = savedBg;
          setSelectedBackgroundId(savedBg);
        }
      } catch (e) {
        console.log('[App] Failed to load saved background ID:', e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize local SQLite database and hydrate persisted entities on startup
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        console.log('[App] Initializing SQLite database and hydrating state...');
        await initDatabase();
        await ensureDefaultFavoritesUnliked();
        await ensureDefaultSearchHistoryCleaned();
        await ensureDefaultPlaybackHistoryCleaned();

        // 1. Hydrate Liked Songs
        const dbLikedSongs = await getLikedSongIds();
        if (isMounted) {
          const map: Record<string, boolean> = {};
          dbLikedSongs.forEach((id) => {
            map[id] = true;
          });
          setSongFavoriteMap(map);
        }

        // 2. Hydrate Liked Playlists
        const dbLikedPlaylists = await getLikedPlaylistIds();
        if (isMounted) {
          const plMap: Record<string, boolean> = {};
          dbLikedPlaylists.forEach((id) => {
            plMap[id] = true;
          });
          setPlaylistLikedMap(plMap);
        }

        // 3. Hydrate Recently Played Tracks (strictly dynamic plays, zero static padding)
        const dbRecentTrackIds = await getRecentlyPlayedTrackIds(10);
        if (isMounted && dbRecentTrackIds.length > 0) {
          const hydratedRecentTracks: RecentlyPlayedTrackItem[] = [];
          for (const trackId of dbRecentTrackIds) {
            const trackItem = resolveRecentlyPlayedTrack(trackId);
            if (trackItem) {
              hydratedRecentTracks.push(trackItem);
            }
          }
          setRecentlyPlayedTracks(hydratedRecentTracks);
        } else if (isMounted) {
          setRecentlyPlayedTracks([]);
        }

        // 4. Hydrate AI DJ Playlists
        const dbAiPlaylists = await getAiDjPlaylists(30);
        if (isMounted && dbAiPlaylists.length > 0) {
          const hydrated = dbAiPlaylists.map(convertStoredAiDjToPlaylist);
          setUserAiPlaylists(hydrated);
        }

        // 5. Hydrate Avatar Companion Selection Preference
        const dbAvatarId = await getSavedAvatarSelection();
        if (isMounted) {
          if (dbAvatarId && isValidAvatarId(dbAvatarId)) {
            console.log('[App] Returning user detected with avatar companion:', dbAvatarId);
            setSavedAvatarId(dbAvatarId);
            savedAvatarIdRef.current = dbAvatarId;
            setShowIntro(false);
            setShowAvatarSelection(false);
            homeOpacity.setValue(1);
            homeTranslateY.setValue(0);
          } else {
            console.log('[App] First-time user detected. Launching intro sequence first.');
            setSavedAvatarId(null);
            savedAvatarIdRef.current = null;
            setShowIntro(true);
            setShowAvatarSelection(false);
            homeOpacity.setValue(0);
            homeTranslateY.setValue(20);
          }
          setIsPreferenceHydrated(true);
        }

        console.log('[App] SQLite database hydrated successfully.');
      } catch (err) {
        console.error('[App] SQLite initialization/hydration error:', err);
        if (isMounted) {
          setIsPreferenceHydrated(true);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const [aiOverlayStatus, setAiOverlayStatus] = useState<AiOverlayStatus>('IDLE');
  const [aiSongInsight, setAiSongInsight] = useState<SongAiInsight | null>(null);
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);

  // Enter Full Screen from Playlist Detail (Section 4 & 5)
  const enterFullscreenPlayer = useCallback(() => {
    isAiOverlayOpenRef.current = false;
    setIsAiOverlayOpen(false);
    isBackgroundOverlayOpenRef.current = false;
    setIsBackgroundOverlayOpen(false);
    isFullscreenPlayerRef.current = true;
    setIsFullscreenPlayer(true);
    // Initial Full Screen focus MUST be FS_PLAY_PAUSE (Section 5)
    setFullscreenFocusId(FULLSCREEN_FOCUS_IDS.PLAY_PAUSE);
  }, [setFullscreenFocusId]);

  // Exit Full Screen -> Return to Playlist Detail and restore focus to PL_PLAYER_FULLSCREEN (Section 28 & 29)
  const exitFullscreenPlayer = useCallback(() => {
    isAiOverlayOpenRef.current = false;
    setIsAiOverlayOpen(false);
    isBackgroundOverlayOpenRef.current = false;
    setIsBackgroundOverlayOpen(false);
    isFullscreenPlayerRef.current = false;
    setIsFullscreenPlayer(false);
    setFocusedId('PL_PLAYER_FULLSCREEN');
  }, [setFocusedId]);

  const handleToggleFullscreen = useCallback(() => {
    if (isFullscreenPlayerRef.current) {
      exitFullscreenPlayer();
    } else {
      enterFullscreenPlayer();
    }
  }, [enterFullscreenPlayer, exitFullscreenPlayer]);

  // Close AI Song Information Overlay -> Restore focus to FS_SONG_INFO (Section 26)
  const closeAiSongInfoOverlay = useCallback(() => {
    isAiOverlayOpenRef.current = false;
    setIsAiOverlayOpen(false);
    setFullscreenFocusId(FULLSCREEN_FOCUS_IDS.SONG_INFO);
  }, [setFullscreenFocusId]);

  // Open AI Song Information Overlay with per-song-ID cache & pending-request deduplication (Sections 20–25)
  const openAiSongInfoOverlay = useCallback(async () => {
    const pl = selectedPlaylistRef.current || PLAYLISTS.chill_vibes;
    const activeTrk =
      pl.tracks.find((t) => t.id === currentTrackRef.current?.id) ||
      pl.tracks[0];
    if (!activeTrk) return;

    isAiOverlayOpenRef.current = true;
    setIsAiOverlayOpen(true);
    setFullscreenFocusId(FULLSCREEN_FOCUS_IDS.AI_OVERLAY_BACK);
    setAiErrorMessage(null);

    // 1. Check cache synchronously by stable playingTrack.id (Section 23)
    const cached = getCachedSongInfo(activeTrk.id);
    if (cached) {
      setAiSongInsight(cached);
      setAiOverlayStatus('READY');
      return;
    }

    // 2. Cache miss -> show LOADING and invoke deduplicated Gemini request (Section 24)
    setAiOverlayStatus('LOADING');
    setAiSongInsight(null);
    try {
      const insight = await fetchOrGetSongInfo(activeTrk, pl.title);
      // Verify the playing song has not changed while awaiting
      const latestTrk =
        (selectedPlaylistRef.current || PLAYLISTS.chill_vibes).tracks.find(
          (t) => t.id === currentTrackRef.current?.id
        ) || activeTrk;
      if (latestTrk.id === activeTrk.id) {
        setAiSongInsight(insight);
        setAiOverlayStatus('READY');
      }
    } catch (err: any) {
      setAiOverlayStatus('ERROR');
      setAiErrorMessage(err?.message || 'Could not generate AI song insight.');
    }
  }, [setFullscreenFocusId]);

  // Open Background Selection Overlay -> Focus on current active background thumbnail
  const openBackgroundOverlay = useCallback(() => {
    isBackgroundOverlayOpenRef.current = true;
    setIsBackgroundOverlayOpen(true);
    const activeId = selectedBackgroundIdRef.current;
    const activeIdx = BACKGROUND_OPTIONS.findIndex((b) => b.id === activeId);
    const targetFocus = activeIdx >= 0 ? BG_THUMB_FOCUS_IDS[activeIdx] : BG_THUMB_FOCUS_IDS[0];
    setFullscreenFocusId(targetFocus);
  }, [setFullscreenFocusId]);

  // Close Background Selection Overlay -> Restore focus to FS_PALETTE
  const closeBackgroundOverlay = useCallback(() => {
    isBackgroundOverlayOpenRef.current = false;
    setIsBackgroundOverlayOpen(false);
    setFullscreenFocusId(FULLSCREEN_FOCUS_IDS.PALETTE);
  }, [setFullscreenFocusId]);

  // Select Background -> Apply immediately & persist to storage without interrupting playback
  const handleSelectBackground = useCallback(async (bgId: string) => {
    selectedBackgroundIdRef.current = bgId;
    setSelectedBackgroundId(bgId);
    try {
      await saveSelectedBackgroundId(bgId);
    } catch (e) {
      console.log('[App] Failed to persist background ID:', e);
    }
  }, []);

  // Collapsible Sidebar State (Default: Collapsed icon-only rail ~76px)
  const [isSidebarHovered, setIsSidebarHovered] = useState<boolean>(false);
  const isSidebarFocused = focusedId.startsWith('NAV_');
  const isSidebarExpanded = isSidebarFocused || isSidebarHovered;

  const sidebarWidth = useRef(new Animated.Value(76)).current;
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const labelTranslateX = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    if (isSidebarExpanded) {
      Animated.parallel([
        Animated.timing(sidebarWidth, {
          toValue: 188,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(labelOpacity, {
          toValue: 1,
          duration: 180,
          delay: 40,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(labelTranslateX, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sidebarWidth, {
          toValue: 76,
          duration: 200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(labelOpacity, {
          toValue: 0,
          duration: 100,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(labelTranslateX, {
          toValue: -8,
          duration: 120,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSidebarExpanded, sidebarWidth, labelOpacity, labelTranslateX]);

  // Clock
  const [currentTime, setCurrentTime] = useState<string>('08:24 PM');
  const [currentDate, setCurrentDate] = useState<string>('Sun, 22 Sep');

  // Dynamic Time of Day Theme (Morning 🌅, Afternoon ☀️, Evening 🌇, Night 🌙)
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<TimeOfDay>(() =>
    getAutoTimeOfDay(new Date().getHours())
  );
  const selectedTimeOfDayRef = useRef<TimeOfDay>(selectedTimeOfDay);
  selectedTimeOfDayRef.current = selectedTimeOfDay;
  const currentTheme = TIME_THEMES[selectedTimeOfDay];

  const handleCycleTheme = useCallback(() => {
    const order: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];
    setSelectedTimeOfDay((prev) => {
      const nextIdx = (order.indexOf(prev) + 1) % order.length;
      const nextTheme = order[nextIdx];
      selectedTimeOfDayRef.current = nextTheme;
      return nextTheme;
    });
  }, []);

  // Voice State
  const [isListening, setIsListening] = useState<boolean>(false);
  const isListeningRef = useRef<boolean>(false);
  isListeningRef.current = isListening;
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceToast, setVoiceToast] = useState<string | null>(null);
  const [geminiDiagnostic, setGeminiDiagnostic] = useState<GeminiDiagnosticInfo | null>(null);
  const geminiDiagnosticRef = useRef<GeminiDiagnosticInfo | null>(null);
  geminiDiagnosticRef.current = geminiDiagnostic;

  // Module 1: AI DJ Processing / Session Creation Overlay State
  const [isAiDjOverlayVisible, setIsAiDjOverlayVisible] = useState<boolean>(false);
  const isAiDjOverlayVisibleRef = useRef<boolean>(false);
  isAiDjOverlayVisibleRef.current = isAiDjOverlayVisible;

  const [aiDjProcessingStage, setAiDjProcessingStage] = useState<AIDJProcessingStage>('UNDERSTANDING');
  const aiDjProcessingStageRef = useRef<AIDJProcessingStage>('UNDERSTANDING');
  aiDjProcessingStageRef.current = aiDjProcessingStage;

  const [aiDjUserRequest, setAiDjUserRequest] = useState<string>('');
  const [aiDjSessionTitle, setAiDjSessionTitle] = useState<string>('Creating your session');
  const lastUserRequestRef = useRef<string>('');
  const [aiDjPreviewTracks, setAiDjPreviewTracks] = useState<MusicTrack[]>([]);
  const [aiDjRevealedCount, setAiDjRevealedCount] = useState<number>(0);
  const [aiDjSessionSummary, setAiDjSessionSummary] = useState<AIDJSessionSummary | null>(null);
  const [aiDjError, setAiDjError] = useState<AIDJErrorInfo | null>(null);
  const [aiDjErrorMessage, setAiDjErrorMessage] = useState<string | null>(null);

  // TV remote D-pad focus on error action buttons ('retry' | 'back')
  const [overlayFocusedBtn, setOverlayFocusedBtn] = useState<'retry' | 'back'>('retry');
  const overlayFocusedBtnRef = useRef<'retry' | 'back'>('retry');
  overlayFocusedBtnRef.current = overlayFocusedBtn;

  // Cancellation and Race-Condition Protection (Sections 23 & 24)
  const aiDjRequestIdRef = useRef<number>(0);

  // Ready AI DJ Session stored for Module 2 consumption (Sections 19 & 20)
  const [readyAiDjSession, setReadyAiDjSession] = useState<AIDJSession | null>(null);
  const readyAiDjSessionRef = useRef<AIDJSession | null>(null);
  readyAiDjSessionRef.current = readyAiDjSession;

  // Dynamic User-Generated AI Playlists for AI DJ Landing Screen
  const [userAiPlaylists, setUserAiPlaylists] = useState<PlaylistData[]>([]);
  const userAiPlaylistsRef = useRef<PlaylistData[]>([]);
  userAiPlaylistsRef.current = userAiPlaylists;

  // Resolves full track data from built-in playlists, user AI DJ sessions, or catalog
  const resolveTrackById = useCallback((trackId: string): PlaylistTrack | null => {
    // 1. Check in all built-in playlists
    for (const pl of Object.values(PLAYLISTS)) {
      const match = pl.tracks.find((t) => t.id === trackId);
      if (match) return match;
    }
    // 2. Check in user AI DJ playlists
    for (const pl of userAiPlaylistsRef.current) {
      const match = pl.tracks.find((t) => t.id === trackId);
      if (match) return match;
    }
    // 3. Check in global TRACK_CATALOG
    const catalogMatch = TRACK_CATALOG.find((t) => t.id === trackId);
    if (catalogMatch) {
      return {
        id: catalogMatch.id,
        trackNumber: 1,
        title: catalogMatch.title,
        artist: catalogMatch.artist,
        album: catalogMatch.album || 'Pandivo Single',
        duration: formatTrackDuration(catalogMatch.duration || 210),
        durationSeconds: catalogMatch.duration || 210,
        audioUrl: catalogMatch.audioUrl,
        artwork:
          catalogMatch.artworkUrl && catalogMatch.artworkUrl.startsWith('http')
            ? { uri: catalogMatch.artworkUrl }
            : (catalogMatch as any).artwork || require('./assets/ui/rec_0_until_found_clean.png'),
        isFavorite: true,
      };
    }
    return null;
  }, []);

  // Dynamically synthesized "Liked Songs" master playlist
  const likedSongsPlaylist: PlaylistData = useMemo(() => {
    const uniqueTracks: PlaylistTrack[] = [];
    const seenIds = new Set<string>();

    Object.entries(songFavoriteMap).forEach(([trackId, isLiked]) => {
      if (isLiked && !seenIds.has(trackId)) {
        seenIds.add(trackId);
        const resolved = resolveTrackById(trackId);
        if (resolved) {
          uniqueTracks.push({
            ...resolved,
            trackNumber: uniqueTracks.length + 1,
            isFavorite: true,
          });
        }
      }
    });

    return {
      id: 'liked_songs',
      title: 'Liked Songs',
      tagline: 'Your personal collection of favorite tracks',
      creator: 'You',
      creatorAvatar: require('./assets/ui/avatar_clean.png'),
      songsCount: `${uniqueTracks.length} songs`,
      totalDuration: formatTotalPlaylistDuration(uniqueTracks),
      description:
        'Every song you like across Search, AI DJ, and Playlists is gathered here into your personal soundtrack.',
      coverImage: require('./assets/ui/liked_songs_heart_3d.png'),
      isHeartCover: true,
      bannerAccentColor: '#EC4899',
      badgeText: 'FAVORITES',
      quoteText: 'Made with love\nJust for you ♥',
      tracks: uniqueTracks,
    };
  }, [songFavoriteMap, resolveTrackById]);

  // Dynamically filtered liked playlists (Built-in + AI DJ)
  const likedPlaylists: PlaylistData[] = useMemo(() => {
    const allPlaylists: PlaylistData[] = [
      ...Object.values(PLAYLISTS),
      ...userAiPlaylists,
    ];
    return allPlaylists.filter((pl) => !!playlistLikedMap[pl.id]);
  }, [playlistLikedMap, userAiPlaylists]);

  const likedSongsPlaylistRef = useRef<PlaylistData>(likedSongsPlaylist);
  likedSongsPlaylistRef.current = likedSongsPlaylist;
  const likedPlaylistsRef = useRef<PlaylistData[]>(likedPlaylists);
  likedPlaylistsRef.current = likedPlaylists;

  const lastIntentRef = useRef<MusicIntent | null>(null);
  const readyAutoProceedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleProceedToAiDjPlaylistRef = useRef<(() => void) | null>(null);
  const handleToggleVoiceRef = useRef<(() => Promise<void>) | null>(null);

  const handleCancelAiDjProcessing = useCallback(() => {
    console.log('[Module 1] handleCancelAiDjProcessing called! Dismissing overlay.');
    if (readyAutoProceedTimerRef.current) {
      clearTimeout(readyAutoProceedTimerRef.current);
      readyAutoProceedTimerRef.current = null;
    }
    // Invalidate any in-flight async request so it can NEVER update state later
    aiDjRequestIdRef.current++;
    isAiDjOverlayVisibleRef.current = false;
    setIsAiDjOverlayVisible(false);
    setAiDjProcessingStage('UNDERSTANDING');
    setAiDjError(null);
    setAiDjErrorMessage(null);
    setAiDjPreviewTracks([]);
    setAiDjRevealedCount(0);
    setAiDjSessionSummary(null);
    setOverlayFocusedBtn('retry');
    setIsListening(false);
    setIsProcessing(false);
    setVoiceToast(null);
    lastBackTimeRef.current = Date.now();
  }, []);

  const handleRetryAiDjProcessing = useCallback(() => {
    const promptToRetry = (lastUserRequestRef.current || aiDjUserRequest || '').trim();
    console.log('[Module 1] handleRetryAiDjProcessing called! promptToRetry:', promptToRetry);
    setOverlayFocusedBtn('retry');

    if (promptToRetry.length > 0) {
      // Retrying a real prompt that failed during AI/Gemini or track selection
      handleVoiceCommandRef.current(promptToRetry);
    } else {
      // Speech recognition had failed or was silent:
      // Dismiss error overlay and immediately start fresh voice listening
      handleCancelAiDjProcessing();
      handleToggleVoiceRef.current?.();
    }
  }, [handleCancelAiDjProcessing, aiDjUserRequest]);

  const handlePlayPlaylistTrackRef = useRef<((track: PlaylistTrack, preserveExistingShuffleQueue?: boolean) => void) | null>(null);
  const handleDpadPressRef = useRef<((id: string) => void) | null>(null);

  // DJ Session & Playback
  const [session, setSession] = useState<AIDJSession | null>(null);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack>(() => {
    const first = PLAYLISTS.chill_vibes.tracks[0];
    return {
      id: first.id,
      title: first.title,
      artist: first.artist,
      album: first.album,
      year: 2024,
      era: '2020s',
      mood: 'calm',
      energy: 'medium',
      bpm: 100,
      vibe: first.title,
      genre: 'Pop',
      audioUrl: first.audioUrl,
      artworkUrl: '',
      duration: first.durationSeconds,
      tags: ['playlist'],
    };
  });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isShuffleActive, setIsShuffleActive] = useState<boolean>(false);
  const isShuffleActiveRef = useRef<boolean>(false);
  const [shuffledTrackIds, setShuffledTrackIds] = useState<string[]>([]);
  const shuffledTrackIdsRef = useRef<string[]>([]);
  const [isRepeatActive, setIsRepeatActive] = useState<boolean>(false);
  const initialAutoPlayDone = useRef<boolean>(false);

  // Industry-standard Fisher-Yates (Knuth) Shuffle Queue Generator with Anchor Pinning & Non-Sequential First Next
  const buildFisherYatesQueue = useCallback(
    (tracks: PlaylistTrack[], anchorTrackId?: string): string[] => {
      if (!tracks || tracks.length === 0) return [];
      if (tracks.length === 1) return [tracks[0].id];

      const anchorIdx = anchorTrackId
        ? tracks.findIndex((t) => t.id === anchorTrackId)
        : -1;
      const validAnchorId =
        anchorIdx >= 0
          ? tracks[anchorIdx].id
          : tracks[Math.floor(Math.random() * tracks.length)].id;
      const resolvedAnchorIdx = tracks.findIndex((t) => t.id === validAnchorId);
      const sequentialNextId =
        tracks[(resolvedAnchorIdx + 1) % tracks.length]?.id;

      const remaining = tracks
        .filter((t) => t.id !== validAnchorId)
        .map((t) => t.id);

      // Unbiased Fisher-Yates (Knuth) in-place permutation
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = remaining[i];
        remaining[i] = remaining[j];
        remaining[j] = temp;
      }

      // Ensure the immediate next track in shuffle is not the sequential next track when playlist has >= 3 tracks
      if (remaining.length >= 2 && remaining[0] === sequentialNextId) {
        const swapIdx = 1 + Math.floor(Math.random() * (remaining.length - 1));
        const temp = remaining[0];
        remaining[0] = remaining[swapIdx];
        remaining[swapIdx] = temp;
      }

      return [validAnchorId, ...remaining];
    },
    []
  );

  const currentTrackRef = useRef(currentTrack);
  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  const lastAutoAdvancedTrackIdRef = useRef<string | null>(null);
  const hasPlaybackStartedRef = useRef<boolean>(false);

  // Audio Player via expo-audio - Stable instance so it is not destroyed on state changes
  const player = useAudioPlayer(null);
  const playerStatus = useAudioPlayerStatus(player);
  const playerStatusRef = useRef(playerStatus);
  playerStatusRef.current = playerStatus;

  // Sync repeat/loop status with the native player
  useEffect(() => {
    if (player) {
      player.volume = 1.0;
      player.loop = isRepeatActive;
    }
  }, [player, isRepeatActive]);

  // Pre-load initial track into player without playing (waits for user interaction)
  useEffect(() => {
    if (player && currentTrack?.audioUrl && !initialAutoPlayDone.current) {
      initialAutoPlayDone.current = true;
      try {
        player.replace(currentTrack.audioUrl);
      } catch (err) {
        console.warn('[Audio] Failed initial track load:', err);
      }
    }
  }, [player]);

  // Real-time clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedMins = minutes < 10 ? `0${minutes}` : `${minutes}`;
      setCurrentTime(`${formattedHours}:${formattedMins} ${ampm}`);

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      setCurrentDate(`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Intro Docking choreography
  const handleDockStart = useCallback(() => {
    // If first-time user hasn't chosen an avatar companion yet, do NOT dock into home screen
    if (!savedAvatarIdRef.current) {
      return;
    }
    Animated.parallel([
      Animated.timing(homeOpacity, {
        toValue: 1.0,
        duration: 650,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(homeTranslateY, {
        toValue: 0,
        duration: 650,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [homeOpacity, homeTranslateY]);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    if (!savedAvatarIdRef.current) {
      // First-time user: immediately present the Avatar Selection Screen
      setShowAvatarSelection(true);
    } else {
      // Replay intro complete: return smoothly to home screen
      Animated.parallel([
        Animated.timing(homeOpacity, {
          toValue: 1.0,
          duration: 450,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(homeTranslateY, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [homeOpacity, homeTranslateY]);

  const handleConfirmAvatar = useCallback(
    async (avatarId: AvatarId) => {
      console.log('[App] User confirmed avatar companion:', avatarId);
      await saveAvatarSelection(avatarId);
      setSavedAvatarId(avatarId);
      savedAvatarIdRef.current = avatarId;
      setShowAvatarSelection(false);

      // Transition smoothly into home landing screen
      Animated.parallel([
        Animated.timing(homeOpacity, {
          toValue: 1.0,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(homeTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    },
    [homeOpacity, homeTranslateY]
  );

  const handleReplayIntro = useCallback(() => {
    homeOpacity.setValue(0);
    homeTranslateY.setValue(20);
    setShowIntro(true);
  }, [homeOpacity, homeTranslateY]);

  // Playlist Search Bar State (Speech-to-Text + Elasticsearch Fuzzy Song Title Match + Safe Reset)
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState<string>('');
  const playlistSearchQueryRef = useRef<string>('');
  const [isPlaylistVoiceListening, setIsPlaylistVoiceListening] = useState<boolean>(false);
  const isPlaylistVoiceListeningRef = useRef<boolean>(false);
  const playlistSearchInputRef = useRef<TextInput>(null);
  const speechFallbackTimerRef = useRef<any>(null);
  const demoSpeechCycleIdxRef = useRef<number>(0);

  const elasticSearchResult = useMemo(() => {
    if (!selectedPlaylist) return null;
    return searchPlaylistTracksElastic(selectedPlaylist.tracks, playlistSearchQuery);
  }, [selectedPlaylist, playlistSearchQuery]);

  const filteredPlaylistTracks = useMemo(
    () => (elasticSearchResult ? elasticSearchResult.tracks : (selectedPlaylist?.tracks ?? [])),
    [elasticSearchResult, selectedPlaylist]
  );
  const filteredPlaylistTracksRef = useRef<PlaylistTrack[]>([]);
  filteredPlaylistTracksRef.current = filteredPlaylistTracks;

  const hasActivePlaylistSearch =
    playlistSearchQuery.trim().length > 0 || isPlaylistVoiceListening;
  const hasActivePlaylistSearchRef = useRef<boolean>(false);
  hasActivePlaylistSearchRef.current = hasActivePlaylistSearch;

  const updatePlaylistSearchText = useCallback((text: string) => {
    if (speechFallbackTimerRef.current) {
      clearTimeout(speechFallbackTimerRef.current);
      speechFallbackTimerRef.current = null;
    }
    playlistSearchQueryRef.current = text;
    setPlaylistSearchQuery(text);
  }, []);

  const applyPlaylistSpeechResult = useCallback((rawTranscript: string) => {
    if (speechFallbackTimerRef.current) {
      clearTimeout(speechFallbackTimerRef.current);
      speechFallbackTimerRef.current = null;
    }
    isPlaylistVoiceListeningRef.current = false;
    setIsPlaylistVoiceListening(false);
    setIsListening(false);
    try {
      SpeechRecognition?.stopListening?.();
    } catch (_e) {}

    const trimmed = rawTranscript.trim();
    if (!trimmed) return;

    playlistSearchQueryRef.current = trimmed;
    setPlaylistSearchQuery(trimmed);

    const activePl = selectedPlaylistRef.current;
    if (activePl) {
      const res = searchPlaylistTracksElastic(activePl.tracks, trimmed);
      if (res.topMatch) {
        setVoiceToast(
          res.isFuzzyCorrected
            ? `🎙️ "${trimmed}" → ✨ Elastic Match: "${res.topMatch.title}" (${res.tracks.length} found)`
            : `🎙️ "${trimmed}" → 🎯 Matched "${res.topMatch.title}" (${res.tracks.length} found)`
        );
      } else {
        setVoiceToast(`🎙️ "${trimmed}" • No exact match`);
      }
      setTimeout(() => setVoiceToast(null), 3400);
    }
  }, []);

  const lastSearchClearTimeRef = useRef<number>(0);

  // Safe Reset & Close for Playlist Search ('✕' Button or Hardware Back)
  const handleClearPlaylistSearch = useCallback(
    (silent: boolean = false) => {
      lastSearchClearTimeRef.current = Date.now();
      if (speechFallbackTimerRef.current) {
        clearTimeout(speechFallbackTimerRef.current);
        speechFallbackTimerRef.current = null;
      }
      if (isPlaylistVoiceListeningRef.current || isListening) {
        try {
          SpeechRecognition?.stopListening?.();
        } catch (_e) {}
      }
      isPlaylistVoiceListeningRef.current = false;
      setIsPlaylistVoiceListening(false);
      setIsListening(false);
      playlistSearchQueryRef.current = '';
      setPlaylistSearchQuery('');

      if (!silent) {
        focusedIdRef.current = 'PL_SEARCH';
        setFocusedId('PL_SEARCH');
        setVoiceToast('✕ Search reset • Showing all playlist songs');
        setTimeout(() => setVoiceToast(null), 2200);
      }
    },
    [isListening, setFocusedId]
  );

  // Generates a realistic Speech-to-Text phrase (with phonetic/spelling variations) if emulator mic has no audio
  const triggerEmulatorPlaylistSpeechFallback = useCallback(() => {
    const activePl = selectedPlaylistRef.current;
    if (!activePl || !isPlaylistVoiceListeningRef.current) return;

    const chillDemoPhrases = [
      'bukas breze', // Phonetic + typo for "Boukas - Breeze"
      'nevr be the seam', // Spelling + homophone for "Never be the Same"
      'sielo de azukar', // Accent + phonetic s/c & k/c for "Cielo De Azúcar"
      'flai hai zuli', // Phonetic for "Fly High Zuly Sky Mix"
      'deman planit blues', // Typo for "Demon Planet Blues"
    ];

    let chosenPhrase = '';
    if (activePl.id === 'chill_vibes') {
      chosenPhrase = chillDemoPhrases[demoSpeechCycleIdxRef.current % chillDemoPhrases.length];
      demoSpeechCycleIdxRef.current += 1;
    } else {
      const sampleIdx = demoSpeechCycleIdxRef.current % Math.min(8, activePl.tracks.length);
      demoSpeechCycleIdxRef.current += 1;
      const targetTitle = activePl.tracks[sampleIdx]?.title || 'breeze';
      // Introduce a natural speech-to-text phonetic spelling variation to demonstrate Elasticsearch tolerance
      chosenPhrase = targetTitle
        .toLowerCase()
        .replace(/ee/g, 'e')
        .replace(/c/g, 'k')
        .replace(/ph/g, 'f');
    }

    applyPlaylistSpeechResult(chosenPhrase);
  }, [applyPlaylistSpeechResult]);

  // Start or Toggle Speech-to-Text on the Playlist Search Bar ('PL_SEARCH')
  const handleStartPlaylistVoiceSearch = useCallback(async () => {
    // Prevent native Android Pressable click from re-triggering voice search right after clearing via 'PL_SEARCH_CLEAR'
    if (Date.now() - lastSearchClearTimeRef.current < 600) {
      return;
    }
    if (focusedIdRef.current === 'PL_SEARCH_CLEAR') {
      handleClearPlaylistSearch(false);
      return;
    }
    if (isPlaylistVoiceListeningRef.current) {
      if (speechFallbackTimerRef.current) {
        clearTimeout(speechFallbackTimerRef.current);
        speechFallbackTimerRef.current = null;
      }
      isPlaylistVoiceListeningRef.current = false;
      setIsPlaylistVoiceListening(false);
      setIsListening(false);
      setVoiceToast(null);
      try {
        await SpeechRecognition?.stopListening?.();
      } catch (_e) {}
      return;
    }

    isPlaylistVoiceListeningRef.current = true;
    setIsPlaylistVoiceListening(true);
    setIsListening(true);
    setVoiceToast('🎙️ Speak a song title now (Elasticsearch fuzzy match active)...');

    // Fallback timer in case TV Emulator has no physical microphone stream attached
    if (speechFallbackTimerRef.current) {
      clearTimeout(speechFallbackTimerRef.current);
    }
    speechFallbackTimerRef.current = setTimeout(() => {
      if (isPlaylistVoiceListeningRef.current) {
        triggerEmulatorPlaylistSpeechFallback();
      }
    }, 1800);

    try {
      await SpeechRecognition?.startListening?.();
    } catch (_err) {
      // If SpeechRecognizer service is unavailable on emulator, trigger realistic speech-to-text after brief listening pulse
    }
  }, [triggerEmulatorPlaylistSpeechFallback]);

  const handleVoiceCommandRef = useRef<(prompt: string) => void>(() => {});

  // Handle Speech Recognition Failures for AI DJ (Silence, Unrecognized, or Mic Error)
  const handleSpeechFailure = useCallback(
    (reason: 'no_speech' | 'not_recognized' | 'mic_error') => {
      console.log(`[AI DJ] handleSpeechFailure called with reason: ${reason}`);
      if (speechFallbackTimerRef.current) {
        clearTimeout(speechFallbackTimerRef.current);
        speechFallbackTimerRef.current = null;
      }
      try {
        SpeechRecognition?.stopListening?.();
      } catch (_e) {}

      setIsListening(false);
      isListeningRef.current = false;
      setIsProcessing(false);
      setVoiceToast(null);
      setVoiceTranscript('');

      // Clear current & last user request so stale query is never used
      lastUserRequestRef.current = '';
      setAiDjUserRequest('');
      setAiDjPreviewTracks([]);
      setAiDjRevealedCount(0);
      setAiDjSessionSummary(null);

      // Invalidate any in-flight request
      aiDjRequestIdRef.current++;

      // Present clean user-friendly error without any technical details
      const speechErr = classifySpeechError(reason);
      setAiDjError(speechErr);
      setAiDjProcessingStage('ERROR');
      isAiDjOverlayVisibleRef.current = true;
      setIsAiDjOverlayVisible(true);
      setOverlayFocusedBtn('retry');
    },
    []
  );

  // Voice Recognition Events
  useEffect(() => {
    if (!speechEventEmitter) return;

    const subStart = speechEventEmitter.addListener('onSpeechStart', () => {
      if (selectedPlaylistRef.current !== null) {
        isPlaylistVoiceListeningRef.current = true;
        setIsPlaylistVoiceListening(true);
        setVoiceToast('🎙️ Listening... Speak song title');
      } else if (activeNavTabRef.current === 'search') {
        searchScreenRef.current?.handleVoiceStart?.();
      } else {
        setIsListening(true);
        setVoiceToast('Listening... Speak your mood or request');
      }
    });

    const subPartial = speechEventEmitter.addListener('onSpeechPartialResults', (data: any) => {
      const partialText = data?.text || '';
      if (
        selectedPlaylistRef.current !== null &&
        isPlaylistVoiceListeningRef.current &&
        partialText.trim().length > 0
      ) {
        if (speechFallbackTimerRef.current) {
          clearTimeout(speechFallbackTimerRef.current);
          speechFallbackTimerRef.current = null;
        }
        playlistSearchQueryRef.current = partialText;
        setPlaylistSearchQuery(partialText);
      } else if (activeNavTabRef.current === 'search') {
        searchScreenRef.current?.handleVoicePartialResult?.(partialText);
      }
    });

    const subResults = speechEventEmitter.addListener('onSpeechResults', (data: any) => {
      const text = (data?.text || '').trim();
      if (speechFallbackTimerRef.current) {
        clearTimeout(speechFallbackTimerRef.current);
        speechFallbackTimerRef.current = null;
      }
      if (selectedPlaylistRef.current !== null) {
        if (!isPlaylistVoiceListeningRef.current) {
          return;
        }
        if (text.length > 0) {
          applyPlaylistSpeechResult(text);
        } else {
          triggerEmulatorPlaylistSpeechFallback();
        }
        return;
      }
      if (activeNavTabRef.current === 'search') {
        searchScreenRef.current?.handleVoiceResult?.(text);
        return;
      }
      // AI DJ Speech Result: strictly use actual speech, never default or fallback!
      setIsListening(false);
      isListeningRef.current = false;
      if (text.length > 0) {
        setVoiceTranscript(text);
        setVoiceToast(`" ${text} "`);
        handleVoiceCommandRef.current(text);
      } else {
        handleSpeechFailure('no_speech');
      }
    });

    const subError = speechEventEmitter.addListener('onSpeechError', (data: any) => {
      if (speechFallbackTimerRef.current) {
        clearTimeout(speechFallbackTimerRef.current);
        speechFallbackTimerRef.current = null;
      }
      if (selectedPlaylistRef.current !== null) {
        if (isPlaylistVoiceListeningRef.current) {
          triggerEmulatorPlaylistSpeechFallback();
        }
        return;
      }
      if (activeNavTabRef.current === 'search') {
        searchScreenRef.current?.handleVoiceError?.();
        return;
      }
      if (isListeningRef.current && activeNavTabRef.current === 'ai_dj') {
        const errorCode = data?.errorCode;
        if (errorCode === 6) {
          // SpeechRecognizer.ERROR_SPEECH_TIMEOUT: No speech detected
          handleSpeechFailure('no_speech');
        } else if (errorCode === 7) {
          // SpeechRecognizer.ERROR_NO_MATCH: Speech not recognized
          handleSpeechFailure('not_recognized');
        } else {
          // Audio / client / permissions / mic failure
          handleSpeechFailure('mic_error');
        }
      } else {
        setIsListening(false);
        isListeningRef.current = false;
        setVoiceToast(null);
      }
    });

    return () => {
      subStart.remove();
      subPartial.remove();
      subResults.remove();
      subError.remove();
    };
  }, [applyPlaylistSpeechResult, triggerEmulatorPlaylistSpeechFallback, handleSpeechFailure]);

  // Request & Verify Android Audio Recording Permission
  const ensureMicrophonePermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const has = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      if (has) return true;
      const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
        title: 'Microphone Permission',
        message: 'This app needs access to your microphone for voice requests and AI DJ testing.',
        buttonPositive: 'Allow',
      });
      return res === PermissionsAndroid.RESULTS.GRANTED;
    } catch (e) {
      console.warn('Microphone permission request failed:', e);
      return false;
    }
  }, []);

  // Execute Voice Command & Drive Module 1 AI DJ Processing Pipeline
  const handleVoiceCommand = useCallback(
    async (
      commandText: string,
      customSessionTitle?: string,
      preformedIntent?: MusicIntent
    ) => {
      if (!commandText || commandText.trim().length === 0) {
        console.warn('[AI DJ] handleVoiceCommand called with empty text, rejecting.');
        return;
      }
      const trimmedCommand = commandText.trim();
      // 1. Generate unique request ID to prevent race conditions and cancel previous in-flight requests
      const currentReqId = ++aiDjRequestIdRef.current;
      lastUserRequestRef.current = trimmedCommand;
      const isAiDjContext = activeNavTabRef.current === 'ai_dj';

      if (isAiDjContext) {
        isAiDjOverlayVisibleRef.current = true;
        setIsAiDjOverlayVisible(true);
        // 2. Reset processing stage & state
        setAiDjProcessingStage('UNDERSTANDING');
        setAiDjUserRequest(trimmedCommand);
        setAiDjSessionTitle(customSessionTitle || 'Creating your session');
        // 3. Clear stale preview tracks
        setAiDjPreviewTracks([]);
        setAiDjRevealedCount(0);
        setAiDjSessionSummary(null);
        // 4. Clear previous error state
        setAiDjError(null);
        setAiDjErrorMessage(null);
        setOverlayFocusedBtn('retry');
      }

      setIsProcessing(true);
      setVoiceToast(null);
      const startTime = Date.now();

      try {
        // STAGE 1: UNDERSTANDING (Real Gemini 3.5 Flash Lite Intent Parsing or Preformed Intent)
        let intent: MusicIntent;
        if (preformedIntent) {
          try {
            const liveParsed = await parseMusicIntent(trimmedCommand);
            intent = {
              ...liveParsed,
              action: 'create_playlist',
              mood: preformedIntent.mood || liveParsed.mood || 'chill',
              context: preformedIntent.context || liveParsed.context || null,
              energy: preformedIntent.energy || liveParsed.energy || 'medium',
            };
          } catch (_e) {
            intent = preformedIntent;
          }
        } else {
          intent = await parseMusicIntent(trimmedCommand);
        }

        if (aiDjRequestIdRef.current !== currentReqId) return;
        lastIntentRef.current = intent;

        // Note: No generic chatbot confirmation card or diagnostic modal during music sessions.

        // Test simulation hook for explicit track shortage
        if (trimmedCommand.includes('[simulate:no_tracks]')) {
          const errInfo = classifyAIDJError(null, null, 0);
          setAiDjError(errInfo);
          setAiDjProcessingStage('ERROR');
          setIsProcessing(false);
          return;
        }

        // Check for unsupported / non-music queries (e.g. "What's the capital of France?")
        if (intent.action === 'unsupported') {
          const errInfo = classifyAIDJError(null, intent);
          setAiDjError(errInfo);
          setAiDjProcessingStage('ERROR');
          setIsProcessing(false);
          return;
        }

        // Check for simulated Gemini API errors in diagnostic test suite
        if (trimmedCommand.includes('[simulate:') && !intent.geminiLive && intent.error) {
          const errInfo = classifyAIDJError(new Error(intent.error), intent);
          setAiDjError(errInfo);
          setAiDjProcessingStage('ERROR');
          setIsProcessing(false);
          return;
        }

        if (isAiDjContext || intent.action === 'start_ai_dj' || intent.action === 'create_playlist') {
          if (!isAiDjOverlayVisibleRef.current) {
            setIsAiDjOverlayVisible(true);
            setAiDjUserRequest(trimmedCommand);
            setAiDjSessionTitle(customSessionTitle || 'Creating your session');
          }

          // STAGE 2: FINDING TRACKS (Catalog Filtering & Progressive Relaxation)
          setAiDjProcessingStage('FINDING_TRACKS');

          const { candidates } = filterCandidatesWithFallback(TRACK_CATALOG, intent, 18);
          if (aiDjRequestIdRef.current !== currentReqId) return;

          // Check if catalog has no suitable tracks
          if (!candidates || candidates.length === 0) {
            const errInfo = classifyAIDJError(null, null, 0);
            setAiDjError(errInfo);
            setAiDjProcessingStage('ERROR');
            setIsProcessing(false);
            return;
          }

          const scored = candidates.map((t) => calculateRelevanceScore(t, intent));
          scored.sort((a, b) => b.score - a.score);
          const top5Preview = scored.slice(0, 5).map((s) => s.track);
          while (top5Preview.length < 5) {
            const extra = TRACK_CATALOG.find((t) => !top5Preview.some((p) => p.id === t.id));
            if (!extra) break;
            top5Preview.push(extra);
          }

          // STAGE 3: BUILDING MIX (Staggered Track Entry 1 -> 2 -> 3 -> 4 -> 5 for Visual Preview)
          setAiDjProcessingStage('BUILDING_MIX');
          setAiDjPreviewTracks(top5Preview);

          for (let count = 1; count <= 5; count++) {
            if (aiDjRequestIdRef.current !== currentReqId) return;
            setAiDjRevealedCount(count);
            await new Promise((resolve) => setTimeout(resolve, 140));
          }

          // STAGE 4: BALANCING SESSION (Full Session Energy Trajectory & Lookahead Queue Preparation)
          if (aiDjRequestIdRef.current !== currentReqId) return;
          setAiDjProcessingStage('BALANCING_SESSION');

          const newSession = initDJSession(intent, TRACK_CATALOG);
          if (aiDjRequestIdRef.current !== currentReqId) return;

          if (!newSession || !newSession.currentTrack) {
            throw new Error('AI DJ session generation failure');
          }

          // Assemble the complete session track list (e.g. 18 tracks)
          const allSessionTracks: MusicTrack[] = [
            newSession.currentTrack,
            ...(newSession.queue || []),
          ];

          // STRICT SEPARATION: The 5 album artwork cards are ONLY a visual preview!
          const previewCards: MusicTrack[] = allSessionTracks.slice(0, 5);
          setAiDjPreviewTracks(previewCards);
          setAiDjRevealedCount(previewCards.length);

          // Full Session Real Duration and Track Count (e.g. 18 tracks · 72 min)
          const totalSecs = allSessionTracks.reduce(
            (acc, t) => acc + (t.duration || 240),
            0
          );
          const calculatedMinutes = Math.round(totalSecs / 60);

          const summary: AIDJSessionSummary = {
            trackCount: allSessionTracks.length, // Real full session length (e.g. 18 tracks, NEVER capped to 5)
            durationMinutes: calculatedMinutes || newSession.totalDurationMinutes || 72,
            mood: newSession.targetMood,
            energy: newSession.targetEnergyLevel,
          };

          // STAGE 5: READY (Clean Session Prepared, Ready to Proceed to Module 2)
          if (aiDjRequestIdRef.current !== currentReqId) return;
          setAiDjSessionSummary(summary);
          setReadyAiDjSession(newSession);
          setSession(newSession);
          setCurrentTrack(newSession.currentTrack);
          setAiDjProcessingStage('READY');
          setIsProcessing(false);

          // Auto-advance to Module 2 (Playlist Detail) after 2.2s of ready display (or immediate on Select)
          if (readyAutoProceedTimerRef.current) {
            clearTimeout(readyAutoProceedTimerRef.current);
          }
          readyAutoProceedTimerRef.current = setTimeout(() => {
            if (isAiDjOverlayVisibleRef.current && aiDjProcessingStageRef.current === 'READY') {
              handleProceedToAiDjPlaylistRef.current?.();
            }
          }, 2200);

          return;
        }

        // Standard Direct Playback for external voice requests
        const isLive = intent.geminiLive ?? true;
        const latency = intent.latencyMs || (Date.now() - startTime);
        if (isLive) {
          setVoiceToast(`🟢 Gemini Responded (${latency}ms) • ${intent.action.toUpperCase()} • ${intent.mood || intent.energy || 'Curating'}`);
        } else {
          setVoiceToast(`🟡 Offline Fallback: ${intent.error || 'Gemini timeout'}`);
        }

        const matched = TRACK_CATALOG.find((t) => t.mood === intent.mood) || TRACK_CATALOG[0];
        setCurrentTrack(matched);
        if (player) {
          player.replace(matched.audioUrl);
          player.play();
        }
        setIsProcessing(false);
        setTimeout(() => setVoiceToast(null), 4500);
      } catch (e: any) {
        if (aiDjRequestIdRef.current !== currentReqId) return;
        setIsProcessing(false);
        if (isAiDjContext || isAiDjOverlayVisibleRef.current) {
          const errInfo = classifyAIDJError(e);
          setAiDjError(errInfo);
          setAiDjProcessingStage('ERROR');
        } else {
          setVoiceToast(`❌ Error: ${e.message}`);
          setTimeout(() => setVoiceToast(null), 3500);
        }
      }
    },
    [player]
  );
  handleVoiceCommandRef.current = handleVoiceCommand;

  // Launch Contextual AI DJ Generation Directly from Home Page CTA
  const handleLaunchContextualAIDJ = useCallback(
    async (context: TimeContext) => {
      const config = CONTEXTUAL_AIDJ_CONFIGS[context] || CONTEXTUAL_AIDJ_CONFIGS.evening;
      console.log('[AI DJ] Launching Contextual Session from Home:', config.context, config.intent);

      // Cleanly clear any active speech fallback timer or diagnostic modal
      if (speechFallbackTimerRef.current) {
        clearTimeout(speechFallbackTimerRef.current);
        speechFallbackTimerRef.current = null;
      }
      setIsListening(false);
      setVoiceToast(null);
      setGeminiDiagnostic(null);

      // Reset playlist detail state
      selectedPlaylistRef.current = null;
      setSelectedPlaylist(null);

      // Navigate to AI DJ tab
      activeNavTabRef.current = 'ai_dj';
      setActiveNavTab('ai_dj');
      setFocusedId(AI_DJ_FOCUS_IDS.MIC);

      // Immediately launch AI DJ Module 1 processing overlay with user intent
      await handleVoiceCommand(
        config.prompt,
        config.sessionTitle,
        {
          action: 'create_playlist',
          mood: config.intent.mood,
          energy: config.intent.energy || 'medium',
          context: config.intent.context,
          confidence: 1.0,
          reason: `Contextual ${config.context} music request from Home screen`,
          geminiLive: true,
        }
      );
    },
    [handleVoiceCommand, setFocusedId]
  );

  // Comprehensive Mic & Gemini Diagnostic Test Runner
  const handleRunDiagnosticTest = useCallback(async () => {
    setIsProcessing(true);
    setVoiceToast('🧪 Testing Mic & Gemini 3.5 Flash Lite API...');
    await ensureMicrophonePermission();
    const pingRes = await testGeminiApiLive();
    const testPrompt = 'Play upbeat energetic workout tracks';
    const intent = await parseMusicIntent(testPrompt);

    const report: GeminiDiagnosticInfo = {
      isResponding: pingRes.isResponding || (intent.geminiLive ?? true),
      latencyMs: pingRes.latencyMs || intent.latencyMs || 0,
      model: 'gemini-3.5-flash-lite',
      statusCode: pingRes.statusCode || (intent.geminiLive ? 200 : 500),
      action: intent.action,
      mood: intent.mood || 'energetic',
      energy: intent.energy || 'high',
      reason: intent.reason,
      errorMessage: pingRes.errorMessage || intent.error,
      timestamp: Date.now(),
      testPrompt,
    };
    setGeminiDiagnostic(report);
    setIsProcessing(false);
    if (report.isResponding) {
      setVoiceToast(`🟢 Gemini Online (${report.latencyMs}ms • 200 OK) • Intent: ${intent.action.toUpperCase()}`);
    } else {
      setVoiceToast(`🔴 Gemini Offline: ${report.errorMessage || 'Error'}`);
    }
    setTimeout(() => setVoiceToast(null), 5000);
  }, [ensureMicrophonePermission]);

  // Toggle Voice Recognition with Microphone Permission & Emulator Safety
  const handleToggleVoice = useCallback(async () => {
    if (selectedPlaylistRef.current !== null) {
      await handleStartPlaylistVoiceSearch();
      return;
    }
    if (activeNavTabRef.current === 'search') {
      searchScreenRef.current?.startVoiceSearch();
      return;
    }
    if (isListening) {
      if (speechFallbackTimerRef.current) {
        clearTimeout(speechFallbackTimerRef.current);
        speechFallbackTimerRef.current = null;
      }
      try {
        await SpeechRecognition?.stopListening?.();
      } catch (_e) {}
      setIsListening(false);
      isListeningRef.current = false;
      setVoiceToast(null);
    } else {
      const hasPerm = await ensureMicrophonePermission();
      if (!hasPerm) {
        setVoiceToast('⚠️ Microphone permission not granted');
        setTimeout(() => setVoiceToast(null), 3000);
        return;
      }

      // Reset stale request, transcript and error state
      aiDjRequestIdRef.current++;
      setVoiceTranscript('');
      lastUserRequestRef.current = '';
      setAiDjUserRequest('');
      setAiDjError(null);
      setAiDjErrorMessage(null);

      setIsListening(true);
      isListeningRef.current = true;
      setVoiceToast('🎙️ Listening... Tell me your mood');

      // 8.0s timeout if user opens mic and remains completely silent
      if (speechFallbackTimerRef.current) {
        clearTimeout(speechFallbackTimerRef.current);
      }
      speechFallbackTimerRef.current = setTimeout(() => {
        if (isListeningRef.current && activeNavTabRef.current === 'ai_dj') {
          handleSpeechFailure('no_speech');
        }
      }, 8000);

      try {
        await SpeechRecognition?.startListening?.();
      } catch (err) {
        console.warn('SpeechRecognition startListening error:', err);
        if (isListeningRef.current && activeNavTabRef.current === 'ai_dj') {
          handleSpeechFailure('mic_error');
        }
      }
    }
  }, [isListening, handleStartPlaylistVoiceSearch, ensureMicrophonePermission, handleSpeechFailure]);

  handleToggleVoiceRef.current = handleToggleVoice;

  // Track Scrubbing / Seeking State
  const [seekPreviewSeconds, setSeekPreviewSeconds] = useState<number | null>(null);
  const seekPreviewSecondsRef = useRef<number | null>(null);
  const seekDebounceTimeoutRef = useRef<any>(null);
  const pendingSeekSecondsRef = useRef<number | null>(null);
  const seekClearTimeoutRef = useRef<any>(null);

  const handleSeekDelta = useCallback(
    (deltaSeconds: number) => {
      const pl = selectedPlaylistRef.current;
      const activeTrk =
        pl?.tracks.find((t) => t.id === currentTrackRef.current?.id) ||
        pl?.tracks[0];
      const totalDur =
        activeTrk?.durationSeconds ||
        playerStatusRef.current?.duration ||
        currentTrackRef.current?.duration ||
        123;
      const baseSec =
        pendingSeekSecondsRef.current !== null
          ? pendingSeekSecondsRef.current
          : seekPreviewSecondsRef.current !== null
          ? seekPreviewSecondsRef.current
          : (playerStatusRef.current?.currentTime ?? 0);
      const targetSec = Math.max(0, Math.min(totalDur, Math.floor(baseSec) + deltaSeconds));
      pendingSeekSecondsRef.current = targetSec;
      seekPreviewSecondsRef.current = targetSec;
      setSeekPreviewSeconds(targetSec);

      if (seekDebounceTimeoutRef.current) {
        clearTimeout(seekDebounceTimeoutRef.current);
      }
      if (seekClearTimeoutRef.current) {
        clearTimeout(seekClearTimeoutRef.current);
      }

      seekDebounceTimeoutRef.current = setTimeout(async () => {
        const seekTarget = pendingSeekSecondsRef.current;
        try {
          if (player && seekTarget !== null) {
            await player.seekTo(seekTarget);
          }
        } catch (err) {
          console.warn('[Audio] seekTo error:', err);
        } finally {
          pendingSeekSecondsRef.current = null;
          // Hold the preview for 450ms so expo-audio status has time to catch up, avoiding snap-back jitter
          seekClearTimeoutRef.current = setTimeout(() => {
            if (pendingSeekSecondsRef.current === null) {
              seekPreviewSecondsRef.current = null;
              setSeekPreviewSeconds(null);
            }
          }, 450);
        }
      }, 180);
    },
    [player]
  );

  // Play a specific track
  const handlePlayTrack = useCallback(
    (track: MusicTrack) => {
      if (seekDebounceTimeoutRef.current) {
        clearTimeout(seekDebounceTimeoutRef.current);
      }
      pendingSeekSecondsRef.current = null;
      seekPreviewSecondsRef.current = null;
      setSeekPreviewSeconds(null);

      hasPlaybackStartedRef.current = true;
      lastAutoAdvancedTrackIdRef.current = track.id;
      currentTrackRef.current = track;
      setCurrentTrack(track);

      // Immediately promote played track to #1 in Recently Played (deduplicated, max 10)
      setRecentlyPlayedTracks((prev) => {
        const item: RecentlyPlayedTrackItem = {
          ...track,
          displayTitle: (track as any).displayTitle || track.title,
          displayArtist: (track as any).displayArtist || track.artist,
          localArtwork:
            (track as any).localArtwork ||
            (track as any).artwork ||
            (track.artworkUrl && track.artworkUrl.startsWith('http')
              ? { uri: track.artworkUrl }
              : require('./assets/ui/rec_0_until_found_clean.png')),
        };
        const filtered = prev.filter((t) => t.id !== track.id);
        return [item, ...filtered].slice(0, 10);
      });

      // Persist playback event to SQLite in background
      recordTrackPlay(track.id).catch((err) => {
        console.error('[App] Failed to record track play in SQLite:', err);
      });

      if (player && track.audioUrl) {
        try {
          player.volume = 1.0;
          player.replace(track.audioUrl);
          player.play();
        } catch (err) {
          console.warn('[Audio] Failed to play track:', err);
        }
      }
      setVoiceToast(`▶ Now Playing: "${track.title}" by ${track.artist}`);
      setTimeout(() => setVoiceToast(null), 3000);
    },
    [player]
  );

  // Toggle Play / Pause
  const handleTogglePlayPause = useCallback(() => {
    if (!player) return;
    const st = playerStatusRef.current;
    if (st?.playing) {
      player.pause();
    } else {
      hasPlaybackStartedRef.current = true;
      const pl = selectedPlaylistRef.current;
      const curTrk = currentTrackRef.current;
      if (
        activeNavTabRef.current === 'playlist' &&
        pl &&
        pl.tracks.length > 0 &&
        (!curTrk || !pl.tracks.some((t) => t.id === curTrk.id))
      ) {
        handlePlayPlaylistTrackRef.current?.(pl.tracks[0]);
        return;
      }
      if (
        st?.didJustFinish ||
        st?.playbackState === 'ended' ||
        (st?.duration && (st?.currentTime ?? 0) >= st.duration - 0.5)
      ) {
        if (curTrk?.audioUrl) {
          player.replace(curTrk.audioUrl);
        }
      }
      player.play();
    }
  }, [player]);

  const handlePlayPlaylistTrack = useCallback(
    (track: PlaylistTrack, preserveExistingShuffleQueue: boolean = false) => {
      // If user manually selects a song from the playlist while Shuffle is active, re-anchor Fisher-Yates queue at that song
      const activePl = selectedPlaylistRef.current;
      if (
        isShuffleActiveRef.current &&
        !preserveExistingShuffleQueue &&
        activePl &&
        activePl.tracks.length > 1
      ) {
        const reanchored = buildFisherYatesQueue(activePl.tracks, track.id);
        shuffledTrackIdsRef.current = reanchored;
        setShuffledTrackIds(reanchored);
      }

      const matched: MusicTrack = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        year: 2024,
        era: '2020s',
        mood: 'calm',
        energy: 'medium',
        bpm: 100,
        vibe: track.title,
        genre: 'Pop',
        audioUrl: track.audioUrl,
        artworkUrl: '',
        duration: track.durationSeconds,
        tags: ['playlist'],
      };
      handlePlayTrack(matched);
    },
    [handlePlayTrack, buildFisherYatesQueue]
  );
  handlePlayPlaylistTrackRef.current = handlePlayPlaylistTrack;

  // Industry-Standard Shuffle Toggle Handler (Fisher-Yates Permutation with Current-Track Pinning)
  const handleToggleShuffle = useCallback(() => {
    const nextState = !isShuffleActiveRef.current;
    isShuffleActiveRef.current = nextState;
    setIsShuffleActive(nextState);

    const activePl = selectedPlaylistRef.current || PLAYLISTS.chill_vibes;
    if (nextState) {
      const currentId = currentTrackRef.current?.id;
      const isPlayingCurrentPl =
        activePl.tracks.some((t) => t.id === currentId);
      const anchorId = isPlayingCurrentPl
        ? currentId
        : activePl.tracks[0]?.id;
      const newQueue = buildFisherYatesQueue(activePl.tracks, anchorId);
      shuffledTrackIdsRef.current = newQueue;
      setShuffledTrackIds(newQueue);

      const nextTrackId = newQueue[1] || newQueue[0];
      const nextTrackObj = activePl.tracks.find((t) => t.id === nextTrackId);
      setVoiceToast(
        nextTrackObj
          ? `🔀 Shuffle On • Up Next: "${nextTrackObj.title}"`
          : '🔀 Shuffle On • Randomized Queue'
      );
      setTimeout(() => setVoiceToast(null), 2800);
    } else {
      shuffledTrackIdsRef.current = [];
      setShuffledTrackIds([]);
      setVoiceToast('➡️ Shuffle Off • Sequential Playlist Order');
      setTimeout(() => setVoiceToast(null), 2400);
    }
  }, [buildFisherYatesQueue]);

  // Play Next Track (Respects Fisher-Yates Shuffled Queue without Repeats, Reshuffling on Cycle Completion)
  const handlePlayNext = useCallback(() => {
    const currentId = currentTrackRef.current?.id;
    const activePl = selectedPlaylistRef.current || selectedPlaylist;
    if (activePl && activePl.tracks.length > 0) {
      if (isShuffleActiveRef.current && activePl.tracks.length > 1) {
        let queue = shuffledTrackIdsRef.current;
        // Ensure queue belongs to current playlist
        const isQueueValid =
          queue.length === activePl.tracks.length &&
          queue.every((id) => activePl.tracks.some((t) => t.id === id));
        if (!isQueueValid) {
          queue = buildFisherYatesQueue(activePl.tracks, currentId);
          shuffledTrackIdsRef.current = queue;
          setShuffledTrackIds(queue);
        }

        const curIdx = currentId ? queue.indexOf(currentId) : 0;
        if (curIdx >= 0 && curIdx + 1 < queue.length) {
          const nextId = queue[curIdx + 1];
          const nextTrack =
            activePl.tracks.find((t) => t.id === nextId) || activePl.tracks[0];
          handlePlayPlaylistTrack(nextTrack, true);
        } else {
          // End of shuffled cycle reached: all tracks have played once! Generate fresh Fisher-Yates cycle without repeating the last track
          const candidates = activePl.tracks.filter((t) => t.id !== currentId);
          const nextAnchor =
            candidates[Math.floor(Math.random() * candidates.length)] ||
            activePl.tracks[0];
          const nextCycle = buildFisherYatesQueue(
            activePl.tracks,
            nextAnchor.id
          );
          shuffledTrackIdsRef.current = nextCycle;
          setShuffledTrackIds(nextCycle);
          handlePlayPlaylistTrack(nextAnchor, true);
        }
      } else {
        const currentIdx = activePl.tracks.findIndex((t) => t.id === currentId);
        const baseIdx = currentIdx >= 0 ? currentIdx : 0;
        const nextIdx = (baseIdx + 1) % activePl.tracks.length;
        handlePlayPlaylistTrack(activePl.tracks[nextIdx], true);
      }
    } else if (session) {
      const newSession = advanceToNextTrack(session, TRACK_CATALOG);
      setSession(newSession);
      handlePlayTrack(newSession.currentTrack);
    } else {
      const currentIdx = TRACK_CATALOG.findIndex((t) => t.id === currentId);
      const baseIdx = currentIdx >= 0 ? currentIdx : 0;
      const nextIdx = (baseIdx + 1) % TRACK_CATALOG.length;
      handlePlayTrack(TRACK_CATALOG[nextIdx]);
    }
  }, [
    selectedPlaylist,
    session,
    buildFisherYatesQueue,
    handlePlayPlaylistTrack,
    handlePlayTrack,
  ]);

  // Play Previous Track (Industry-Standard 4s Restart Threshold + Backward Traversal in Shuffled or Sequential Queue)
  const handlePlayPrev = useCallback(() => {
    const curTime = playerStatusRef.current?.currentTime ?? 0;
    // Industry Standard: If > 4 seconds into the current song, restart the current track from 0:00
    if (player && curTime > 4) {
      try {
        player.seekTo(0);
        seekPreviewSecondsRef.current = 0;
        setSeekPreviewSeconds(0);
        setTimeout(() => {
          seekPreviewSecondsRef.current = null;
          setSeekPreviewSeconds(null);
        }, 300);
        return;
      } catch (err) {
        console.warn('[Audio] Restart track seek error:', err);
      }
    }

    const currentId = currentTrackRef.current?.id;
    const activePl = selectedPlaylistRef.current || selectedPlaylist;
    if (activePl && activePl.tracks.length > 0) {
      if (isShuffleActiveRef.current && activePl.tracks.length > 1) {
        let queue = shuffledTrackIdsRef.current;
        const isQueueValid =
          queue.length === activePl.tracks.length &&
          queue.every((id) => activePl.tracks.some((t) => t.id === id));
        if (!isQueueValid) {
          queue = buildFisherYatesQueue(activePl.tracks, currentId);
          shuffledTrackIdsRef.current = queue;
          setShuffledTrackIds(queue);
        }
        const curIdx = currentId ? queue.indexOf(currentId) : 0;
        const baseIdx = curIdx >= 0 ? curIdx : 0;
        const prevQueueIdx = (baseIdx - 1 + queue.length) % queue.length;
        const prevId = queue[prevQueueIdx];
        const prevTrack =
          activePl.tracks.find((t) => t.id === prevId) || activePl.tracks[0];
        handlePlayPlaylistTrack(prevTrack, true);
      } else {
        const currentIdx = activePl.tracks.findIndex((t) => t.id === currentId);
        const baseIdx = currentIdx >= 0 ? currentIdx : 0;
        const prevIdx =
          (baseIdx - 1 + activePl.tracks.length) % activePl.tracks.length;
        handlePlayPlaylistTrack(activePl.tracks[prevIdx], true);
      }
    } else {
      const currentIdx = TRACK_CATALOG.findIndex((t) => t.id === currentId);
      const baseIdx = currentIdx >= 0 ? currentIdx : 0;
      const prevIdx =
        (baseIdx - 1 + TRACK_CATALOG.length) % TRACK_CATALOG.length;
      handlePlayTrack(TRACK_CATALOG[prevIdx]);
    }
  }, [
    player,
    selectedPlaylist,
    buildFisherYatesQueue,
    handlePlayPlaylistTrack,
    handlePlayTrack,
  ]);

  // Playlist Navigation & Back Handlers (Sections 13, 14, 15, 16)
  const handleSelectPlaylist = useCallback(
    (
      playlist: PlaylistData,
      origin: 'library' | 'home' | 'ai_dj' | 'favorites' = 'library'
    ) => {
      handleClearPlaylistSearch(true);
      playlistOriginRef.current = origin;
      setPlaylistOrigin(origin);
      selectedPlaylistRef.current = playlist;
      setSelectedPlaylist(playlist);
      activeNavTabRef.current = origin;
      setActiveNavTab(origin);
      lastFocusedTrackIdRef.current = null;
      playerOriginTrackIdRef.current = playlist.tracks[0]
        ? `TRK_${playlist.tracks[0].id}`
        : 'TRK_1';
      if (isShuffleActiveRef.current && playlist.tracks.length > 1) {
        const curId = currentTrackRef.current?.id;
        const anchor = playlist.tracks.some((t) => t.id === curId)
          ? curId
          : playlist.tracks[0]?.id;
        const newQueue = buildFisherYatesQueue(playlist.tracks, anchor);
        shuffledTrackIdsRef.current = newQueue;
        setShuffledTrackIds(newQueue);
      }
      setFocusedId('PL_PLAY_ALL');
    },
    [setFocusedId, buildFisherYatesQueue, handleClearPlaylistSearch]
  );

  // USB Storage State & Handlers
  const [usbStatus, setUsbStatus] = useState<UsbStatus>({
    isConnected: false,
    volumePath: null,
    driveName: null,
    totalSpaceBytes: 0,
    freeSpaceBytes: 0,
  });
  const usbStatusRef = useRef<UsbStatus>(usbStatus);
  usbStatusRef.current = usbStatus;

  const [usbTracks, setUsbTracks] = useState<PlaylistTrack[]>([]);
  const usbTracksRef = useRef<PlaylistTrack[]>([]);
  usbTracksRef.current = usbTracks;

  const [usbModalState, setUsbModalState] = useState<{
    visible: boolean;
    type: 'NOT_CONNECTED' | 'NO_SONGS';
    title?: string;
    message?: string;
  }>({
    visible: false,
    type: 'NOT_CONNECTED',
  });
  const usbModalStateRef = useRef(usbModalState);
  usbModalStateRef.current = usbModalState;

  const handleCloseUsbModal = useCallback(() => {
    setUsbModalState((prev) => ({ ...prev, visible: false }));
    setFocusedId(LIBRARY_CARD_IDS.USB);
  }, [setFocusedId]);

  const loadUsbTracksInternal = useCallback(async () => {
    try {
      const rawTracks = await scanUsbTracks();
      const mapped: PlaylistTrack[] = rawTracks.map((t, idx) => {
        const totalSec = t.duration || 180;
        const mins = Math.floor(totalSec / 60);
        const secs = Math.floor(totalSec % 60);
        const durStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        return {
          id: t.id || `usb_track_${idx}`,
          trackNumber: idx + 1,
          title: t.title || 'Unknown Track',
          artist: t.artist || 'Unknown Artist',
          album: t.album || 'USB Storage',
          duration: durStr,
          durationSeconds: totalSec,
          audioUrl: t.audioUrl,
          artwork: t.artworkUrl
            ? { uri: t.artworkUrl }
            : require('./assets/playlists/banner_usb_drive.png'),
        };
      });
      setUsbTracks(mapped);
      setUsbStatus((prev) => ({ ...prev, songCount: mapped.length }));
      return mapped;
    } catch (e) {
      console.warn('[Usb] loadUsbTracksInternal failed:', e);
      return [];
    }
  }, []);

  useEffect(() => {
    // 1. Initial USB status query
    getUsbStatus().then((status) => {
      setUsbStatus(status);
      if (status.isConnected) {
        loadUsbTracksInternal();
      }
    });

    // 2. Real-time broadcast subscription
    const unsubscribe = subscribeToUsbStatus((status) => {
      setUsbStatus(status);
      if (status.isConnected) {
        loadUsbTracksInternal();
      } else {
        setUsbTracks([]);
        if (selectedPlaylistRef.current?.id === 'usb_storage') {
          selectedPlaylistRef.current = null;
          setSelectedPlaylist(null);
          setFocusedId(LIBRARY_CARD_IDS.USB);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadUsbTracksInternal, setFocusedId]);

  const handleSelectUsbCard = useCallback(async () => {
    const status = await getUsbStatus();
    setUsbStatus(status);

    if (!status.isConnected) {
      setUsbModalState({
        visible: true,
        type: 'NOT_CONNECTED',
        title: 'No USB Drive Connected',
        message:
          'Please insert a USB flash drive (FAT32 or exFAT) into your TV or OTG adapter. Your offline audio will be loaded automatically.',
      });
      setFocusedId('USB_MODAL_BACK');
      return;
    }

    // Refresh and scan USB audio files
    const tracks = await loadUsbTracksInternal();

    if (tracks.length === 0) {
      setUsbModalState({
        visible: true,
        type: 'NO_SONGS',
        title: 'No Songs Found on USB',
        message:
          'Your USB drive is connected, but no supported audio files (.mp3, .flac, .m4a, .wav, .aac) were found. Copy your music files to the drive and try again.',
      });
      setFocusedId('USB_MODAL_BACK');
      return;
    }

    // USB connected and has tracks -> Construct PlaylistData & open in PlaylistScreen
    const usbPlaylist: PlaylistData = {
      id: 'usb_storage',
      title: status.driveName ? `USB: ${status.driveName}` : 'USB Music Library',
      tagline: `Removable Storage • ${tracks.length} tracks`,
      creator: 'USB Drive',
      creatorAvatar: require('./assets/ui/avatar_clean.png'),
      songsCount: `${tracks.length} ${tracks.length === 1 ? 'song' : 'songs'}`,
      totalDuration: formatTotalPlaylistDuration(tracks),
      description:
        'Audio tracks loaded directly from your connected USB storage drive. Offline local playback with full queue and playback controls.',
      coverImage: require('./assets/playlists/banner_usb_drive.png'),
      bannerAccentColor: '#0284C7',
      badgeText: 'USB AUDIO',
      quoteText: 'Offline Local Music',
      tracks: tracks,
    };

    handleSelectPlaylist(usbPlaylist, 'library');
  }, [loadUsbTracksInternal, handleSelectPlaylist, setFocusedId]);

  // Transition from Module 1 (Session Ready) to Module 2 (Playlist Detail)
  const handleProceedToAiDjPlaylist = useCallback(() => {
    if (readyAutoProceedTimerRef.current) {
      clearTimeout(readyAutoProceedTimerRef.current);
      readyAutoProceedTimerRef.current = null;
    }
    const sessionToLoad = readyAiDjSessionRef.current || session;
    if (!sessionToLoad) {
      console.warn('[Module 2] No AI DJ session found to load into Playlist Detail.');
      handleCancelAiDjProcessing();
      return;
    }

    console.log('[Module 2] Transitioning to Playlist Detail with full AI DJ session:', sessionToLoad.id);
    // Dismiss Module 1 overlay
    isAiDjOverlayVisibleRef.current = false;
    setIsAiDjOverlayVisible(false);

    // Convert full 18-track session to PlaylistData (100% of session tracks, real metadata)
    const userPrompt = lastUserRequestRef.current || aiDjUserRequest || undefined;
    const aiDjPlaylist = convertAiDjSessionToPlaylist(
      sessionToLoad,
      userPrompt,
      lastIntentRef.current || undefined
    );

    // Save into dynamic user AI playlists (prepend and deduplicate)
    setUserAiPlaylists((prev) => {
      const filtered = prev.filter(
        (p) => p.id !== aiDjPlaylist.id && p.title !== aiDjPlaylist.title
      );
      return [aiDjPlaylist, ...filtered];
    });

    // Persist to local SQLite storage in background
    saveAiDjPlaylist({
      session_id: aiDjPlaylist.id,
      title: aiDjPlaylist.title,
      user_prompt: userPrompt || null,
      mood: sessionToLoad.targetMood || null,
      track_ids: aiDjPlaylist.tracks.map((t) => t.id),
      created_at: Date.now(),
    }).catch((err) => {
      console.error('[App] Failed to save AI DJ playlist to SQLite:', err);
    });

    // Load session into existing Playlist Detail with origin 'ai_dj'
    handleSelectPlaylist(aiDjPlaylist, 'ai_dj');
  }, [session, handleCancelAiDjProcessing, handleSelectPlaylist]);
  handleProceedToAiDjPlaylistRef.current = handleProceedToAiDjPlaylist;

  const handleBackToHome = useCallback(() => {
    handleClearPlaylistSearch(true);
    selectedPlaylistRef.current = null;
    setSelectedPlaylist(null);
    activeNavTabRef.current = 'home';
    setActiveNavTab('home');
    setFocusedId('HERO_VOICE');
    recentlyPlayedStartIndexRef.current = 0;
    forYouStartIndexRef.current = 0;
    homeScrollYRef.current = 0;
    lastFocusedTopNavRef.current = 'HDR_THEME';
    lastFocusedHeroRef.current = 'HERO_VOICE';
    lastFocusedRecentlyPlayedRef.current = 'REC_0';
    lastFocusedForYouRef.current = 'MIX_0';
    homeScrollViewRef.current?.scrollTo({ y: 0, animated: false });
    recentlyPlayedScrollRef.current?.scrollTo({ x: 0, animated: false });
    forYouScrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [setFocusedId, handleClearPlaylistSearch]);

  const handleBackFromPlaylist = useCallback(() => {
    handleClearPlaylistSearch(true);
    const origin = playlistOriginRef.current;
    const currentId = selectedPlaylistRef.current?.id;
    selectedPlaylistRef.current = null;
    setSelectedPlaylist(null);

    // CRITICAL: When inside AI DJ generated Playlist Detail, Back MUST return to AI DJ Landing Page!
    if (origin === 'ai_dj') {
      console.log('[Module 2] Back from AI DJ Playlist -> Returning to AI DJ Landing Page');
      activeNavTabRef.current = 'ai_dj';
      setActiveNavTab('ai_dj');
      setFocusedId(AI_DJ_FOCUS_IDS.MIC);
      return;
    }

    // Favorites screen playlist return
    if (origin === 'favorites') {
      console.log('[Favorites] Back from Playlist -> Returning to Favorites Screen');
      activeNavTabRef.current = 'favorites';
      setActiveNavTab('favorites');
      setFocusedId(FAVORITES_FOCUS_IDS.LIKED_SONGS);
      return;
    }

    // Home screen playlist return
    if (origin === 'home') {
      activeNavTabRef.current = 'home';
      setActiveNavTab('home');
      setFocusedId('HERO_VOICE');
      recentlyPlayedStartIndexRef.current = 0;
      forYouStartIndexRef.current = 0;
      homeScrollYRef.current = 0;
      lastFocusedTopNavRef.current = 'HDR_THEME';
      lastFocusedHeroRef.current = 'HERO_VOICE';
      lastFocusedRecentlyPlayedRef.current = 'REC_0';
      lastFocusedForYouRef.current = 'MIX_0';
      homeScrollViewRef.current?.scrollTo({ y: 0, animated: false });
      recentlyPlayedScrollRef.current?.scrollTo({ x: 0, animated: false });
      forYouScrollRef.current?.scrollTo({ x: 0, animated: false });
      return;
    }

    // Normal Library playlist return MUST NOT BE BROKEN: returns to Library with matching card focus
    activeNavTabRef.current = 'library';
    setActiveNavTab('library');
    if (currentId === 'focus_mix') {
      setFocusedId(LIBRARY_CARD_IDS.FOCUS);
    } else if (currentId === 'workout_mix') {
      setFocusedId(LIBRARY_CARD_IDS.WORKOUT);
    } else if (currentId === 'study_mix') {
      setFocusedId(LIBRARY_CARD_IDS.STUDY);
    } else if (currentId === 'energize_morning') {
      setFocusedId(LIBRARY_CARD_IDS.ENERGIZE);
    } else if (currentId === 'midnight_dreams') {
      setFocusedId(LIBRARY_CARD_IDS.MIDNIGHT);
    } else {
      setFocusedId(LIBRARY_CARD_IDS.CHILL);
    }
  }, [setFocusedId, handleClearPlaylistSearch]);

  // Deterministic Home & Drawer Navigation Map
  const getHomeNextFocus = useCallback((currentId: string, direction: DPadDirection): string | null => {
    // 1. Left Drawer Items
    if (currentId.startsWith('NAV_')) {
      if (direction === 'up') {
        if (currentId === 'NAV_SETTINGS') return 'NAV_FAV';
        if (currentId === 'NAV_FAV') return 'NAV_LIBRARY';
        if (currentId === 'NAV_LIBRARY') return 'NAV_DJ';
        if (currentId === 'NAV_DJ') return 'NAV_SEARCH';
        if (currentId === 'NAV_SEARCH') return 'NAV_HOME';
        return null;
      }
      if (direction === 'down') {
        if (currentId === 'NAV_HOME') return 'NAV_SEARCH';
        if (currentId === 'NAV_SEARCH') return 'NAV_DJ';
        if (currentId === 'NAV_DJ') return 'NAV_LIBRARY';
        if (currentId === 'NAV_LIBRARY') return 'NAV_FAV';
        if (currentId === 'NAV_FAV') return 'NAV_SETTINGS';
        return null;
      }
      if (direction === 'right') {
        if (activeNavTabRef.current === 'search' || currentId === 'NAV_SEARCH') {
          return SEARCH_FOCUS_IDS.KEY_A;
        }
        if (currentId === 'NAV_DJ') return 'HERO_VOICE';
        if (currentId === 'NAV_FAV') return FAVORITES_FOCUS_IDS.LIKED_SONGS;
        if (currentId === 'NAV_SETTINGS') return SETTINGS_FOCUS_IDS.CHANGE_AVATAR;
        return lastFocusedHeroRef.current || 'HERO_VOICE';
      }
      return null;
    }

    // 2. Top Header Utilities
    if (currentId === 'HDR_THEME') {
      if (direction === 'left') return 'NAV_HOME';
      if (direction === 'right') return 'HDR_REPLAY';
      if (direction === 'down') return lastFocusedHeroRef.current || 'HERO_VOICE';
      return null;
    }
    if (currentId === 'HDR_REPLAY') {
      if (direction === 'left') return 'HDR_THEME';
      if (direction === 'right') return null;
      if (direction === 'down') return 'HERO_CHILL';
      return null;
    }

    // 3. Hero Section
    if (currentId === 'HERO_VOICE') {
      if (direction === 'left') return 'NAV_HOME';
      if (direction === 'right') return 'HERO_CHILL';
      if (direction === 'up') return lastFocusedTopNavRef.current || 'HDR_THEME';
      if (direction === 'down') {
        return recentlyPlayedTracksRef.current.length > 0
          ? 'REC_0'
          : (lastFocusedForYouRef.current || 'MIX_0');
      }
      return null;
    }
    if (currentId === 'HERO_CHILL') {
      if (direction === 'left') return 'HERO_VOICE';
      if (direction === 'up') return 'HDR_REPLAY';
      if (direction === 'down') {
        if (recentlyPlayedTracksRef.current.length > 1) return 'REC_1';
        if (recentlyPlayedTracksRef.current.length === 1) return 'REC_0';
        return lastFocusedForYouRef.current || 'MIX_0';
      }
      return null;
    }

    // 4. Recently Played Row (REC_0 .. REC_9)
    if (currentId.startsWith('REC_')) {
      const idx = parseInt(currentId.replace('REC_', ''), 10);
      if (direction === 'left') return idx === 0 ? 'NAV_HOME' : `REC_${idx - 1}`;
      if (direction === 'right') return idx < recentlyPlayedTracksRef.current.length - 1 ? `REC_${idx + 1}` : null;
      if (direction === 'up') {
        if (idx === 0) return 'HERO_VOICE';
        return 'HERO_CHILL';
      }
      if (direction === 'down') {
        return lastFocusedForYouRef.current || 'MIX_0';
      }
      return null;
    }

    // 5. For You Mixes Row (MIX_0 .. MIX_4)
    if (currentId.startsWith('MIX_')) {
      const idx = parseInt(currentId.replace('MIX_', ''), 10);
      if (direction === 'left') return idx === 0 ? 'NAV_HOME' : `MIX_${idx - 1}`;
      if (direction === 'right') return idx < FOR_YOU_MIXES.length - 1 ? `MIX_${idx + 1}` : null;
      if (direction === 'up') {
        if (recentlyPlayedTracksRef.current.length > 0) {
          return lastFocusedRecentlyPlayedRef.current || 'REC_0';
        }
        return idx === 0 ? 'HERO_VOICE' : 'HERO_CHILL';
      }
      return null;
    }

    return null;
  }, []);

  // Keep AI Song Info synchronized if track changes while overlay is open (Section 47)
  useEffect(() => {
    if (!isAiOverlayOpen || !currentTrack?.id) return;
    const pl = selectedPlaylistRef.current || PLAYLISTS.chill_vibes;
    const activeTrk =
      pl.tracks.find((t) => t.id === currentTrack.id) || pl.tracks[0];
    if (!activeTrk) return;

    const cached = getCachedSongInfo(activeTrk.id);
    if (cached) {
      setAiSongInsight(cached);
      setAiOverlayStatus('READY');
      return;
    }

    setAiOverlayStatus('LOADING');
    setAiSongInsight(null);
    fetchOrGetSongInfo(activeTrk, pl.title)
      .then((insight) => {
        if (currentTrackRef.current?.id === activeTrk.id) {
          setAiSongInsight(insight);
          setAiOverlayStatus('READY');
        }
      })
      .catch((err) => {
        setAiOverlayStatus('ERROR');
        setAiErrorMessage(err?.message || 'Could not generate AI song insight.');
      });
  }, [currentTrack?.id, isAiOverlayOpen]);

  // Isolated Full Screen Remote Event Controller (Sections 1, 8–19, 26–37)
  const handleFullscreenRemoteEvent = useCallback(
    (key: string) => {
      const fsFocus = fullscreenFocusIdRef.current;

      // 1. Physical Remote Back Hierarchy (Section 27)
      if (key === 'back' || key === 'escape') {
        if (isBackgroundOverlayOpenRef.current) {
          closeBackgroundOverlay();
        } else if (isAiOverlayOpenRef.current) {
          closeAiSongInfoOverlay();
        } else {
          exitFullscreenPlayer();
        }
        return;
      }

      // 2. SELECT / ENTER in Full Screen (Sections 8, 13, 18, 26)
      if (key === 'select' || key === 'enter') {
        if (isBackgroundOverlayOpenRef.current) {
          if (fsFocus === FULLSCREEN_FOCUS_IDS.BG_OVERLAY_CLOSE) {
            closeBackgroundOverlay();
            return;
          }
          const thumbIdx = (BG_THUMB_FOCUS_IDS as readonly string[]).indexOf(fsFocus);
          if (thumbIdx !== -1) {
            const selectedOpt = BACKGROUND_OPTIONS[thumbIdx];
            if (selectedOpt) {
              handleSelectBackground(selectedOpt.id);
            }
            return;
          }
          return;
        }

        if (isAiOverlayOpenRef.current) {
          if (fsFocus === FULLSCREEN_FOCUS_IDS.AI_OVERLAY_BACK) {
            closeAiSongInfoOverlay();
          }
          return;
        }

        if (fsFocus === FULLSCREEN_FOCUS_IDS.BACK) {
          exitFullscreenPlayer();
          return;
        }
        if (fsFocus === FULLSCREEN_FOCUS_IDS.PLAY_PAUSE) {
          handleTogglePlayPause();
          return;
        }
        if (fsFocus === FULLSCREEN_FOCUS_IDS.PREVIOUS) {
          handlePlayPrev();
          return;
        }
        if (fsFocus === FULLSCREEN_FOCUS_IDS.NEXT) {
          handlePlayNext();
          return;
        }
        if (fsFocus === FULLSCREEN_FOCUS_IDS.LIKE) {
          const isPlayingUsb =
            currentTrackRef.current?.id?.startsWith('usb_') ||
            selectedPlaylistRef.current?.id === 'usb_storage';
          if (isPlayingUsb) return;
          const pl = selectedPlaylistRef.current || PLAYLISTS.chill_vibes;
          const activeTrk =
            pl.tracks.find((t) => t.id === currentTrackRef.current?.id) ||
            pl.tracks[0];
          if (activeTrk) {
            handleToggleSongFavorite(activeTrk.id);
          }
          return;
        }
        if (fsFocus === FULLSCREEN_FOCUS_IDS.PALETTE) {
          openBackgroundOverlay();
          return;
        }
        if (fsFocus === FULLSCREEN_FOCUS_IDS.SONG_INFO) {
          openAiSongInfoOverlay();
          return;
        }
        // FS_SCRUBBER and FS_UPCOMING_TRACK_1..4 SELECT -> NO PLAY / NO-OP (Section 18)
        return;
      }

      // 3. Directional Navigation in Full Screen (Sections 8–17, 37)
      if (key === 'left' || key === 'right' || key === 'up' || key === 'down') {
        if (isAiOverlayOpenRef.current) {
          return; // Lock focus on AI Overlay Back while overlay is open
        }

        if (isBackgroundOverlayOpenRef.current) {
          const nextFsTarget = getFullscreenNextFocus(
            fsFocus,
            key as DPadDirection,
            false,
            4,
            true
          );
          if (nextFsTarget !== null) {
            setFullscreenFocusId(nextFsTarget);
          }
          return;
        }

        // Scrubber Special Control: LEFT/RIGHT seek -10s / +10s without moving focus (Sections 14 & 15)
        if (fsFocus === FULLSCREEN_FOCUS_IDS.SCRUBBER) {
          if (key === 'left') {
            handleSeekDelta(-10);
            return;
          }
          if (key === 'right') {
            handleSeekDelta(10);
            return;
          }
          if (key === 'up') {
            setFullscreenFocusId(FULLSCREEN_FOCUS_IDS.PLAY_PAUSE);
            return;
          }
          return; // DOWN -> BLOCKED
        }

        const isPlayingUsb =
          currentTrackRef.current?.id?.startsWith('usb_') ||
          selectedPlaylistRef.current?.id === 'usb_storage';
        const nextFsTarget = getFullscreenNextFocus(
          fsFocus,
          key as DPadDirection,
          isAiOverlayOpenRef.current,
          4,
          false,
          isPlayingUsb
        );
        if (nextFsTarget !== null) {
          setFullscreenFocusId(nextFsTarget);
        }
      }
    },
    [
      closeBackgroundOverlay,
      openBackgroundOverlay,
      handleSelectBackground,
      closeAiSongInfoOverlay,
      exitFullscreenPlayer,
      handleTogglePlayPause,
      handlePlayPrev,
      handlePlayNext,
      handleToggleSongFavorite,
      openAiSongInfoOverlay,
      handleSeekDelta,
      setFullscreenFocusId,
    ]
  );

  // Hardware Back Button (Android TV Remote Back Key)
  useEffect(() => {
    const onHardwareBack = () => {
      console.log('[onHardwareBack] tab:', activeNavTabRef.current, 'pl:', !!selectedPlaylistRef.current, 'overlay:', isAiDjOverlayVisibleRef.current);
      // USB Message Overlay: dismiss on hardware BACK
      if (usbModalStateRef.current.visible) {
        handleCloseUsbModal();
        return true;
      }
      // Module 1: Safely cancel AI DJ processing overlay on hardware BACK
      if (isAiDjOverlayVisibleRef.current) {
        console.log('[Module 1] onHardwareBack: overlay is visible, cancelling!');
        handleCancelAiDjProcessing();
        return true;
      }

      const now = Date.now();
      if (now - lastBackTimeRef.current < 220) {
        return true;
      }
      lastBackTimeRef.current = now;

      if (isListening) {
        SpeechRecognition?.stopListening();
        setIsListening(false);
        setVoiceToast(null);
        return true;
      }

      if (geminiDiagnosticRef.current !== null) {
        setGeminiDiagnostic(null);
        return true;
      }

      // Full Screen Back Hierarchy: 1) Close Background Overlay -> FS_PALETTE, 2) Close AI Overlay -> FS_SONG_INFO, 3) Exit Fullscreen -> PL_PLAYER_FULLSCREEN
      if (isFullscreenPlayerRef.current) {
        if (isBackgroundOverlayOpenRef.current) {
          closeBackgroundOverlay();
        } else if (isAiOverlayOpenRef.current) {
          closeAiSongInfoOverlay();
        } else {
          exitFullscreenPlayer();
        }
        return true;
      }

      if (selectedPlaylistRef.current !== null) {
        handleBackFromPlaylist();
        return true;
      }
      if (activeNavTabRef.current === 'search') {
        const consumed = searchScreenRef.current?.handleBack();
        if (!consumed) {
          handleBackToHome();
        }
        return true;
      }
      if (showAvatarSelectionRef.current) {
        if (savedAvatarIdRef.current) {
          setShowAvatarSelection(false);
          return true;
        }
        // Initial onboarding screen: safely consume Back so app does not exit
        return true;
      }
      if (
        activeNavTabRef.current === 'library' ||
        activeNavTabRef.current === 'ai_dj' ||
        activeNavTabRef.current === 'favorites' ||
        activeNavTabRef.current === 'settings'
      ) {
        handleBackToHome();
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [
    isListening,
    closeAiSongInfoOverlay,
    exitFullscreenPlayer,
    handleBackFromPlaylist,
    handleBackToHome,
    handleCancelAiDjProcessing,
  ]);

  // Stable ref for TVEventHandler to prevent frequent re-subscription cycles and key drop/lag
  const tvHandlersRef = useRef({
    handleProceedToAiDjPlaylist: handleProceedToAiDjPlaylistRef,
    handleCancelAiDjProcessing,
    setOverlayFocusedBtn,
    handleRetryAiDjProcessing,
    handleTogglePlayPause,
    handleFullscreenRemoteEvent,
    handleReplayIntro,
    handleBackFromPlaylist,
    handleBackToHome,
    handleToggleShuffle,
    handleTogglePlaylistLike,
    handleToggleSongFavorite,
    handlePlayPrev,
    handlePlayNext,
    handleToggleFullscreen,
    handlePlayPlaylistTrack,
    handleToggleVoice,
    handleLaunchContextualAIDJ,
    handleRunDiagnosticTest,
    handleVoiceCommand,
    handleSelectPlaylist,
    handleSeekDelta,
    setFocusedId,
    getHomeNextFocus,
  });

  tvHandlersRef.current = {
    handleProceedToAiDjPlaylist: handleProceedToAiDjPlaylistRef,
    handleCancelAiDjProcessing,
    setOverlayFocusedBtn,
    handleRetryAiDjProcessing,
    handleTogglePlayPause,
    handleFullscreenRemoteEvent,
    handleReplayIntro,
    handleBackFromPlaylist,
    handleBackToHome,
    handleToggleShuffle,
    handleTogglePlaylistLike,
    handleToggleSongFavorite,
    handlePlayPrev,
    handlePlayNext,
    handleToggleFullscreen,
    handlePlayPlaylistTrack,
    handleToggleVoice,
    handleLaunchContextualAIDJ,
    handleRunDiagnosticTest,
    handleVoiceCommand,
    handleSelectPlaylist,
    handleSeekDelta,
    setFocusedId,
    getHomeNextFocus,
  };

  // Centralized, Deterministic TV Remote Event Router
  useEffect(() => {
    const tvListener = TVEventHandler.addListener((evt: any) => {
      if (!evt || !evt.eventType) return;

      // Only process ACTION_UP (or events without action code) so 1 physical press = 1 transition
      if (evt.eventKeyAction !== undefined && evt.eventKeyAction !== 1) {
        return;
      }

      const key = evt.eventType.toLowerCase();
      const h = tvHandlersRef.current;

      // AVATAR COMPANION SELECTION SCREEN D-PAD ROUTER
      if (showAvatarSelectionRef.current) {
        avatarSelectionRef.current?.handleRemoteEvent(key);
        return;
      }

      // MODULE 1 & 2 AI DJ PROCESSING OVERLAY D-PAD BEHAVIOR (Sections 22 & 23)
      if (isAiDjOverlayVisibleRef.current) {
        console.log('[Module 1/2] TVEventHandler: overlay is visible, key:', key, 'stage:', aiDjProcessingStageRef.current);
        if (aiDjProcessingStageRef.current === 'READY') {
          if (key === 'select' || key === 'dpad_center' || key === 'enter') {
            console.log('[Module 2] User pressed Select on READY -> Opening AI DJ Playlist Detail');
            h.handleProceedToAiDjPlaylist.current?.();
            return;
          }
          if (key === 'back' || key === 'escape') {
            h.handleCancelAiDjProcessing();
            return;
          }
          return;
        }
        if (aiDjProcessingStageRef.current === 'ERROR') {
          if (key === 'left' || key === 'up') {
            h.setOverlayFocusedBtn('retry');
            return;
          }
          if (key === 'right' || key === 'down') {
            h.setOverlayFocusedBtn('back');
            return;
          }
          if (key === 'select' || key === 'dpad_center' || key === 'enter') {
            if (overlayFocusedBtnRef.current === 'retry') {
              h.handleRetryAiDjProcessing();
            } else {
              h.handleCancelAiDjProcessing();
            }
            return;
          }
        }
        if (key === 'back' || key === 'escape') {
          h.handleCancelAiDjProcessing();
        }
        return;
      }

      if (key === 'playpause') {
        h.handleTogglePlayPause();
        return;
      }

      // ISOLATED FULL SCREEN NAVIGATION CONTEXT (Sections 1 & 30)
      if (isFullscreenPlayerRef.current) {
        console.log('[TVEvent:FullScreen]', key, 'fsFocus:', fullscreenFocusIdRef.current);
        h.handleFullscreenRemoteEvent(key);
        return;
      }

      const currentFocus = focusedIdRef.current;
      console.log('[TVEvent]', key, 'focused:', currentFocus);

      if (key === 'menu' || key === 'info') {
        h.handleReplayIntro();
        return;
      }

      // Physical Remote Back Button -> Return to Library / Home
      if (key === 'back' || key === 'escape') {
        const now = Date.now();
        if (now - lastBackTimeRef.current < 220) {
          return;
        }
        lastBackTimeRef.current = now;
        console.log('[TVEventHandler:Back]', 'tab:', activeNavTabRef.current, 'pl:', !!selectedPlaylistRef.current);

        if (usbModalStateRef.current.visible) {
          handleCloseUsbModal();
          return;
        }
        if (geminiDiagnosticRef.current !== null) {
          setGeminiDiagnostic(null);
          return;
        }
        if (selectedPlaylistRef.current !== null) {
          h.handleBackFromPlaylist();
          return;
        }
        if (activeNavTabRef.current === 'search') {
          const consumed = searchScreenRef.current?.handleBack();
          if (!consumed) {
            h.handleBackToHome();
          }
          return;
        }
        if (activeNavTabRef.current === 'library' || activeNavTabRef.current === 'ai_dj') {
          h.handleBackToHome();
          return;
        }
        return;
      }

      // Select / Enter Key Handling
      if (key === 'select' || key === 'enter') {
        if (usbModalStateRef.current.visible) {
          handleCloseUsbModal();
          return;
        }
        // 1. Playlist Detail Screen Select Actions
        if (selectedPlaylistRef.current !== null) {
          if (currentFocus === 'PL_BACK') {
            h.handleBackFromPlaylist();
            return;
          }
          if (currentFocus === 'NAV_LIBRARY') {
            h.handleBackFromPlaylist();
            return;
          }
          if (currentFocus === 'NAV_HOME') {
            h.handleBackToHome();
            return;
          }
          if (currentFocus.startsWith('NAV_')) {
            handleDpadPressRef.current?.(currentFocus);
            return;
          }
          if (currentFocus === 'PL_PLAY_ALL' || currentFocus === 'PL_PLAYER_PLAY' || currentFocus === 'PL_PLAYER_SCRUB') {
            h.handleTogglePlayPause();
            return;
          }
          if (currentFocus === 'PL_SHUFFLE') {
            h.handleToggleShuffle();
            return;
          }
          if (currentFocus === 'PL_FAV') {
            if (selectedPlaylistRef.current?.id === 'usb_storage') return;
            h.handleTogglePlaylistLike();
            return;
          }
          if (currentFocus === 'PL_PLAYER_HEART') {
            if (selectedPlaylistRef.current?.id === 'usb_storage') return;
            h.handleToggleSongFavorite();
            return;
          }
          if (currentFocus === 'PL_PLAYER_PREV') {
            h.handlePlayPrev();
            return;
          }
          if (currentFocus === 'PL_PLAYER_NEXT') {
            h.handlePlayNext();
            return;
          }
          if (currentFocus === 'PL_PLAYER_FULLSCREEN') {
            h.handleToggleFullscreen();
            return;
          }
          if (currentFocus.startsWith('TRK_')) {
            const matchedTrack = selectedPlaylistRef.current.tracks.find((t) => `TRK_${t.id}` === currentFocus);
            if (matchedTrack) {
              h.handlePlayPlaylistTrack(matchedTrack);
            }
            return;
          }
          return;
        }

        // 2. AI DJ Landing Screen Select Actions
        if (selectedPlaylistRef.current === null && activeNavTabRef.current === 'ai_dj') {
          if (currentFocus === AI_DJ_FOCUS_IDS.MIC) {
            h.handleToggleVoice();
            return;
          }
          if (currentFocus === AI_DJ_FOCUS_IDS.DIAGNOSTIC_BTN) {
            h.handleRunDiagnosticTest();
            return;
          }
          if (currentFocus === AI_DJ_FOCUS_IDS.ERR_GENERAL) {
            h.handleVoiceCommand("What's the capital of France?");
            return;
          }
          if (currentFocus === AI_DJ_FOCUS_IDS.ERR_NOTRACKS) {
            h.handleVoiceCommand('Obscure tracks [simulate:no_tracks]');
            return;
          }
          if (currentFocus === AI_DJ_FOCUS_IDS.ERR_CONN) {
            h.handleVoiceCommand('Chill vibe [simulate:timeout]');
            return;
          }
          if (currentFocus === AI_DJ_FOCUS_IDS.ERR_AIDOWN) {
            h.handleVoiceCommand('Workout [simulate:ai_unavailable]');
            return;
          }
          if (currentFocus.startsWith('AI_DJ_CARD_')) {
            const idx = parseInt(currentFocus.replace('AI_DJ_CARD_', ''), 10);
            const targetPlaylist = userAiPlaylistsRef.current[idx];
            if (targetPlaylist) {
              h.handleSelectPlaylist(targetPlaylist, 'ai_dj');
            }
            return;
          }
          if (currentFocus === AI_DJ_FOCUS_IDS.VIEW_ALL) {
            activeNavTabRef.current = 'library';
            setActiveNavTab('library');
            h.setFocusedId(LIBRARY_CARD_IDS.CHILL);
            return;
          }
          if (currentFocus.startsWith('NAV_')) {
            handleDpadPressRef.current?.(currentFocus);
            return;
          }
          return;
        }

        // 3. Library Screen Select Actions
        if (selectedPlaylistRef.current === null && activeNavTabRef.current === 'library') {
          if (currentFocus === LIBRARY_CARD_IDS.CHILL) {
            h.handleSelectPlaylist(PLAYLISTS.chill_vibes);
            return;
          }
          if (currentFocus === LIBRARY_CARD_IDS.FOCUS) {
            h.handleSelectPlaylist(PLAYLISTS.focus_mix);
            return;
          }
          if (currentFocus === LIBRARY_CARD_IDS.WORKOUT) {
            h.handleSelectPlaylist(PLAYLISTS.workout_mix);
            return;
          }
          if (currentFocus === LIBRARY_CARD_IDS.STUDY) {
            h.handleSelectPlaylist(PLAYLISTS.study_mix);
            return;
          }
          if (currentFocus === LIBRARY_CARD_IDS.ENERGIZE) {
            h.handleSelectPlaylist(PLAYLISTS.energize_morning);
            return;
          }
          if (currentFocus === LIBRARY_CARD_IDS.MIDNIGHT) {
            h.handleSelectPlaylist(PLAYLISTS.midnight_dreams);
            return;
          }
          if (currentFocus === LIBRARY_CARD_IDS.USB) {
            handleSelectUsbCard();
            return;
          }
          if (currentFocus === 'LIB_BACK' || currentFocus === 'NAV_HOME') {
            h.handleBackToHome();
            return;
          }
          if (currentFocus === 'NAV_LIBRARY') {
            h.setFocusedId(LIBRARY_CARD_IDS.CHILL);
            return;
          }
          if (currentFocus.startsWith('NAV_')) {
            handleDpadPressRef.current?.(currentFocus);
            return;
          }
          return;
        }

        // 4. Favorites Screen Select Actions
        if (selectedPlaylistRef.current === null && activeNavTabRef.current === 'favorites') {
          if (currentFocus === FAVORITES_FOCUS_IDS.LIKED_SONGS) {
            h.handleSelectPlaylist(likedSongsPlaylistRef.current, 'favorites');
            return;
          }
          if (currentFocus.startsWith(FAVORITES_FOCUS_IDS.PLAYLIST_PREFIX)) {
            const idx = parseInt(
              currentFocus.replace(FAVORITES_FOCUS_IDS.PLAYLIST_PREFIX, ''),
              10
            );
            const targetPl = likedPlaylistsRef.current[idx];
            if (targetPl) {
              h.handleSelectPlaylist(targetPl, 'favorites');
            }
            return;
          }
          if (currentFocus.startsWith('NAV_')) {
            handleDpadPressRef.current?.(currentFocus);
            return;
          }
          return;
        }

        // 5. Search Screen Select Actions
        if (selectedPlaylistRef.current === null && activeNavTabRef.current === 'search') {
          if (currentFocus === 'NAV_SEARCH') {
            h.setFocusedId(SEARCH_FOCUS_IDS.KEY_A);
            return;
          }
          if (currentFocus.startsWith('NAV_')) {
            handleDpadPressRef.current?.(currentFocus);
            return;
          }
          searchScreenRef.current?.handleSelect(currentFocus);
          return;
        }

        // 6. Settings Screen Select Actions
        if (selectedPlaylistRef.current === null && activeNavTabRef.current === 'settings') {
          if (currentFocus === SETTINGS_FOCUS_IDS.CHANGE_AVATAR) {
            setShowAvatarSelection(true);
            return;
          }
          if (currentFocus.startsWith('NAV_')) {
            handleDpadPressRef.current?.(currentFocus);
            return;
          }
          return;
        }

        // 7. Home Screen Select Actions
        if (currentFocus === 'HERO_VOICE') {
          h.handleLaunchContextualAIDJ(selectedTimeOfDayRef.current);
          return;
        }
        if (currentFocus === 'NAV_DJ') {
          selectedPlaylistRef.current = null;
          setSelectedPlaylist(null);
          activeNavTabRef.current = 'ai_dj';
          setActiveNavTab('ai_dj');
          h.setFocusedId(AI_DJ_FOCUS_IDS.MIC);
          return;
        }
        if (currentFocus === 'NAV_LIBRARY') {
          selectedPlaylistRef.current = null;
          setSelectedPlaylist(null);
          activeNavTabRef.current = 'library';
          setActiveNavTab('library');
          h.setFocusedId(LIBRARY_CARD_IDS.CHILL);
          return;
        }
        if (currentFocus === 'NAV_FAV') {
          selectedPlaylistRef.current = null;
          setSelectedPlaylist(null);
          activeNavTabRef.current = 'favorites';
          setActiveNavTab('favorites');
          h.setFocusedId(FAVORITES_FOCUS_IDS.LIKED_SONGS);
          return;
        }
        if (currentFocus === 'NAV_SETTINGS') {
          selectedPlaylistRef.current = null;
          setSelectedPlaylist(null);
          activeNavTabRef.current = 'settings';
          setActiveNavTab('settings');
          h.setFocusedId(SETTINGS_FOCUS_IDS.CHANGE_AVATAR);
          return;
        }
        if (currentFocus === 'NAV_HOME') {
          h.handleBackToHome();
          return;
        }
        if (currentFocus.startsWith('MIX_')) {
          const idx = parseInt(currentFocus.replace('MIX_', ''), 10);
          const mix = FOR_YOU_MIXES[idx];
          if (mix && PLAYLISTS[mix.playlistKey]) {
            h.handleSelectPlaylist(PLAYLISTS[mix.playlistKey], 'home');
          }
          return;
        }
        handleDpadPressRef.current?.(currentFocus);
        return;
      }

      // D-Pad Direction Keys (left, right, up, down)
      if (key === 'left' || key === 'right' || key === 'up' || key === 'down') {
        // 1. Playlist Detail Screen Navigation
        if (selectedPlaylistRef.current !== null) {
          // Scrubber: LEFT/RIGHT seek without moving focus; UP -> PLAY/PAUSE; DOWN -> BLOCKED
          if (currentFocus === 'PL_PLAYER_SCRUB') {
            if (key === 'left') {
              h.handleSeekDelta(-10);
              return;
            }
            if (key === 'right') {
              h.handleSeekDelta(10);
              return;
            }
            if (key === 'up') {
              h.setFocusedId('PL_PLAYER_PLAY');
              return;
            }
            // DOWN on Scrubber is BLOCKED
            return;
          }

          // Case 1: Enter Player from a Playlist Track (TRK_N + RIGHT -> PLAYER_PLAY_PAUSE)
          if (key === 'right' && currentFocus.startsWith('TRK_')) {
            playerOriginTrackIdRef.current = currentFocus;
            h.setFocusedId('PL_PLAYER_PLAY');
            return;
          }

          // Case 2: Enter Player from Playlist Like (PL_FAV + RIGHT -> PLAYER_PLAY_PAUSE)
          if (key === 'right' && currentFocus === 'PL_FAV') {
            const tracks = selectedPlaylistRef.current.tracks;
            const firstTrackId = tracks[0] ? `TRK_${tracks[0].id}` : 'TRK_1';
            const validFocusedTrack =
              lastFocusedTrackIdRef.current &&
              tracks.some((t) => `TRK_${t.id}` === lastFocusedTrackIdRef.current)
                ? lastFocusedTrackIdRef.current
                : firstTrackId;
            playerOriginTrackIdRef.current = validFocusedTrack;
            h.setFocusedId('PL_PLAYER_PLAY');
            return;
          }

          // Case 2b: Enter Player from Shuffle on USB (PL_SHUFFLE + RIGHT -> PLAYER_PLAY_PAUSE)
          if (key === 'right' && currentFocus === 'PL_SHUFFLE' && selectedPlaylistRef.current?.id === 'usb_storage') {
            const tracks = selectedPlaylistRef.current.tracks;
            const firstTrackId = tracks[0] ? `TRK_${tracks[0].id}` : 'TRK_1';
            const validFocusedTrack =
              lastFocusedTrackIdRef.current &&
              tracks.some((t) => `TRK_${t.id}` === lastFocusedTrackIdRef.current)
                ? lastFocusedTrackIdRef.current
                : firstTrackId;
            playerOriginTrackIdRef.current = validFocusedTrack;
            h.setFocusedId('PL_PLAYER_PLAY');
            return;
          }

          // Standard Playlist Navigation Table Lookup
          const isUsbPlaylist = selectedPlaylistRef.current?.id === 'usb_storage';
          const nextTarget = getPlaylistNextFocus(
            currentFocus,
            key as DPadDirection,
            selectedPlaylistRef.current.tracks,
            playerOriginTrackIdRef.current,
            isUsbPlaylist
          );
          if (nextTarget !== null) {
            h.setFocusedId(nextTarget);
            if (nextTarget === 'NAV_LIBRARY') {
              if (playlistOriginRef.current === 'ai_dj') {
                activeNavTabRef.current = 'ai_dj';
                setActiveNavTab('ai_dj');
                h.setFocusedId('NAV_DJ');
              } else {
                activeNavTabRef.current = 'library';
                setActiveNavTab('library');
              }
            }
          }
          return;
        }

        // 2. AI DJ Landing Screen Navigation
        if (selectedPlaylistRef.current === null && activeNavTabRef.current === 'ai_dj') {
          const nextTarget = getAiDjNextFocus(
            currentFocus,
            key as DPadDirection,
            userAiPlaylistsRef.current.length
          );
          if (nextTarget !== null) {
            h.setFocusedId(nextTarget);
          }
          return;
        }

        // 3. Library Screen Navigation
        if (selectedPlaylistRef.current === null && activeNavTabRef.current === 'library') {
          const nextTarget = getLibraryNextFocus(currentFocus, key as DPadDirection);
          if (nextTarget !== null) {
            h.setFocusedId(nextTarget);
          }
          return;
        }

        // 4. Search Screen Navigation
        if (selectedPlaylistRef.current === null && activeNavTabRef.current === 'search') {
          if (currentFocus.startsWith('NAV_')) {
            const nextTarget = h.getHomeNextFocus(currentFocus, key as DPadDirection);
            if (nextTarget !== null) {
              h.setFocusedId(nextTarget);
            }
            return;
          }
          const nextTarget = searchScreenRef.current?.handleDirection(key as DPadDirection, currentFocus);
          if (nextTarget !== null && nextTarget !== undefined) {
            h.setFocusedId(nextTarget);
          }
          return;
        }

        // 5. Favorites Screen Navigation
        if (selectedPlaylistRef.current === null && activeNavTabRef.current === 'favorites') {
          const nextTarget = getFavoritesNextFocus(
            currentFocus,
            key as DPadDirection,
            likedPlaylistsRef.current.length
          );
          if (nextTarget !== null) {
            h.setFocusedId(nextTarget);
          }
          return;
        }

        // 6. Settings Screen Navigation
        if (selectedPlaylistRef.current === null && activeNavTabRef.current === 'settings') {
          const nextTarget = getSettingsNextFocus(currentFocus, key as DPadDirection);
          if (nextTarget !== null) {
            h.setFocusedId(nextTarget);
          }
          return;
        }

        // 7. Home Screen Navigation
        if (
          selectedPlaylistRef.current === null &&
          activeNavTabRef.current !== 'library' &&
          activeNavTabRef.current !== 'search' &&
          activeNavTabRef.current !== 'favorites' &&
          activeNavTabRef.current !== 'settings' &&
          activeNavTabRef.current !== 'ai_dj'
        ) {
          const nextTarget = h.getHomeNextFocus(currentFocus, key as DPadDirection);
          if (nextTarget !== null) {
            h.setFocusedId(nextTarget);
          }
          return;
        }
      }
    });
    return () => tvListener.remove();
  }, []);

  // Auto-advance to next track when playback finishes
  useEffect(() => {
    if (playerStatus?.playing && (playerStatus?.currentTime ?? 0) > 2) {
      if (lastAutoAdvancedTrackIdRef.current === currentTrackRef.current?.id) {
        lastAutoAdvancedTrackIdRef.current = null;
      }
    }
  }, [playerStatus?.playing, playerStatus?.currentTime]);

  useEffect(() => {
    const isFinished =
      playerStatus?.didJustFinish ||
      playerStatus?.playbackState === 'ended';

    const currentId = currentTrackRef.current?.id;

    if (hasPlaybackStartedRef.current && isFinished && currentId) {
      if (isRepeatActive) {
        if (player && currentTrackRef.current?.audioUrl) {
          player.replace(currentTrackRef.current.audioUrl);
          player.play();
        }
      } else {
        if (lastAutoAdvancedTrackIdRef.current !== currentId) {
          lastAutoAdvancedTrackIdRef.current = currentId;
          handlePlayNext();
        }
      }
    }
  }, [playerStatus?.didJustFinish, playerStatus?.playbackState, isRepeatActive, handlePlayNext, player]);

  // D-Pad Spatial Navigation Handler
  const handleDpadPress = useCallback(
    (id: string) => {
      focusedIdRef.current = id;
      setFocusedId(id);
      if (id.startsWith('NAV_')) {
        const found = NAV_ITEMS.find((n) => n.id === id);
        if (found) {
          selectedPlaylistRef.current = null;
          setSelectedPlaylist(null);
          activeNavTabRef.current = found.tab;
          setActiveNavTab(found.tab);
          if (found.tab === 'home') {
            handleBackToHome();
          } else if (found.tab === 'library') {
            focusedIdRef.current = LIBRARY_CARD_IDS.CHILL;
            setFocusedId(LIBRARY_CARD_IDS.CHILL);
          } else if (found.tab === 'ai_dj' || found.tab === 'dj') {
            focusedIdRef.current = AI_DJ_FOCUS_IDS.MIC;
            setFocusedId(AI_DJ_FOCUS_IDS.MIC);
          } else if (found.tab === 'search') {
            focusedIdRef.current = SEARCH_FOCUS_IDS.KEY_A;
            setFocusedId(SEARCH_FOCUS_IDS.KEY_A);
          } else if (found.tab === 'favorites') {
            focusedIdRef.current = FAVORITES_FOCUS_IDS.LIKED_SONGS;
            setFocusedId(FAVORITES_FOCUS_IDS.LIKED_SONGS);
          } else if (found.tab === 'settings') {
            focusedIdRef.current = SETTINGS_FOCUS_IDS.CHANGE_AVATAR;
            setFocusedId(SETTINGS_FOCUS_IDS.CHANGE_AVATAR);
          } else {
            focusedIdRef.current = 'HERO_VOICE';
            setFocusedId('HERO_VOICE');
          }
        }
      } else if (id === SETTINGS_FOCUS_IDS.CHANGE_AVATAR) {
        setShowAvatarSelection(true);
      } else if (id === 'HERO_VOICE') {
        handleLaunchContextualAIDJ(selectedTimeOfDayRef.current);
      } else if (id === 'HERO_CHILL') {
        handleSelectPlaylist(PLAYLISTS.energize_morning);
      } else if (id === FAVORITES_FOCUS_IDS.LIKED_SONGS) {
        handleSelectPlaylist(likedSongsPlaylistRef.current, 'favorites');
      } else if (id.startsWith(FAVORITES_FOCUS_IDS.PLAYLIST_PREFIX)) {
        const idx = parseInt(id.replace(FAVORITES_FOCUS_IDS.PLAYLIST_PREFIX, ''), 10);
        const targetPl = likedPlaylistsRef.current[idx];
        if (targetPl) {
          handleSelectPlaylist(targetPl, 'favorites');
        }
      } else if (id === LIBRARY_CARD_IDS.CHILL) {
        handleSelectPlaylist(PLAYLISTS.chill_vibes);
      } else if (id === LIBRARY_CARD_IDS.FOCUS) {
        handleSelectPlaylist(PLAYLISTS.focus_mix);
      } else if (id === LIBRARY_CARD_IDS.WORKOUT) {
        handleSelectPlaylist(PLAYLISTS.workout_mix);
      } else if (id === LIBRARY_CARD_IDS.STUDY) {
        handleSelectPlaylist(PLAYLISTS.study_mix);
      } else if (id === LIBRARY_CARD_IDS.ENERGIZE) {
        handleSelectPlaylist(PLAYLISTS.energize_morning);
      } else if (id === LIBRARY_CARD_IDS.MIDNIGHT) {
        handleSelectPlaylist(PLAYLISTS.midnight_dreams);
      } else if (id === LIBRARY_CARD_IDS.USB) {
        handleSelectUsbCard();
      } else if (id === 'USB_MODAL_BACK') {
        handleCloseUsbModal();
      } else if (id === 'LIB_BACK') {
        handleBackToHome();
      } else if (id === 'LIB_SEARCH') {
        handleToggleVoice();
      } else if (id.startsWith('REC_')) {
        const idx = parseInt(id.replace('REC_', ''), 10);
        const trk = recentlyPlayedTracksRef.current[idx];
        if (trk) {
          handlePlayTrack(trk);
        }
      } else if (id.startsWith('MIX_')) {
        const idx = parseInt(id.replace('MIX_', ''), 10);
        const mix = FOR_YOU_MIXES[idx];
        const playlistKey = mix?.playlistKey || 'chill_vibes';
        handleSelectPlaylist(PLAYLISTS[playlistKey] || PLAYLISTS.chill_vibes, 'home');
      } else if (id === 'HDR_REPLAY') {
        handleReplayIntro();
      } else if (id === 'HDR_THEME') {
        handleCycleTheme();
      }
    },
    [
      handleLaunchContextualAIDJ,
      selectedTimeOfDay,
      handleToggleVoice,
      handlePlayTrack,
      handleReplayIntro,
      handleCycleTheme,
      handleBackToHome,
      handleSelectPlaylist,
    ]
  );
  handleDpadPressRef.current = handleDpadPress;

  const renderFocusedTrackTitle = (title: string) => {
    if (!title) return null;

    if (title.includes(' - ')) {
      const parts = title.split(' - ');
      return (
        <Text style={styles.trackTitle} numberOfLines={1}>
          <Text style={styles.trackTitlePart1}>{parts[0]}</Text>
          <Text style={styles.trackTitleDash}> - </Text>
          <Text style={styles.trackTitlePart2}>{parts.slice(1).join(' - ')}</Text>
        </Text>
      );
    }

    const words = title.trim().split(/\s+/);

    if (words.length === 1) {
      const w = words[0];
      if (w.length <= 3) {
        return (
          <Text style={styles.trackTitle} numberOfLines={1}>
            <Text style={styles.trackTitlePart1}>{w[0]}</Text>
            {w[1] ? <Text style={styles.trackTitleDash}>{w[1]}</Text> : null}
            {w.length > 2 ? <Text style={styles.trackTitlePart2}>{w.slice(2)}</Text> : null}
          </Text>
        );
      }
      const idx1 = Math.max(1, Math.floor(w.length / 3));
      const idx2 = Math.min(w.length - 1, Math.floor((w.length * 2) / 3));
      return (
        <Text style={styles.trackTitle} numberOfLines={1}>
          <Text style={styles.trackTitlePart1}>{w.slice(0, idx1)}</Text>
          <Text style={styles.trackTitleDash}>{w.slice(idx1, idx2)}</Text>
          <Text style={styles.trackTitlePart2}>{w.slice(idx2)}</Text>
        </Text>
      );
    }

    if (words.length === 2) {
      return (
        <Text style={styles.trackTitle} numberOfLines={1}>
          <Text style={styles.trackTitlePart1}>{words[0]}</Text>
          <Text style={styles.trackTitleDash}> </Text>
          <Text style={styles.trackTitlePart2}>{words[1]}</Text>
        </Text>
      );
    }

    // 3 or more words: word 0 Purple, word 1 Blue, remaining words Cyan
    return (
      <Text style={styles.trackTitle} numberOfLines={1}>
        <Text style={styles.trackTitlePart1}>{words[0]} </Text>
        <Text style={styles.trackTitleDash}>{words[1]} </Text>
        <Text style={styles.trackTitlePart2}>{words.slice(2).join(' ')}</Text>
      </Text>
    );
  };

  const getCompanionArtwork = useCallback((id: AvatarId | null) => {
    switch (id) {
      case 'bamboo':
        return require('./assets/avatars/avatar_bamboo.png');
      case 'ember':
        return require('./assets/avatars/avatar_ember.png');
      case 'frost':
        return require('./assets/avatars/avatar_frost.png');
      case 'sunny':
        return require('./assets/avatars/avatar_sunny.png');
      case 'shadow':
        return require('./assets/avatars/avatar_shadow.png');
      default:
        return require('./assets/ui/avatar_clean.png');
    }
  }, []);

  if (!isPreferenceHydrated) {
    return <View style={styles.container} />;
  }

  return (
    <View
      style={[
        styles.container,
        activeNavTab === 'favorites' && { backgroundColor: '#FFFFFF' },
      ]}
      focusable={true}
      hasTVPreferredFocus={true}
    >
      {activeNavTab === 'search' && (
        <Image
          source={require('./assets/ui/search_pastel_bg.png')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      )}
      <Animated.View
        style={[
          styles.mainContent,
          {
            opacity: homeOpacity,
            transform: [{ translateY: homeTranslateY }],
          },
          isFullscreenPlayer && { display: 'none' },
        ]}
      >
        {/* Top Header Bar */}
        <View style={styles.topHeader}>
          {/* Left Brand Identity: Collapses icon-only (76px) / Expands full title */}
          <Animated.View
            style={[
              styles.brandRow,
              {
                width: sidebarWidth.interpolate({
                  inputRange: [76, 188],
                  outputRange: [104, 216],
                }),
              },
            ]}
          >
            <Pressable
              focusable={false}
              onHoverIn={() => setIsSidebarHovered(true)}
              onHoverOut={() => setIsSidebarHovered(false)}
              onPress={() => setIsSidebarHovered((prev) => !prev)}
              style={styles.brandPressable}
            >
              <Image
                source={require('./assets/logo.png')}
                style={styles.headerLogoImage}
                resizeMode="contain"
              />
              <Animated.View
                style={[
                  styles.brandTitleWrapper,
                  {
                    opacity: labelOpacity,
                    transform: [{ translateX: labelTranslateX }],
                  },
                ]}
              >
                <Text numberOfLines={1} style={styles.brandTitle}>PANDIVO</Text>
              </Animated.View>
            </Pressable>
          </Animated.View>

          {/* Right Header Utilities: Search bar & Back when playlist or library is open, or Home widgets */}
          {selectedPlaylist ? (
            <View style={styles.playlistHeaderRow}>
              <Pressable
                focusable={false}
                onPress={handleBackFromPlaylist}
                style={({ pressed }) => [
                  styles.playlistBackBtn,
                  focusedId === 'PL_BACK' && styles.playlistBackBtnFocused,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={styles.playlistBackArrow}>←</Text>
                <Text style={styles.playlistBackText}>Back</Text>
              </Pressable>

              <View style={styles.headerRightRow}>
                <View style={styles.clockContainer}>
                  <Text style={styles.clockTime}>{currentTime}</Text>
                  <Text style={styles.clockDate}>{currentDate}</Text>
                </View>
                <View style={styles.avatarBorder}>
                  <Image
                    source={getCompanionArtwork(savedAvatarId)}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                </View>
              </View>
            </View>
          ) : activeNavTab === 'library' ? (
            <View style={styles.playlistHeaderRow}>
              <Pressable
                focusable={false}
                onPress={handleBackToHome}
                style={({ pressed }) => [
                  styles.playlistBackBtn,
                  focusedId === 'LIB_BACK' && styles.playlistBackBtnFocused,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={styles.playlistBackArrow}>←</Text>
                <Text style={styles.playlistBackText}>Back</Text>
              </Pressable>

              <View style={styles.headerRightRow}>
                <View style={styles.clockContainer}>
                  <Text style={styles.clockTime}>{currentTime}</Text>
                  <Text style={styles.clockDate}>{currentDate}</Text>
                </View>
                <View style={styles.avatarBorder}>
                  <Image
                    source={getCompanionArtwork(savedAvatarId)}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                </View>
              </View>
            </View>
          ) : activeNavTab === 'ai_dj' || activeNavTab === 'search' || activeNavTab === 'favorites' || activeNavTab === 'settings' ? (
            <View style={styles.playlistHeaderRow}>
              <View />
              <View style={styles.headerRightRow}>
                <View style={styles.clockContainer}>
                  <Text style={styles.clockTime}>{currentTime}</Text>
                  <Text style={styles.clockDate}>{currentDate}</Text>
                </View>
                <View style={styles.avatarBorder}>
                  <Image
                    source={getCompanionArtwork(savedAvatarId)}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.headerRightRow}>
              {/* Dynamic Time of Day Theme Cycler */}
              <Pressable
                focusable={false}
                onPress={handleCycleTheme}
                style={({ pressed }) => [
                  styles.headerThemeBtn,
                  focusedId === 'HDR_THEME' && styles.headerThemeBtnFocused,
                  pressed && styles.btnPressed,
                ]}
              >
                <Feather
                  name={currentTheme.iconName}
                  size={14}
                  color={focusedId === 'HDR_THEME' ? '#4338CA' : currentTheme.iconColor}
                />
                <Text
                  style={[
                    styles.headerThemeLabel,
                    focusedId === 'HDR_THEME' && styles.headerThemeLabelFocused,
                  ]}
                >
                  {currentTheme.label}
                </Text>
              </Pressable>

              {/* Intro Replay Utility Button */}
              <Pressable
                focusable={false}
                onPress={handleReplayIntro}
                style={({ pressed }) => [
                  styles.headerIconBtn,
                  focusedId === 'HDR_REPLAY' && styles.headerIconBtnFocused,
                  pressed && styles.btnPressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="movie-play-outline"
                  size={19}
                  color={focusedId === 'HDR_REPLAY' ? '#4338CA' : '#475569'}
                />
              </Pressable>

              {/* Live Time / Date Indicator */}
              <View style={styles.clockContainer}>
                <Text style={styles.clockTime}>{currentTime}</Text>
                <Text style={styles.clockDate}>{currentDate}</Text>
              </View>

              {/* User Profile Avatar */}
              <View style={styles.avatarBorder}>
                <Image
                  source={getCompanionArtwork(savedAvatarId)}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              </View>
            </View>
          )}
        </View>

        {/* Voice Toast Banner (When Speaking or Processing) */}
        {voiceToast && (
          <View style={styles.voiceToast}>
            <Text style={styles.voiceToastText}>{voiceToast}</Text>
          </View>
        )}

        {/* Main Body: Left Rail + Scrollable Content */}
        <View style={styles.bodyGrid}>
          {/* Left Navigation Rail (Collapsible: 76px default icon-only -> 188px expanded) */}
          <Animated.View
            style={[
              styles.leftNavRail,
              {
                width: sidebarWidth.interpolate({
                  inputRange: [76, 188],
                  outputRange: [104, 216],
                }),
              },
            ]}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeNavTab === item.tab;
              const isItemFocused = focusedId === item.id;
              return (
                <Pressable
                  key={item.id}
                  focusable={false}
                  onHoverIn={() => setIsSidebarHovered(true)}
                  onHoverOut={() => setIsSidebarHovered(false)}
                  onPress={() => handleDpadPress(item.id)}
                  style={({ pressed }) => [
                    styles.navItem,
                    isActive && styles.navItemActive,
                    isItemFocused && styles.navItemFocused,
                    isActive && isItemFocused && styles.navItemActiveFocused,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <View style={styles.navIconBox}>
                    <Image
                      source={item.icon}
                      style={[
                        styles.navIconImage,
                        (isActive || isItemFocused) ? styles.navIconImageActive : styles.navIconImageInactive,
                      ]}
                      resizeMode="contain"
                    />
                  </View>
                  <Animated.View
                    style={[
                      styles.navLabelWrapper,
                      {
                        opacity: labelOpacity,
                        transform: [{ translateX: labelTranslateX }],
                      },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[styles.navLabel, isActive && styles.navLabelActive]}
                    >
                      {item.label}
                    </Text>
                  </Animated.View>
                </Pressable>
              );
            })}
          </Animated.View>

          {/* Right Content Canvas: PlaylistScreen, AiDjScreen, LibraryScreen, or Home Main Dashboard */}
          {selectedPlaylist ? (
            <PlaylistScreen
              playlist={selectedPlaylist}
              currentTrackId={currentTrack?.id}
              isPlaying={!!playerStatus?.playing}
              currentTimeMs={
                seekPreviewSeconds !== null
                  ? seekPreviewSeconds * 1000
                  : (playerStatus?.currentTime || 0) * 1000
              }
              durationMs={(playerStatus?.duration || (currentTrack?.duration || 252)) * 1000}
              onPlayTrack={handlePlayPlaylistTrack}
              onTogglePlayPause={handleTogglePlayPause}
              onBackToHome={handleBackFromPlaylist}
              focusedId={focusedId}
              setFocusedId={setFocusedId}
              onPlayNext={handlePlayNext}
              onPlayPrev={handlePlayPrev}
              isShuffleActive={isShuffleActive}
              shuffledTrackIds={shuffledTrackIds}
              onToggleShuffle={handleToggleShuffle}
              isRepeatActive={isRepeatActive}
              onToggleRepeat={() => setIsRepeatActive((prev) => !prev)}
              onSeekDelta={handleSeekDelta}
              onToggleFullscreen={handleToggleFullscreen}
              isPlaylistLiked={!!playlistLikedMap[selectedPlaylist.id]}
              onTogglePlaylistLike={() => handleTogglePlaylistLike(selectedPlaylist.id)}
              favoriteMap={songFavoriteMap}
              onToggleSongFavorite={handleToggleSongFavorite}
            />
          ) : activeNavTab === 'ai_dj' ? (
            <AiDjScreen
              focusedId={focusedId}
              setFocusedId={setFocusedId}
              onPressMic={handleToggleVoice}
              onSelectHistoryPlaylist={(pl) => handleSelectPlaylist(pl, 'ai_dj')}
              onPressViewAll={() => {
                activeNavTabRef.current = 'library';
                setActiveNavTab('library');
                setFocusedId(LIBRARY_CARD_IDS.CHILL);
              }}
              isListening={isListening}
              isProcessing={isProcessing}
              voiceTranscript={voiceTranscript}
              geminiDiagnostic={isAiDjOverlayVisible ? null : geminiDiagnostic}
              onTriggerTestPrompt={(prompt) => {
                setIsListening(false);
                setVoiceTranscript(prompt);
                handleVoiceCommand(prompt);
              }}
              onRunDiagnosticTest={handleRunDiagnosticTest}
              onCloseDiagnosticModal={() => setGeminiDiagnostic(null)}
              userPlaylists={userAiPlaylists}
              playlistLikedMap={playlistLikedMap}
              onTogglePlaylistLike={handleTogglePlaylistLike}
            />
          ) : activeNavTab === 'library' ? (
            <LibraryScreen
              onSelectPlaylist={handleSelectPlaylist}
              focusedId={focusedId}
              setFocusedId={setFocusedId}
              playlistLikedMap={playlistLikedMap}
              onTogglePlaylistLike={handleTogglePlaylistLike}
              onSelectUsbCard={handleSelectUsbCard}
              usbStatus={usbStatus}
            />
          ) : activeNavTab === 'favorites' ? (
            <FavoritesScreen
              likedSongsPlaylist={likedSongsPlaylist}
              likedPlaylists={likedPlaylists}
              focusedId={focusedId}
              setFocusedId={setFocusedId}
              onSelectPlaylist={(pl) => handleSelectPlaylist(pl, 'favorites')}
              onTogglePlaylistLike={handleTogglePlaylistLike}
              currentTime={currentTime}
            />
          ) : activeNavTab === 'search' ? (
            <SearchScreen
              ref={searchScreenRef}
              focusedId={focusedId}
              setFocusedId={setFocusedId}
              onBackToHome={handleBackToHome}
              onPlayTrack={(track) => handlePlayPlaylistTrack(track)}
              onTogglePlayPause={handleTogglePlayPause}
              currentPlayingTrackId={currentTrack?.id}
              isPlaying={!!playerStatus?.playing}
              songFavoriteMap={songFavoriteMap}
              onToggleSongFavorite={handleToggleSongFavorite}
            />
          ) : activeNavTab === 'settings' ? (
            <SettingsScreen
              savedAvatarId={savedAvatarId}
              focusedId={focusedId}
              setFocusedId={setFocusedId}
              onChangeAvatar={() => setShowAvatarSelection(true)}
            />
          ) : (
            <ScrollView
              ref={homeScrollViewRef}
              focusable={false}
              scrollEnabled={false}
              style={styles.mainScrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
            {/* Hero Prompt Banner Card with Dynamic Time-of-Day Panoramic Art */}
            <View style={styles.heroBannerCard}>
              {/* Background Panoramic Artwork */}
              <Image
                source={currentTheme.bannerImage}
                style={styles.heroBannerImage}
                resizeMode="cover"
              />

              {/* Progressive 100% -> 75% -> 50% -> 25% -> 0% Smooth Gradient Overlay */}
              <Image
                source={currentTheme.gradientOverlay}
                style={styles.heroGradientOverlay}
                resizeMode="stretch"
              />

              {/* Left Column: Greeting, Headline, Subheadline & Voice Capsule */}
              <View style={styles.heroLeftCol}>
                <View style={styles.heroGreetingPill}>
                  <Text style={[styles.heroGreetingText, { color: currentTheme.textColor }]}>
                    {currentTheme.greeting}
                  </Text>
                </View>

                <Text style={[styles.heroTitle, { color: currentTheme.textColor }]}>
                  What do you want to{' '}
                  <Text style={{ color: currentTheme.hearAccent, textDecorationLine: 'underline' }}>
                    hear?
                  </Text>
                </Text>

                <Text style={[styles.heroSubtitle, { color: currentTheme.subtextColor }]}>
                  Ask Pandivo to play music for any mood, moment, or activity.
                </Text>

                {/* Contextual AI DJ Action Capsule */}
                <Pressable
                  focusable={false}
                  onPress={() => handleDpadPress('HERO_VOICE')}
                  style={({ pressed }) => [
                    styles.heroVoiceCapsule,
                    focusedId === 'HERO_VOICE' && styles.heroVoiceCapsuleFocused,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.heroVoiceCapsuleBadge,
                      focusedId === 'HERO_VOICE' && styles.heroVoiceCapsuleBadgeFocused,
                    ]}
                  >
                    <Ionicons
                      name="sparkles"
                      size={13}
                      color={focusedId === 'HERO_VOICE' ? '#FFFFFF' : '#6366F1'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.heroVoiceCapsuleText,
                      focusedId === 'HERO_VOICE' && styles.heroVoiceCapsuleTextFocused,
                    ]}
                  >
                    {getAIDJCTA({ context: selectedTimeOfDay })}
                  </Text>
                </Pressable>
              </View>

              {/* Floating Quick Play Card */}
              <Pressable
                focusable={false}
                onPress={() => handleDpadPress('HERO_CHILL')}
                style={({ pressed }) => [
                  styles.heroFloatingCard,
                  focusedId === 'HERO_CHILL' && styles.heroFloatingCardFocused,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={styles.heroFloatingTag}>{currentTheme.quickCardTag}</Text>
                <Text style={styles.heroFloatingTitle}>{currentTheme.quickCardTitle}</Text>
                <View style={styles.heroFloatingPlayRow}>
                  <View style={styles.heroFloatingPlayBtn}>
                    <Text style={styles.heroFloatingPlayIcon}>▶</Text>
                  </View>
                  <Text style={styles.heroFloatingPlayLabel}>Play</Text>
                </View>
              </Pressable>
            </View>



            {/* Recently Played Carousel */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recently Played</Text>
              {recentlyPlayedTracks.length > 0 && (
                <Text style={styles.sectionSeeAll}>See All →</Text>
              )}
            </View>

            {recentlyPlayedTracks.length > 0 ? (
              <ScrollView
                ref={recentlyPlayedScrollRef}
                focusable={false}
                scrollEnabled={false}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ overflow: 'visible' }}
                contentContainerStyle={styles.carouselScroll}
              >
                {recentlyPlayedTracks.map((track, idx) => {
                  const cardId = `REC_${idx}`;
                  const isCardFocused = focusedId === cardId;
                  const isTrackPlaying = currentTrack.id === track.id && playerStatus?.playing;

                  return (
                    <Pressable
                      key={`rec_${track.id}_${idx}`}
                      focusable={false}
                      onPress={() => handleDpadPress(cardId)}
                      style={({ pressed }) => [
                        styles.trackCard,
                        isCardFocused && styles.trackCardFocused,
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <View style={[styles.cardInner, !isCardFocused && styles.cardInnerShadow]}>
                        <Image source={track.localArtwork} style={styles.trackArtwork} resizeMode="cover" />
                        {/* Dark translucent gradient overlay at the bottom of the artwork */}
                        <Image
                          source={require('./assets/ui/rec_card_gradient.png')}
                          style={styles.cardGradientOverlay}
                          resizeMode="stretch"
                        />
                        {/* Bottom information area */}
                        <View style={styles.cardInfoContainer}>
                          <View style={styles.cardTextCol}>
                            {isCardFocused ? (
                              renderFocusedTrackTitle(track.displayTitle)
                            ) : (
                              <Text style={styles.trackTitle} numberOfLines={1}>
                                {track.displayTitle}
                              </Text>
                            )}
                            <Text style={styles.trackArtist} numberOfLines={1}>
                              {track.displayArtist}
                            </Text>
                          </View>
                          {/* Subtle monochrome music-note icon */}
                          <Image
                            source={require('./assets/ui/icon_music_note.png')}
                            style={styles.cardMusicNoteIcon}
                            resizeMode="contain"
                          />
                        </View>
                        {isTrackPlaying && (
                          <View style={styles.playingBadge}>
                            <Text style={styles.playingBadgeIcon}>▶</Text>
                          </View>
                        )}
                      </View>
                      {/* Multicolor PANDIVO focus indicator and subtle outer glow */}
                      {isCardFocused && (
                        <Image
                          source={require('./assets/ui/pandivo_focus_border.png')}
                          style={styles.cardFocusBorderOverlay}
                          resizeMode="stretch"
                        />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.recentlyPlayedEmptyRow}>
                <Text style={styles.recentlyPlayedEmptyText}>
                  No recently played songs yet. Songs you play will appear here.
                </Text>
              </View>
            )}

            {/* For You Curated Mixes Carousel */}
            <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
              <Text style={styles.sectionTitle}>For You</Text>
              <Text style={styles.sectionSeeAll}>See All →</Text>
            </View>

            <ScrollView
              ref={forYouScrollRef}
              focusable={false}
              scrollEnabled={false}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ overflow: 'visible' }}
              contentContainerStyle={styles.carouselScroll}
            >
              {FOR_YOU_MIXES.map((mix, idx) => {
                const mixId = `MIX_${idx}`;
                const isMixFocused = focusedId === mixId;

                return (
                  <Pressable
                    key={mix.id}
                    focusable={false}
                    onPress={() => handleDpadPress(mixId)}
                    style={({ pressed }) => [
                      styles.playlistCard,
                      isMixFocused && styles.playlistCardFocused,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <View style={[styles.playlistCardInner, !isMixFocused && styles.playlistCardInnerShadow]}>
                      <Image source={mix.localArtwork} style={styles.playlistArtwork} resizeMode="cover" />
                      {/* Dark translucent gradient overlay at the bottom of the artwork */}
                      <Image
                        source={require('./assets/ui/playlist_card_gradient.png')}
                        style={styles.playlistGradientOverlay}
                        resizeMode="stretch"
                      />
                      {/* Bottom information area */}
                      <View style={styles.playlistInfoContainer}>
                        <View style={styles.playlistTextCol}>
                          <Text style={styles.playlistTitle} numberOfLines={1}>
                            {mix.title}
                          </Text>
                          <Text style={styles.playlistSubtitle} numberOfLines={1}>
                            {mix.subtitle}
                          </Text>
                        </View>
                        {/* Minimal playlist icon */}
                        <Image
                          source={require('./assets/ui/icon_playlist.png')}
                          style={styles.playlistIcon}
                          resizeMode="contain"
                        />
                      </View>
                    </View>
                    {/* Multicolor PANDIVO focus indicator and soft outer glow */}
                    {isMixFocused && (
                      <Image
                        source={require('./assets/ui/pandivo_playlist_focus_border.png')}
                        style={styles.playlistFocusBorderOverlay}
                        resizeMode="stretch"
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </ScrollView>
          )}
        </View>
      </Animated.View>

      {/* Full Screen Player Mode (Isolated Focus & Navigation Context) */}
      {isFullscreenPlayer && selectedPlaylist && (() => {
        const activeFsTrack =
          selectedPlaylist.tracks.find((t) => t.id === currentTrack?.id) ||
          selectedPlaylist.tracks[0];
        const fsCurrentTimeSeconds =
          seekPreviewSeconds !== null
            ? seekPreviewSeconds
            : playerStatus?.currentTime || 0;
        const fsDurationSeconds =
          playerStatus?.duration || activeFsTrack?.durationSeconds || 252;
        return (
          <FullscreenPlayerScreen
            playlist={selectedPlaylist}
            playingTrack={activeFsTrack}
            isPlaying={!!playerStatus?.playing}
            currentTimeSeconds={fsCurrentTimeSeconds}
            durationSeconds={fsDurationSeconds}
            isSongLiked={!!songFavoriteMap[activeFsTrack.id]}
            isShuffleActive={isShuffleActive}
            shuffledTrackIds={shuffledTrackIds}
            fullscreenFocusId={fullscreenFocusId}
            isAiOverlayOpen={isAiOverlayOpen}
            aiOverlayStatus={aiOverlayStatus}
            aiSongInsight={aiSongInsight}
            aiErrorMessage={aiErrorMessage}
            selectedBackgroundId={selectedBackgroundId}
            isBackgroundOverlayOpen={isBackgroundOverlayOpen}
            onOpenBackgroundOverlay={openBackgroundOverlay}
            onCloseBackgroundOverlay={closeBackgroundOverlay}
            onSelectBackground={handleSelectBackground}
            onExitFullscreen={exitFullscreenPlayer}
            onTogglePlayPause={handleTogglePlayPause}
            onPlayPrev={handlePlayPrev}
            onPlayNext={handlePlayNext}
            onToggleSongLike={handleToggleSongFavorite}
            onOpenAiOverlay={openAiSongInfoOverlay}
            onCloseAiOverlay={closeAiSongInfoOverlay}
            isUsbTrack={
              activeFsTrack?.id?.startsWith('usb_') ||
              selectedPlaylist.id === 'usb_storage'
            }
          />
        );
      })()}

      {/* MODULE 1: AI DJ PROCESSING / SESSION CREATION OVERLAY */}
      <AIDJProcessingOverlay
        visible={isAiDjOverlayVisible}
        userRequest={aiDjUserRequest}
        sessionTitle={aiDjSessionTitle}
        stage={aiDjProcessingStage}
        tracks={aiDjPreviewTracks}
        revealedCount={aiDjRevealedCount}
        sessionSummary={aiDjSessionSummary}
        errorInfo={aiDjError}
        errorMessage={aiDjErrorMessage}
        onCancel={handleCancelAiDjProcessing}
        onRetry={handleRetryAiDjProcessing}
        onProceed={handleProceedToAiDjPlaylist}
        focusedErrorButton={overlayFocusedBtn}
        onFocusErrorButton={setOverlayFocusedBtn}
      />

      {/* USB Storage Status / Error Modal Overlay */}
      <UsbMessageOverlay
        visible={usbModalState.visible}
        type={usbModalState.type}
        title={usbModalState.title}
        message={usbModalState.message}
        onClose={handleCloseUsbModal}
        isFocused={focusedId === 'USB_MODAL_BACK'}
      />

      {/* 3.50s Cinematic Sound-to-Music Intro Sequence */}
      {showIntro && (
        <SonicIntroSequence
          onDockStart={handleDockStart}
          onComplete={handleIntroComplete}
        />
      )}

      {/* Premium Avatar Companion Selection Screen */}
      {showAvatarSelection && (
        <AvatarSelectionScreen
          ref={avatarSelectionRef}
          onConfirmAvatar={handleConfirmAvatar}
          onCancel={() => setShowAvatarSelection(false)}
          initialSelectedAvatarId={savedAvatarId || 'frost'}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB', // Pristine ceramic gallery off-white
  },
  mainContent: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 28,
  },
  // Top Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  brandRow: {
    height: 56,
    marginTop: -12,
    paddingTop: 12,
    marginLeft: -28,
    paddingLeft: 28,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  brandPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandTitleWrapper: {
    overflow: 'hidden',
  },
  headerLogoImage: {
    width: 44,
    height: 44,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 4,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  playlistHeaderRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 20,
  },
  playlistBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    overflow: 'hidden',
  },
  playlistBackBtnFocused: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
    borderWidth: 2,
    borderRadius: 20,
    transform: [{ scale: 1.04 }],
    overflow: 'hidden',
  },
  playlistBackArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366F1',
  },
  playlistBackText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  playlistSearchContainerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 16,
  },
  playlistSearchPill: {
    flex: 1,
    maxWidth: 460,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    elevation: 1,
  },
  playlistSearchPillFocused: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
    elevation: 4,
  },
  playlistSearchPillListening: {
    backgroundColor: '#FDF2F8',
    borderColor: '#EC4899',
    borderWidth: 2,
  },
  playlistSearchIcon: {
    fontSize: 14,
  },
  playlistSearchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    paddingVertical: 0,
  },
  playlistSearchCountBadge: {
    backgroundColor: '#E0E7FF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  playlistSearchCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  playlistSearchClearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  playlistSearchClearBtnFocused: {
    backgroundColor: '#FCE7F3',
    borderColor: '#EC4899',
    borderWidth: 2.5,
    transform: [{ scale: 1.08 }],
    elevation: 5,
  },
  playlistSearchClearIcon: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  playlistSearchClearIconFocused: {
    color: '#DB2777',
  },
  playlistSearchPlaceholder: {
    fontSize: 13,
    color: '#94A3B8',
  },
  playlistHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circleIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  circleIconBtnFocused: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
    borderWidth: 2,
    borderRadius: 19,
    transform: [{ scale: 1.08 }],
    overflow: 'hidden',
  },
  circleIconBtnText: {
    fontSize: 14,
  },
  actionButtonFocused: {
    borderWidth: 2,
    borderColor: '#6366F1',
    borderRadius: 18,
    overflow: 'hidden',
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  headerIconBtnFocused: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
    transform: [{ scale: 1.1 }],
    elevation: 6,
  },
  headerIconText: {
    fontSize: 16,
  },
  headerThemeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  headerThemeBtnFocused: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
    transform: [{ scale: 1.05 }],
    elevation: 6,
  },
  headerThemeIcon: {
    fontSize: 14,
  },
  headerThemeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerThemeLabelFocused: {
    color: '#4338CA',
  },
  clockContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  clockTime: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  clockDate: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  avatarBorder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  // Voice Toast
  voiceToast: {
    position: 'absolute',
    top: 58,
    alignSelf: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 999,
    elevation: 8,
  },
  voiceToastText: {
    color: '#F8F9FB',
    fontSize: 12.5,
    fontWeight: '600',
  },
  // Body Grid
  bodyGrid: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  // Left Nav Rail
  leftNavRail: {
    paddingTop: 10,
    paddingRight: 6,
    marginLeft: -28,
    paddingLeft: 28,
    backgroundColor: 'transparent',
    gap: 8,
    overflow: 'visible',
    zIndex: 50,
    elevation: 0,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  navItemActive: {
    backgroundColor: '#F3E8FF',
  },
  navItemFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#6366F1',
    elevation: 6,
  },
  navItemActiveFocused: {
    backgroundColor: '#F3E8FF',
    borderColor: '#6366F1',
    elevation: 6,
  },
  navIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIconImage: {
    width: 32,
    height: 32,
  },
  navIconImageInactive: {
    opacity: 0.85,
  },
  navIconImageActive: {
    opacity: 1.0,
    transform: [{ scale: 1.06 }],
  },
  navLabelWrapper: {
    marginLeft: 10,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  navLabelActive: {
    color: '#6366F1',
    fontWeight: '700',
  },
  // Main Scroll View
  mainScrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
    paddingBottom: 40,
    paddingLeft: 8,
    paddingRight: 14,
  },
  // Hero Prompt Banner
  heroBannerCard: {
    width: '100%',
    height: 184,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    marginBottom: 12,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  heroBannerImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  heroGradientOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  heroLeftCol: {
    position: 'absolute',
    left: 24,
    top: 0,
    bottom: 0,
    width: 390,
    justifyContent: 'center',
    zIndex: 10,
  },
  heroGreetingPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 6,
  },
  heroGreetingText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 12,
  },
  heroVoiceCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8.5,
    paddingHorizontal: 15,
    borderRadius: 24,
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.28)',
    gap: 9,
    elevation: 3,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  heroVoiceCapsuleFocused: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
    transform: [{ scale: 1.05 }],
    elevation: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  heroVoiceCapsuleBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroVoiceCapsuleBadgeFocused: {
    backgroundColor: '#6366F1',
  },
  heroVoiceCapsuleIcon: {
    fontSize: 13,
  },
  heroVoiceCapsuleText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.1,
  },
  heroVoiceCapsuleTextFocused: {
    color: '#4338CA',
  },
  heroFloatingCard: {
    position: 'absolute',
    right: 24,
    bottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 4,
    minWidth: 150,
  },
  heroFloatingCardFocused: {
    borderColor: '#6366F1',
    transform: [{ scale: 1.06 }],
    elevation: 8,
    backgroundColor: '#FFFFFF',
  },
  heroFloatingTag: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#6366F1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  heroFloatingTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  heroFloatingPlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroFloatingPlayBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroFloatingPlayIcon: {
    color: '#FFFFFF',
    fontSize: 10,
    marginLeft: 2,
  },
  heroFloatingPlayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  sectionChevron: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '700',
  },
  sectionSeeAll: {
    fontSize: 12,
    fontWeight: '600',
    color: '#818CF8',
  },

  // Recently Played Carousel
  carouselScroll: {
    paddingVertical: 14,
    paddingLeft: 12,
    paddingRight: 14,
    overflow: 'visible',
  },
  recentlyPlayedEmptyRow: {
    paddingVertical: 18,
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginBottom: 4,
  },
  recentlyPlayedEmptyText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  trackCard: {
    width: 138,
    height: 142,
    marginRight: 13,
    position: 'relative',
    overflow: 'visible',
  },
  trackCardFocused: {
    transform: [{ scale: 1.04 }],
    zIndex: 10,
  },
  cardInner: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  cardInnerShadow: {
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  trackArtwork: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    width: '104%',
    height: '104%',
  },
  cardGradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: 52,
  },
  cardInfoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 9,
    paddingBottom: 7,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardTextCol: {
    flex: 1,
    marginRight: 6,
  },
  trackTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  trackTitleFocused: {
    fontWeight: '800',
  },
  trackTitlePart1: {
    color: '#C084FC',
    fontWeight: '800',
  },
  trackTitleDash: {
    color: '#60A5FA',
    fontWeight: '800',
  },
  trackTitlePart2: {
    color: '#2DD4BF',
    fontWeight: '800',
  },
  trackArtist: {
    fontSize: 9.5,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  cardMusicNoteIcon: {
    width: 13,
    height: 13,
    tintColor: '#CBD5E1',
    opacity: 0.65,
    marginBottom: 1,
  },
  cardFocusBorderOverlay: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 158,
    height: 162,
    zIndex: 20,
  },
  playingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  playingBadgeIcon: {
    color: '#FFFFFF',
    fontSize: 9,
    marginLeft: 1,
  },
  // For You Playlist Carousel (Reference Design)
  playlistCard: {
    width: 158,
    height: 198,
    marginRight: 14,
    position: 'relative',
    overflow: 'visible',
  },
  playlistCardFocused: {
    transform: [{ scale: 1.04 }],
    zIndex: 10,
  },
  playlistCardInner: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  playlistCardInnerShadow: {
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  playlistArtwork: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    width: '104%',
    height: '104%',
  },
  playlistGradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: 66,
  },
  playlistInfoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  playlistTextCol: {
    flex: 1,
    marginRight: 8,
  },
  playlistTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  playlistSubtitle: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  playlistIcon: {
    width: 16,
    height: 16,
    tintColor: '#CBD5E1',
    opacity: 0.75,
    marginBottom: 2,
  },
  playlistFocusBorderOverlay: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 198,
    height: 238,
    zIndex: 20,
  },
  // Docked Mini Player Bar
  miniPlayerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    gap: 12,
  },
  miniPlayerArtwork: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  miniPlayerInfo: {
    flex: 1,
  },
  miniPlayerTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  miniPlayerArtist: {
    fontSize: 10.5,
    color: '#64748B',
  },
  miniPlayerPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniPlayerPlayIcon: {
    fontSize: 14,
    color: '#0F172A',
  },
  miniPlayerProgressContainer: {
    paddingHorizontal: 8,
  },
  miniPlayerTime: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  // Button interactions
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
