import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Image,
  Animated,
} from 'react-native';
import { PLAYLISTS, PlaylistData, PlaylistTrack } from '../data/playlistData';
import { MusicTrack } from '../services/musicCatalog';
import { formatTime } from '../services/recommendationEngine';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface PlaylistScreenProps {
  playlist: PlaylistData;
  currentTrackId?: string;
  currentPlayingTrack?: MusicTrack | PlaylistTrack | null;
  activePlaybackPlaylistId?: string | null;
  isPlaying?: boolean;
  currentTimeMs?: number;
  durationMs?: number;
  onPlayTrack: (track: PlaylistTrack) => void;
  onPlayPlaylist?: (playlist: PlaylistData, startTrack?: PlaylistTrack) => void;
  onTogglePlayPause: () => void;
  onBackToHome: () => void;
  focusedId: string;
  setFocusedId: (id: string) => void;
  onPlayNext?: () => void;
  onPlayPrev?: () => void;
  isShuffleActive?: boolean;
  shuffledTrackIds?: string[];
  onToggleShuffle?: () => void;
  isRepeatActive?: boolean;
  onToggleRepeat?: () => void;
  onSeekDelta?: (deltaSeconds: number) => void;
  onToggleFullscreen?: () => void;
  isPlaylistLiked?: boolean;
  onTogglePlaylistLike?: (playlistId?: string) => void;
  favoriteMap?: Record<string, boolean>;
  onToggleSongFavorite?: (trackId: string) => void;
}

interface MemoizedTrackRowProps {
  track: PlaylistTrack;
  idx: number;
  isUsb?: boolean;
  isRowActive: boolean;
  isRowFocused: boolean;
  isFavorited: boolean;
  isPlaying: boolean;
  eqBar1: Animated.Value;
  eqBar2: Animated.Value;
  eqBar3: Animated.Value;
  onPlayTrack: (track: PlaylistTrack) => void;
  toggleFavorite: (trackId: string) => void;
}

