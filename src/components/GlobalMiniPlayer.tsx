import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';
import { MusicTrack } from '../services/musicCatalog';

export const MINI_PLAYER_FOCUS_IDS = {
  PREV: 'MINI_PREV',
  PLAY_PAUSE: 'MINI_PLAY_PAUSE',
  NEXT: 'MINI_NEXT',
  FULLSCREEN: 'MINI_FULLSCREEN',
} as const;

export interface GlobalMiniPlayerProps {
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  currentTimeSeconds: number;
  durationSeconds: number;
  focusedId: string;
  onTogglePlayPause: () => void;
  onPlayPrev: () => void;
  onPlayNext: () => void;
  onOpenFullscreen: () => void;
}

export const GlobalMiniPlayer: React.FC<GlobalMiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  currentTimeSeconds,
  durationSeconds,
  focusedId,
  onTogglePlayPause,
  onPlayPrev,
  onPlayNext,
  onOpenFullscreen,
}) => {
  const artworkSource = useMemo(() => {
    if (!currentTrack) return require('../../assets/ui/rec_0_until_found_clean.png');
    if ((currentTrack as any).artwork) return (currentTrack as any).artwork;
    if ((currentTrack as any).localArtwork) return (currentTrack as any).localArtwork;
    if (currentTrack.artworkUrl && currentTrack.artworkUrl.startsWith('http')) {
      return { uri: currentTrack.artworkUrl };
    }
    return require('../../assets/ui/rec_0_until_found_clean.png');
  }, [currentTrack]);

  const progressPercent = useMemo(() => {
    if (!durationSeconds || durationSeconds <= 0) return 0;
    const ratio = Math.max(0, Math.min(1, (currentTimeSeconds || 0) / durationSeconds));
    return ratio * 100;
  }, [currentTimeSeconds, durationSeconds]);

  const isPrevFocused = focusedId === MINI_PLAYER_FOCUS_IDS.PREV;
  const isPlayFocused = focusedId === MINI_PLAYER_FOCUS_IDS.PLAY_PAUSE;
  const isNextFocused = focusedId === MINI_PLAYER_FOCUS_IDS.NEXT;
  const isFullscreenFocused = focusedId === MINI_PLAYER_FOCUS_IDS.FULLSCREEN;

  return (
    <View style={styles.container}>
      {/* 1. Track Artwork */}
      <Image
        source={artworkSource}
        style={styles.artwork}
        resizeMode="cover"
      />

      {/* 2. Track Title & Artist Metadata + Slim Progress Bar */}
      <View style={styles.trackInfoCol}>
        <Text style={styles.titleText} numberOfLines={1}>
          {currentTrack?.title || 'Unknown Title'}
        </Text>
        <Text style={styles.artistText} numberOfLines={1}>
          {currentTrack?.artist || 'Unknown Artist'}
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(progressPercent)}%` },
            ]}
          />
        </View>
      </View>

      {/* 3. Controls Group: [Prev] [Play/Pause] [Next] | [Fullscreen] */}
      <View style={styles.controlsRow}>
        {/* Previous Track Button */}
        <Pressable
          focusable={false}
          android_ripple={null}
          onPress={onPlayPrev}
          style={[
            styles.controlBtn,
            isPrevFocused && styles.controlBtnFocused,
          ]}
        >
          <Image
            source={require('../../assets/ui/icon_prev.png')}
            style={[
              styles.controlIcon,
              isPrevFocused && styles.controlIconFocused,
            ]}
            resizeMode="contain"
          />
        </Pressable>

        {/* Play / Pause Primary Button */}
        <Pressable
          focusable={false}
          android_ripple={null}
          onPress={onTogglePlayPause}
          style={[
            styles.playBtn,
            isPlayFocused && styles.playBtnFocused,
          ]}
        >
          <Image
            source={
              isPlaying
                ? require('../../assets/ui/icon_pause.png')
                : require('../../assets/ui/icon_play.png')
            }
            style={styles.playIcon}
            resizeMode="contain"
          />
        </Pressable>

        {/* Next Track Button */}
        <Pressable
          focusable={false}
          android_ripple={null}
          onPress={onPlayNext}
          style={[
            styles.controlBtn,
            isNextFocused && styles.controlBtnFocused,
          ]}
        >
          <Image
            source={require('../../assets/ui/icon_next.png')}
            style={[
              styles.controlIcon,
              isNextFocused && styles.controlIconFocused,
            ]}
            resizeMode="contain"
          />
        </Pressable>

        {/* Subtle Vertical Divider */}
        <View style={styles.divider} />

        {/* Fullscreen Player Button */}
        <Pressable
          focusable={false}
          android_ripple={null}
          onPress={onOpenFullscreen}
          style={[
            styles.controlBtn,
            isFullscreenFocused && styles.controlBtnFocused,
          ]}
        >
          <Image
            source={require('../../assets/ui/icon_fullscreen.png')}
            style={[
              styles.controlIcon,
              isFullscreenFocused && styles.controlIconFocused,
            ]}
            resizeMode="contain"
          />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 70,
    borderRadius: 20,
    backgroundColor: '#FAF5FF', // Clean, opaque very light violet/lavender (eliminates shadow punch-through)
    borderWidth: 1.5,
    borderColor: '#E9D5FF', // Subtle lavender border
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
    marginLeft: 22, // Indents from left side, reducing width cleanly
    marginRight: 6,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 14,
    backgroundColor: '#F1F5F9',
  },
  trackInfoCol: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 20,
    minWidth: 0,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  artistText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  progressTrack: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#E2E8F0',
    marginTop: 5,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 1.5,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  controlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  controlBtnFocused: {
    borderColor: '#A855F7',
    borderWidth: 2,
    backgroundColor: '#7C3AED',
    transform: [{ scale: 1.1 }],
  },
  controlIcon: {
    width: 15,
    height: 15,
    tintColor: '#475569',
  },
  controlIconFocused: {
    tintColor: '#FFFFFF',
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  playBtnFocused: {
    borderColor: '#C026D3',
    borderWidth: 2.5,
    backgroundColor: '#6D28D9',
    transform: [{ scale: 1.12 }],
  },
  playIcon: {
    width: 18,
    height: 18,
    tintColor: '#FFFFFF',
  },
  divider: {
    width: 1.5,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
});
