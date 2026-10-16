import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  forwardRef,
} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Animated,
  Easing,
  Dimensions,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AvatarId, VALID_AVATAR_IDS } from '../database/repositories/avatarPreferenceRepository';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 5 Music Companions with precise metadata, asset mapping, and spatial positions
export interface CompanionItem {
  id: AvatarId;
  name: string;
  species: string;
  source: any;
  // Relative position coordinates along the shallow curve across the 16:9 TV canvas
  xPercent: number;
  yPercent: number;
}

export const COMPANIONS: CompanionItem[] = [
  {
    id: 'bamboo',
    name: 'Bamboo',
    species: 'Panda',
    source: require('../../assets/avatars/avatar_bamboo.webp'),
    xPercent: 0.114,
    yPercent: 0.472,
  },
  {
    id: 'ember',
    name: 'Ember',
    species: 'Orange Fox',
    source: require('../../assets/avatars/avatar_ember.webp'),
    xPercent: 0.295,
    yPercent: 0.600,
  },
  {
    id: 'frost',
    name: 'Frost',
    species: 'White Wolf',
    source: require('../../assets/avatars/avatar_frost.webp'),
    xPercent: 0.500,
    yPercent: 0.655,
  },
  {
    id: 'sunny',
    name: 'Sunny',
    species: 'Golden Dog',
    source: require('../../assets/avatars/avatar_sunny.webp'),
    xPercent: 0.705,
    yPercent: 0.600,
  },
  {
    id: 'shadow',
    name: 'Shadow',
    species: 'Dark Cat',
    source: require('../../assets/avatars/avatar_shadow.webp'),
    xPercent: 0.886,
    yPercent: 0.472,
  },
];

// Color letters for "vibe" gradient heading
const VIBE_GRADIENT_LETTERS = [
  { char: 'v', color: '#2563EB' }, // Electric royal blue
  { char: 'i', color: '#6366F1' }, // Royal iris
  { char: 'b', color: '#A855F7' }, // Radiant orchid purple
  { char: 'e', color: '#EC4899' }, // Vibrant pink
];

// Base avatar dimension on standard 1080p TV layout
const BASE_AVATAR_SIZE = 118;
const FOCUSED_SCALE = 1.30;
const UNFOCUSED_SCALE = 0.95;

// ---------------------------------------------------------------------------
// Premium backdrop helpers (visual only, no extra dependencies)
// Palette: White + #E6D7FA (lavender) + #F8E6FA (blush)
// ---------------------------------------------------------------------------
const PALETTE = {
  white: '#FFFFFF',
  lavender: '#E6D7FA',
  blush: '#F8E6FA',
};

// Vertical colour ramp: blush crown -> white light behind the content -> lavender floor
const BG_GRADIENT_STOPS: { t: number; hex: string }[] = [
  { t: 0.0, hex: '#F8E6FA' },
  { t: 0.38, hex: '#FFFFFF' },
  { t: 0.7, hex: '#F5EFFD' },
  { t: 1.0, hex: '#E6D7FA' },
];

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
};

const gradientColorAt = (t: number): string => {
  const stops = BG_GRADIENT_STOPS;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (t >= a.t && t <= b.t) {
      const k = (t - a.t) / (b.t - a.t);
      const [r1, g1, b1] = hexToRgb(a.hex);
      const [r2, g2, b2] = hexToRgb(b.hex);
      const mix = (x: number, y: number) => Math.round(x + (y - x) * k);
      return `rgb(${mix(r1, r2)}, ${mix(g1, g2)}, ${mix(b1, b2)})`;
    }
  }
  return stops[stops.length - 1].hex;
};

// Smooth top-to-bottom gradient built from thin strips (works without expo-linear-gradient)
const GRADIENT_STRIPS = 36;
const GradientBackdrop = React.memo(() => {
  const strips = useMemo(() => {
    const h = SCREEN_HEIGHT / GRADIENT_STRIPS;
    return Array.from({ length: GRADIENT_STRIPS }, (_, i) => ({
      key: i,
      top: i * h,
      height: h + 1, // 1px overlap avoids hairline seams
      color: gradientColorAt((i + 0.5) / GRADIENT_STRIPS),
    }));
  }, []);
  return (
    <View style={StyleSheet.absoluteFill}>
      {strips.map((s) => (
        <View
          key={s.key}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: s.top,
            height: s.height,
            backgroundColor: s.color,
          }}
        />
      ))}
    </View>
  );
});