const MemoizedTrackRow = React.memo(function MemoizedTrackRow({
  track,
  idx,
  isUsb = false,
  isRowActive,
  isRowFocused,
  isFavorited,
  isPlaying,
  eqBar1,
  eqBar2,
  eqBar3,
  onPlayTrack,
  toggleFavorite,
}: MemoizedTrackRowProps) {
  return (
    <Pressable
      focusable={false}
      onPress={() => onPlayTrack(track)}
      style={({ pressed }) => [
        styles.trackRow,
        isRowActive && styles.trackRowActive,
        isRowFocused && styles.trackRowFocused,
        pressed && styles.btnPressed,
      ]}
    >
      {/* Col 1: Number or Animated Equalizer */}
      <View style={styles.colNumber}>
        {isRowActive && isPlaying ? (
          <View style={styles.equalizerContainer}>
            <Animated.View style={[styles.equalizerBar, { height: eqBar1 }]} />
            <Animated.View style={[styles.equalizerBar, { height: eqBar2 }]} />
            <Animated.View style={[styles.equalizerBar, { height: eqBar3 }]} />
          </View>
        ) : (
          <Text style={[styles.trackNumberText, isRowActive && styles.trackNumberActive]}>
            {idx + 1}
          </Text>
        )}
      </View>

      {/* Col 2: Title with Thumbnail */}
      <View style={styles.colTitle}>
        <Image source={track.artwork} style={styles.trackThumb} resizeMode="cover" />
        <View style={styles.titleInfo}>
          <Text
            style={[styles.trackTitleText, isRowActive && styles.trackTitleActive]}
            numberOfLines={1}
          >
            {track.title}
          </Text>
        </View>
      </View>

      {/* Col 3: Artist */}
      <View style={styles.colArtist}>
        <Text
          style={[styles.trackArtistText, isRowActive && styles.trackArtistActive]}
          numberOfLines={1}
        >
          {track.artist}
        </Text>
      </View>

      {/* Col 4: Album */}
      <View style={styles.colAlbum}>
        <Text
          style={[styles.trackAlbumText, isRowActive && styles.trackAlbumActive]}
          numberOfLines={1}
        >
          {track.album}
        </Text>
      </View>

      {/* Col 5: Duration */}
      <View style={styles.colDuration}>
        <Text
          style={[styles.trackDurationText, isRowActive && styles.trackDurationActive]}
        >
          {track.duration}
        </Text>
      </View>

      {/* Col 6: Heart Action */}
      <View style={styles.colActions}>
        {!isUsb && (
          <Pressable
            focusable={false}
            onPress={(e) => {
              e.stopPropagation?.();
              toggleFavorite(track.id);
            }}
            style={styles.iconHit}
          >
            <Image
              source={
                isFavorited
                  ? require('../../assets/ui/icon_heart_filled.png')
                  : require('../../assets/ui/icon_heart_outline.png')
              }
              style={[
                styles.rowHeartVectorIcon,
                {
                  tintColor: isFavorited ? '#9333EA' : '#CBD5E1',
                },
              ]}
              resizeMode="contain"
            />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
});

export function PlaylistScreen({
  playlist,
  currentTrackId,
  currentPlayingTrack,
  activePlaybackPlaylistId,
  isPlaying = false,
  currentTimeMs = 0,
  durationMs = 0,
  onPlayTrack,
  onPlayPlaylist,
  onTogglePlayPause,
  onBackToHome,
  focusedId,
  setFocusedId,
  onPlayNext,
  onPlayPrev,
  isShuffleActive: propShuffle,
  shuffledTrackIds,
  onToggleShuffle,
  isRepeatActive: propRepeat,
  onToggleRepeat,
  onSeekDelta,
  onToggleFullscreen,
  isPlaylistLiked: propPlaylistLiked,
  onTogglePlaylistLike,
  favoriteMap: propFavoriteMap,
  onToggleSongFavorite,
}: PlaylistScreenProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const currentScrollYRef = useRef<number>(0);
  const viewportHeightRef = useRef<number>(540);
  const headerHeightRef = useRef<number>(211);

  const TRACK_ROW_STRIDE = 43;
  const TRACK_ROW_HEIGHT = 42;

  const scrollToTrack = useCallback((trkIdx: number, animated: boolean = true) => {
    if (!scrollViewRef.current || trkIdx < 0) return;

    // When at the very top (tracks 0 or 1), keep the hero section completely in view
    if (trkIdx <= 1) {
      if (currentScrollYRef.current !== 0) {
        scrollViewRef.current.scrollTo({ y: 0, animated });
        currentScrollYRef.current = 0;
      }
      return;
    }

    const headerH = headerHeightRef.current || 211;
    const rowStride = TRACK_ROW_STRIDE;
    const rowH = TRACK_ROW_HEIGHT;
    const viewportH = viewportHeightRef.current || 540;
    const currentY = currentScrollYRef.current;

    const rowTop = headerH + trkIdx * rowStride;
    const rowBottom = rowTop + rowH;

    // Buffer margins to keep context visible above and below the focused row
    const topMargin = rowStride * 1.5; // ~64px (context above)
    const bottomMargin = rowStride * 2.0; // ~86px (context below)

    const visibleTop = currentY;
    const visibleBottom = currentY + viewportH;

    if (rowBottom > visibleBottom - bottomMargin) {
      // Row is approaching or past bottom edge: scroll down
      const targetY = Math.max(0, rowBottom + bottomMargin - viewportH);
      currentScrollYRef.current = targetY;
      scrollViewRef.current.scrollTo({ y: targetY, animated });
    } else if (rowTop < visibleTop + topMargin) {
      // Row is approaching or past top edge: scroll up
      const targetY = Math.max(0, rowTop - topMargin);
      currentScrollYRef.current = targetY;
      scrollViewRef.current.scrollTo({ y: targetY, animated });
    }
  }, []);

  const [localFavoriteMap, setLocalFavoriteMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    playlist.tracks.forEach((t) => {
      initial[t.id] = !!t.isFavorite;
    });
    return initial;
  });
  const [localPlaylistLiked, setLocalPlaylistLiked] = useState<boolean>(false);

  const favoriteMap = propFavoriteMap !== undefined ? propFavoriteMap : localFavoriteMap;
  const isPlaylistLiked = propPlaylistLiked !== undefined ? propPlaylistLiked : localPlaylistLiked;

  const [localShuffle, setLocalShuffle] = useState(false);
  const [localRepeat, setLocalRepeat] = useState(false);

  const isShuffleActive = propShuffle !== undefined ? propShuffle : localShuffle;
  const isRepeatActive = propRepeat !== undefined ? propRepeat : localRepeat;

  const toggleShuffle = useCallback(() => {
    if (onToggleShuffle) {
      onToggleShuffle();
    } else {
      setLocalShuffle((p) => !p);
    }
  }, [onToggleShuffle]);

  const toggleRepeat = useCallback(() => {
    if (onToggleRepeat) {
      onToggleRepeat();
    } else {
      setLocalRepeat((p) => !p);
    }
  }, [onToggleRepeat]);

  const isUsbPlaylist = playlist?.id === 'usb_storage';

  const togglePlaylistLike = useCallback(() => {
    if (isUsbPlaylist) return;
    if (onTogglePlaylistLike) {
      onTogglePlaylistLike(playlist?.id);
    } else {
      setLocalPlaylistLiked((p) => !p);
    }
  }, [isUsbPlaylist, onTogglePlaylistLike, playlist?.id]);

  // Programmatic scroll when focusedId changes so focused tracks and top buttons are always in view
  useEffect(() => {
    if (!scrollViewRef.current) return;
    if (
      focusedId === 'PL_BACK' ||
      focusedId === 'PL_PLAY_ALL' ||
      focusedId === 'PL_SHUFFLE' ||
      focusedId === 'PL_FAV'
    ) {
      if (currentScrollYRef.current !== 0) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
        currentScrollYRef.current = 0;
      }
      return;
    }
    if (focusedId.startsWith('TRK_')) {
      const trkIdx = playlist.tracks.findIndex((t) => `TRK_${t.id}` === focusedId);
      if (trkIdx !== -1) {
        scrollToTrack(trkIdx, true);
      }
    }
  }, [focusedId, playlist.tracks, scrollToTrack]);

  // Reset scroll position when switching playlists
  useEffect(() => {
    currentScrollYRef.current = 0;
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [playlist?.id]);

  // Equalizer animation for playing track
  const eqBar1 = useRef(new Animated.Value(5)).current;
  const eqBar2 = useRef(new Animated.Value(12)).current;
  const eqBar3 = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (isPlaying) {
      const anim1 = Animated.loop(
        Animated.sequence([
          Animated.timing(eqBar1, { toValue: 15, duration: 250, useNativeDriver: false }),
          Animated.timing(eqBar1, { toValue: 4, duration: 250, useNativeDriver: false }),
        ])
      );
      const anim2 = Animated.loop(
        Animated.sequence([
          Animated.timing(eqBar2, { toValue: 6, duration: 320, useNativeDriver: false }),
          Animated.timing(eqBar2, { toValue: 17, duration: 320, useNativeDriver: false }),
        ])
      );
      const anim3 = Animated.loop(
        Animated.sequence([
          Animated.timing(eqBar3, { toValue: 17, duration: 200, useNativeDriver: false }),
          Animated.timing(eqBar3, { toValue: 5, duration: 200, useNativeDriver: false }),
        ])
      );
      anim1.start();
      anim2.start();
      anim3.start();

      return () => {
        anim1.stop();
        anim2.stop();
        anim3.stop();
      };
    } else {
      eqBar1.setValue(5);
      eqBar2.setValue(11);
      eqBar3.setValue(7);
    }
  }, [isPlaying, eqBar1, eqBar2, eqBar3]);

  const toggleFavorite = useCallback(
    (trackId: string) => {
      if (isUsbPlaylist || trackId.startsWith('usb_')) return;
      if (onToggleSongFavorite) {
        onToggleSongFavorite(trackId);
      } else {
        setLocalFavoriteMap((prev) => ({
          ...prev,
          [trackId]: !prev[trackId],
        }));
      }
    },
    [isUsbPlaylist, onToggleSongFavorite]
  );

  const handleInternalPlayNext = useCallback(() => {
    if (onPlayNext) {
      onPlayNext();
    } else {
      const currentIdx = playlist.tracks.findIndex((t) => t.id === currentTrackId);
      const baseIdx = currentIdx >= 0 ? currentIdx : 0;
      const nextIdx = (baseIdx + 1) % playlist.tracks.length;
      onPlayTrack(playlist.tracks[nextIdx]);
    }
  }, [onPlayNext, playlist.tracks, currentTrackId, onPlayTrack]);

  const handleInternalPlayPrev = useCallback(() => {
    if (onPlayPrev) {
      onPlayPrev();
    } else {
      const currentIdx = playlist.tracks.findIndex((t) => t.id === currentTrackId);
      const baseIdx = currentIdx >= 0 ? currentIdx : 0;
      const prevIdx = (baseIdx - 1 + playlist.tracks.length) % playlist.tracks.length;
      onPlayTrack(playlist.tracks[prevIdx]);
    }
  }, [onPlayPrev, playlist.tracks, currentTrackId, onPlayTrack]);

  const defaultPlaceholderTrack = React.useMemo<PlaylistTrack>(
    () => ({
      id: 'none',
      title: 'No Tracks Available',
      artist: 'Liked songs will appear here',
      album: '',
      duration: '0:00',
      durationSeconds: 0,
      audioUrl: '',
      artwork: require('../../assets/ui/rec_0_until_found_clean.png'),
      trackNumber: 1,
    }),
    []
  );

  // Helper to extract artwork reliably from any track format
  const getTrackArtwork = useCallback((trk: any) => {
    if (!trk) return require('../../assets/ui/rec_0_until_found_clean.png');
    if (trk.artwork) return trk.artwork;
    if (trk.localArtwork) return trk.localArtwork;
    if (trk.artworkUrl && typeof trk.artworkUrl === 'string' && trk.artworkUrl.startsWith('http')) {
      return { uri: trk.artworkUrl };
    }
    if (trk.id) {
      for (const pl of Object.values(PLAYLISTS)) {
        const found = pl.tracks.find((t) => t.id === trk.id);
        if (found?.artwork) return found.artwork;
      }
    }
    return require('../../assets/ui/rec_0_until_found_clean.png');
  }, []);

  // 1. Check if the currently playing track belongs to this opened playlist
  const effectivePlayingTrackId = currentPlayingTrack?.id || currentTrackId;
  const playingTrackInThisPlaylist = React.useMemo(() => {
    if (!playlist.tracks || playlist.tracks.length === 0 || !effectivePlayingTrackId) return undefined;
    return playlist.tracks.find((t) => t.id === effectivePlayingTrackId);
  }, [playlist.tracks, effectivePlayingTrackId]);

  // Check if this opened playlist is the active playback playlist
  const isThisPlaylistActive = React.useMemo(() => {
    if (!activePlaybackPlaylistId) {
      return !!playingTrackInThisPlaylist;
    }
    return activePlaybackPlaylistId === playlist.id && !!playingTrackInThisPlaylist;
  }, [activePlaybackPlaylistId, playlist.id, playingTrackInThisPlaylist]);

  // Is this specific playlist currently active and playing?
  const isThisPlaylistPlaying = !!(isPlaying && isThisPlaylistActive);

  // 2. Authoritative track for the right-side player panel:
  // Must ALWAYS represent the real current playback state!
  const authoritativeTrack = React.useMemo(() => {
    if (currentPlayingTrack && currentPlayingTrack.id && currentPlayingTrack.id !== 'none') {
      return currentPlayingTrack;
    }
    if (playingTrackInThisPlaylist) {
      return playingTrackInThisPlaylist;
    }
    return playlist.tracks && playlist.tracks.length > 0 ? playlist.tracks[0] : defaultPlaceholderTrack;
  }, [currentPlayingTrack, playingTrackInThisPlaylist, playlist.tracks, defaultPlaceholderTrack]);

  // Handle Play/Pause on the Playlist Hero header button (PL_PLAY_ALL)
  const handleTopPlayPause = useCallback(() => {
    if (isThisPlaylistActive) {
      onTogglePlayPause();
    } else if (onPlayPlaylist) {
      onPlayPlaylist(playlist, playlist.tracks?.[0]);
    } else if (playlist.tracks && playlist.tracks.length > 0) {
      onPlayTrack(playlist.tracks[0]);
    }
  }, [isThisPlaylistActive, onTogglePlayPause, onPlayPlaylist, playlist, onPlayTrack]);

  // Scroll to playing track when opening a playlist that contains it
  useEffect(() => {
    if (!scrollViewRef.current) return;
    if (playingTrackInThisPlaylist) {
      const trkIdx = playlist.tracks.findIndex((t) => t.id === playingTrackInThisPlaylist.id);
      if (trkIdx > 1) {
        scrollToTrack(trkIdx, false);
      }
    }
  }, [playlist.id, playingTrackInThisPlaylist, scrollToTrack]);

  // Determine the next track in queue (only when this playlist is actively playing)
  const nextTrackInQueue = React.useMemo(() => {
    if (!playlist.tracks || playlist.tracks.length === 0 || !playingTrackInThisPlaylist) return null;
    const curTrackId = playingTrackInThisPlaylist.id;
    if (isShuffleActive && shuffledTrackIds && shuffledTrackIds.length > 0) {
      const curIdx = shuffledTrackIds.indexOf(curTrackId);
      const nextId = shuffledTrackIds[(curIdx >= 0 ? curIdx + 1 : 0) % shuffledTrackIds.length];
      return playlist.tracks.find((t) => t.id === nextId) || playlist.tracks[0];
    }
    const curIdx = playlist.tracks.findIndex((t) => t.id === curTrackId);
    return playlist.tracks[(curIdx >= 0 ? curIdx + 1 : 1) % playlist.tracks.length];
  }, [playlist.tracks, playingTrackInThisPlaylist, isShuffleActive, shuffledTrackIds]);

  const currentSeconds = Math.floor(currentTimeMs / 1000);
  const totalSeconds =
    durationMs > 0
      ? Math.floor(durationMs / 1000)
      : (authoritativeTrack as any)?.durationSeconds > 0
      ? (authoritativeTrack as any).durationSeconds
      : typeof (authoritativeTrack as any)?.duration === 'number' && (authoritativeTrack as any).duration > 0
      ? (authoritativeTrack as any).duration
      : 252;
  const progressRatio = totalSeconds > 0 ? Math.min(1, Math.max(0, currentSeconds / totalSeconds)) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.mainLayoutRow}>
        {/* CENTER: Main Playlist Content */}
        <View style={styles.playlistCenterCol}>
          <ScrollView
            ref={scrollViewRef}
            focusable={false}
            style={styles.scrollArea}
            contentContainerStyle={styles.contentPadding}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e) => {
              currentScrollYRef.current = e.nativeEvent.contentOffset.y;
            }}
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height;
              if (h > 0) {
                viewportHeightRef.current = h;
              }
            }}
          >
        {/* Unified Playlist Card with Opacity, Downward White Shades & Subtle Curved Corners */}
        <View style={styles.playlistMainCard}>
          <Image
            source={require('../../assets/playlists/playlist_top_banner.jpg')}
            style={styles.heroBackdropImage}
            resizeMode="cover"
          />
          <Image
            source={require('../../assets/playlists/playlist_top_gradient.png')}
            style={styles.heroBackdropGradient}
            resizeMode="stretch"
          />

          {/* Playlist Hero Section */}
          <View style={styles.heroSection}>
        {/* Left: Square Cover Art with visualizer badge */}
        <View
          style={[
            styles.coverWrapper,
            (playlist.isHeartCover || playlist.id === 'liked_songs') && styles.heartCoverWrapper,
          ]}
        >
          {playlist.isHeartCover || playlist.id === 'liked_songs' ? (
            <Image
              source={require('../../assets/ui/liked_songs_heart_3d.webp')}
              style={styles.heartCover3dImage}
              resizeMode="contain"
            />
          ) : playlist.coverGrid && playlist.coverGrid.length >= 4 ? (
            <View style={styles.coverGridContainer}>
              <View style={styles.coverGridRow}>
                <Image source={playlist.coverGrid[0]} style={styles.coverGridTile} resizeMode="cover" />
                <Image source={playlist.coverGrid[1]} style={styles.coverGridTile} resizeMode="cover" />
              </View>
              <View style={styles.coverGridRow}>
                <Image source={playlist.coverGrid[2]} style={styles.coverGridTile} resizeMode="cover" />
                <Image source={playlist.coverGrid[3]} style={styles.coverGridTile} resizeMode="cover" />
              </View>
            </View>
          ) : (
            <Image source={playlist.coverImage} style={styles.coverImage} resizeMode="cover" />
          )}

          {/* Equalizer Visualizer Badge on bottom-left */}
          <View style={styles.coverVisualizerBadge}>
            <View style={styles.coverVisBar1} />
            <View style={styles.coverVisBar2} />
            <View style={styles.coverVisBar3} />
            <View style={styles.coverVisBar4} />
          </View>

        </View>

        {/* Center: Details & Controls */}
        <View style={styles.heroInfoCol}>
          <View style={styles.topBadgeRow}>
            <View
              style={[
                styles.badgePill,
                playlist.bannerAccentColor
                  ? { backgroundColor: `${playlist.bannerAccentColor}25`, borderColor: `${playlist.bannerAccentColor}66` }
                  : undefined,
              ]}
            >
              <Text
                style={[
                  styles.badgePillText,
                  playlist.bannerAccentColor ? { color: playlist.bannerAccentColor } : undefined,
                ]}
              >
                {playlist.badgeText}
              </Text>
            </View>
            {isShuffleActive && isThisPlaylistPlaying && nextTrackInQueue && (
              <View style={styles.shuffleQueueBadge}>
                <View style={styles.shuffleQueueBadgeDot} />
                <Text style={styles.shuffleQueueBadgeText} numberOfLines={1}>
                  SHUFFLE ON • NEXT: {nextTrackInQueue.title}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.playlistTitle}>{playlist.title}</Text>
          <Text style={styles.playlistTagline}>{playlist.tagline}</Text>

          {/* Meta Line: Songs + Time */}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {playlist.songsCount} • {playlist.totalDuration}
            </Text>
          </View>

          {/* Description */}
          <Text style={styles.playlistDescription}>{playlist.description}</Text>

          {/* Action Buttons Row */}
          <View style={styles.actionRow}>
            {/* Play All Button */}
            <View
              style={[
                styles.playPillFocusRing,
                focusedId === 'PL_PLAY_ALL' && styles.playPillFocusRingActive,
              ]}
            >
              <Pressable
                focusable={false}
                onPress={handleTopPlayPause}
                style={({ pressed }) => [
                  styles.playPillBtn,
                  focusedId === 'PL_PLAY_ALL' && styles.playPillBtnFocused,
                  pressed && styles.btnPressed,
                ]}
              >
                <Image
                  source={
                    isThisPlaylistPlaying
                      ? require('../../assets/ui/icon_pause.png')
                      : require('../../assets/ui/icon_play.png')
                  }
                  style={styles.playPillVectorIcon}
                  resizeMode="contain"
                />
                <Text style={styles.playPillLabel}>{isThisPlaylistPlaying ? 'Pause' : 'Play'}</Text>
              </Pressable>
            </View>

            {/* Shuffle Button (Industry Standard Toggle with Active Dot & Focus Ring) */}
            <Pressable
              focusable={false}
              onPress={toggleShuffle}
              style={({ pressed }) => [
                styles.circleActionBtn,
                isShuffleActive && styles.circleActionBtnActive,
                focusedId === 'PL_SHUFFLE' &&
                  (isShuffleActive
                    ? styles.circleActionBtnActiveFocused
                    : styles.circleActionBtnFocused),
                pressed && styles.btnPressed,
              ]}
            >
              <Image
                source={require('../../assets/ui/icon_shuffle.png')}
                style={[
                  styles.circleActionVectorIcon,
                  {
                    tintColor: isShuffleActive
                      ? '#FFFFFF'
                      : focusedId === 'PL_SHUFFLE'
                      ? '#6366F1'
                      : '#475569',
                  },
                ]}
                resizeMode="contain"
              />
              {isShuffleActive && <View style={styles.shuffleActiveDot} />}
            </Pressable>

            {/* Playlist Like Button (PL_FAV — separate from Song Like) */}
            {!isUsbPlaylist && (
              <Pressable
                focusable={false}
                onPress={togglePlaylistLike}
                style={({ pressed }) => [
                  styles.circleActionBtn,
                  focusedId === 'PL_FAV' && styles.circleActionBtnFocused,
                  pressed && styles.btnPressed,
                ]}
              >
                <Image
                  source={
                    isPlaylistLiked
                      ? require('../../assets/ui/icon_heart_filled.png')
                      : require('../../assets/ui/icon_heart_outline.png')
                  }
                  style={[
                    styles.circleActionVectorIcon,
                    {
                      tintColor: isPlaylistLiked
                        ? '#EC4899'
                        : focusedId === 'PL_FAV'
                        ? '#EC4899'
                        : '#64748B',
                    },
                  ]}
                  resizeMode="contain"
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* Decorative Right Accent (Matching Mockup with Note + Quote) */}
        <View style={styles.decorativeAccent}>
          <Text style={styles.decorativeQuoteText}>{playlist.quoteText}</Text>
          <View style={styles.decorativeMusicIconBox}>
            <Image
              source={require('../../assets/ui/icon_music_note.png')}
              style={styles.decorativeMusicVectorIcon}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      {/* Songs Table Section */}
      <View
        style={styles.tableInner}
        onLayout={(e) => {
          const y = e.nativeEvent.layout.y;
          if (y > 0) {
            headerHeightRef.current = y + 33;
          }
        }}
      >
        {/* Table Header */}
        <View style={styles.tableHeaderRow}>
          <Text style={styles.thNumber}>#</Text>
          <Text style={styles.thTitle}>TITLE</Text>
          <Text style={styles.thArtist}>ARTIST</Text>
          <Text style={styles.thAlbum}>ALBUM</Text>
          <Text style={styles.thDuration}>🕒</Text>
          <View style={styles.thActions} />
        </View>

        {/* Track Rows (Memoized for 60fps TV D-Pad Navigation across 75+ Tracks) */}
        {playlist.tracks && playlist.tracks.length > 0 ? (
          playlist.tracks.map((track, idx) => (
            <MemoizedTrackRow
              key={track.id}
              track={track}
              idx={idx}
              isUsb={isUsbPlaylist || track.id.startsWith('usb_')}
              isRowActive={!!(playingTrackInThisPlaylist && playingTrackInThisPlaylist.id === track.id)}
              isRowFocused={focusedId === `TRK_${track.id}`}
              isFavorited={!!favoriteMap[track.id]}
              isPlaying={isPlaying}
              eqBar1={eqBar1}
              eqBar2={eqBar2}
              eqBar3={eqBar3}
              onPlayTrack={onPlayTrack}
              toggleFavorite={toggleFavorite}
            />
          ))
        ) : (
          <View style={{ paddingVertical: 48, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="heart-outline" size={44} color="rgba(255,255,255,0.25)" />
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '600', marginTop: 12 }}>
              No Liked Songs Yet
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6, textAlign: 'center', maxWidth: 320 }}>
              Tap the heart button while listening to add songs to your favorites.
            </Text>
          </View>
        )}
      </View>
    </View>
  </ScrollView>
        </View>

        {/* RIGHT: Dedicated Right-Side Player Panel */}
        <View style={styles.rightPlayerCol}>
          <View style={styles.playerPanelCard}>
            {/* Soft Rose-Lavender-Indigo Light Theme Base Washes */}
            <View style={styles.playerCardTopPinkWash} />
            <View style={styles.playerCardMidLavenderWash} />
            <View style={styles.playerCardBottomIndigoWash} />

            {/* Subtle Light Pink Silk Lines (Minimal & Clean) */}
            <View style={styles.playerPinkWaveMid1} />
            <View style={styles.playerPinkArcBottomLeft} />

            {/* Delicate Minimal Sparkles */}
            <Text style={[styles.playerSparkleStar, { top: 242, left: 22, fontSize: 11, color: '#F472B6' }]}>✦</Text>
            <Text style={[styles.playerSparkleStar, { top: 248, right: 24, fontSize: 10, color: '#EC4899' }]}>✧</Text>
            <Text style={[styles.playerSparkleStar, { bottom: 92, left: 20, fontSize: 10, color: '#F472B6' }]}>✦</Text>
            <Text style={[styles.playerSparkleStar, { bottom: 48, right: 48, fontSize: 9, color: '#C084FC' }]}>✧</Text>

            <View style={[styles.playerSparkleDot, { top: 256, left: 48, width: 4.5, height: 4.5, backgroundColor: '#F9A8D4' }]} />
            <View style={[styles.playerSparkleDot, { bottom: 104, right: 54, width: 5, height: 5, backgroundColor: '#FFFFFF' }]} />

            {/* Inner Highlight Bezel for Crisp Visible Rounded Corners */}
            <View pointerEvents="none" style={styles.playerCardInnerCornerFrame} />

            {/* Content Container holding all padded UI controls */}
            <View style={styles.playerPanelContent}>
              {/* 1. Prominent Album Artwork */}
            <View style={styles.playerArtworkBox}>
              <Image source={getTrackArtwork(authoritativeTrack)} style={styles.playerArtwork} resizeMode="cover" />
            </View>

            {/* 2. Song Name & 3. Artist / Details */}
            <View style={styles.playerMetaBlock}>
              <Text style={styles.playerTrackTitle} numberOfLines={1}>
                {authoritativeTrack.title}
              </Text>
              <Text style={styles.playerArtistName} numberOfLines={1}>
                {authoritativeTrack.artist}
              </Text>
            </View>

            {/* 4–8. Playback Controls Row: Heart, Previous, Play/Pause, Next, Fullscreen */}
            <View
              style={[
                styles.playerControlsRow,
                (isUsbPlaylist || authoritativeTrack?.id?.startsWith('usb_')) && {
                  justifyContent: 'space-evenly',
                },
              ]}
            >
              {/* Heart / Like Button (PL_PLAYER_HEART) */}
              {!isUsbPlaylist && !authoritativeTrack?.id?.startsWith('usb_') && (
                <Pressable
                  focusable={false}
                  onPress={() => toggleFavorite(authoritativeTrack.id)}
                  style={({ pressed }) => [
                    styles.playerSideBtn,
                    focusedId === 'PL_PLAYER_HEART' && styles.playerHeartBtnFocused,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Image
                    source={
                      favoriteMap[authoritativeTrack.id]
                        ? require('../../assets/ui/icon_heart_filled.png')
                        : require('../../assets/ui/icon_heart_outline.png')
                    }
                    style={[
                      styles.playerSideVectorIcon,
                      {
                        tintColor: favoriteMap[authoritativeTrack.id]
                          ? '#EC4899'
                          : focusedId === 'PL_PLAYER_HEART'
                          ? '#EC4899'
                          : '#64748B',
                      },
                    ]}
                    resizeMode="contain"
                  />
                </Pressable>
              )}

              {/* Previous Track Button (PL_PLAYER_PREV) */}
              <Pressable
                focusable={false}
                onPress={handleInternalPlayPrev}
                style={({ pressed }) => [
                  styles.playerSideBtn,
                  focusedId === 'PL_PLAYER_PREV' && styles.playerSideBtnFocused,
                  pressed && styles.btnPressed,
                ]}
              >
                <Image
                  source={require('../../assets/ui/icon_prev.png')}
                  style={[
                    styles.playerSideVectorIcon,
                    {
                      tintColor: focusedId === 'PL_PLAYER_PREV' ? '#6366F1' : '#334155',
                    },
                  ]}
                  resizeMode="contain"
                />
              </Pressable>

              {/* Play / Pause Primary Button (PL_PLAYER_PLAY) */}
              <Pressable
                focusable={false}
                onPress={handleTopPlayPause}
                style={({ pressed }) => [
                  styles.playerPlayCircle,
                  focusedId === 'PL_PLAYER_PLAY' && styles.playerPlayCircleFocused,
                  pressed && styles.btnPressed,
                ]}
              >
                <Image
                  source={
                    isPlaying
                      ? require('../../assets/ui/icon_pause.png')
                      : require('../../assets/ui/icon_play.png')
                  }
                  style={styles.playerPlayVectorIcon}
                  resizeMode="contain"
                />
              </Pressable>

              {/* Next Track Button (PL_PLAYER_NEXT) */}
              <Pressable
                focusable={false}
                onPress={handleInternalPlayNext}
                style={({ pressed }) => [
                  styles.playerSideBtn,
                  focusedId === 'PL_PLAYER_NEXT' && styles.playerSideBtnFocused,
                  pressed && styles.btnPressed,
                ]}
              >
                <Image
                  source={require('../../assets/ui/icon_next.png')}
                  style={[
                    styles.playerSideVectorIcon,
                    {
                      tintColor: focusedId === 'PL_PLAYER_NEXT' ? '#6366F1' : '#334155',
                    },
                  ]}
                  resizeMode="contain"
                />
              </Pressable>

              {/* Fullscreen Button (PL_PLAYER_FULLSCREEN) */}
              <Pressable
                focusable={false}
                onPress={onToggleFullscreen}
                style={({ pressed }) => [
                  styles.playerSideBtn,
                  focusedId === 'PL_PLAYER_FULLSCREEN' && styles.playerFullscreenBtnFocused,
                  pressed && styles.btnPressed,
                ]}
              >
                <Image
                  source={require('../../assets/ui/icon_fullscreen.png')}
                  style={[
                    styles.playerSideVectorIcon,
                    {
                      tintColor: focusedId === 'PL_PLAYER_FULLSCREEN' ? '#6366F1' : '#334155',
                    },
                  ]}
                  resizeMode="contain"
                />
              </Pressable>
            </View>

            {/* 9. Scrubber Progress Bar (PL_PLAYER_SCRUB) */}
            <Pressable
              focusable={false}
              onPress={onTogglePlayPause}
              style={({ pressed }) => [
                styles.scrubberRow,
                focusedId === 'PL_PLAYER_SCRUB' && styles.scrubberRowFocused,
                pressed && styles.btnPressed,
              ]}
            >
              <Text
                style={[
                  styles.scrubberTimeText,
                  focusedId === 'PL_PLAYER_SCRUB' && styles.scrubberTimeTextFocused,
                ]}
              >
                {formatTime(currentSeconds)}
              </Text>
              <View
                style={[
                  styles.scrubberTrack,
                  focusedId === 'PL_PLAYER_SCRUB' && styles.scrubberTrackFocused,
                ]}
              >
                <View
                  style={[
                    styles.scrubberFilled,
                    { width: `${Math.round(progressRatio * 100)}%` },
                    focusedId === 'PL_PLAYER_SCRUB' && styles.scrubberFilledFocused,
                  ]}
                />
                <View
                  style={[
                    styles.scrubberKnob,
                    {
                      left: `${Math.round(progressRatio * 100)}%`,
                      marginLeft: focusedId === 'PL_PLAYER_SCRUB' ? -8 : -5,
                    },
                    focusedId === 'PL_PLAYER_SCRUB' && styles.scrubberKnobFocused,
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.scrubberTimeText,
                  focusedId === 'PL_PLAYER_SCRUB' && styles.scrubberTimeTextFocused,
                ]}
              >
                {formatTime(totalSeconds)}
              </Text>
            </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainLayoutRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 14,
  },
  playlistCenterCol: {
    flex: 1,
  },
  rightPlayerCol: {
    width: 240,
  },
  scrollArea: {
    flex: 1,
  },
  contentPadding: {
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 20,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  actionButtonFocused: {
    borderWidth: 2,
    borderColor: '#6366F1',
    borderRadius: 18,
  },
  playPillFocusRing: {
    padding: 2.5,
    borderRadius: 25,
    borderWidth: 2.5,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  playPillFocusRingActive: {
    borderColor: '#4338CA',
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 1.05 }],
    elevation: 8,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  playPillBtnFocused: {
    backgroundColor: '#4F46E5',
  },
  circleActionBtnFocused: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2.5,
    borderColor: '#6366F1',
    borderRadius: 18,
    transform: [{ scale: 1.12 }],
    elevation: 6,
  },

  // Unified Playlist Card with Opacity, Downward White Shades & Subtle Curved Corners
  playlistMainCard: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroBackdropImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    opacity: 0.65,
  },
  heroBackdropGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
  },

  // Hero Section
  heroSection: {
    position: 'relative',
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  coverWrapper: {
    width: 154,
    height: 154,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E1B4B',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  heartCoverWrapper: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    overflow: 'visible',
    borderRadius: 0,
  },
  heartCover3dImage: {
    width: 154,
    height: 154,
  },
  heartCoverContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverGridContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    backgroundColor: '#0F172A',
  },
  coverGridRow: {
    width: '100%',
    height: '50%',
    flexDirection: 'row',
  },
  coverGridTile: {
    width: '50%',
    height: '100%',
  },
  coverVisualizerBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2.5,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  coverVisBar1: { width: 2.5, height: 6, backgroundColor: '#FFFFFF', borderRadius: 1.5 },
  coverVisBar2: { width: 2.5, height: 13, backgroundColor: '#FFFFFF', borderRadius: 1.5 },
  coverVisBar3: { width: 2.5, height: 9, backgroundColor: '#FFFFFF', borderRadius: 1.5 },
  coverVisBar4: { width: 2.5, height: 5, backgroundColor: '#FFFFFF', borderRadius: 1.5 },
  coverTextOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 10,
  },
  coverTitleOverlay: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
    fontStyle: 'italic',
  },

  heroInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  topBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgePillText: {
    color: '#6366F1',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  playlistTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  playlistTagline: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#475569',
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 4,
  },
  creatorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
  },
  creatorName: {
    fontWeight: '700',
    color: '#1E293B',
  },
  playlistDescription: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 4,
    maxWidth: 520,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  playPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  playPillIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  playPillLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  circleActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circleActionBtnActive: {
    backgroundColor: '#6366F1',
    borderColor: '#4F46E5',
    borderWidth: 1.5,
    elevation: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  circleActionBtnActiveFocused: {
    backgroundColor: '#4338CA',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    borderRadius: 18,
    transform: [{ scale: 1.15 }],
    elevation: 8,
    shadowColor: '#312E81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  shuffleActiveDot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  shuffleQueueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.32)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
    maxWidth: 235,
    marginLeft: 8,
  },
  shuffleQueueBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
  },
  shuffleQueueBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.4,
  },
  circleActionBtnIcon: {
    fontSize: 14,
  },
  circleActionBtnIconActive: {
    transform: [{ scale: 1.1 }],
  },
  playPillVectorIcon: {
    width: 13,
    height: 13,
    marginRight: 2,
    tintColor: '#FFFFFF',
  },
  circleActionVectorIcon: {
    width: 17,
    height: 17,
  },
  decorativeMusicVectorIcon: {
    width: 18,
    height: 18,
    tintColor: '#6366F1',
  },
  rowHeartVectorIcon: {
    width: 13,
    height: 13,
  },
  heartActionIcon: {
    fontSize: 15,
  },
  moreActionIcon: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },

  // Decorative Accent Right
  decorativeAccent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 10,
  },
  decorativeQuoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#818CF8',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 16,
  },
  decorativeMusicIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorativeMusicIcon: {
    fontSize: 18,
  },

  // Table Section Inside Unified Card
  tableInner: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 2,
  },
  thNumber: {
    width: 34,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'center',
  },
  thTitle: {
    flex: 3,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94A3B8',
    paddingLeft: 6,
  },
  thArtist: {
    flex: 2,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  thAlbum: {
    flex: 2,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  thDuration: {
    width: 46,
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'center',
  },
  thActions: {
    width: 36,
  },

  // Track Rows
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderRadius: 8,
    marginBottom: 1,
    borderWidth: 1.5,
    borderColor: 'transparent',
    height: 42,
  },
  trackRowActive: {
    backgroundColor: '#F3E8FF',
  },
  trackRowFocused: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  colNumber: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  trackNumberActive: {
    color: '#6366F1',
    fontWeight: '800',
  },
  equalizerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 16,
    justifyContent: 'center',
  },
  equalizerBar: {
    width: 2.5,
    backgroundColor: '#6366F1',
    borderRadius: 1.5,
  },
  colTitle: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
  },
  trackThumb: {
    width: 28,
    height: 28,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  titleInfo: {
    flex: 1,
  },
  trackTitleText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  trackTitleActive: {
    color: '#4338CA',
  },
  colArtist: {
    flex: 2,
  },
  trackArtistText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  trackArtistActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  colAlbum: {
    flex: 2,
  },
  trackAlbumText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '400',
  },
  trackAlbumActive: {
    color: '#6366F1',
  },
  colDuration: {
    width: 46,
    alignItems: 'center',
  },
  trackDurationText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  trackDurationActive: {
    color: '#6366F1',
    fontWeight: '700',
  },
  colActions: {
    width: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconHit: {
    padding: 4,
  },
  rowHeartIcon: {
    fontSize: 14,
  },

  // Dedicated Right-Side Player Panel Styles (Light Rose-Lavender Theme with Pink Lines & Sparkles)
  playerPanelCard: {
    backgroundColor: '#F5EFFF',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 435,
    borderWidth: 2,
    borderColor: '#D8B4FE',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 6,
  },
  playerCardInnerCornerFrame: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.88)',
  },
  playerCardTopPinkWash: {
    position: 'absolute',
    top: -40,
    left: -30,
    width: 240,
    height: 210,
    borderRadius: 110,
    backgroundColor: 'rgba(252, 231, 243, 0.88)',
  },
  playerCardMidLavenderWash: {
    position: 'absolute',
    top: 165,
    right: -45,
    width: 230,
    height: 195,
    borderRadius: 105,
    backgroundColor: 'rgba(243, 232, 255, 0.78)',
  },
  playerCardBottomIndigoWash: {
    position: 'absolute',
    bottom: -45,
    left: -25,
    width: 260,
    height: 190,
    borderRadius: 110,
    backgroundColor: 'rgba(224, 231, 255, 0.85)',
  },
  playerPinkWaveMid1: {
    position: 'absolute',
    top: 200,
    left: -60,
    width: 340,
    height: 150,
    borderRadius: 120,
    borderTopWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.34)',
    transform: [{ rotate: '-12deg' }],
  },
  playerPinkArcBottomLeft: {
    position: 'absolute',
    bottom: -90,
    left: -70,
    width: 235,
    height: 235,
    borderRadius: 118,
    borderWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.32)',
    backgroundColor: 'rgba(252, 231, 243, 0.22)',
  },
  playerSparkleStar: {
    position: 'absolute',
    fontWeight: '800',
    textShadowColor: 'rgba(255, 255, 255, 0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  playerSparkleDot: {
    position: 'absolute',
    borderRadius: 99,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  playerPanelContent: {
    flex: 1,
    width: '100%',
    paddingTop: 16,
    paddingHorizontal: 14,
    paddingBottom: 22,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerArtworkBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 5,
  },
  playerArtwork: {
    width: '100%',
    height: '100%',
  },
  playerMetaBlock: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  playerTrackTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    width: '100%',
  },
  playerArtistName: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  playerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  playerSideBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(244, 114, 182, 0.35)',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  playerSideBtnFocused: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
    borderWidth: 2.5,
    transform: [{ scale: 1.15 }],
  },
  playerSideBtnIcon: {
    fontSize: 13,
    color: '#334155',
  },
  playerSideBtnIconFocused: {
    color: '#6366F1',
    fontWeight: '800',
  },
  playerHeartBtnFocused: {
    backgroundColor: '#FDF2F8',
    borderColor: '#EC4899',
    borderWidth: 2.5,
    transform: [{ scale: 1.15 }],
  },
  playerHeartIconFocused: {
    transform: [{ scale: 1.1 }],
  },
  playerPlayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  playerPlayCircleFocused: {
    backgroundColor: '#4338CA',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 22,
    transform: [{ scale: 1.15 }],
  },
  playerPlayCircleIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  playerPlayVectorIcon: {
    width: 18,
    height: 18,
    tintColor: '#FFFFFF',
  },
  playerSideVectorIcon: {
    width: 15,
    height: 15,
  },
  playerFullscreenBtnFocused: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
    borderWidth: 2.5,
    transform: [{ scale: 1.15 }],
  },
  playerFullscreenIconFocused: {
    color: '#6366F1',
    fontWeight: '800',
  },

  scrubberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(244, 114, 182, 0.32)',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  scrubberRowFocused: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#6366F1',
  },
  scrubberTimeText: {
    fontSize: 10.5,
    color: '#334155',
    fontWeight: '700',
    minWidth: 26,
    textAlign: 'center',
  },
  scrubberTimeTextFocused: {
    color: '#6366F1',
    fontWeight: '800',
  },
  scrubberTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(203, 213, 225, 0.8)',
    borderRadius: 2,
    position: 'relative',
    justifyContent: 'center',
  },
  scrubberTrackFocused: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  scrubberFilled: {
    height: 4,
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
  scrubberFilledFocused: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4F46E5',
  },
  scrubberKnob: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366F1',
    position: 'absolute',
    top: -3,
  },
  scrubberKnobFocused: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4F46E5',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    top: -4,
    elevation: 4,
  },
  elasticBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#D8B4FE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 10,
  },
  elasticBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    flex: 1,
  },
  elasticCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  elasticFuzzyBadge: {
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#F9A8D4',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  elasticFuzzyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DB2777',
  },
  elasticResetInlineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  elasticResetInlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
});
