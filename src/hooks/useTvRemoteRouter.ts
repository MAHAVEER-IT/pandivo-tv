import { useEffect, useRef } from 'react';
// @ts-ignore
import TVEventHandler from 'react-native/Libraries/Components/TV/TVEventHandler';
import { PlaylistData, PlaylistTrack, PLAYLISTS } from '../data/playlistData';
import { MusicTrack, TRACK_CATALOG } from '../services/musicCatalog';
import { AvatarSelectionScreenRef } from '../components/AvatarSelectionScreen';
import { SearchScreenRef } from '../components/SearchScreen';
import { AIDJProcessingStage } from '../components/ai-dj';
import { DPadDirection, getPlaylistNextFocus } from '../navigation/playlistNavGraph';
import { getAiDjNextFocus, AI_DJ_FOCUS_IDS } from '../navigation/aiDjNavGraph';
import { getLibraryNextFocus, LIBRARY_CARD_IDS } from '../navigation/libraryNavGraph';
import { getFavoritesNextFocus, FAVORITES_FOCUS_IDS } from '../navigation/favoritesNavGraph';
import { getSettingsNextFocus, SETTINGS_FOCUS_IDS } from '../navigation/settingsNavGraph';
import { SEARCH_FOCUS_IDS } from '../navigation/searchNavGraph';
import { MINI_PLAYER_FOCUS_IDS } from '../components/GlobalMiniPlayer';
import { FOR_YOU_MIXES } from '../constants/forYouMixes';
import { TimeContext } from '../constants/timeThemes';

export interface TvRouterHandlers {
  handleProceedToAiDjPlaylist: React.MutableRefObject<(() => void) | null>;
  handleCancelAiDjProcessing: () => void;
  setOverlayFocusedBtn: (btn: 'retry' | 'back') => void;
  handleRetryAiDjProcessing: () => void;
  handleTogglePlayPause: () => void;
  handleFullscreenRemoteEvent: (key: string) => void;
  handleReplayIntro: () => void;
  handleBackFromPlaylist: () => void;
  handleBackToHome: () => void;
  handleToggleShuffle: () => void;
  handleTogglePlaylistLike: (id?: string) => void;
  handleToggleSongFavorite: (id?: string) => void;
  handlePlayPrev: () => void;
  handlePlayNext: () => void;
  handleToggleFullscreen: () => void;
  handlePlayPlaylistTrack: (track: PlaylistTrack, preserveExistingShuffleQueue?: boolean) => void;
  handlePlayPlaylistFromLibrary: (playlist: PlaylistData) => void;
  handleToggleVoice: () => Promise<void>;
  handleCancelVoiceListening: () => void;
  handleLaunchContextualAIDJ: (context: TimeContext) => void;
  handleRunDiagnosticTest: () => Promise<void>;
  handleVoiceCommand: (text: string) => void;
  handleSelectPlaylist: (playlist: PlaylistData, origin?: 'library' | 'home' | 'ai_dj' | 'favorites') => void;
  handleSeekDelta: (delta: number) => void;
  setFocusedId: (updater: string | ((prev: string) => string)) => void;
  getHomeNextFocus: (currentId: string, direction: DPadDirection) => string | null;
  handleOpenFullscreenFromMiniPlayer: () => void;
  getContentExitTarget: () => string;
  getSidebarNavForCurrentTab: () => string;
}

