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

  const activeCompanion = COMPANIONS[selectedIndex];

  // Pre-calculate track line segments connecting adjacent companion nodes
  const connectingSegments = useMemo(() => {
    const segments = [];
    for (let i = 0; i < COMPANIONS.length - 1; i++) {
      const start = COMPANIONS[i];
      const end = COMPANIONS[i + 1];
      const x1 = start.xPercent * SCREEN_WIDTH;
      const y1 = start.yPercent * SCREEN_HEIGHT;
      const x2 = end.xPercent * SCREEN_WIDTH;
      const y2 = end.yPercent * SCREEN_HEIGHT;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      segments.push({
        id: `seg_${i}`,
        midX,
        midY,
        length,
        angle,
        junctionX: x2,
        junctionY: y2,
      });
    }
    return segments;
  }, []);

  return (
    <Animated.View style={[styles.rootContainer, { opacity: screenOpacity }]}>
      {/* 1. Layered Background with #FAEDFA Color Shades */}
      <View style={styles.backgroundContainer} pointerEvents="none">
        {/* Soft upper ambient glow in luminous pastel tint */}
        <View style={styles.bgTopAura} />

        {/* Center stage radiant disc in soft blush lavender shade */}
        <View style={styles.bgCenterStage} />

        {/* Floor horizon contour */}
        <View style={styles.bgFloorHorizon} />

        {/* Atmospheric side accents in harmonic #FAEDFA shades */}
        <View style={styles.bgSideAccentLeft} />
        <View style={styles.bgSideAccentRight} />
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

        {/* Main Heading: "Choose your " (deep plum slate) + "vibe" (gradient letters) */}
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
        {/* Curved connecting arc track between companions in #FAEDFA harmonic shade */}
        {connectingSegments.map((seg) => (
          <React.Fragment key={seg.id}>
            <View
              style={{
                position: 'absolute',
                left: seg.midX - seg.length / 2,
                top: seg.midY - 1.5,
                width: seg.length,
                height: 3,
                backgroundColor: '#DEB0DE',
                borderRadius: 1.5,
                shadowColor: '#C49EC4',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.4,
                shadowRadius: 6,
                transform: [{ rotate: `${seg.angle}deg` }],
                zIndex: 5,
              }}
            />
            {/* Connecting node dot with white fill and #DEB0DE border */}
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
                borderColor: '#DEB0DE',
                shadowColor: '#C49EC4',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.45,
                shadowRadius: 5,
                zIndex: 6,
              }}
            />
          </React.Fragment>
        ))}

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
    backgroundColor: '#FAEDFA', // Soft blush lavender base
    zIndex: 9999,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  // Soft upper ambient aura in luminous pastel tint
  bgTopAura: {
    position: 'absolute',
    top: -120,
    left: '15%',
    width: '70%',
    height: 380,
    borderRadius: 250,
    backgroundColor: '#FFF7FF',
    opacity: 0.85,
    transform: [{ scaleX: 1.4 }],
  },
  // Center stage radiant disc in soft blush lavender shade
  bgCenterStage: {
    position: 'absolute',
    top: '38%',
    left: '8%',
    width: '84%',
    height: 320,
    borderRadius: 200,
    backgroundColor: '#F5DEF5',
    opacity: 0.75,
    transform: [{ scaleY: 0.5 }],
  },
  // Floor horizon contour
  bgFloorHorizon: {
    position: 'absolute',
    bottom: '18%',
    left: '5%',
    width: '90%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#C49EC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  // Atmospheric side accents in harmonic #FAEDFA shades
  bgSideAccentLeft: {
    position: 'absolute',
    bottom: '10%',
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#F0D4F0',
    opacity: 0.6,
  },
  bgSideAccentRight: {
    position: 'absolute',
    bottom: '10%',
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#F0D4F0',
    opacity: 0.6,
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
    height: 34,
    marginBottom: 8,
    gap: 4,
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
    color: '#281133', // Deep plum slate ink
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
    color: '#6F4E75', // Warm violet slate caption
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
    borderWidth: 2,
    borderColor: '#EAC5EA',
  },
  avatarImage: {
    width: BASE_AVATAR_SIZE,
    height: BASE_AVATAR_SIZE,
  },
  // Selection ring with neon purple/lavender halo
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
  unfocusedBorderRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: BASE_AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  floorReflection: {
    position: 'absolute',
    bottom: -16,
    width: BASE_AVATAR_SIZE * 0.95,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
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
  },
  chevronIcon: {
    marginBottom: 2,
  },
  selectedNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#281133',
    letterSpacing: -0.2,
  },
});
