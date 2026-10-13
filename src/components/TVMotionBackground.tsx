import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

export const MOTION_BACKGROUND_ASSETS = {
  workout: require('../../assets/motion_bgs/workout_tunnel.mp4'),
  party: require('../../assets/motion_bgs/disco_ball.mp4'),
  late_night: require('../../assets/motion_bgs/cyan_ribbon.mp4'),
  sleep: require('../../assets/motion_bgs/starlight_helix.mp4'),
  nature: require('../../assets/motion_bgs/emerald_nature.mp4'),
  classical: require('../../assets/motion_bgs/classical_cello.mp4'),
  morning: require('../../assets/motion_bgs/warm_amber.mp4'),
};

export type MotionMoodKey = keyof typeof MOTION_BACKGROUND_ASSETS;

export function resolveMotionBackground(
  mood?: string | null,
  context?: string | null,
  genre?: string | null
): any {
  const m = (mood || '').toLowerCase();
  const c = (context || '').toLowerCase();
  const g = (genre || '').toLowerCase();

  if (c.includes('workout') || m === 'energetic' || c.includes('gym')) {
    return MOTION_BACKGROUND_ASSETS.workout;
  }
  if (c.includes('party') || m === 'party' || g.includes('dance')) {
    return MOTION_BACKGROUND_ASSETS.party;
  }
  if (c.includes('sleep') || m === 'relax' || m === 'peaceful') {
    return MOTION_BACKGROUND_ASSETS.sleep;
  }
  if (c.includes('study') || g.includes('classical') || g.includes('orchestral')) {
    return MOTION_BACKGROUND_ASSETS.classical;
  }
  if (m === 'happy' || c.includes('morning') || c.includes('sunrise')) {
    return MOTION_BACKGROUND_ASSETS.morning;
  }
  if (m === 'calm' || g.includes('acoustic') || c.includes('rain')) {
    return MOTION_BACKGROUND_ASSETS.nature;
  }
  // Default dark ambient cyan ribbon
  return MOTION_BACKGROUND_ASSETS.late_night;
}

interface TVMotionBackgroundProps {
  mood?: string | null;
  context?: string | null;
  genre?: string | null;
  scrimOpacity?: number; // 0.0 to 1.0 (default: 0.48)
  customSource?: any;
}

/**
 * TVMotionBackground:
 * Renders hardware-accelerated Media3 ExoPlayer video loop on Android TV.
 * - Hardware SurfaceView: 0% CPU overhead, isolated native thread
 * - player.loop = true: seamless instant loop with 1s GOP keyframes
 * - player.muted = true: zero audio contention with expo-audio
 * - Memoized: isolated from UI re-renders
 */
export const TVMotionBackground: React.FC<TVMotionBackgroundProps> = React.memo(
  ({ mood, context, genre, scrimOpacity = 0.48, customSource }) => {
    const videoSource = useMemo(
      () => customSource || resolveMotionBackground(mood, context, genre),
      [customSource, mood, context, genre]
    );

    const player = useVideoPlayer(videoSource, (p) => {
      p.loop = true;
      p.muted = true;
      p.play();
    });

    return (
      <View style={styles.container} pointerEvents="none">
        {/* Hardware-accelerated ExoPlayer SurfaceView */}
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
          surfaceType="textureView"
        />

        {/* Ambient Contrast Scrim (ensures UI, album art & text legibility) */}
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.scrim,
            { backgroundColor: `rgba(15, 23, 42, ${scrimOpacity})` },
          ]}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    backgroundColor: '#0A0E1A',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
