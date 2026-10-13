import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AIMusicVisualizerProps {
  isAnimated?: boolean;
}

export const AIMusicVisualizer: React.FC<AIMusicVisualizerProps> = ({ isAnimated = true }) => {
  // Orb breathing scale animation (0.98 -> 1.02 -> 0.98)
  const orbScale = useRef(new Animated.Value(1)).current;
  const orbGlowOpacity = useRef(new Animated.Value(0.6)).current;

  // Orbital rings subtle rotation & breathing
  const ringRotate = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(1)).current;

  // 4 Independent harmonic drivers for smooth, organic equalizer breathing
  const eqWave1 = useRef(new Animated.Value(0.4)).current;
  const eqWave2 = useRef(new Animated.Value(0.7)).current;
  const eqWave3 = useRef(new Animated.Value(0.5)).current;
  const eqWave4 = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (!isAnimated) return;

    // 1. Central Orb Subtle Breathing (slow sine easing)
    const orbBreathing = Animated.loop(
      Animated.sequence([
        Animated.timing(orbScale, {
          toValue: 1.025,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbScale, {
          toValue: 0.98,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // 2. Orb Glow Opacity Breathing
    const glowPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(orbGlowOpacity, {
          toValue: 0.9,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(orbGlowOpacity, {
          toValue: 0.5,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // 3. Orbital Rings Gentle Drift (very slow, smooth continuous drift)
    const ringLoop = Animated.loop(
      Animated.timing(ringRotate, {
        toValue: 1,
        duration: 36000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const ringBreathing = Animated.loop(
      Animated.sequence([
        Animated.timing(ringScale, {
          toValue: 1.015,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ringScale, {
          toValue: 0.985,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // 4. Symmetrical Audio Signal Harmonic Breathing (calm, non-aggressive audio pulse)
    const createEqLoop = (animVal: Animated.Value, minVal: number, maxVal: number, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(animVal, {
            toValue: maxVal,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animVal, {
            toValue: minVal,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

    const eqLoop1 = createEqLoop(eqWave1, 0.25, 0.95, 1700);
    const eqLoop2 = createEqLoop(eqWave2, 0.35, 1.0, 1400);
    const eqLoop3 = createEqLoop(eqWave3, 0.3, 0.85, 1900);
    const eqLoop4 = createEqLoop(eqWave4, 0.4, 0.9, 1600);

    orbBreathing.start();
    glowPulse.start();
    ringLoop.start();
    ringBreathing.start();
    eqLoop1.start();
    eqLoop2.start();
    eqLoop3.start();
    eqLoop4.start();

    return () => {
      orbBreathing.stop();
      glowPulse.stop();
      ringLoop.stop();
      ringBreathing.stop();
      eqLoop1.stop();
      eqLoop2.stop();
      eqLoop3.stop();
      eqLoop4.stop();
    };
  }, [isAnimated, orbScale, orbGlowOpacity, ringRotate, ringScale, eqWave1, eqWave2, eqWave3, eqWave4]);

  const spin = ringRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const reverseSpin = ringRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  // Heights configuration for 8 symmetrical equalizer bars on each side (tapered bell curve)
  const leftBarDrivers = [
    { baseHeight: 3, driver: eqWave1, color: '#C7D2FE', isDot: true },
    { baseHeight: 5, driver: eqWave3, color: '#A5B4FC' },
    { baseHeight: 9, driver: eqWave2, color: '#93C5FD' },
    { baseHeight: 14, driver: eqWave4, color: '#818CF8' },
    { baseHeight: 19, driver: eqWave1, color: '#6366F1' },
    { baseHeight: 24, driver: eqWave2, color: '#7C3AED' },
    { baseHeight: 20, driver: eqWave3, color: '#8B5CF6' },
    { baseHeight: 14, driver: eqWave4, color: '#A78BFA' },
  ];

  const rightBarDrivers = [
    { baseHeight: 14, driver: eqWave4, color: '#A78BFA' },
    { baseHeight: 20, driver: eqWave3, color: '#8B5CF6' },
    { baseHeight: 24, driver: eqWave2, color: '#7C3AED' },
    { baseHeight: 19, driver: eqWave1, color: '#6366F1' },
    { baseHeight: 14, driver: eqWave4, color: '#818CF8' },
    { baseHeight: 9, driver: eqWave2, color: '#93C5FD' },
    { baseHeight: 5, driver: eqWave3, color: '#A5B4FC' },
    { baseHeight: 3, driver: eqWave1, color: '#C7D2FE', isDot: true },
  ];

  return (
    <View style={styles.container}>
      {/* 1. LEFT SYMMETRICAL EQUALIZER AUDIO BARS */}
      <View style={styles.eqSideContainer}>
        {leftBarDrivers.map((bar, i) => (
          <Animated.View
            key={`left_eq_${i}`}
            style={[
              bar.isDot ? styles.eqDot : styles.eqBar,
              {
                height: bar.baseHeight,
                backgroundColor: bar.color,
                transform: [
                  {
                    scaleY: bar.driver.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.45, 1.25],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>

      {/* 2. CENTRAL GLASS ORB & ORBITAL RINGS */}
      <View style={styles.orbStage}>
        {/* Soft Outer Lavender Aura Glow */}
        <Animated.View
          style={[
            styles.outerAuraGlow,
            { opacity: orbGlowOpacity },
          ]}
        />

        {/* Outer Orbital Ring with Satellites */}
        <Animated.View
          style={[
            styles.orbitalRingOuter,
            {
              transform: [{ rotate: spin }, { scale: ringScale }],
            },
          ]}
        >
          {/* Satellite bead 1 (top-left) */}
          <View style={[styles.satelliteBead, styles.satellite1]} />
          {/* Satellite bead 2 (bottom-right) */}
          <View style={[styles.satelliteBead, styles.satellite2]} />
        </Animated.View>

        {/* Inner Orbital Ring with Satellites */}
        <Animated.View
          style={[
            styles.orbitalRingInner,
            {
              transform: [{ rotate: reverseSpin }, { scale: ringScale }],
            },
          ]}
        >
          {/* Satellite bead 3 (top-right) */}
          <View style={[styles.satelliteBead, styles.satellite3]} />
          {/* Satellite bead 4 (bottom-left) */}
          <View style={[styles.satelliteBead, styles.satellite4]} />
        </Animated.View>

        {/* Glass Orb Main Body with 3D Translucent Rim & Specular Highlights */}
        <Animated.View
          style={[
            styles.glassOrb,
            { transform: [{ scale: orbScale }] },
          ]}
        >
          {/* Specular Highlight Arc at Top-Left (Glass refraction rim) */}
          <View style={styles.specularRimHighlight} />
          {/* Secondary Soft Specular Sheen */}
          <View style={styles.specularCenterSheen} />
          {/* Subtle Bottom Ambient Refraction */}
          <View style={styles.bottomRefraction} />

          {/* Centered Purple / Violet Musical Note Symbol */}
          <View style={styles.musicNoteContainer}>
            <MaterialCommunityIcons
              name="music-note"
              size={26}
              color="#7C3AED"
              style={styles.musicNoteShadow}
            />
          </View>
        </Animated.View>
      </View>

      {/* 3. RIGHT SYMMETRICAL EQUALIZER AUDIO BARS */}
      <View style={styles.eqSideContainer}>
        {rightBarDrivers.map((bar, i) => (
          <Animated.View
            key={`right_eq_${i}`}
            style={[
              bar.isDot ? styles.eqDot : styles.eqBar,
              {
                height: bar.baseHeight,
                backgroundColor: bar.color,
                transform: [
                  {
                    scaleY: bar.driver.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.45, 1.25],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 76,
    width: '100%',
    marginVertical: 2,
  },

  // Symmetrical Equalizer Sides
  eqSideContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    paddingHorizontal: 4,
  },
  eqBar: {
    width: 2.5,
    borderRadius: 2,
    opacity: 0.85,
  },
  eqDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.65,
  },

  // Central Orb Stage
  orbStage: {
    width: 114,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 6,
  },

  // Soft Ambient Background Aura Glow
  outerAuraGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E7FF',
    opacity: 0.65,
  },

  // Orbital Rings
  orbitalRingOuter: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitalRingInner: {
    position: 'absolute',
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Satellite Beads on Orbital Rings
  satelliteBead: {
    position: 'absolute',
    borderRadius: 999,
    shadowColor: '#6366F1',
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 2,
  },
  satellite1: {
    width: 5,
    height: 5,
    backgroundColor: '#818CF8',
    top: 6,
    left: 9,
  },
  satellite2: {
    width: 6,
    height: 6,
    backgroundColor: '#A78BFA',
    bottom: 6,
    right: 11,
  },
  satellite3: {
    width: 5,
    height: 5,
    backgroundColor: '#6366F1',
    top: 5,
    right: 10,
  },
  satellite4: {
    width: 4,
    height: 4,
    backgroundColor: '#C084FC',
    bottom: 9,
    left: 8,
  },

  // Glass Orb Core (3D Frosted Appearance)
  glassOrb: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },

  // Specular Highlights for Real Glass Translucency
  specularRimHighlight: {
    position: 'absolute',
    top: 3,
    left: 7,
    width: 28,
    height: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    transform: [{ rotate: '-28deg' }],
  },
  specularCenterSheen: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(224, 231, 255, 0.38)',
  },
  bottomRefraction: {
    position: 'absolute',
    bottom: -5,
    width: 38,
    height: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(167, 139, 250, 0.28)',
  },

  // Centered Purple Music Note
  musicNoteContainer: {
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  musicNoteShadow: {
    textShadowColor: 'rgba(99, 102, 241, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