// Soft radial light: stacked translucent discs fake a blurred glow (no hard edges)
interface RadialGlowProps {
  size: number;
  color: string;
  peak?: number;
  layers?: number;
  style?: any;
}
const RadialGlow = React.memo(({ size, color, peak = 0.8, layers = 14, style }: RadialGlowProps) => {
  const alpha = 1 - Math.pow(1 - peak, 1 / layers);
  return (
    <View
      pointerEvents="none"
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      {Array.from({ length: layers }, (_, i) => {
        const d = size * Math.sqrt(1 - i / layers);
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: d,
              height: d,
              borderRadius: d / 2,
              backgroundColor: color,
              opacity: alpha,
            }}
          />
        );
      })}
    </View>
  );
});

// Spotlight that glides with the focused avatar (re-uses the existing indicator animated values)
const AURA_SIZE = BASE_AVATAR_SIZE * 4.8;
const AURA_OFFSET_Y = (BASE_AVATAR_SIZE * FOCUSED_SCALE) / 2 + 70 - AURA_SIZE / 2;
const FLOOR_GLOW_SIZE = SCREEN_WIDTH * 0.9;

export interface AvatarSelectionScreenRef {
  handleRemoteEvent: (key: string) => void;
  handleLeft: () => void;
  handleRight: () => void;
  handleSelect: () => void;
  getCurrentAvatarId: () => AvatarId;
}

interface AvatarSelectionScreenProps {
  onConfirmAvatar: (avatarId: AvatarId) => void;
  onCancel?: () => void;
  initialSelectedAvatarId?: AvatarId;
}

export const AvatarSelectionScreen = forwardRef<
  AvatarSelectionScreenRef,
  AvatarSelectionScreenProps
