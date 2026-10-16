import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { MusicTrack, TRACK_CATALOG } from '../services/musicCatalog';
import { PlaylistData, PlaylistTrack, PLAYLISTS } from '../data/playlistData';
import { AIDJSession, advanceToNextTrack } from '../services/aiDjSessionService';
import { recordTrackPlay } from '../database';
import { useFavorites } from './FavoritesContext';

export interface PlaybackContextType {
  player: any;
  playerStatus: any;
  playerStatusRef: React.MutableRefObject<any>;
  currentTrack: MusicTrack;
  currentTrackRef: React.MutableRefObject<MusicTrack>;
  setCurrentTrack: React.Dispatch<React.SetStateAction<MusicTrack>>;
  activePlaybackPlaylist: PlaylistData | null;
  activePlaybackPlaylistRef: React.MutableRefObject<PlaylistData | null>;
  setActivePlaybackPlaylist: React.Dispatch<React.SetStateAction<PlaylistData | null>>;
  isShuffleActive: boolean;
  isShuffleActiveRef: React.MutableRefObject<boolean>;
  shuffledTrackIds: string[];
  shuffledTrackIdsRef: React.MutableRefObject<string[]>;
  setShuffledTrackIds: React.Dispatch<React.SetStateAction<string[]>>;
  isRepeatActive: boolean;
  setIsRepeatActive: React.Dispatch<React.SetStateAction<boolean>>;
  seekPreviewSeconds: number | null;
  handleSeekDelta: (deltaSeconds: number) => void;
  handlePlayTrack: (track: MusicTrack) => void;
  handleTogglePlayPause: () => void;
  handlePlayPlaylistTrack: (
    track: PlaylistTrack,
    preserveExistingShuffleQueue?: boolean,
    playlistContext?: PlaylistData | null
  ) => void;
  handlePlayPlaylist: (playlist: PlaylistData, startTrack?: PlaylistTrack) => void;
  handlePlayPlaylistFromLibrary: (playlist: PlaylistData) => void;
  handleToggleShuffle: () => void;
  handlePlayNext: () => void;
  handlePlayPrev: () => void;
  pausePlaybackForVoice: () => void;
  resumePlaybackAfterVoice: () => void;
  wasPlayingBeforeVoiceRef: React.MutableRefObject<boolean>;
  session: AIDJSession | null;
  setSession: React.Dispatch<React.SetStateAction<AIDJSession | null>>;
}

const PlaybackContext = createContext<PlaybackContextType | null>(null);

export interface PlaybackProviderProps {
  children: React.ReactNode;
  getSelectedPlaylist?: () => PlaylistData | null;
  onTrackPlayed?: (track: MusicTrack) => void;
  setVoiceToast?: (msg: string | null) => void;
}

