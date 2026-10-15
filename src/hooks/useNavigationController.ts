import { useState, useRef, useCallback, useEffect } from 'react';
import { PlaylistData, PlaylistTrack, PLAYLISTS } from '../data/playlistData';
import { MusicTrack } from '../services/musicCatalog';
import { RecentlyPlayedTrackItem } from '../constants/recentlyPlayed';
import { TimeContext } from '../constants/timeThemes';
import { DPadDirection } from '../navigation/playlistNavGraph';
import { LIBRARY_CARD_IDS } from '../navigation/libraryNavGraph';
import { AI_DJ_FOCUS_IDS } from '../navigation/aiDjNavGraph';
import { SEARCH_FOCUS_IDS } from '../navigation/searchNavGraph';
import { FAVORITES_FOCUS_IDS } from '../navigation/favoritesNavGraph';
import { SETTINGS_FOCUS_IDS } from '../navigation/settingsNavGraph';
import { NAV_ITEMS } from '../constants/navItems';
import { FOR_YOU_MIXES } from '../constants/forYouMixes';
import { buildFisherYatesQueue } from '../utils/shuffleUtils';

export interface UseNavigationControllerParams {
  isShuffleActiveRef: React.MutableRefObject<boolean>;
  currentTrackRef: React.MutableRefObject<MusicTrack>;
  shuffledTrackIdsRef: React.MutableRefObject<string[]>;
  setShuffledTrackIds: React.Dispatch<React.SetStateAction<string[]>>;
  recentlyPlayedTracksRef: React.MutableRefObject<RecentlyPlayedTrackItem[]>;
  likedSongsPlaylistRef: React.MutableRefObject<PlaylistData>;
  likedPlaylistsRef: React.MutableRefObject<PlaylistData[]>;
  handleClearPlaylistSearch: (silent?: boolean) => void;
  handleLaunchContextualAIDJ: (context: TimeContext) => Promise<void>;
  selectedTimeOfDayRef: React.MutableRefObject<TimeContext>;
  handleToggleVoice: () => Promise<void>;
  handlePlayTrack: (track: MusicTrack | RecentlyPlayedTrackItem) => void;
  handleReplayIntro: () => void;
  handleCycleTheme: () => void;
  handleSelectUsbCard: () => Promise<void>;
  handleCloseUsbModal: () => void;
  setShowAvatarSelection: (show: boolean) => void;
}

