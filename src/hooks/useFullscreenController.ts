import { useState, useRef, useCallback, useEffect } from 'react';
import { PlaylistData, PlaylistTrack, PLAYLISTS } from '../data/playlistData';
import { MusicTrack } from '../services/musicCatalog';
import {
  FULLSCREEN_FOCUS_IDS,
  BG_THUMB_FOCUS_IDS,
  getFullscreenNextFocus,
} from '../navigation/fullscreenNavGraph';
import { BACKGROUND_OPTIONS } from '../components/BackgroundSelectionOverlay';
import {
  SongAiInsight,
  getCachedSongInfo,
  fetchOrGetSongInfo,
} from '../services/geminiSongInfoService';
import { DPadDirection } from '../navigation/playlistNavGraph';

export type AiOverlayStatus = 'IDLE' | 'LOADING' | 'READY' | 'ERROR';

export interface UseFullscreenControllerParams {
  selectedPlaylistRef: React.MutableRefObject<PlaylistData | null>;
  setSelectedPlaylist: (pl: PlaylistData | null) => void;
  currentTrackRef: React.MutableRefObject<MusicTrack>;
  currentTrack: MusicTrack;
  setFocusedId: (id: string) => void;
  selectedBackgroundIdRef: React.MutableRefObject<string | null>;
  handleSelectBackground: (bgId: string) => Promise<void>;
  handleTogglePlayPause: () => void;
  handlePlayPrev: () => void;
  handlePlayNext: () => void;
  handleToggleSongFavorite: (id?: string) => void;
  handleSeekDelta: (delta: number) => void;
}