>(({ onConfirmAvatar, onCancel, initialSelectedAvatarId = 'bamboo' }, ref) => {
  // Determine initial index (default to Bamboo at index 0)
  const initialIndex = Math.max(
    0,
    COMPANIONS.findIndex((c) => c.id === initialSelectedAvatarId)
  );

  const [selectedIndex, setSelectedIndex] = useState<number>(
    initialIndex !== -1 ? initialIndex : 0
  );
  const selectedIndexRef = useRef<number>(initialIndex !== -1 ? initialIndex : 0);
  selectedIndexRef.current = selectedIndex;

  const isTransitioningRef = useRef<boolean>(false);
  const isConfirmingRef = useRef<boolean>(false);

  // Master entrance animations
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-16)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const carouselOpacity = useRef(new Animated.Value(0)).current;

  // Individual companion scale and focus ring animations
  const focusAnims = useRef(
    COMPANIONS.map((_, i) => new Animated.Value(i === (initialIndex !== -1 ? initialIndex : 2) ? 1 : 0))
  ).current;

  // Calculate indicator coordinates for initial selection
  const getIndicatorCoords = (index: number) => {
    const comp = COMPANIONS[index];
    const centerX = comp.xPercent * SCREEN_WIDTH;
    const centerY = comp.yPercent * SCREEN_HEIGHT;
    // Position comfortably above avatar ears and head (radius + spacing)
    const scaledRadius = (BASE_AVATAR_SIZE * FOCUSED_SCALE) / 2;
    return {
      x: centerX,
      y: centerY - scaledRadius - 70,
    };
  };

  const initialCoords = getIndicatorCoords(initialIndex !== -1 ? initialIndex : 2);
  const indicatorX = useRef(new Animated.Value(initialCoords.x)).current;
  const indicatorY = useRef(new Animated.Value(initialCoords.y)).current;
  const indicatorOpacity = useRef(new Animated.Value(1)).current;
  const confirmPulseAnim = useRef(new Animated.Value(1)).current;


  // Fade-in choreography on screen mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        delay: 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 400,
        delay: 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(carouselOpacity, {
        toValue: 1,
        duration: 500,
        delay: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [screenOpacity, headerOpacity, headerTranslateY, carouselOpacity]);

  // Smooth focus transition when moving between companions
  const animateToCompanion = useCallback(
    (targetIndex: number) => {
      if (isTransitioningRef.current || isConfirmingRef.current) return;
      if (targetIndex < 0 || targetIndex >= COMPANIONS.length) return;

      const prevIndex = selectedIndexRef.current;
      if (prevIndex === targetIndex) return;

      isTransitioningRef.current = true;
      setSelectedIndex(targetIndex);
      selectedIndexRef.current = targetIndex;

      const targetCoords = getIndicatorCoords(targetIndex);

      // Coordinated parallel animations:
      // 1. Current avatar smoothly scales down
      // 2. Next avatar smoothly scales up into active position
      // 3. Selection ring transitions smoothly
      // 4. Chevron & name smoothly translate to newly focused avatar
      // 5. Name text smoothly crossfades
      Animated.parallel([
        Animated.timing(focusAnims[prevIndex], {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(focusAnims[targetIndex], {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(indicatorX, {
          toValue: targetCoords.x,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(indicatorY, {
          toValue: targetCoords.y,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(indicatorOpacity, {
            toValue: 0.1,
            duration: 90,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(indicatorOpacity, {
            toValue: 1,
            duration: 170,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        isTransitioningRef.current = false;
      });
    },
    [focusAnims, indicatorX, indicatorY, indicatorOpacity]
  );

  // Navigate LEFT: move focus to previous companion (bounds: stops at Bamboo)
  const handleLeft = useCallback(() => {
    const current = selectedIndexRef.current;
    if (current > 0) {
      animateToCompanion(current - 1);
    }
  }, [animateToCompanion]);

  // Navigate RIGHT: move focus to next companion (bounds: stops at Shadow)
  const handleRight = useCallback(() => {
    const current = selectedIndexRef.current;
    if (current < COMPANIONS.length - 1) {
      animateToCompanion(current + 1);
    }
  }, [animateToCompanion]);

  // SELECT / ENTER: Confirm selection, play confirmation pulse, callback to parent
  const handleSelect = useCallback(() => {
    if (isConfirmingRef.current) return;
    isConfirmingRef.current = true;

    const chosenCompanion = COMPANIONS[selectedIndexRef.current];
    console.log('[AvatarSelectionScreen] Confirmed companion:', chosenCompanion.id, chosenCompanion.name);

    // Play confirmation scale pulse and glow
    Animated.sequence([
      Animated.timing(confirmPulseAnim, {
        toValue: 1.15,
        duration: 150,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(confirmPulseAnim, {
        toValue: 1.0,
        duration: 180,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 320,
        delay: 50,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onConfirmAvatar(chosenCompanion.id);
    });
  }, [confirmPulseAnim, screenOpacity, onConfirmAvatar]);

  // Centralized remote event handler
  const handleRemoteEvent = useCallback(
    (key: string) => {
      const lower = key.toLowerCase();
      if (lower === 'left') {
        handleLeft();
      } else if (lower === 'right') {
        handleRight();
      } else if (lower === 'select' || lower === 'dpad_center' || lower === 'enter') {
        handleSelect();
      } else if (lower === 'back' || lower === 'escape') {
        if (onCancel) {
          onCancel();
        }
      }
      // 'up', 'down': keep focus securely on the avatar selection carousel
    },
    [handleLeft, handleRight, handleSelect, onCancel]
  );

  // Expose methods via ref for deterministic TV remote routing
  useImperativeHandle(
    ref,
    () => ({
      handleRemoteEvent,
      handleLeft,
      handleRight,
      handleSelect,
      getCurrentAvatarId: () => COMPANIONS[selectedIndexRef.current].id,
    }),
    [handleRemoteEvent, handleLeft, handleRight, handleSelect]
  );

  // Precompute connecting track curve segments between adjacent companions
  const connectingSegments = useMemo(() => {
    const segments = [];
    for (let i = 0; i < COMPANIONS.length - 1; i++) {
      const c1 = COMPANIONS[i];
      const c2 = COMPANIONS[i + 1];
      const x1 = c1.xPercent * SCREEN_WIDTH;
      const y1 = c1.yPercent * SCREEN_HEIGHT;
      const x2 = c2.xPercent * SCREEN_WIDTH;
      const y2 = c2.yPercent * SCREEN_HEIGHT;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.hypot(dx, dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      segments.push({
        id: `seg_${c1.id}_${c2.id}`,
        midX,
        midY,
        length,
        angle,
        junctionX: (x1 + x2) / 2,
        junctionY: (y1 + y2) / 2,
      });
    }
    return segments;
  }, []);

  const activeCompanion = COMPANIONS[selectedIndex];

  return (
    <Animated.View style={[styles.rootContainer, { opacity: screenOpacity }]}>
      {/* 1. Premium layered background: White + #E6D7FA + #F8E6FA */}
      <View style={styles.backgroundContainer} pointerEvents="none">
        {/* Vertical gradient: blush crown -> white -> lavender floor */}
        <GradientBackdrop />

        {/* Corner depth: lavender at the top corners, blush at the bottom corners */}
        <RadialGlow
          size={SCREEN_WIDTH * 0.7}
          color={PALETTE.lavender}
          peak={0.55}
          style={{ position: 'absolute', left: -SCREEN_WIDTH * 0.35, top: -SCREEN_WIDTH * 0.35 }}
        />
        <RadialGlow
          size={SCREEN_WIDTH * 0.7}
          color={PALETTE.lavender}
          peak={0.55}
          style={{ position: 'absolute', right: -SCREEN_WIDTH * 0.35, top: -SCREEN_WIDTH * 0.35 }}
        />
        <RadialGlow
          size={SCREEN_WIDTH * 0.7}
          color={PALETTE.blush}
          peak={0.9}
          style={{ position: 'absolute', left: -SCREEN_WIDTH * 0.35, bottom: -SCREEN_WIDTH * 0.35 }}
        />
        <RadialGlow
          size={SCREEN_WIDTH * 0.7}
          color={PALETTE.blush}
          peak={0.9}
          style={{ position: 'absolute', right: -SCREEN_WIDTH * 0.35, bottom: -SCREEN_WIDTH * 0.35 }}
        />

        {/* Soft white light pool behind the header */}
        <RadialGlow
          size={SCREEN_WIDTH * 0.7}
          color={PALETTE.white}
          peak={0.9}
          style={{
            position: 'absolute',
            left: SCREEN_WIDTH * 0.15,
            top: SCREEN_HEIGHT * 0.14 - SCREEN_WIDTH * 0.35,
            transform: [{ scaleY: 0.55 }],
          }}
        />

        {/* Pooled light on the "stage floor" beneath the carousel */}
        <View
          style={{
            position: 'absolute',
            left: SCREEN_WIDTH / 2 - FLOOR_GLOW_SIZE / 2,
            top: SCREEN_HEIGHT * 0.8 - FLOOR_GLOW_SIZE / 2,
            transform: [{ scaleY: 0.14 }],
          }}
        >
          <RadialGlow size={FLOOR_GLOW_SIZE} color={PALETTE.white} peak={0.85} />
        </View>
        <View style={styles.floorHorizon} />

        {/* Spotlight + sound-wave ripples that follow the focused companion */}
        <Animated.View
          style={[
            styles.focusAura,
            {
              transform: [{ translateX: indicatorX }, { translateY: indicatorY }],
            },
          ]}
        >
          <RadialGlow size={AURA_SIZE} color={PALETTE.white} peak={0.95} />
          <View style={[styles.auraRing, { width: BASE_AVATAR_SIZE * 2.1, height: BASE_AVATAR_SIZE * 2.1, borderRadius: BASE_AVATAR_SIZE * 1.05, opacity: 0.95 }]} />
          <View style={[styles.auraRing, { width: BASE_AVATAR_SIZE * 3.1, height: BASE_AVATAR_SIZE * 3.1, borderRadius: BASE_AVATAR_SIZE * 1.55, opacity: 0.6 }]} />
          <View style={[styles.auraRing, { width: BASE_AVATAR_SIZE * 4.2, height: BASE_AVATAR_SIZE * 4.2, borderRadius: BASE_AVATAR_SIZE * 2.1, opacity: 0.35 }]} />
        </Animated.View>
      </View>

      {/* 2. Top Header Section: Equalizer Logo, "Choose your vibe", Subtitle */}
      <Animated.View
        style={[
          styles.headerContainer,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        {/* Colorful Equalizer Logo (5 vertical gradient pill bars) */}
        <View style={styles.equalizerContainer}>
          <View style={[styles.eqBar, { height: 12, backgroundColor: '#818CF8' }]} />
          <View style={[styles.eqBar, { height: 22, backgroundColor: '#A78BFA' }]} />
          <View style={[styles.eqBar, { height: 32, backgroundColor: '#C084FC' }]} />
          <View style={[styles.eqBar, { height: 22, backgroundColor: '#E879F9' }]} />
          <View style={[styles.eqBar, { height: 12, backgroundColor: '#F472B6' }]} />
        </View>

        {/* Main Heading: "Choose your " (dark navy) + "vibe" (gradient letters) */}
        <View style={styles.titleRow}>
          <Text style={styles.titleChooseYour}>Choose your </Text>
          <View style={styles.vibeLettersRow}>
            {VIBE_GRADIENT_LETTERS.map((letter, idx) => (
              <Text key={idx} style={[styles.vibeLetter, { color: letter.color }]}>
                {letter.char}
              </Text>
            ))}
          </View>
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitleText}>
          Pick your music companion and make this experience yours.
        </Text>
      </Animated.View>

      {/* 3. Avatar Carousel Area along shallow curved path */}
      <Animated.View style={[styles.carouselContainer, { opacity: carouselOpacity }]}>
        {/* Floating Indicator: Downward Chevron + Selected Avatar Name */}
        <Animated.View
          style={[
            styles.floatingIndicatorContainer,
            {
              transform: [
                { translateX: indicatorX },
                { translateY: indicatorY },
              ],
              opacity: indicatorOpacity,
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.indicatorInner}>
            <Feather name="chevron-down" size={26} color="#3B82F6" style={styles.chevronIcon} />
            <Text style={styles.selectedNameText}>{activeCompanion.name}</Text>
          </View>
        </Animated.View>

        {/* Curved connecting arc track between companions in #E6D7FA */}
        {connectingSegments.map((seg) => (
          <React.Fragment key={seg.id}>
            <View
              style={{
                position: 'absolute',
                left: seg.midX - seg.length / 2,
                top: seg.midY - 1.5,
                width: seg.length,
                height: 3,
                backgroundColor: '#E6D7FA',
                borderRadius: 1.5,
                shadowColor: '#C4B0F0',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.45,
                shadowRadius: 6,
                transform: [{ rotate: `${seg.angle}deg` }],
                zIndex: 5,
              }}
            />
            {/* Connecting node dot with white fill and #E6D7FA border */}
            <View
              style={{
                position: 'absolute',
                left: seg.junctionX - 5,
                top: seg.junctionY - 5,
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: '#FFFFFF',
                borderWidth: 2.5,
                borderColor: '#E6D7FA',
                shadowColor: '#C4B0F0',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 5,
                zIndex: 6,
              }}
            />
          </React.Fragment>
        ))}

        {/* 5 Companion Avatars */}
        {COMPANIONS.map((companion, index) => {
          const isSelected = selectedIndex === index;
          const focusAnim = focusAnims[index];

          // Interpolations for smooth scaling, ring opacity, and lighting
          const avatarScale = focusAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [UNFOCUSED_SCALE, FOCUSED_SCALE],
          });

          const ringOpacity = focusAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });

          const glowOpacity = focusAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.95],
          });

          const unselectedBorderOpacity = focusAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.75, 0],
          });

          const centerX = companion.xPercent * SCREEN_WIDTH;
          const centerY = companion.yPercent * SCREEN_HEIGHT;

          return (
            <View
              key={companion.id}
              style={[
                styles.avatarPositionWrapper,
                {
                  left: centerX - BASE_AVATAR_SIZE / 2,
                  top: centerY - BASE_AVATAR_SIZE / 2,
                },
              ]}
            >
              <Pressable
                focusable={false}
                onPress={() => {
                  if (isSelected) {
                    handleSelect();
                  } else {
                    animateToCompanion(index);
                  }
                }}
                style={styles.avatarPressable}
              >
                {/* Floor light reflection beneath focused avatar */}
                <Animated.View
                  style={[
                    styles.floorReflection,
                    {
                      opacity: glowOpacity,
                      transform: [{ scale: isSelected ? confirmPulseAnim : 1 }],
                    },
                  ]}
                />

                {/* Animated Avatar Container (Scale + Confirm Pulse) */}
                <Animated.View
                  style={[
                    styles.avatarCircleContainer,
                    {
                      transform: [
                        { scale: avatarScale },
                        isSelected ? { scale: confirmPulseAnim } : { scale: 1 },
                      ],
                    },
                  ]}
                >
                  {/* Outer Luminous Glowing Selection Ring */}
                  <Animated.View
                    style={[
                      styles.selectionGlowRing,
                      { opacity: ringOpacity },
                    ]}
                  />

                  {/* Soft outer halo for a double-ring premium look */}
                  <Animated.View
                    style={[
                      styles.selectionHaloRing,
                      { opacity: ringOpacity },
                    ]}
                  />

                  {/* Clean Subtle Unfocused Ring */}
                  <Animated.View
                    style={[
                      styles.unfocusedBorderRing,
                      { opacity: unselectedBorderOpacity },
                    ]}
                  />

                  {/* Backdrop circular disc for soft fill */}
                  <View style={styles.avatarDiscBackdrop} />

                  {/* Avatar Character Image - unclipped so ears/hat pop naturally */}
                  <Image
                    source={companion.source}
                    style={styles.avatarImage}
                    resizeMode="contain"
                  />
                </Animated.View>
              </Pressable>
            </View>
          );
        })}
      </Animated.View>
    </Animated.View>
  );
});

AvatarSelectionScreen.displayName = 'AvatarSelectionScreen';

const styles = StyleSheet.create({
  rootContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    zIndex: 9999,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  focusAura: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: AURA_SIZE,
    height: AURA_SIZE,
    marginLeft: -AURA_SIZE / 2,
    marginTop: AURA_OFFSET_Y,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: '#E6D7FA',
  },
  floorHorizon: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.2,
    left: SCREEN_WIDTH * 0.12,
    width: SCREEN_WIDTH * 0.76,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#C4B0F0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
  },
  headerContainer: {
    position: 'absolute',
    top: 36,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  equalizerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    marginBottom: 10,
    gap: 4,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1.5,
    borderColor: '#E6D7FA',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
  },
  eqBar: {
    width: 4.5,
    borderRadius: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleChooseYour: {
    fontSize: 40,
    fontWeight: '800',
    color: '#0F172A', // Obsidian slate ink
    letterSpacing: -0.5,
  },
  vibeLettersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vibeLetter: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 16.5,
    fontWeight: '500',
    color: '#5B6A82', // Refined slate caption (slightly deeper for 10-foot legibility)
    marginTop: 8,
    letterSpacing: 0.1,
  },
  carouselContainer: {
    ...StyleSheet.absoluteFill,
  },
  avatarPositionWrapper: {
    position: 'absolute',
    width: BASE_AVATAR_SIZE,
    height: BASE_AVATAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  avatarPressable: {
    width: BASE_AVATAR_SIZE,
    height: BASE_AVATAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleContainer: {
    width: BASE_AVATAR_SIZE,
    height: BASE_AVATAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarDiscBackdrop: {
    ...StyleSheet.absoluteFill,
    borderRadius: BASE_AVATAR_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E6D7FA',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
  },
  avatarImage: {
    width: BASE_AVATAR_SIZE,
    height: BASE_AVATAR_SIZE,
  },
  // Selection ring with neon purple/lavender/cyan halo
  selectionGlowRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: BASE_AVATAR_SIZE / 2,
    borderWidth: 3.5,
    borderColor: '#818CF8', // Radiant royal iris
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 18,
    elevation: 12,
  },
  selectionHaloRing: {
    position: 'absolute',
    top: -9,
    left: -9,
    right: -9,
    bottom: -9,
    borderRadius: (BASE_AVATAR_SIZE + 18) / 2,
    borderWidth: 1.5,
    borderColor: '#E6D7FA',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  unfocusedBorderRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: BASE_AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: '#E6D7FA',
    shadowColor: '#E6D7FA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  floorReflection: {
    position: 'absolute',
    bottom: -16,
    width: BASE_AVATAR_SIZE * 0.95,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#C4B0F0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 22,
    elevation: 8,
    zIndex: -1,
  },
  floatingIndicatorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 140,
    marginLeft: -70, // Centers horizontally on indicatorX
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  indicatorInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1.5,
    borderColor: '#E6D7FA',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
  },
  chevronIcon: {
    marginBottom: 2,
  },
  selectedNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
});