export function useNavigationController({
  isShuffleActiveRef,
  currentTrackRef,
  shuffledTrackIdsRef,
  setShuffledTrackIds,
  recentlyPlayedTracksRef,
  likedSongsPlaylistRef,
  likedPlaylistsRef,
  handleClearPlaylistSearch,
  handleLaunchContextualAIDJ,
  selectedTimeOfDayRef,
  handleToggleVoice,
  handlePlayTrack,
  handleReplayIntro,
  handleCycleTheme,
  handleSelectUsbCard,
  handleCloseUsbModal,
  setShowAvatarSelection,
}: UseNavigationControllerParams) {
  const [activeNavTab, setActiveNavTab] = useState<string>('home');
  const activeNavTabRef = useRef<string>('home');
  activeNavTabRef.current = activeNavTab;

  const [focusedId, setFocusedIdState] = useState<string>('HERO_VOICE');
  const focusedIdRef = useRef<string>('HERO_VOICE');
  focusedIdRef.current = focusedId;
  const previousFocusedIdRef = useRef<string>('HERO_VOICE');

  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistData | null>(null);
  const selectedPlaylistRef = useRef<PlaylistData | null>(null);
  selectedPlaylistRef.current = selectedPlaylist;

  const [playlistOrigin, setPlaylistOrigin] = useState<'library' | 'home' | 'ai_dj' | 'favorites'>('library');
  const playlistOriginRef = useRef<'library' | 'home' | 'ai_dj' | 'favorites'>('library');
  playlistOriginRef.current = playlistOrigin;

  const [searchSubScreen, setSearchSubScreen] = useState<'landing' | 'results'>('landing');
  const searchSubScreenRef = useRef<'landing' | 'results'>('landing');
  searchSubScreenRef.current = searchSubScreen;

  const homeScrollViewRef = useRef<any>(null);
  const recentlyPlayedScrollRef = useRef<any>(null);
  const forYouScrollRef = useRef<any>(null);

  const recentlyPlayedStartIndexRef = useRef<number>(0);
  const forYouStartIndexRef = useRef<number>(0);
  const homeScrollYRef = useRef<number>(0);

  const lastFocusedTopNavRef = useRef<string>('HDR_THEME');
  const lastFocusedHeroRef = useRef<string>('HERO_VOICE');
  const lastFocusedRecentlyPlayedRef = useRef<string>('REC_0');
  const lastFocusedForYouRef = useRef<string>('MIX_0');
  const lastContentFocusIdRef = useRef<string>('MIX_0');
  const playerOriginTrackIdRef = useRef<string>('TRK_1');
  const lastFocusedTrackIdRef = useRef<string | null>(null);

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
    setFocusedIdState(nextId);
  }, []);

  // Smoothly scroll Home ScrollView when focusedId moves between vertical sections
  useEffect(() => {
    if (selectedPlaylist !== null || activeNavTab !== 'home') return;
    if (!homeScrollViewRef.current) return;
    let targetY = homeScrollYRef.current;
    if (focusedId.startsWith('MIX_')) {
      const hasRecents = (recentlyPlayedTracksRef.current?.length || 0) > 0;
      targetY = hasRecents ? 414 : 260;
    } else if (focusedId.startsWith('REC_')) {
      targetY = 160;
    } else if (
      focusedId.startsWith('HERO_') ||
      focusedId.startsWith('HDR_') ||
      focusedId.startsWith('NAV_')
    ) {
      targetY = 0;
    }
    if (homeScrollYRef.current !== targetY) {
      homeScrollYRef.current = targetY;
      homeScrollViewRef.current.scrollTo({ y: targetY, animated: true });
    }
  }, [focusedId, selectedPlaylist, activeNavTab, recentlyPlayedTracksRef]);

  // Smoothly scroll horizontal carousels only when moving past visible window edges
  useEffect(() => {
    if (selectedPlaylist !== null || activeNavTab !== 'home') return;

    if (focusedId.startsWith('REC_')) {
      const idx = parseInt(focusedId.replace('REC_', ''), 10);
      if (!isNaN(idx) && recentlyPlayedScrollRef.current) {
        const VISIBLE_CARD_COUNT = 5;
        const tracks = recentlyPlayedTracksRef.current || [];
        const maxStartIdx = Math.max(0, tracks.length - VISIBLE_CARD_COUNT);
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
  }, [focusedId, selectedPlaylist, activeNavTab, recentlyPlayedTracksRef]);

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
        if (curId && playlist.tracks.some((t) => t.id === curId)) {
          const newQueue = buildFisherYatesQueue(playlist.tracks, curId);
          shuffledTrackIdsRef.current = newQueue;
          setShuffledTrackIds(newQueue);
        }
      }
      setFocusedId('PL_PLAY_ALL');
    },
    [buildFisherYatesQueue, handleClearPlaylistSearch, isShuffleActiveRef, currentTrackRef, shuffledTrackIdsRef, setShuffledTrackIds]
  );

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
  }, [handleClearPlaylistSearch]);

  const handleBackFromPlaylist = useCallback(() => {
    handleClearPlaylistSearch(true);
    const origin = playlistOriginRef.current;
    const currentId = selectedPlaylistRef.current?.id;
    selectedPlaylistRef.current = null;
    setSelectedPlaylist(null);

    if (origin === 'ai_dj') {
      console.log('[Module 2] Back from AI DJ Playlist -> Returning to AI DJ Landing Page');
      activeNavTabRef.current = 'ai_dj';
      setActiveNavTab('ai_dj');
      setFocusedId(AI_DJ_FOCUS_IDS.MIC);
      return;
    }

    if (origin === 'favorites') {
      console.log('[Favorites] Back from Playlist -> Returning to Favorites Screen');
      activeNavTabRef.current = 'favorites';
      setActiveNavTab('favorites');
      setFocusedId(FAVORITES_FOCUS_IDS.LIKED_SONGS);
      return;
    }

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
  }, [handleClearPlaylistSearch]);

  const getHomeNextFocus = useCallback((currentId: string, direction: DPadDirection): string | null => {
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
  }, [recentlyPlayedTracksRef]);

  const getContentExitTarget = useCallback((): string => {
    const lastTarget = lastContentFocusIdRef.current;
    const tab = activeNavTabRef.current;

    if (tab === 'home') {
      if (
        lastTarget &&
        (lastTarget.startsWith('MIX_') ||
          lastTarget.startsWith('REC_') ||
          lastTarget.startsWith('HERO_'))
      ) {
        return lastTarget;
      }
      return lastFocusedForYouRef.current || 'MIX_0';
    }

    if (tab === 'library') {
      if (
        lastTarget &&
        (lastTarget.startsWith('LIB_CARD_') || lastTarget === 'LIB_BACK')
      ) {
        return lastTarget;
      }
      return LIBRARY_CARD_IDS.USB;
    }

    if (tab === 'favorites') {
      if (
        lastTarget &&
        (lastTarget.startsWith(FAVORITES_FOCUS_IDS.PLAYLIST_PREFIX) ||
          lastTarget === FAVORITES_FOCUS_IDS.LIKED_SONGS)
      ) {
        return lastTarget;
      }
      return FAVORITES_FOCUS_IDS.LIKED_SONGS;
    }

    if (tab === 'settings') {
      if (
        lastTarget &&
        (lastTarget === SETTINGS_FOCUS_IDS.CHANGE_AVATAR ||
          lastTarget === SETTINGS_FOCUS_IDS.QR_CARD)
      ) {
        return lastTarget;
      }
      return SETTINGS_FOCUS_IDS.CHANGE_AVATAR;
    }

    if (tab === 'ai_dj') {
      if (
        lastTarget &&
        (lastTarget.startsWith('AI_DJ_CARD_') ||
          lastTarget === AI_DJ_FOCUS_IDS.MIC ||
          lastTarget === AI_DJ_FOCUS_IDS.VIEW_ALL)
      ) {
        return lastTarget;
      }
      return AI_DJ_FOCUS_IDS.MIC;
    }

    if (tab === 'search') {
      if (
        lastTarget &&
        (lastTarget.startsWith('KEY_') || lastTarget.startsWith('SRC_'))
      ) {
        return lastTarget;
      }
      return SEARCH_FOCUS_IDS.KEY_SPACE;
    }

    return lastTarget || 'MIX_0';
  }, []);

  const getSidebarNavForCurrentTab = useCallback((): string => {
    switch (activeNavTabRef.current) {
      case 'search':
        return 'NAV_SEARCH';
      case 'ai_dj':
        return 'NAV_DJ';
      case 'library':
        return 'NAV_LIBRARY';
      case 'favorites':
        return 'NAV_FAV';
      case 'settings':
        return 'NAV_SETTINGS';
      case 'home':
      default:
        return 'NAV_HOME';
    }
  }, []);

  const handleDpadPressRef = useRef<((id: string) => void) | null>(null);

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
      selectedTimeOfDayRef,
      handleToggleVoice,
      handlePlayTrack,
      handleReplayIntro,
      handleCycleTheme,
      handleBackToHome,
      handleSelectPlaylist,
      setShowAvatarSelection,
      handleSelectUsbCard,
      handleCloseUsbModal,
      likedSongsPlaylistRef,
      likedPlaylistsRef,
      recentlyPlayedTracksRef,
    ]
  );
  handleDpadPressRef.current = handleDpadPress;

  return {
    activeNavTab,
    setActiveNavTab,
    activeNavTabRef,
    focusedId,
    setFocusedId,
    focusedIdRef,
    selectedPlaylist,
    setSelectedPlaylist,
    selectedPlaylistRef,
    playlistOrigin,
    setPlaylistOrigin,
    playlistOriginRef,
    searchSubScreen,
    setSearchSubScreen,
    searchSubScreenRef,
    homeScrollViewRef,
    recentlyPlayedScrollRef,
    forYouScrollRef,
    recentlyPlayedStartIndexRef,
    forYouStartIndexRef,
    homeScrollYRef,
    lastFocusedTopNavRef,
    lastFocusedHeroRef,
    lastFocusedRecentlyPlayedRef,
    lastFocusedForYouRef,
    lastContentFocusIdRef,
    playerOriginTrackIdRef,
    lastFocusedTrackIdRef,
    handleSelectPlaylist,
    handleBackToHome,
    handleBackFromPlaylist,
    getHomeNextFocus,
    getContentExitTarget,
    getSidebarNavForCurrentTab,
    handleDpadPress,
    handleDpadPressRef,
  };
}