export const PlaybackProvider: React.FC<PlaybackProviderProps> = ({
  children,
  getSelectedPlaylist,
  onTrackPlayed,
  setVoiceToast,
}) => {
  const favorites = useFavorites();
  const [session, setSession] = useState<AIDJSession | null>(null);
  const [activePlaybackPlaylist, setActivePlaybackPlaylist] = useState<PlaylistData | null>(
    () => PLAYLISTS.chill_vibes
  );
  const activePlaybackPlaylistRef = useRef<PlaylistData | null>(PLAYLISTS.chill_vibes);
  activePlaybackPlaylistRef.current = activePlaybackPlaylist;

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
      artwork: first.artwork,
    } as any;
  });

  const [isShuffleActive, setIsShuffleActive] = useState<boolean>(false);
  const isShuffleActiveRef = useRef<boolean>(false);
  const [shuffledTrackIds, setShuffledTrackIds] = useState<string[]>([]);
  const shuffledTrackIdsRef = useRef<string[]>([]);
  const [isRepeatActive, setIsRepeatActive] = useState<boolean>(false);
  const initialAutoPlayDone = useRef<boolean>(false);

  // Industry-standard Fisher-Yates (Knuth) Shuffle Queue Generator
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

      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = remaining[i];
        remaining[i] = remaining[j];
        remaining[j] = temp;
      }

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
  const lastRecordedTrackIdRef = useRef<string | null>(null);

  // Audio Player via expo-audio
  const player = useAudioPlayer(null);
  const playerStatus = useAudioPlayerStatus(player);
  const playerStatusRef = useRef(playerStatus);
  playerStatusRef.current = playerStatus;

  const wasPlayingBeforeVoiceRef = useRef<boolean>(false);

  const pausePlaybackForVoice = useCallback(() => {
    if (player && playerStatusRef.current?.playing) {
      wasPlayingBeforeVoiceRef.current = true;
      player.pause();
      console.log('[Voice UX] Audio paused for microphone input.');
    }
  }, [player]);

  const resumePlaybackAfterVoice = useCallback(() => {
    if (wasPlayingBeforeVoiceRef.current && player) {
      wasPlayingBeforeVoiceRef.current = false;
      player.play();
      console.log('[Voice UX] Audio resumed after microphone input.');
    }
  }, [player]);

  // Scrubbing & Seeking State
  const [seekPreviewSeconds, setSeekPreviewSeconds] = useState<number | null>(null);
  const seekPreviewSecondsRef = useRef<number | null>(null);
  const seekDebounceTimeoutRef = useRef<any>(null);
  const pendingSeekSecondsRef = useRef<number | null>(null);
  const seekClearTimeoutRef = useRef<any>(null);

  const handleSeekDelta = useCallback(
    (deltaSeconds: number) => {
      const totalDur =
        playerStatusRef.current?.duration || currentTrackRef.current?.duration || 252;
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
      lastRecordedTrackIdRef.current = track.id;
      currentTrackRef.current = track;
      setCurrentTrack(track);

      favorites.addRecentlyPlayedTrack(track);
      onTrackPlayed?.(track);

      if (player && track.audioUrl) {
        try {
          player.volume = 1.0;
          player.replace(track.audioUrl);
          player.play();
        } catch (err) {
          console.warn('[Audio] Failed to play track:', err);
        }
      }
      if (setVoiceToast) {
        setVoiceToast(`▶ Now Playing: "${track.title}" by ${track.artist}`);
        setTimeout(() => setVoiceToast(null), 3000);
      }
    },
    [player, favorites, onTrackPlayed, setVoiceToast]
  );

  // Toggle Play / Pause
  const handleTogglePlayPause = useCallback(() => {
    if (!player) return;
    const st = playerStatusRef.current;
    if (st?.playing) {
      player.pause();
    } else {
      hasPlaybackStartedRef.current = true;
      const curTrack = currentTrackRef.current;
      if (curTrack && lastRecordedTrackIdRef.current !== curTrack.id) {
        lastRecordedTrackIdRef.current = curTrack.id;
        favorites.addRecentlyPlayedTrack(curTrack);
        onTrackPlayed?.(curTrack);
      }
      if (st && st.duration > 0 && (st.currentTime >= st.duration - 0.5 || st.didJustFinish)) {
        if (curTrack?.audioUrl) {
          try {
            player.replace(curTrack.audioUrl);
          } catch (_) {}
        }
      }
      player.play();
    }
  }, [player, favorites, onTrackPlayed]);

  const handlePlayPlaylistTrack = useCallback(
    (
      track: PlaylistTrack,
      preserveExistingShuffleQueue: boolean = false,
      playlistContext?: PlaylistData | null
    ) => {
      wasPlayingBeforeVoiceRef.current = false;
      let targetPl = playlistContext || null;
      if (!targetPl) {
        if (
          activePlaybackPlaylistRef.current &&
          activePlaybackPlaylistRef.current.tracks.some((t) => t.id === track.id)
        ) {
          targetPl = activePlaybackPlaylistRef.current;
        } else {
          const selectedPl = getSelectedPlaylist?.();
          if (selectedPl && selectedPl.tracks.some((t) => t.id === track.id)) {
            targetPl = selectedPl;
          } else {
            for (const pl of Object.values(PLAYLISTS)) {
              if (pl.tracks.some((t) => t.id === track.id)) {
                targetPl = pl;
                break;
              }
            }
          }
        }
      }

      if (targetPl) {
        activePlaybackPlaylistRef.current = targetPl;
        setActivePlaybackPlaylist(targetPl);
      }

      if (
        isShuffleActiveRef.current &&
        !preserveExistingShuffleQueue &&
        targetPl &&
        targetPl.tracks.length > 1
      ) {
        const reanchored = buildFisherYatesQueue(targetPl.tracks, track.id);
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
        ...(track.artwork ? { artwork: track.artwork } : {}),
      } as any;
      handlePlayTrack(matched);
    },
    [handlePlayTrack, buildFisherYatesQueue, getSelectedPlaylist]
  );

  const handlePlayPlaylist = useCallback(
    (playlist: PlaylistData, startTrack?: PlaylistTrack) => {
      if (!playlist || !playlist.tracks || playlist.tracks.length === 0) return;
      const isCurrentPl =
        activePlaybackPlaylistRef.current?.id === playlist.id &&
        playlist.tracks.some((t) => t.id === currentTrackRef.current?.id);
      if (isCurrentPl && !startTrack) {
        handleTogglePlayPause();
      } else {
        activePlaybackPlaylistRef.current = playlist;
        setActivePlaybackPlaylist(playlist);
        const targetTrack = startTrack || playlist.tracks[0];
        handlePlayPlaylistTrack(targetTrack, false, playlist);
      }
    },
    [handleTogglePlayPause, handlePlayPlaylistTrack]
  );

  const handlePlayPlaylistFromLibrary = useCallback(
    (playlist: PlaylistData) => {
      handlePlayPlaylist(playlist);
    },
    [handlePlayPlaylist]
  );

  const handleToggleShuffle = useCallback(() => {
    const nextState = !isShuffleActiveRef.current;
    isShuffleActiveRef.current = nextState;
    setIsShuffleActive(nextState);

    if (nextState) {
      const currentId = currentTrackRef.current?.id;
      let activePl = activePlaybackPlaylistRef.current;
      if (!activePl || !activePl.tracks.some((t) => t.id === currentId)) {
        for (const pl of Object.values(PLAYLISTS)) {
          if (pl.tracks.some((t) => t.id === currentId)) {
            activePl = pl;
            break;
          }
        }
      }
      if (!activePl) activePl = getSelectedPlaylist?.() || PLAYLISTS.chill_vibes;

      const isPlayingCurrentPl = activePl.tracks.some((t) => t.id === currentId);
      const anchorId = isPlayingCurrentPl ? currentId : activePl.tracks[0]?.id;
      const newQueue = buildFisherYatesQueue(activePl.tracks, anchorId);
      shuffledTrackIdsRef.current = newQueue;
      setShuffledTrackIds(newQueue);

      const nextTrackId = newQueue[1] || newQueue[0];
      const nextTrackObj = activePl.tracks.find((t) => t.id === nextTrackId);
      if (setVoiceToast) {
        setVoiceToast(
          nextTrackObj
            ? `🔀 Shuffle On • Up Next: "${nextTrackObj.title}"`
            : '🔀 Shuffle On • Randomized Queue'
        );
        setTimeout(() => setVoiceToast(null), 2800);
      }
    } else {
      shuffledTrackIdsRef.current = [];
      setShuffledTrackIds([]);
      if (setVoiceToast) {
        setVoiceToast('➡️ Shuffle Off • Sequential Playlist Order');
        setTimeout(() => setVoiceToast(null), 2400);
      }
    }
  }, [buildFisherYatesQueue, getSelectedPlaylist, setVoiceToast]);

  const handlePlayNext = useCallback(() => {
    const currentId = currentTrackRef.current?.id;
    let activePl = activePlaybackPlaylistRef.current;
    if (!activePl || !activePl.tracks.some((t) => t.id === currentId)) {
      for (const pl of Object.values(PLAYLISTS)) {
        if (pl.tracks.some((t) => t.id === currentId)) {
          activePl = pl;
          activePlaybackPlaylistRef.current = pl;
          setActivePlaybackPlaylist(pl);
          break;
        }
      }
    }
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
        if (curIdx >= 0 && curIdx + 1 < queue.length) {
          const nextId = queue[curIdx + 1];
          const nextTrack =
            activePl.tracks.find((t) => t.id === nextId) || activePl.tracks[0];
          handlePlayPlaylistTrack(nextTrack, true, activePl);
        } else {
          const candidates = activePl.tracks.filter((t) => t.id !== currentId);
          const nextAnchor =
            candidates[Math.floor(Math.random() * candidates.length)] ||
            activePl.tracks[0];
          const nextCycle = buildFisherYatesQueue(activePl.tracks, nextAnchor.id);
          shuffledTrackIdsRef.current = nextCycle;
          setShuffledTrackIds(nextCycle);
          handlePlayPlaylistTrack(nextAnchor, true, activePl);
        }
      } else {
        const currentIdx = activePl.tracks.findIndex((t) => t.id === currentId);
        const baseIdx = currentIdx >= 0 ? currentIdx : 0;
        const nextIdx = (baseIdx + 1) % activePl.tracks.length;
        handlePlayPlaylistTrack(activePl.tracks[nextIdx], true, activePl);
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
  }, [session, buildFisherYatesQueue, handlePlayPlaylistTrack, handlePlayTrack]);

  const handlePlayPrev = useCallback(() => {
    const curTime = playerStatusRef.current?.currentTime ?? 0;
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
    let activePl = activePlaybackPlaylistRef.current;
    if (!activePl || !activePl.tracks.some((t) => t.id === currentId)) {
      for (const pl of Object.values(PLAYLISTS)) {
        if (pl.tracks.some((t) => t.id === currentId)) {
          activePl = pl;
          activePlaybackPlaylistRef.current = pl;
          setActivePlaybackPlaylist(pl);
          break;
        }
      }
    }
    if (activePl && activePl.tracks.length > 0) {
      if (isShuffleActiveRef.current && activePl.tracks.length > 1) {
        const queue = shuffledTrackIdsRef.current;
        const curIdx = currentId ? queue.indexOf(currentId) : 0;
        if (curIdx > 0) {
          const prevId = queue[curIdx - 1];
          const prevTrack =
            activePl.tracks.find((t) => t.id === prevId) || activePl.tracks[0];
          handlePlayPlaylistTrack(prevTrack, true, activePl);
        } else {
          const lastId = queue[queue.length - 1];
          const lastTrack =
            activePl.tracks.find((t) => t.id === lastId) || activePl.tracks[0];
          handlePlayPlaylistTrack(lastTrack, true, activePl);
        }
      } else {
        const currentIdx = activePl.tracks.findIndex((t) => t.id === currentId);
        const baseIdx = currentIdx >= 0 ? currentIdx : 0;
        const prevIdx = (baseIdx - 1 + activePl.tracks.length) % activePl.tracks.length;
        handlePlayPlaylistTrack(activePl.tracks[prevIdx], true, activePl);
      }
    } else {
      const currentIdx = TRACK_CATALOG.findIndex((t) => t.id === currentId);
      const baseIdx = currentIdx >= 0 ? currentIdx : 0;
      const prevIdx = (baseIdx - 1 + TRACK_CATALOG.length) % TRACK_CATALOG.length;
      handlePlayTrack(TRACK_CATALOG[prevIdx]);
    }
  }, [player, handlePlayPlaylistTrack, handlePlayTrack]);

  // Sync repeat/loop status with native player
  useEffect(() => {
    if (player) {
      player.volume = 1.0;
      player.loop = isRepeatActive;
    }
  }, [player, isRepeatActive]);

  // Preload initial track
  useEffect(() => {
    if (player && currentTrack?.audioUrl && !initialAutoPlayDone.current) {
      initialAutoPlayDone.current = true;
      try {
        player.replace(currentTrack.audioUrl);
      } catch (err) {
        console.warn('[Audio] Failed initial track load:', err);
      }
    }
  }, [player, currentTrack]);

  // Synchronize playback history when audio playback actively starts
  useEffect(() => {
    if (playerStatus?.playing) {
      const curTrack = currentTrackRef.current;
      if (curTrack && lastRecordedTrackIdRef.current !== curTrack.id) {
        lastRecordedTrackIdRef.current = curTrack.id;
        favorites.addRecentlyPlayedTrack(curTrack);
        onTrackPlayed?.(curTrack);
      }
    }
  }, [playerStatus?.playing, favorites, onTrackPlayed]);

  // Auto-advance on track completion
  useEffect(() => {
    const isFinished =
      playerStatus?.didJustFinish || playerStatus?.playbackState === 'ended';
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
  }, [
    playerStatus?.didJustFinish,
    playerStatus?.playbackState,
    isRepeatActive,
    handlePlayNext,
    player,
  ]);

  const value: PlaybackContextType = {
    player,
    playerStatus,
    playerStatusRef,
    currentTrack,
    currentTrackRef,
    setCurrentTrack,
    activePlaybackPlaylist,
    activePlaybackPlaylistRef,
    setActivePlaybackPlaylist,
    isShuffleActive,
    isShuffleActiveRef,
    shuffledTrackIds,
    shuffledTrackIdsRef,
    setShuffledTrackIds,
    isRepeatActive,
    setIsRepeatActive,
    seekPreviewSeconds,
    handleSeekDelta,
    handlePlayTrack,
    handleTogglePlayPause,
    handlePlayPlaylistTrack,
    handlePlayPlaylist,
    handlePlayPlaylistFromLibrary,
    handleToggleShuffle,
    handlePlayNext,
    handlePlayPrev,
    pausePlaybackForVoice,
    resumePlaybackAfterVoice,
    wasPlayingBeforeVoiceRef,
    session,
    setSession,
  };

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
};

export const usePlayback = (): PlaybackContextType => {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error('usePlayback must be used within a PlaybackProvider');
  }
  return context;
};
