import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from 'react-native';
import { useAudioPlayer } from 'expo-audio';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Color Palette: Premium Gallery Light Theme
const COLORS = {
  bg: '#F8F9FB', // Pristine ceramic gallery canvas
  mainLight: '#0F172A', // Deep obsidian slate ink
  brandAccent: '#6366F1', // Radiant royal iris
  brandGlow: 'rgba(99, 102, 241, 0.20)',
  lightGlow: 'rgba(15, 23, 42, 0.08)',
  textMuted: '#64748B', // Refined slate caption
};

interface SonicIntroSequenceProps {
  onComplete: () => void;
  onDockStart?: () => void;
}

export function SonicIntroSequence({
  onComplete,
  onDockStart,
}: SonicIntroSequenceProps) {
  // Synthesized 3.50s audio identity:
  // 1. Atmosphere: 55Hz low ambient swell (0.00s)
  // 2. Motion thump: whoom pulse (0.35s - 1.20s)
  // 3. Sonic identity: crystal chime motif with lush stereo decay (1.60s - 3.50s)
  const introAudio = useAudioPlayer(require('../../assets/audio/intro_sound.wav'));

  // Master animation drivers
  // Phase 1: 0.00 - 0.35s (0 - 350ms) - Initial point of sound ink
  const pointScale = useRef(new Animated.Value(0)).current;
  const pointOpacity = useRef(new Animated.Value(0)).current;

  // Phase 2: 0.35 - 0.85s (350 - 850ms) - Acoustic pulse rings & orbital nodes
  const pulseRing1Scale = useRef(new Animated.Value(0.4)).current;
  const pulseRing1Opacity = useRef(new Animated.Value(0)).current;
  const pulseRing2Scale = useRef(new Animated.Value(0.2)).current;
  const pulseRing2Opacity = useRef(new Animated.Value(0)).current;
  const orbitalSpread = useRef(new Animated.Value(0)).current;
  const orbitalOpacity = useRef(new Animated.Value(0)).current;

  // Ephemeral teaser caption (0.45s - 1.55s)
  const microCaptionOpacity = useRef(new Animated.Value(0)).current;
  const microCaptionTranslateY = useRef(new Animated.Value(10)).current;

  // Phase 3: 0.85 - 1.65s (850 - 1650ms) - Iris transition & accents
  const violetAccentOpacity = useRef(new Animated.Value(0)).current;

  // Phase 4: 1.65 - 2.20s (1650 - 2200ms) - Reorganize to Logo & Lock
  const logoScale = useRef(new Animated.Value(0.65)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoGleam = useRef(new Animated.Value(0)).current;
  const particlesCollapse = useRef(new Animated.Value(1)).current;

  // Brand Typography (Title + Subtitle) (1.75s - 2.85s)
  const brandTitleOpacity = useRef(new Animated.Value(0)).current;
  const brandTitleTranslateY = useRef(new Animated.Value(16)).current;
  const brandTitleScale = useRef(new Animated.Value(0.92)).current;

  const brandSubtitleOpacity = useRef(new Animated.Value(0)).current;
  const brandSubtitleTranslateY = useRef(new Animated.Value(10)).current;

  // Phase 5: 2.85 - 3.50s (2850 - 3500ms) - Natural Dock into Home
  const dockTranslateX = useRef(new Animated.Value(0)).current;
  const dockTranslateY = useRef(new Animated.Value(0)).current;
  const dockScale = useRef(new Animated.Value(1.0)).current;
  const introContainerOpacity = useRef(new Animated.Value(1.0)).current;

  useEffect(() => {
    // 1. Play audio immediately (rewound to 0 for instant replay)
    try {
      introAudio.seekTo(0);
      introAudio.play();
    } catch (_) {
      try {
        introAudio.play();
      } catch (__) {}
    }

    // 2. Precision choreography timeline (~3.50s = 3500ms)

    // T = 0.00s - 0.35s (350ms): Tiny obsidian droplet appears at center
    Animated.parallel([
      Animated.timing(pointScale, {
        toValue: 1.0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(pointOpacity, {
        toValue: 1.0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // T = 0.35s - 0.85s (500ms): Point expands into circular acoustic pulse (whoom)
    const timerPhase2 = setTimeout(() => {
      Animated.parallel([
        // Pulse ring 1 (sharp acoustic pulse)
        Animated.timing(pulseRing1Scale, {
          toValue: 3.8,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(pulseRing1Opacity, {
            toValue: 0.95,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.timing(pulseRing1Opacity, {
            toValue: 0.0,
            duration: 440,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        // Pulse ring 2 (subtle trailing harmonic)
        Animated.timing(pulseRing2Scale, {
          toValue: 5.4,
          duration: 650,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(pulseRing2Opacity, {
            toValue: 0.70,
            duration: 190,
            useNativeDriver: true,
          }),
          Animated.timing(pulseRing2Opacity, {
            toValue: 0.0,
            duration: 460,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        // Orbital acoustic nodes emerge
        Animated.timing(orbitalSpread, {
          toValue: 1.0,
          duration: 520,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(orbitalOpacity, {
          toValue: 0.95,
          duration: 280,
          useNativeDriver: true,
        }),
        // Ephemeral micro-caption gently rises: "ACOUSTIC INTELLIGENCE"
        Animated.timing(microCaptionOpacity, {
          toValue: 0.85,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(microCaptionTranslateY, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 350);

    // T = 0.85s - 1.65s (800ms): Pulse expands into organic transition
    const timerPhase3 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(violetAccentOpacity, {
          toValue: 1.0,
          duration: 550,
          delay: 150,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pointOpacity, {
          toValue: 0.30,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }, 850);

    // T = 1.50s: Micro-caption dissolves smoothly
    const timerDissolveMicro = setTimeout(() => {
      Animated.timing(microCaptionOpacity, {
        toValue: 0.0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }, 1500);

    // T = 1.65s - 2.15s (500ms): Snap into the Sonic Brand Mark + Chime strikes
    const timerPhase4 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(particlesCollapse, {
          toValue: 0.0,
          duration: 360,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(orbitalOpacity, {
          toValue: 0.0,
          duration: 300,
          useNativeDriver: true,
        }),
        // Fade out initial center point completely so it does not bleed through logo
        Animated.timing(pointOpacity, {
          toValue: 0.0,
          duration: 250,
          useNativeDriver: true,
        }),
        // Logo appears & expands with slight bounce
        Animated.timing(logoOpacity, {
          toValue: 1.0,
          duration: 340,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1.06,
          duration: 400,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
      ]).start();
    }, 1650);

    // T = 1.85s: Brand Title "SONIC" glides upward into view
    const timerBrandTitle = setTimeout(() => {
      Animated.parallel([
        Animated.timing(brandTitleOpacity, {
          toValue: 1.0,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(brandTitleTranslateY, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(brandTitleScale, {
          toValue: 1.0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 1850);

    // T = 2.05s: Subtitle "INTELLIGENT MUSIC EXPERIENCE" glides in
    const timerBrandSubtitle = setTimeout(() => {
      Animated.parallel([
        Animated.timing(brandSubtitleOpacity, {
          toValue: 1.0,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.timing(brandSubtitleTranslateY, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 2050);

    // T = 2.20s - 2.85s (650ms): Brand Lock & Iris Gleam Pulse
    const timerPhase5 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1.00,
          duration: 350,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(logoGleam, {
            toValue: 1.0,
            duration: 220,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(logoGleam, {
            toValue: 0.25,
            duration: 220,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }, 2200);

    // T = 2.85s - 3.50s (650ms): Natural Transition & Docking into Header
    const timerPhase6 = setTimeout(() => {
      onDockStart && onDockStart();

      Animated.parallel([
        // Logo glides smoothly from center to header position
        Animated.timing(dockTranslateX, {
          toValue: -(SCREEN_WIDTH * 0.42),
          duration: 620,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(dockTranslateY, {
          toValue: -(SCREEN_HEIGHT * 0.42),
          duration: 620,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(dockScale, {
          toValue: 0.46,
          duration: 620,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        // Brand text fades out as crest moves to header
        Animated.timing(brandTitleOpacity, {
          toValue: 0.0,
          duration: 400,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(brandSubtitleOpacity, {
          toValue: 0.0,
          duration: 350,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        // Container background remains #F8F9FB, overlay layer fades smoothly
        Animated.timing(introContainerOpacity, {
          toValue: 0.0,
          duration: 580,
          delay: 50,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        onComplete();
      });
    }, 2850);

    return () => {
      clearTimeout(timerPhase2);
      clearTimeout(timerPhase3);
      clearTimeout(timerDissolveMicro);
      clearTimeout(timerPhase4);
      clearTimeout(timerBrandTitle);
      clearTimeout(timerBrandSubtitle);
      clearTimeout(timerPhase5);
      clearTimeout(timerPhase6);
    };
  }, []);

  // 8 Orbital Acoustic Nodes coordinates around center
  const orbitalAngles = [0, 45, 90, 135, 180, 225, 270, 315];
  const ORBIT_RADIUS = 68;



  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.overlay,
        {
          opacity: introContainerOpacity,
        },
      ]}
    >
      <View style={styles.centerAnchor}>
        {/* Layer 1: Initial Central Point (0.00s - 0.85s) */}
        <Animated.View
          style={[
            styles.corePoint,
            {
              transform: [{ scale: pointScale }],
              opacity: Animated.multiply(pointOpacity, particlesCollapse),
            },
          ]}
        >
          <View style={styles.corePointGlow} />
        </Animated.View>

        {/* Layer 2: Expanding Acoustic Pulse Rings (0.35s - 0.85s) */}
        <Animated.View
          style={[
            styles.pulseRing,
            styles.pulseRing1,
            {
              transform: [{ scale: pulseRing1Scale }],
              opacity: pulseRing1Opacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.pulseRing,
            styles.pulseRing2,
            {
              transform: [{ scale: pulseRing2Scale }],
              opacity: pulseRing2Opacity,
            },
          ]}
        />

        {/* Layer 3: Orbital Acoustic Nodes (Resonant Particles) */}
        {orbitalAngles.map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const targetX = Math.cos(rad) * ORBIT_RADIUS;
          const targetY = Math.sin(rad) * ORBIT_RADIUS;

          const stretchXMulti = 1.7;
          const stretchYMulti = 0.55;

          const nodeTranslateX = Animated.multiply(
            orbitalSpread,
            targetX * stretchXMulti
          );
          const nodeTranslateY = Animated.multiply(
            orbitalSpread,
            targetY * stretchYMulti
          );

          return (
            <Animated.View
              key={`orbit_node_${i}`}
              style={[
                styles.orbitalNode,
                {
                  opacity: Animated.multiply(orbitalOpacity, particlesCollapse),
                  transform: [
                    { translateX: nodeTranslateX },
                    { translateY: nodeTranslateY },
                    { scale: particlesCollapse },
                  ],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.nodeVioletDot,
                  { opacity: violetAccentOpacity },
                ]}
              />
            </Animated.View>
          );
        })}



        {/* Layer 4B: Ephemeral Micro-Caption during Wave Expansion */}
        <Animated.View
          style={[
            styles.microCaptionWrapper,
            {
              opacity: microCaptionOpacity,
              transform: [{ translateY: microCaptionTranslateY }],
            },
          ]}
        >
          <Text style={styles.microCaptionText}>ACOUSTIC INTELLIGENCE</Text>
        </Animated.View>

        {/* Layer 5: App Logo Crest & Docking (1.65s - 3.50s) */}
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              opacity: logoOpacity,
              transform: [
                { translateX: dockTranslateX },
                { translateY: dockTranslateY },
                { scale: Animated.multiply(logoScale, dockScale) },
              ],
            },
          ]}
        >
          {/* Subtle iris brand aura */}
          <Animated.View
            style={[
              styles.logoAura,
              {
                opacity: Animated.add(0.28, Animated.multiply(logoGleam, 0.45)),
              },
            ]}
          />

          {/* Master Vector-Rendered Music Logo */}
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Layer 6: Brand Typography & Tagline (1.85s - 2.85s) */}
        <Animated.View
          style={[
            styles.brandTypographyContainer,
            {
              opacity: brandTitleOpacity,
              transform: [
                { translateY: brandTitleTranslateY },
                { scale: brandTitleScale },
              ],
            },
          ]}
        >
          <View style={styles.brandTitleRow}>
            <Text style={styles.brandTitleText}>PANDIVO</Text>
            <View style={styles.brandTitleBadge}>
              <Text style={styles.brandTitleBadgeText}>MUSIC</Text>
            </View>
          </View>

          <Animated.View
            style={[
              styles.brandSubtitleRow,
              {
                opacity: brandSubtitleOpacity,
                transform: [{ translateY: brandSubtitleTranslateY }],
              },
            ]}
          >
            <View style={styles.subtitleDash} />
            <Text style={styles.brandSubtitleText}>
              INTELLIGENT MUSIC EXPERIENCE
            </Text>
            <View style={styles.subtitleDash} />
          </Animated.View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: COLORS.bg,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerAnchor: {
    width: 360,
    height: 360,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Core initial point
  corePoint: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.mainLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corePointGlow: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGlow,
  },
  // Concentric pulse rings
  pulseRing: {
    position: 'absolute',
    borderRadius: 999,
  },
  pulseRing1: {
    width: 64,
    height: 64,
    borderWidth: 1.5,
    borderColor: COLORS.mainLight,
  },
  pulseRing2: {
    width: 104,
    height: 104,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.20)',
  },
  // Orbital acoustic nodes
  orbitalNode: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.mainLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeVioletDot: {
    ...StyleSheet.absoluteFill,
    borderRadius: 3,
    backgroundColor: COLORS.brandAccent,
  },

  // Ephemeral micro-caption during wave expansion
  microCaptionWrapper: {
    position: 'absolute',
    top: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  microCaptionText: {
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 6,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  // Logo Mark
  logoWrapper: {
    position: 'absolute',
    width: 104,
    height: 104,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoAura: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: COLORS.brandGlow,
  },
  logoImage: {
    width: 96,
    height: 96,
  },
  // Brand Typography & Tagline
  brandTypographyContainer: {
    position: 'absolute',
    top: 252,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  brandTitleText: {
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'System',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 6,
    color: COLORS.mainLight,
  },
  brandTitleBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.30)',
  },
  brandTitleBadgeText: {
    fontFamily: Platform.OS === 'android' ? 'sans-serif-condensed' : 'System',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: COLORS.brandAccent,
  },
  brandSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    gap: 8,
  },
  subtitleDash: {
    width: 14,
    height: 1.5,
    backgroundColor: 'rgba(99, 102, 241, 0.40)',
    borderRadius: 1,
  },
  brandSubtitleText: {
    fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'System',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 4.5,
    color: COLORS.brandAccent,
    textTransform: 'uppercase',
  },
});