export interface TvRouterRefs {
  showAvatarSelectionRef: React.MutableRefObject<boolean>;
  avatarSelectionRef: React.RefObject<AvatarSelectionScreenRef | null>;
  isAiDjOverlayVisibleRef: React.MutableRefObject<boolean>;
  aiDjProcessingStageRef: React.MutableRefObject<AIDJProcessingStage>;
  overlayFocusedBtnRef: React.MutableRefObject<'retry' | 'back'>;
  usbModalStateRef: React.MutableRefObject<any>;
  geminiDiagnosticRef: React.MutableRefObject<any>;
  isFullscreenPlayerRef: React.MutableRefObject<boolean>;
  fullscreenFocusIdRef: React.MutableRefObject<string>;
  focusedIdRef: React.MutableRefObject<string>;
  activeNavTabRef: React.MutableRefObject<string>;
  selectedPlaylistRef: React.MutableRefObject<PlaylistData | null>;
  playerStatusRef: React.MutableRefObject<any>;
  currentTrackRef: React.MutableRefObject<MusicTrack>;
  playerOriginTrackIdRef: React.MutableRefObject<string>;
  lastFocusedTrackIdRef: React.MutableRefObject<string | null>;
  lastContentFocusIdRef: React.MutableRefObject<string>;
  playlistOriginRef: React.MutableRefObject<'library' | 'home' | 'ai_dj' | 'favorites'>;
  userAiPlaylistsRef: React.MutableRefObject<PlaylistData[]>;
  likedPlaylistsRef: React.MutableRefObject<PlaylistData[]>;
  likedSongsPlaylistRef: React.MutableRefObject<PlaylistData>;
  isMiniPlayerVisibleRef: React.MutableRefObject<boolean>;
  searchSubScreenRef: React.MutableRefObject<'landing' | 'results'>;
  searchScreenRef: React.RefObject<SearchScreenRef | null>;
  isListeningRef: React.MutableRefObject<boolean>;
  selectedTimeOfDayRef: React.MutableRefObject<TimeContext>;
  handleCloseUsbModal: () => void;
  setGeminiDiagnostic: (diag: any) => void;
  setShowAvatarSelection: (show: boolean) => void;
  setActiveNavTab: (tab: string) => void;
  setSelectedPlaylist: (pl: PlaylistData | null) => void;
  handleSelectUsbCard: () => void;
  handleDpadPressRef: React.MutableRefObject<((id: string) => void) | null>;
  player: any;
}