export function useFullscreenController({
  selectedPlaylistRef,
  setSelectedPlaylist,
  currentTrackRef,
  currentTrack,
  setFocusedId,
  selectedBackgroundIdRef,
  handleSelectBackground,
  handleTogglePlayPause,
  handlePlayPrev,
  handlePlayNext,
  handleToggleSongFavorite,
  handleSeekDelta,
}: UseFullscreenControllerParams) {
  const [isFullscreenPlayer, setIsFullscreenPlayer] = useState<boolean>(false);
  const isFullscreenPlayerRef = useRef<boolean>(false);
  isFullscreenPlayerRef.current = isFullscreenPlayer;

  const [fullscreenFocusId, setFullscreenFocusId] = useState<string>(
    FULLSCREEN_FOCUS_IDS.PLAY_PAUSE
  );
  const fullscreenFocusIdRef = useRef<string>(FULLSCREEN_FOCUS_IDS.PLAY_PAUSE);
  fullscreenFocusIdRef.current = fullscreenFocusId;

  const fullscreenReturnFocusRef = useRef<string>('PL_PLAYER_FULLSCREEN');
  const playlistBeforeFullscreenRef = useRef<PlaylistData | null>(null);

  const [isAiOverlayOpen, setIsAiOverlayOpen] = useState<boolean>(false);
  const isAiOverlayOpenRef = useRef<boolean>(false);
  isAiOverlayOpenRef.current = isAiOverlayOpen;

  const [aiOverlayStatus, setAiOverlayStatus] = useState<AiOverlayStatus>('IDLE');
  const [aiSongInsight, setAiSongInsight] = useState<SongAiInsight | null>(null);
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);

  const [isBackgroundOverlayOpen, setIsBackgroundOverlayOpen] = useState<boolean>(false);
  const isBackgroundOverlayOpenRef = useRef<boolean>(false);
  isBackgroundOverlayOpenRef.current = isBackgroundOverlayOpen;

  const enterFullscreenPlayer = useCallback(() => {
    isAiOverlayOpenRef.current = false;
    setIsAiOverlayOpen(false);
    isBackgroundOverlayOpenRef.current = false;
    setIsBackgroundOverlayOpen(false);
    isFullscreenPlayerRef.current = true;
    setIsFullscreenPlayer(true);
    setFullscreenFocusId(FULLSCREEN_FOCUS_IDS.PLAY_PAUSE);
  }, []);

  const exitFullscreenPlayer = useCallback(() => {
    isAiOverlayOpenRef.current = false;
    setIsAiOverlayOpen(false);
    isBackgroundOverlayOpenRef.current = false;
    setIsBackgroundOverlayOpen(false);
    isFullscreenPlayerRef.current = false;
    setIsFullscreenPlayer(false);
    if (playlistBeforeFullscreenRef.current === null) {
      selectedPlaylistRef.current = null;
      setSelectedPlaylist(null);
    }
    const returnFocus = fullscreenReturnFocusRef.current || 'PL_PLAYER_FULLSCREEN';
    setFocusedId(returnFocus);
  }, [setFocusedId, selectedPlaylistRef, setSelectedPlaylist]);

  const handleToggleFullscreen = useCallback(() => {
    if (isFullscreenPlayerRef.current) {
      exitFullscreenPlayer();
    } else {
      fullscreenReturnFocusRef.current = 'PL_PLAYER_FULLSCREEN';
      playlistBeforeFullscreenRef.current = selectedPlaylistRef.current;
      enterFullscreenPlayer();
    }
  }, [enterFullscreenPlayer, exitFullscreenPlayer, selectedPlaylistRef]);

  const handleOpenFullscreenFromMiniPlayer = useCallback(() => {
    fullscreenReturnFocusRef.current = 'MINI_FULLSCREEN';
    playlistBeforeFullscreenRef.current = selectedPlaylistRef.current;
    enterFullscreenPlayer();
  }, [enterFullscreenPlayer, selectedPlaylistRef]);

  const closeAiSongInfoOverlay = useCallback(() => {
    isAiOverlayOpenRef.current = false;
    setIsAiOverlayOpen(false);
    setFullscreenFocusId(FULLSCREEN_FOCUS_IDS.SONG_INFO);
  }, []);

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

    const cached = getCachedSongInfo(activeTrk.id);
    if (cached) {
      setAiSongInsight(cached);
      setAiOverlayStatus('READY');
      return;
    }

    setAiOverlayStatus('LOADING');
    setAiSongInsight(null);
    try {
      const insight = await fetchOrGetSongInfo(activeTrk, pl.title);
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
  }, [currentTrackRef, selectedPlaylistRef]);

  const openBackgroundOverlay = useCallback(() => {
    isBackgroundOverlayOpenRef.current = true;
    setIsBackgroundOverlayOpen(true);
    const activeId = selectedBackgroundIdRef.current;
    const activeIdx = BACKGROUND_OPTIONS.findIndex((b) => b.id === activeId);
    const targetFocus = activeIdx >= 0 ? BG_THUMB_FOCUS_IDS[activeIdx] : BG_THUMB_FOCUS_IDS[0];
    setFullscreenFocusId(targetFocus);
  }, [selectedBackgroundIdRef]);

  const closeBackgroundOverlay = useCallback(() => {
    isBackgroundOverlayOpenRef.current = false;
    setIsBackgroundOverlayOpen(false);
    setFullscreenFocusId(FULLSCREEN_FOCUS_IDS.PALETTE);
  }, []);

  // Sync AI Song Info when track changes while overlay is open
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
  }, [currentTrack?.id, isAiOverlayOpen, currentTrackRef, selectedPlaylistRef]);

  const handleFullscreenRemoteEvent = useCallback(
    (key: string) => {
      const fsFocus = fullscreenFocusIdRef.current;

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
        return;
      }

      if (key === 'left' || key === 'right' || key === 'up' || key === 'down') {
        if (isAiOverlayOpenRef.current) {
          return;
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
          return;
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
      currentTrackRef,
      selectedPlaylistRef,
    ]
  );

  return {
    isFullscreenPlayer,
    isFullscreenPlayerRef,
    setIsFullscreenPlayer,
    fullscreenFocusId,
    fullscreenFocusIdRef,
    setFullscreenFocusId,
    isAiOverlayOpen,
    isAiOverlayOpenRef,
    setIsAiOverlayOpen,
    aiOverlayStatus,
    setAiOverlayStatus,
    aiSongInsight,
    setAiSongInsight,
    aiErrorMessage,
    setAiErrorMessage,
    isBackgroundOverlayOpen,
    isBackgroundOverlayOpenRef,
    setIsBackgroundOverlayOpen,
    enterFullscreenPlayer,
    exitFullscreenPlayer,
    handleToggleFullscreen,
    handleOpenFullscreenFromMiniPlayer,
    closeAiSongInfoOverlay,
    openAiSongInfoOverlay,
    openBackgroundOverlay,
    closeBackgroundOverlay,
    handleFullscreenRemoteEvent,
  };
}
