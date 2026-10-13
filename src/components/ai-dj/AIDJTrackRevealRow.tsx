import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Image, Animated, Easing, Text } from 'react-native';
import { MusicTrack } from '../../services/musicCatalog';

export type AIDJProcessingStage =
  | 'UNDERSTANDING'
  | 'FINDING_TRACKS'
  | 'BUILDING_MIX'
  | 'BALANCING_SESSION'
  | 'READY'
  | 'ERROR'
  | 'CANCELLED';

interface AIDJTrackRevealRowProps {
  tracks: MusicTrack[];
  revealedCount: number;
  stage: AIDJProcessingStage;
}

const FALLBACK_COVERS = [
  require('../../../assets/playlists/cover_chill_vibes.jpg'),
  require('../../../assets/playlists/cover_focus_mix.jpg'),
  require('../../../assets/playlists/cover_study_mix.jpg'),
  require('../../../assets/playlists/cover_midnight_dreams.jpg'),
  require('../../../assets/playlists/cover_workout_mix.jpg'),
];

export const AIDJTrackRevealRow: React.FC<AIDJTrackRevealRowProps> = ({
  tracks,
  revealedCount,
  stage,
}) => {
  // 5 Dedicated animated drivers for progressive track card entry
  const anim0 = useRef(new Animated.Value(0)).current;
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;
  const anim4 = useRef(new Animated.Value(0)).current;

  const animDrivers = [anim0, anim1, anim2, anim3, anim4];

  // Animate cards progressively as revealedCount increases
  useEffect(() => {
    animDrivers.forEach((driver, idx) => {
      if (idx < revealedCount) {
        Animated.spring(driver, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }).start();
      } else {
        driver.setValue(0);
      }
    });
  }, [revealedCount]);

  // Mini Equalizer Bar Pulse Driver for bottom-right badge
  const eqMiniPulse = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(eqMiniPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(eqMiniPulse, {
          toValue: 0.4,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [eqMiniPulse]);

  return (
    <View style={styles.container}>
      {[0, 1, 2, 3, 4].map((slotIdx) => {
        const isRevealed = slotIdx < revealedCount;
        const track = tracks[slotIdx];
        const driver = animDrivers[slotIdx];
        const fallbackCover = FALLBACK_COVERS[slotIdx % FALLBACK_COVERS.length];

        const cardScale = driver.interpolate({
          inputRange: [0, 1],
          outputRange: [0.86, 1],
        });

        const cardTranslateY = driver.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        });

        if (!isRevealed || !track) {
          // Subtle frosted placeholder slot
          return (
            <View key={`slot_empty_${slotIdx}`} style={styles.placeholderCard}>
              <View style={styles.placeholderInnerPulse} />
            </View>
          );
        }

        return (
          <Animated.View
            key={`${track.id || 'track'}_slot_${slotIdx}`}
            style={[
              styles.cardWrapper,
              {
                opacity: driver,
                transform: [{ scale: cardScale }, { translateY: cardTranslateY }],
              },
            ]}
          >
            {/* Real Album Artwork */}
            <Image
              source={
                track.artworkUrl
                  ? { uri: track.artworkUrl }
                  : fallbackCover
              }
              defaultSource={fallbackCover}
              style={styles.cardImage}
              resizeMode="cover"
            />

            {/* Subtle Gradient Vignette / Inner Shadow */}
            <View style={styles.cardInnerGlow} />

            {/* Bottom-Right Frosted Mini Audio Equalizer Badge */}
            <View style={styles.miniEqBadge}>
              <Animated.View
                style={[
                  styles.miniEqBar,
                  {
                    height: 4,
                    transform: [
                      {
                        scaleY: eqMiniPulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.6, 1.2],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.miniEqBar,
                  {
                    height: 7,
                    transform: [
                      {
                        scaleY: eqMiniPulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1.1, 0.5],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.miniEqBar,
                  {
                    height: 5,
                    transform: [
                      {
                        scaleY: eqMiniPulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.7, 1.3],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.miniEqBar,
                  {
                    height: 6,
                    transform: [
                      {
                        scaleY: eqMiniPulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1.2, 0.6],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 10,
    height: 74,
  },
  cardWrapper: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#312E81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 11,
  },
  cardInnerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  miniEqBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1.5,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    paddingHorizontal: 3,
    paddingVertical: 2,
    borderRadius: 3,
  },
  miniEqBar: {
    width: 1.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  placeholderCard: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: 'rgba(238, 242, 255, 0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(224, 231, 255, 0.75)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderInnerPulse: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(199, 210, 254, 0.35)',
  },
});
