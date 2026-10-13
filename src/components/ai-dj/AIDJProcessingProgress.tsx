import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing } from 'react-native';
import { AIDJProcessingStage } from './AIDJTrackRevealRow';

interface AIDJProcessingProgressProps {
  stage: AIDJProcessingStage;
}

const STAGES: AIDJProcessingStage[] = [
  'UNDERSTANDING',
  'FINDING_TRACKS',
  'BUILDING_MIX',
  'BALANCING_SESSION',
  'READY',
];

export const AIDJProcessingProgress: React.FC<AIDJProcessingProgressProps> = ({ stage }) => {
  const activeIndex = Math.max(0, STAGES.indexOf(stage));

  // Animated line fill progress (0 -> 1)
  const lineFill = useRef(new Animated.Value(0)).current;

  // Active dot breathing pulse
  const activeDotPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const targetProgress = activeIndex / (STAGES.length - 1);
    Animated.timing(lineFill, {
      toValue: targetProgress,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [activeIndex, lineFill]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(activeDotPulse, {
          toValue: 1.25,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(activeDotPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [activeDotPulse]);

  const lineWidth = lineFill.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Background Track Line */}
      <View style={styles.trackBackground}>
        {/* Animated Filled Progress Track */}
        <Animated.View style={[styles.trackFill, { width: lineWidth }]} />
      </View>

      {/* 5 Stage Node Dots */}
      <View style={styles.dotsRow}>
        {STAGES.map((s, idx) => {
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;

          return (
            <View key={s} style={styles.dotSlot}>
              {isActive ? (
                <View style={styles.activeDotContainer}>
                  {/* Outer Glowing Breathing Ring */}
                  <Animated.View
                    style={[
                      styles.activeHalo,
                      { transform: [{ scale: activeDotPulse }] },
                    ]}
                  />
                  {/* Inner Active Dot */}
                  <View style={styles.activeCoreDot} />
                </View>
              ) : isCompleted ? (
                <View style={styles.completedDot} />
              ) : (
                <View style={styles.inactiveDot} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 230,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    position: 'relative',
  },
  trackBackground: {
    position: 'absolute',
    left: 6,
    right: 6,
    height: 2.5,
    backgroundColor: 'rgba(216, 180, 254, 0.45)', // very light pastel lavender
    borderRadius: 2,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 2,
  },
  dotsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
    paddingHorizontal: 2,
  },
  dotSlot: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDotContainer: {
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeHalo: {
    position: 'absolute',
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
  },
  activeCoreDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#7C3AED',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
    elevation: 2,
  },
  completedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7C3AED',
  },
  inactiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(216, 180, 254, 0.75)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
});