export function useTvRemoteRouter(handlers: TvRouterHandlers, refs: TvRouterRefs) {
  const tvHandlersRef = useRef(handlers);
  tvHandlersRef.current = handlers;

  const lastBackTimeRef = useRef<number>(0);

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
      if (refs.showAvatarSelectionRef.current) {
        refs.avatarSelectionRef.current?.handleRemoteEvent(key);
        return;
      }

      // MODULE 1 & 2 AI DJ PROCESSING OVERLAY D-PAD BEHAVIOR
      if (refs.isAiDjOverlayVisibleRef.current) {
        console.log('[Module 1/2] TVEventHandler: overlay is visible, key:', key, 'stage:', refs.aiDjProcessingStageRef.current);
        if (refs.aiDjProcessingStageRef.current === 'READY') {
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
        if (refs.aiDjProcessingStageRef.current === 'ERROR') {
          if (key === 'left' || key === 'up') {
            h.setOverlayFocusedBtn('retry');
            return;
          }
          if (key === 'right' || key === 'down') {
            h.setOverlayFocusedBtn('back');
            return;
          }
          if (key === 'select' || key === 'dpad_center' || key === 'enter') {
            if (refs.overlayFocusedBtnRef.current === 'retry') {
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
        const curFocus = refs.focusedIdRef.current;
        if (curFocus && curFocus.startsWith('LIB_CARD_')) {
          let plKey: keyof typeof PLAYLISTS | null = null;
          if (curFocus === LIBRARY_CARD_IDS.CHILL) plKey = 'chill_vibes';
          else if (curFocus === LIBRARY_CARD_IDS.FOCUS) plKey = 'focus_mix';
          else if (curFocus === LIBRARY_CARD_IDS.WORKOUT) plKey = 'workout_mix';
          else if (curFocus === LIBRARY_CARD_IDS.STUDY) plKey = 'study_mix';
          else if (curFocus === LIBRARY_CARD_IDS.ENERGIZE) plKey = 'energize_morning';
          else if (curFocus === LIBRARY_CARD_IDS.MIDNIGHT) plKey = 'midnight_dreams';
          if (plKey && PLAYLISTS[plKey]) {
            h.handlePlayPlaylistFromLibrary(PLAYLISTS[plKey]);
            return;
          }
        }
        if (refs.selectedPlaylistRef.current !== null && curFocus === 'PL_PLAY_ALL') {
          const pl = refs.selectedPlaylistRef.current;
          const curTrk = refs.currentTrackRef.current;
          const isThisPlPlaying =
            refs.playerStatusRef.current?.playing &&
            pl &&
            pl.tracks.some((t) => t.id === curTrk?.id);
          if (isThisPlPlaying) {
            refs.player?.pause();
          } else if (
            !refs.playerStatusRef.current?.playing &&
            pl &&
            curTrk &&
            pl.tracks.some((t) => t.id === curTrk.id)
          ) {
            refs.player?.play();
          } else if (pl && pl.tracks && pl.tracks.length > 0) {
            h.handlePlayPlaylistTrack(pl.tracks[0]);
          }
          return;
        }
        h.handleTogglePlayPause();
        return;
      }

      // ISOLATED FULL SCREEN NAVIGATION CONTEXT
      if (refs.isFullscreenPlayerRef.current) {
        console.log('[TVEvent:FullScreen]', key, 'fsFocus:', refs.fullscreenFocusIdRef.current);
        h.handleFullscreenRemoteEvent(key);
        return;
      }

      const currentFocus = refs.focusedIdRef.current;
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
        console.log('[TVEventHandler:Back]', 'tab:', refs.activeNavTabRef.current, 'pl:', !!refs.selectedPlaylistRef.current);

        if (currentFocus.startsWith('MINI_')) {
          const exitTarget = h.getContentExitTarget();
          h.setFocusedId(exitTarget);
          return;
        }

        if (refs.usbModalStateRef.current.visible) {
          refs.handleCloseUsbModal();
          return;
        }
        if (refs.geminiDiagnosticRef.current !== null) {
          refs.setGeminiDiagnostic(null);
          return;
        }
        if (refs.selectedPlaylistRef.current !== null) {
          h.handleBackFromPlaylist();
          return;
        }
        if (refs.activeNavTabRef.current === 'search') {
          const consumed = refs.searchScreenRef.current?.handleBack();
          if (!consumed) {
            h.handleBackToHome();
          }
          return;
        }
        if (refs.activeNavTabRef.current === 'library' || refs.activeNavTabRef.current === 'ai_dj') {
          h.handleBackToHome();
          return;
        }
        if (refs.activeNavTabRef.current === 'home') {
          if (!currentFocus.startsWith('NAV_')) {
            h.setFocusedId('NAV_HOME');
            return;
          }
        }
        return;
      }

      // Select / Enter Key Handling
      if (key === 'select' || key === 'enter') {
        if (refs.usbModalStateRef.current.visible) {
          refs.handleCloseUsbModal();
          return;
        }

        // 0. Mini-Player Select Actions
        if (currentFocus === MINI_PLAYER_FOCUS_IDS.PREV) {
          h.handlePlayPrev();
          return;
        }
        if (currentFocus === MINI_PLAYER_FOCUS_IDS.PLAY_PAUSE) {
          h.handleTogglePlayPause();
          return;
        }
        if (currentFocus === MINI_PLAYER_FOCUS_IDS.NEXT) {
          h.handlePlayNext();
          return;
        }
        if (currentFocus === MINI_PLAYER_FOCUS_IDS.FULLSCREEN) {
          h.handleOpenFullscreenFromMiniPlayer();
          return;
        }
        // 1. Playlist Detail Screen Select Actions
        if (refs.selectedPlaylistRef.current !== null) {
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
            refs.handleDpadPressRef.current?.(currentFocus);
            return;
          }
          if (currentFocus === 'PL_PLAY_ALL') {
            const pl = refs.selectedPlaylistRef.current;
            const curTrk = refs.currentTrackRef.current;
            const isThisPlPlaying =
              refs.playerStatusRef.current?.playing &&
              pl &&
              pl.tracks.some((t) => t.id === curTrk?.id);
            if (isThisPlPlaying) {
              refs.player?.pause();
            } else if (
              !refs.playerStatusRef.current?.playing &&
              pl &&
              curTrk &&
              pl.tracks.some((t) => t.id === curTrk.id)
            ) {
              refs.player?.play();
            } else if (pl && pl.tracks && pl.tracks.length > 0) {
              h.handlePlayPlaylistTrack(pl.tracks[0]);
            }
            return;
          }
          if (currentFocus === 'PL_PLAYER_PLAY' || currentFocus === 'PL_PLAYER_SCRUB') {
            h.handleTogglePlayPause();
            return;
          }
          if (currentFocus === 'PL_SHUFFLE') {
            h.handleToggleShuffle();
            return;
          }
          if (currentFocus === 'PL_FAV') {
            if (refs.selectedPlaylistRef.current?.id === 'usb_storage') return;
            h.handleTogglePlaylistLike(refs.selectedPlaylistRef.current?.id);
            return;
          }
          if (currentFocus === 'PL_PLAYER_HEART') {
            if (refs.selectedPlaylistRef.current?.id === 'usb_storage') return;
            h.handleToggleSongFavorite(refs.currentTrackRef.current?.id);
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
            const matchedTrack = refs.selectedPlaylistRef.current.tracks.find((t) => `TRK_${t.id}` === currentFocus);
            if (matchedTrack) {
              h.handlePlayPlaylistTrack(matchedTrack);
            }
            return;
          }
          return;
        }

        // 2. AI DJ Landing Screen Select Actions
        if (refs.selectedPlaylistRef.current === null && refs.activeNavTabRef.current === 'ai_dj') {
          if (currentFocus === AI_DJ_FOCUS_IDS.CANCEL_MIC) {
            h.handleCancelVoiceListening();
            return;
          }
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
            const targetPlaylist = refs.userAiPlaylistsRef.current[idx];
            if (targetPlaylist) {
              h.handleSelectPlaylist(targetPlaylist, 'ai_dj');
            }
            return;
          }
          if (currentFocus === AI_DJ_FOCUS_IDS.VIEW_ALL) {
            refs.activeNavTabRef.current = 'library';
            refs.setActiveNavTab('library');
            h.setFocusedId(LIBRARY_CARD_IDS.CHILL);
            return;
          }
          if (currentFocus.startsWith('NAV_')) {
            refs.handleDpadPressRef.current?.(currentFocus);
            return;
          }
          return;
        }

        // 3. Library Screen Select Actions
        if (refs.selectedPlaylistRef.current === null && refs.activeNavTabRef.current === 'library') {
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
            refs.handleSelectUsbCard();
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
            refs.handleDpadPressRef.current?.(currentFocus);
            return;
          }
          return;
        }

        // 4. Favorites Screen Select Actions
        if (refs.selectedPlaylistRef.current === null && refs.activeNavTabRef.current === 'favorites') {
          if (currentFocus === FAVORITES_FOCUS_IDS.LIKED_SONGS) {
            h.handleSelectPlaylist(refs.likedSongsPlaylistRef.current, 'favorites');
            return;
          }
          if (currentFocus.startsWith(FAVORITES_FOCUS_IDS.PLAYLIST_PREFIX)) {
            const idx = parseInt(
              currentFocus.replace(FAVORITES_FOCUS_IDS.PLAYLIST_PREFIX, ''),
              10
            );
            const targetPl = refs.likedPlaylistsRef.current[idx];
            if (targetPl) {
              h.handleSelectPlaylist(targetPl, 'favorites');
            }
            return;
          }
          if (currentFocus.startsWith('NAV_')) {
            refs.handleDpadPressRef.current?.(currentFocus);
            return;
          }
          return;
        }

        // 5. Search Screen Select Actions
        if (refs.selectedPlaylistRef.current === null && refs.activeNavTabRef.current === 'search') {
          if (currentFocus === 'NAV_SEARCH') {
            h.setFocusedId(SEARCH_FOCUS_IDS.KEY_A);
            return;
          }
          if (currentFocus.startsWith('NAV_')) {
            refs.handleDpadPressRef.current?.(currentFocus);
            return;
          }
          refs.searchScreenRef.current?.handleSelect(currentFocus);
          return;
        }

        // 6. Settings Screen Select Actions
        if (refs.selectedPlaylistRef.current === null && refs.activeNavTabRef.current === 'settings') {
          if (currentFocus === SETTINGS_FOCUS_IDS.CHANGE_AVATAR) {
            refs.setShowAvatarSelection(true);
            return;
          }
          if (currentFocus.startsWith('NAV_')) {
            refs.handleDpadPressRef.current?.(currentFocus);
            return;
          }
          return;
        }

        // 7. Home Screen Select Actions
        if (currentFocus === 'HERO_VOICE') {
          h.handleLaunchContextualAIDJ(refs.selectedTimeOfDayRef.current);
          return;
        }
        if (currentFocus === 'NAV_DJ') {
          refs.selectedPlaylistRef.current = null;
          refs.setSelectedPlaylist(null);
          refs.activeNavTabRef.current = 'ai_dj';
          refs.setActiveNavTab('ai_dj');
          h.setFocusedId(AI_DJ_FOCUS_IDS.MIC);
          return;
        }
        if (currentFocus === 'NAV_LIBRARY') {
          refs.selectedPlaylistRef.current = null;
          refs.setSelectedPlaylist(null);
          refs.activeNavTabRef.current = 'library';
          refs.setActiveNavTab('library');
          h.setFocusedId(LIBRARY_CARD_IDS.CHILL);
          return;
        }
        if (currentFocus === 'NAV_FAV') {
          refs.selectedPlaylistRef.current = null;
          refs.setSelectedPlaylist(null);
          refs.activeNavTabRef.current = 'favorites';
          refs.setActiveNavTab('favorites');
          h.setFocusedId(FAVORITES_FOCUS_IDS.LIKED_SONGS);
          return;
        }
        if (currentFocus === 'NAV_SETTINGS') {
          refs.selectedPlaylistRef.current = null;
          refs.setSelectedPlaylist(null);
          refs.activeNavTabRef.current = 'settings';
          refs.setActiveNavTab('settings');
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
        refs.handleDpadPressRef.current?.(currentFocus);
        return;
      }

      // D-Pad Direction Keys (left, right, up, down)
      if (key === 'left' || key === 'right' || key === 'up' || key === 'down') {
        // 0. Mini-Player Focused Navigation
        if (currentFocus.startsWith('MINI_')) {
          if (key === 'up') {
            const exitTarget = h.getContentExitTarget();
            h.setFocusedId(exitTarget);
            return;
          }
          if (key === 'down') {
            return;
          }
          if (key === 'left') {
            if (currentFocus === MINI_PLAYER_FOCUS_IDS.PREV) {
              h.setFocusedId(h.getSidebarNavForCurrentTab());
              return;
            }
            if (currentFocus === MINI_PLAYER_FOCUS_IDS.PLAY_PAUSE) {
              h.setFocusedId(MINI_PLAYER_FOCUS_IDS.PREV);
              return;
            }
            if (currentFocus === MINI_PLAYER_FOCUS_IDS.NEXT) {
              h.setFocusedId(MINI_PLAYER_FOCUS_IDS.PLAY_PAUSE);
              return;
            }
            if (currentFocus === MINI_PLAYER_FOCUS_IDS.FULLSCREEN) {
              h.setFocusedId(MINI_PLAYER_FOCUS_IDS.NEXT);
              return;
            }
          }
          if (key === 'right') {
            if (currentFocus === MINI_PLAYER_FOCUS_IDS.PREV) {
              h.setFocusedId(MINI_PLAYER_FOCUS_IDS.PLAY_PAUSE);
              return;
            }
            if (currentFocus === MINI_PLAYER_FOCUS_IDS.PLAY_PAUSE) {
              h.setFocusedId(MINI_PLAYER_FOCUS_IDS.NEXT);
              return;
            }
            if (currentFocus === MINI_PLAYER_FOCUS_IDS.NEXT) {
              h.setFocusedId(MINI_PLAYER_FOCUS_IDS.FULLSCREEN);
              return;
            }
            if (currentFocus === MINI_PLAYER_FOCUS_IDS.FULLSCREEN) {
              return;
            }
          }
          return;
        }

        // 1. Playlist Detail Screen Navigation
        if (refs.selectedPlaylistRef.current !== null) {
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
            return;
          }

          if (key === 'right' && currentFocus.startsWith('TRK_')) {
            refs.playerOriginTrackIdRef.current = currentFocus;
            h.setFocusedId('PL_PLAYER_PLAY');
            return;
          }

          if (key === 'right' && currentFocus === 'PL_FAV') {
            const tracks = refs.selectedPlaylistRef.current.tracks;
            const firstTrackId = tracks[0] ? `TRK_${tracks[0].id}` : 'TRK_1';
            const validFocusedTrack =
              refs.lastFocusedTrackIdRef.current &&
              tracks.some((t) => `TRK_${t.id}` === refs.lastFocusedTrackIdRef.current)
                ? refs.lastFocusedTrackIdRef.current
                : firstTrackId;
            refs.playerOriginTrackIdRef.current = validFocusedTrack;
            h.setFocusedId('PL_PLAYER_PLAY');
            return;
          }

          if (key === 'right' && currentFocus === 'PL_SHUFFLE' && refs.selectedPlaylistRef.current?.id === 'usb_storage') {
            const tracks = refs.selectedPlaylistRef.current.tracks;
            const firstTrackId = tracks[0] ? `TRK_${tracks[0].id}` : 'TRK_1';
            const validFocusedTrack =
              refs.lastFocusedTrackIdRef.current &&
              tracks.some((t) => `TRK_${t.id}` === refs.lastFocusedTrackIdRef.current)
                ? refs.lastFocusedTrackIdRef.current
                : firstTrackId;
            refs.playerOriginTrackIdRef.current = validFocusedTrack;
            h.setFocusedId('PL_PLAYER_PLAY');
            return;
          }

          const isUsbPlaylist = refs.selectedPlaylistRef.current?.id === 'usb_storage';
          const nextTarget = getPlaylistNextFocus(
            currentFocus,
            key as DPadDirection,
            refs.selectedPlaylistRef.current.tracks,
            refs.playerOriginTrackIdRef.current,
            isUsbPlaylist
          );
          if (nextTarget !== null) {
            h.setFocusedId(nextTarget);
            if (nextTarget === 'NAV_LIBRARY') {
              if (refs.playlistOriginRef.current === 'ai_dj') {
                refs.activeNavTabRef.current = 'ai_dj';
                refs.setActiveNavTab('ai_dj');
                h.setFocusedId('NAV_DJ');
              } else {
                refs.activeNavTabRef.current = 'library';
                refs.setActiveNavTab('library');
              }
            }
          }
          return;
        }

        // 2. AI DJ Landing Screen Navigation
        if (refs.selectedPlaylistRef.current === null && refs.activeNavTabRef.current === 'ai_dj') {
          const nextTarget = getAiDjNextFocus(
            currentFocus,
            key as DPadDirection,
            refs.userAiPlaylistsRef.current.length,
            refs.isListeningRef.current
          );
          if (nextTarget !== null) {
            h.setFocusedId(nextTarget);
          } else if (key === 'down' && refs.isMiniPlayerVisibleRef.current && !currentFocus.startsWith('NAV_')) {
            refs.lastContentFocusIdRef.current = currentFocus;
            h.setFocusedId(MINI_PLAYER_FOCUS_IDS.PLAY_PAUSE);
          }
          return;
        }

        // 3. Library Screen Navigation
        if (refs.selectedPlaylistRef.current === null && refs.activeNavTabRef.current === 'library') {
          const nextTarget = getLibraryNextFocus(currentFocus, key as DPadDirection);
          if (nextTarget !== null) {
            h.setFocusedId(nextTarget);
          } else if (key === 'down' && refs.isMiniPlayerVisibleRef.current && !currentFocus.startsWith('NAV_')) {
            refs.lastContentFocusIdRef.current = currentFocus;
            h.setFocusedId(MINI_PLAYER_FOCUS_IDS.PLAY_PAUSE);
          }
          return;
        }

        // 4. Search Screen Navigation
        if (refs.selectedPlaylistRef.current === null && refs.activeNavTabRef.current === 'search') {
          if (currentFocus.startsWith('NAV_')) {
            const nextTarget = h.getHomeNextFocus(currentFocus, key as DPadDirection);
            if (nextTarget !== null) {
              h.setFocusedId(nextTarget);
            }
            return;
          }
          const nextTarget = refs.searchScreenRef.current?.handleDirection(key as DPadDirection, currentFocus);
          if (nextTarget !== null && nextTarget !== undefined) {
            h.setFocusedId(nextTarget);
          } else if (key === 'down' && refs.isMiniPlayerVisibleRef.current && refs.searchSubScreenRef.current === 'landing') {
            refs.lastContentFocusIdRef.current = currentFocus;
            h.setFocusedId(MINI_PLAYER_FOCUS_IDS.PLAY_PAUSE);
          }
          return;
        }

        // 5. Favorites Screen Navigation
        if (refs.selectedPlaylistRef.current === null && refs.activeNavTabRef.current === 'favorites') {
          const nextTarget = getFavoritesNextFocus(
            currentFocus,
            key as DPadDirection,
            refs.likedPlaylistsRef.current.length
          );
          if (nextTarget !== null) {
            h.setFocusedId(nextTarget);
          } else if (key === 'down' && refs.isMiniPlayerVisibleRef.current && !currentFocus.startsWith('NAV_')) {
            refs.lastContentFocusIdRef.current = currentFocus;
            h.setFocusedId(MINI_PLAYER_FOCUS_IDS.PLAY_PAUSE);
          }
          return;
        }

        // 6. Settings Screen Navigation
        if (refs.selectedPlaylistRef.current === null && refs.activeNavTabRef.current === 'settings') {
          const nextTarget = getSettingsNextFocus(currentFocus, key as DPadDirection);
          if (nextTarget !== null) {
            h.setFocusedId(nextTarget);
          } else if (key === 'down' && refs.isMiniPlayerVisibleRef.current && !currentFocus.startsWith('NAV_')) {
            refs.lastContentFocusIdRef.current = currentFocus;
            h.setFocusedId(MINI_PLAYER_FOCUS_IDS.PLAY_PAUSE);
          }
          return;
        }

        // 7. Home Screen Navigation
        if (
          refs.selectedPlaylistRef.current === null &&
          refs.activeNavTabRef.current !== 'library' &&
          refs.activeNavTabRef.current !== 'search' &&
          refs.activeNavTabRef.current !== 'favorites' &&
          refs.activeNavTabRef.current !== 'settings' &&
          refs.activeNavTabRef.current !== 'ai_dj'
        ) {
          const nextTarget = h.getHomeNextFocus(currentFocus, key as DPadDirection);
          if (nextTarget !== null) {
            h.setFocusedId(nextTarget);
          } else if (key === 'down' && refs.isMiniPlayerVisibleRef.current && !currentFocus.startsWith('NAV_')) {
            refs.lastContentFocusIdRef.current = currentFocus;
            h.setFocusedId(MINI_PLAYER_FOCUS_IDS.PLAY_PAUSE);
          }
          return;
        }
      }
    });

    return () => tvListener.remove();
  }, [handlers, refs]);
}
