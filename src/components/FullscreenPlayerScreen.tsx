import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  DimensionValue,
} from 'react-native';
import { PlaylistData, PlaylistTrack } from '../data/playlistData';
import {
  FULLSCREEN_FOCUS_IDS,
  UPCOMING_TRACK_FOCUS_IDS,
} from '../navigation/fullscreenNavGraph';
import { SongAiInsight } from '../services/geminiSongInfoService';
import { TVMotionBackground } from './TVMotionBackground';
import { TRACK_CATALOG } from '../services/musicCatalog';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  BackgroundSelectionOverlay,
  BACKGROUND_OPTIONS,
  getDefaultBackgroundId,
} from './BackgroundSelectionOverlay';

export type AiOverlayStatus = 'IDLE' | 'LOADING' | 'READY' | 'ERROR';

export interface FullscreenPlayerScreenProps {
  playlist: PlaylistData;
  playingTrack: PlaylistTrack;
  isPlaying: boolean;
  currentTimeSeconds: number;
  durationSeconds: number;
  isSongLiked: boolean;
  isShuffleActive?: boolean;
  shuffledTrackIds?: string[];
  fullscreenFocusId: string;
  isAiOverlayOpen: boolean;
  aiOverlayStatus: AiOverlayStatus;
  aiSongInsight: SongAiInsight | null;
  aiErrorMessage?: string | null;
  selectedBackgroundId?: string | null;
  isBackgroundOverlayOpen?: boolean;
  onExitFullscreen: () => void;
  onTogglePlayPause: () => void;
  onPlayNext: () => void;
  onPlayPrev: () => void;
  onToggleSongLike: (trackId: string) => void;
  onOpenAiOverlay: () => void;
  onCloseAiOverlay: () => void;
  onOpenBackgroundOverlay?: () => void;
  onCloseBackgroundOverlay?: () => void;
  onSelectBackground?: (id: string) => void;
  isUsbTrack?: boolean;
}

function formatTime(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds || 0));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

interface LeafSpec {
  id: number;
  tier: 'distant' | 'midground' | 'foreground';
  width: number;
  height: number;
  color: string;
  veinColor: string;
  baseOpacity: number;
  phase: number; // 0.08 .. 0.92
  startX: number;
  endX: number;
  startY: number;
  endY: number;
  driftDuration: number; // slow-motion 13s .. 22s
  swayDuration: number; // 3.4s .. 5.8s
  swayAmplitudeY: number;
  rotStart: string;
  rotEnd: string;
  minScaleY: number;
}

const PINK_LEAF_SPECS: LeafSpec[] = [
  // Distant layer (subtle, small, slow high-altitude pink petals)
  { id: 0, tier: 'distant', width: 11, height: 7, color: '#F9A8D4', veinColor: '#FFF1F2', baseOpacity: 0.42, phase: 0.11, startX: -60, endX: 1020, startY: 18, endY: 195, driftDuration: 19500, swayDuration: 4300, swayAmplitudeY: 14, rotStart: '-25deg', rotEnd: '45deg', minScaleY: 0.62 },
  { id: 1, tier: 'distant', width: 10, height: 6.5, color: '#F472B6', veinColor: '#FFE4E6', baseOpacity: 0.36, phase: 0.24, startX: -50, endX: 1010, startY: 95, endY: 290, driftDuration: 21000, swayDuration: 4800, swayAmplitudeY: 16, rotStart: '15deg', rotEnd: '-40deg', minScaleY: 0.58 },
  { id: 2, tier: 'distant', width: 12, height: 8, color: '#FDA4AF', veinColor: '#FFF1F2', baseOpacity: 0.40, phase: 0.39, startX: -70, endX: 1030, startY: -15, endY: 160, driftDuration: 18400, swayDuration: 3900, swayAmplitudeY: 12, rotStart: '-35deg', rotEnd: '30deg', minScaleY: 0.65 },
  { id: 3, tier: 'distant', width: 9.5, height: 6, color: '#F472B6', veinColor: '#FFF1F2', baseOpacity: 0.35, phase: 0.52, startX: -40, endX: 1020, startY: 180, endY: 380, driftDuration: 22000, swayDuration: 5100, swayAmplitudeY: 15, rotStart: '10deg', rotEnd: '65deg', minScaleY: 0.60 },
  { id: 4, tier: 'distant', width: 11.5, height: 7.5, color: '#F9A8D4', veinColor: '#FFE4E6', baseOpacity: 0.44, phase: 0.67, startX: -60, endX: 1015, startY: 260, endY: 455, driftDuration: 20200, swayDuration: 4500, swayAmplitudeY: 13, rotStart: '-18deg', rotEnd: '50deg', minScaleY: 0.64 },
  { id: 5, tier: 'distant', width: 10.5, height: 7, color: '#FB7185', veinColor: '#FFF1F2', baseOpacity: 0.34, phase: 0.81, startX: -55, endX: 1025, startY: 60, endY: 240, driftDuration: 19800, swayDuration: 4600, swayAmplitudeY: 15, rotStart: '22deg', rotEnd: '-32deg', minScaleY: 0.60 },

  // Midground hero layer (sculpted botanical pink leaves with veins & 3D slow-mo flutter)
  { id: 6, tier: 'midground', width: 18, height: 11, color: '#F472B6', veinColor: '#FFF1F2', baseOpacity: 0.68, phase: 0.09, startX: -80, endX: 1040, startY: 35, endY: 245, driftDuration: 15200, swayDuration: 3700, swayAmplitudeY: 22, rotStart: '-32deg', rotEnd: '48deg', minScaleY: 0.52 },
  { id: 7, tier: 'midground', width: 21, height: 13, color: '#FB7185', veinColor: '#FFE4E6', baseOpacity: 0.64, phase: 0.18, startX: -85, endX: 1040, startY: 130, endY: 355, driftDuration: 16400, swayDuration: 4100, swayAmplitudeY: 25, rotStart: '18deg', rotEnd: '-45deg', minScaleY: 0.48 },
  { id: 8, tier: 'midground', width: 16, height: 10, color: '#EC4899', veinColor: '#FCE7F3', baseOpacity: 0.58, phase: 0.29, startX: -75, endX: 1035, startY: -10, endY: 210, driftDuration: 14800, swayDuration: 3500, swayAmplitudeY: 20, rotStart: '-40deg', rotEnd: '35deg', minScaleY: 0.55 },
  { id: 9, tier: 'midground', width: 20, height: 12.5, color: '#F9A8D4', veinColor: '#FFFFFF', baseOpacity: 0.74, phase: 0.37, startX: -90, endX: 1045, startY: 215, endY: 430, driftDuration: 15900, swayDuration: 3900, swayAmplitudeY: 24, rotStart: '12deg', rotEnd: '68deg', minScaleY: 0.50 },
  { id: 10, tier: 'midground', width: 17, height: 10.5, color: '#F472B6', veinColor: '#FFF1F2', baseOpacity: 0.66, phase: 0.46, startX: -70, endX: 1030, startY: 85, endY: 310, driftDuration: 16800, swayDuration: 4200, swayAmplitudeY: 21, rotStart: '-24deg', rotEnd: '52deg', minScaleY: 0.54 },
  { id: 11, tier: 'midground', width: 22, height: 13.5, color: '#FDA4AF', veinColor: '#FFFFFF', baseOpacity: 0.70, phase: 0.56, startX: -95, endX: 1050, startY: 280, endY: 490, driftDuration: 15500, swayDuration: 3800, swayAmplitudeY: 26, rotStart: '28deg', rotEnd: '-38deg', minScaleY: 0.46 },
  { id: 12, tier: 'midground', width: 19, height: 11.5, color: '#FB7185', veinColor: '#FFF1F2', baseOpacity: 0.62, phase: 0.64, startX: -80, endX: 1040, startY: 15, endY: 225, driftDuration: 17100, swayDuration: 4400, swayAmplitudeY: 23, rotStart: '-15deg', rotEnd: '58deg', minScaleY: 0.52 },
  { id: 13, tier: 'midground', width: 16.5, height: 10, color: '#F472B6', veinColor: '#FFE4E6', baseOpacity: 0.65, phase: 0.73, startX: -75, endX: 1035, startY: 165, endY: 395, driftDuration: 16100, swayDuration: 3600, swayAmplitudeY: 19, rotStart: '32deg', rotEnd: '-28deg', minScaleY: 0.56 },
  { id: 14, tier: 'midground', width: 20.5, height: 12.5, color: '#F9A8D4', veinColor: '#FFFFFF', baseOpacity: 0.72, phase: 0.84, startX: -85, endX: 1040, startY: 240, endY: 460, driftDuration: 15400, swayDuration: 4000, swayAmplitudeY: 24, rotStart: '-28deg', rotEnd: '44deg', minScaleY: 0.50 },
  { id: 15, tier: 'midground', width: 18, height: 11, color: '#EC4899', veinColor: '#FCE7F3', baseOpacity: 0.56, phase: 0.91, startX: -80, endX: 1040, startY: 55, endY: 275, driftDuration: 16600, swayDuration: 4300, swayAmplitudeY: 22, rotStart: '14deg', rotEnd: '-48deg', minScaleY: 0.53 },

  // Foreground out-of-focus cinema bokeh leaves (large, dreamy translucent pink)
  { id: 16, tier: 'foreground', width: 30, height: 18, color: '#F9A8D4', veinColor: '#FFFFFF', baseOpacity: 0.28, phase: 0.15, startX: -110, endX: 1070, startY: 40, endY: 295, driftDuration: 13200, swayDuration: 3400, swayAmplitudeY: 30, rotStart: '-36deg', rotEnd: '54deg', minScaleY: 0.45 },
  { id: 17, tier: 'foreground', width: 34, height: 20, color: '#F472B6', veinColor: '#FFF1F2', baseOpacity: 0.24, phase: 0.42, startX: -120, endX: 1080, startY: 190, endY: 440, driftDuration: 13800, swayDuration: 3600, swayAmplitudeY: 32, rotStart: '25deg', rotEnd: '-42deg', minScaleY: 0.42 },
  { id: 18, tier: 'foreground', width: 28, height: 17, color: '#FDA4AF', veinColor: '#FFFFFF', baseOpacity: 0.30, phase: 0.69, startX: -110, endX: 1070, startY: 110, endY: 360, driftDuration: 12900, swayDuration: 3300, swayAmplitudeY: 28, rotStart: '-20deg', rotEnd: '60deg', minScaleY: 0.48 },
  { id: 19, tier: 'foreground', width: 32, height: 19, color: '#FB7185', veinColor: '#FFE4E6', baseOpacity: 0.25, phase: 0.88, startX: -115, endX: 1075, startY: 270, endY: 500, driftDuration: 13500, swayDuration: 3500, swayAmplitudeY: 30, rotStart: '18deg', rotEnd: '-50deg', minScaleY: 0.44 },
];

const SlowMoPinkLeafWindBackground = React.memo(function SlowMoPinkLeafWindBackground() {
  // Continuous 0 -> 1 drift progress per leaf + sinusoidal wind sway & 3D leaf flutter
  const leafControllers = useRef(
    PINK_LEAF_SPECS.map(() => ({
      drift: new Animated.Value(0),
      sway: new Animated.Value(0),
    }))
  ).current;

  // Ambient slow-motion wind current ribbon breathers
  const windStreamAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const streamLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(windStreamAnim, {
          toValue: 1,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(windStreamAnim, {
          toValue: 0,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    streamLoop.start();

    const activeLoops: Animated.CompositeAnimation[] = [streamLoop];

    leafControllers.forEach((ctrl, idx) => {
      const spec = PINK_LEAF_SPECS[idx];
      ctrl.drift.setValue(0);
      ctrl.sway.setValue(0);

      const driftLoop = Animated.loop(
        Animated.timing(ctrl.drift, {
          toValue: 1,
          duration: spec.driftDuration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      const swayLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(ctrl.sway, {
            toValue: 1,
            duration: spec.swayDuration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(ctrl.sway, {
            toValue: 0,
            duration: spec.swayDuration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

      driftLoop.start();
      swayLoop.start();
      activeLoops.push(driftLoop, swayLoop);
    });

    return () => {
      activeLoops.forEach((l) => l.stop());
    };
  }, [leafControllers, windStreamAnim]);

  const streamTranslateX = windStreamAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-28, 28],
  });
  const streamTranslateY = windStreamAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 10],
  });

  return (
    <View style={styles.proceduralBgRoot} pointerEvents="none" focusable={false}>
      {/* Soft Pastel Sky & Sakura-Lavender Atmospheric Glow */}
      <View style={styles.skyGradientTopGlow} />
      <View style={styles.skyGradientBottomGlow} />

      {/* Slow-Motion Diagonal Wind Stream Ribbons */}
      <Animated.View
        style={[
          styles.windStreamRibbonOne,
          {
            transform: [
              { translateX: streamTranslateX },
              { translateY: streamTranslateY },
              { rotate: '-13deg' },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.windStreamRibbonTwo,
          {
            transform: [
              { translateX: Animated.multiply(streamTranslateX, -0.8) },
              { translateY: Animated.multiply(streamTranslateY, -1) },
              { rotate: '-11deg' },
            ],
          },
        ]}
      />

      {/* 20 Procedural Sculpted Pink Leaves Drifting in Slow-Motion Wind */}
      {PINK_LEAF_SPECS.map((spec, idx) => {
        const ctrl = leafControllers[idx];
        const p = spec.phase;
        const tWrap = 1 - p;
        const x0 = spec.startX + p * (spec.endX - spec.startX);
        const y0 = spec.startY + p * (spec.endY - spec.startY);

        const translateX = ctrl.drift.interpolate({
          inputRange: [0, tWrap - 0.02, tWrap - 0.002, tWrap + 0.002, tWrap + 0.02, 1],
          outputRange: [x0, spec.endX, spec.endX, spec.startX, spec.startX, x0],
        });

        const baseTranslateY = ctrl.drift.interpolate({
          inputRange: [0, tWrap - 0.02, tWrap - 0.002, tWrap + 0.002, tWrap + 0.02, 1],
          outputRange: [y0, spec.endY, spec.endY, spec.startY, spec.startY, y0],
        });

        const swayY = ctrl.sway.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [-spec.swayAmplitudeY, spec.swayAmplitudeY, -spec.swayAmplitudeY],
        });

        const leafOpacity = ctrl.drift.interpolate({
          inputRange: [0, tWrap - 0.03, tWrap - 0.003, tWrap + 0.003, tWrap + 0.03, 1],
          outputRange: [
            spec.baseOpacity,
            spec.baseOpacity,
            0,
            0,
            spec.baseOpacity,
            spec.baseOpacity,
          ],
        });

        const rotateZ = ctrl.sway.interpolate({
          inputRange: [0, 1],
          outputRange: [spec.rotStart, spec.rotEnd],
        });

        const scaleY = ctrl.sway.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, spec.minScaleY, 1],
        });

        return (
          <Animated.View
            key={`pink_leaf_${spec.id}`}
            style={[
              styles.proceduralLeafAnchor,
              {
                opacity: leafOpacity,
                transform: [
                  { translateX },
                  { translateY: Animated.add(baseTranslateY, swayY) },
                  { rotate: rotateZ },
                  { scaleY },
                ],
              },
            ]}
          >
            {/* Organic Sculpted Pink Leaf / Sakura Petal Geometry (No Image!) */}
            <View
              style={{
                width: spec.width,
                height: spec.height,
                backgroundColor: spec.color,
                borderTopLeftRadius: spec.width * 0.92,
                borderBottomRightRadius: spec.width * 0.92,
                borderTopRightRadius: spec.width * 0.16,
                borderBottomLeftRadius: spec.width * 0.22,
                overflow: 'hidden',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#F472B6',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.35,
                shadowRadius: 4,
              }}
            >
              {/* Upper Silk Sunlight Highlight on Leaf Curve */}
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 1,
                  width: spec.width * 0.68,
                  height: spec.height * 0.46,
                  backgroundColor: 'rgba(255, 255, 255, 0.38)',
                  borderTopLeftRadius: spec.width * 0.8,
                  borderBottomRightRadius: spec.width * 0.5,
                }}
              />
              {/* Botanical Central Vein */}
              <View
                style={{
                  width: spec.width * 0.76,
                  height: 1.1,
                  backgroundColor: spec.veinColor,
                  opacity: 0.72,
                  borderRadius: 1,
                  transform: [{ rotate: '14deg' }],
                }}
              />
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
});

const FullscreenUpcomingPanel = React.memo(function FullscreenUpcomingPanel({
  upcomingTracks,
  fullscreenFocusId,
  focusedUpcomingIdx,
}: {
  upcomingTracks: PlaylistTrack[];
  fullscreenFocusId: string;
  focusedUpcomingIdx: number;
}) {
  return (
    <View
      style={[
        styles.upcomingPanel,
        focusedUpcomingIdx !== -1 && styles.upcomingPanelActive,
      ]}
    >
      <View style={styles.upcomingHeaderRow}>
        <Text style={styles.upcomingHeaderTitle}>NEXT 4 TRACKS</Text>
        <Text style={styles.upcomingHeaderBadge}>QUEUE PREVIEW</Text>
      </View>

      {upcomingTracks.map((trk, idx) => {
        const focusId = UPCOMING_TRACK_FOCUS_IDS[idx];
        const isItemFocused = fullscreenFocusId === focusId;

        return (
          <Pressable
            key={`${trk.id}_up_${idx}`}
            focusable={false}
            // SELECT on upcoming track must NOT start playback or change track (Section 18)
            onPress={() => {}}
            style={[
              styles.upcomingRow,
              isItemFocused && styles.upcomingRowFocused,
            ]}
          >
            <Text
              style={[
                styles.upcomingIndex,
                isItemFocused && styles.upcomingIndexFocused,
              ]}
            >
              {idx + 1}
            </Text>
            <Image
              source={trk.artwork}
              style={styles.upcomingThumb}
              resizeMode="cover"
            />
            <View style={styles.upcomingMetaCol}>
              <Text
                numberOfLines={1}
                style={[
                  styles.upcomingTrackTitle,
                  isItemFocused && styles.upcomingTrackTitleFocused,
                ]}
              >
                {trk.title}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.upcomingTrackArtist,
                  isItemFocused && styles.upcomingTrackArtistFocused,
                ]}
              >
                {trk.artist}
              </Text>
            </View>
            <Text
              style={[
                styles.upcomingDuration,
                isItemFocused && styles.upcomingDurationFocused,
              ]}
            >
              {trk.duration}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

const FullscreenCenterStage = React.memo(function FullscreenCenterStage({
  playingTrack,
  playlistTitle,
  playlistCoverImage,
  isPlaying,
  focusedUpcomingTrack,
  focusedUpcomingIdx,
}: {
  playingTrack: PlaylistTrack;
  playlistTitle: string;
  playlistCoverImage: any;
  isPlaying: boolean;
  focusedUpcomingTrack: PlaylistTrack | null;
  focusedUpcomingIdx: number;
}) {
  return (
    <View style={styles.centerStage}>
      {/* Clean Circular Song Cover Image */}
      <View style={[styles.artworkDiscFrame, { marginBottom: 16 }]}>
        <Image
          source={playingTrack.artwork || playlistCoverImage}
          style={styles.artworkDiscImage}
          resizeMode="cover"
        />
      </View>

      {/* Now Playing Song Metadata */}
      <View style={styles.nowPlayingTextBlock}>
        <View style={styles.statusBadgeRow}>
          <View
            style={[
              styles.liveDot,
              { backgroundColor: isPlaying ? '#34D399' : '#FBBF24' },
            ]}
          />
          <Text style={styles.statusBadgeText}>
            {isPlaying ? 'NOW PLAYING' : 'PAUSED'} • {playlistTitle.toUpperCase()}
          </Text>
        </View>

        <Text numberOfLines={1} style={styles.mainSongTitle}>
          {playingTrack.title}
        </Text>
        <Text numberOfLines={1} style={styles.mainSongArtist}>
          {playingTrack.artist}  •  {playingTrack.album}
        </Text>

        {/* Non-intrusive inspection indicator when browsing Upcoming 4 Tracks */}
        {focusedUpcomingTrack && (
          <View style={styles.upcomingInspectBanner}>
            <Text style={styles.upcomingInspectText}>
              Up Next Preview (#{focusedUpcomingIdx + 1}): "{focusedUpcomingTrack.title}" by{' '}
              {focusedUpcomingTrack.artist}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
});

const FullscreenControls = React.memo(function FullscreenControls({
  isPlaying,
  isSongLiked,
  fullscreenFocusId,
  isAiOverlayOpen,
  isBackgroundOverlayOpen,
  playingTrackId,
  isUsbTrack = false,
  onPlayPrev,
  onTogglePlayPause,
  onPlayNext,
  onToggleSongLike,
  onOpenAiOverlay,
  onOpenBackgroundOverlay,
}: {
  isPlaying: boolean;
  isSongLiked: boolean;
  fullscreenFocusId: string;
  isAiOverlayOpen: boolean;
  isBackgroundOverlayOpen?: boolean;
  playingTrackId: string;
  isUsbTrack?: boolean;
  onPlayPrev: () => void;
  onTogglePlayPause: () => void;
  onPlayNext: () => void;
  onToggleSongLike: (trackId: string) => void;
  onOpenAiOverlay: () => void;
  onOpenBackgroundOverlay?: () => void;
}) {
  return (
    <View style={styles.controlsRow}>
      {/* Left Transport Cluster: PREVIOUS, PLAY/PAUSE, NEXT */}
      <View style={styles.leftTransportCluster}>
        {/* PREVIOUS (FS_PREVIOUS) */}
        <Pressable
          focusable={false}
          onPress={onPlayPrev}
          style={[
            styles.transportIconBtn,
            fullscreenFocusId === FULLSCREEN_FOCUS_IDS.PREVIOUS &&
              styles.transportIconBtnFocused,
          ]}
        >
          <Text
            style={[
              styles.chevronControlIcon,
              fullscreenFocusId === FULLSCREEN_FOCUS_IDS.PREVIOUS &&
                styles.controlIconFocused,
            ]}
          >
            ‹
          </Text>
        </Pressable>

        {/* PLAY / PAUSE (FS_PLAY_PAUSE) */}
        <View
          style={[
            styles.playCircleRing,
            fullscreenFocusId === FULLSCREEN_FOCUS_IDS.PLAY_PAUSE &&
              styles.playCircleRingFocused,
          ]}
        >
          <Pressable
            focusable={false}
            onPress={onTogglePlayPause}
            style={[
              styles.playCircleBtn,
              fullscreenFocusId === FULLSCREEN_FOCUS_IDS.PLAY_PAUSE &&
                styles.playCircleBtnFocused,
            ]}
          >
            <Image
              source={
                isPlaying
                  ? require('../../assets/ui/icon_pause.png')
                  : require('../../assets/ui/icon_play.png')
              }
              style={styles.playCircleVectorIcon}
              resizeMode="contain"
            />
          </Pressable>
        </View>

        {/* NEXT (FS_NEXT) */}
        <Pressable
          focusable={false}
          onPress={onPlayNext}
          style={[
            styles.transportIconBtn,
            fullscreenFocusId === FULLSCREEN_FOCUS_IDS.NEXT &&
              styles.transportIconBtnFocused,
          ]}
        >
          <Text
            style={[
              styles.chevronControlIcon,
              fullscreenFocusId === FULLSCREEN_FOCUS_IDS.NEXT &&
                styles.controlIconFocused,
            ]}
          >
            ›
          </Text>
        </Pressable>
      </View>

      {/* Right Action Cluster: LIKE (FS_LIKE), PALETTE (FS_PALETTE) & SONG INFO (FS_SONG_INFO) */}
      <View style={styles.rightActionCluster}>
        {/* LIKE (FS_LIKE) */}
        {!isUsbTrack && (
          <Pressable
            focusable={false}
            onPress={() => onToggleSongLike(playingTrackId)}
            style={[
              styles.rightCircleBtn,
              isSongLiked && styles.rightCircleBtnLiked,
              fullscreenFocusId === FULLSCREEN_FOCUS_IDS.LIKE &&
                styles.rightCircleBtnFocused,
            ]}
          >
            <Image
              source={
                isSongLiked
                  ? require('../../assets/ui/icon_heart_filled.png')
                  : require('../../assets/ui/icon_heart_outline.png')
              }
              style={[
                styles.rightVectorIcon,
                {
                  tintColor:
                    fullscreenFocusId === FULLSCREEN_FOCUS_IDS.LIKE
                      ? '#FFFFFF'
                      : isSongLiked
                      ? '#F43F5E'
                      : 'rgba(255, 255, 255, 0.90)',
                },
              ]}
              resizeMode="contain"
            />
          </Pressable>
        )}

        {/* BACKGROUND PALETTE (FS_PALETTE) */}
        <Pressable
          focusable={false}
          onPress={onOpenBackgroundOverlay}
          style={[
            styles.rightCircleBtn,
            isBackgroundOverlayOpen && styles.rightCircleBtnPaletteActive,
            fullscreenFocusId === FULLSCREEN_FOCUS_IDS.PALETTE &&
              styles.rightCircleBtnFocused,
          ]}
        >
          <MaterialCommunityIcons
            name="palette"
            size={20}
            color={
              fullscreenFocusId === FULLSCREEN_FOCUS_IDS.PALETTE
                ? '#FFFFFF'
                : isBackgroundOverlayOpen
                ? '#A5B4FC'
                : 'rgba(255, 255, 255, 0.90)'
            }
          />
        </Pressable>

        {/* SONG INFO (FS_SONG_INFO) — ⓘ icon */}
        <Pressable
          focusable={false}
          onPress={onOpenAiOverlay}
          style={[
            styles.rightCircleBtn,
            isAiOverlayOpen && styles.rightCircleBtnInfoActive,
            fullscreenFocusId === FULLSCREEN_FOCUS_IDS.SONG_INFO &&
              styles.rightCircleBtnFocused,
          ]}
        >
          <Text
            style={[
              styles.infoSymbolText,
              isAiOverlayOpen && styles.infoSymbolTextActive,
              fullscreenFocusId === FULLSCREEN_FOCUS_IDS.SONG_INFO &&
                styles.infoSymbolTextFocused,
            ]}
          >
            ⓘ
          </Text>
        </Pressable>
      </View>
    </View>
  );
});

const FullscreenScrubber = React.memo(function FullscreenScrubber({
  currentTimeSeconds,
  durationSeconds,
  isFocused,
}: {
  currentTimeSeconds: number;
  durationSeconds: number;
  isFocused: boolean;
}) {
  const safeDuration = Math.max(1, durationSeconds || 123);
  const clampedSeconds = Math.max(0, Math.min(safeDuration, currentTimeSeconds));
  const progressRatio = Math.max(0, Math.min(1, clampedSeconds / safeDuration));
  const progressPercent: DimensionValue = `${(progressRatio * 100).toFixed(1)}%` as DimensionValue;

  return (
    <View
      style={[
        styles.scrubberContainer,
        isFocused && styles.scrubberContainerFocused,
      ]}
    >
      <View
        style={[
          styles.scrubberLineTrack,
          isFocused && styles.scrubberLineTrackFocused,
        ]}
      >
        <View
          style={[
            styles.scrubberLineFill,
            { width: progressPercent },
            isFocused && styles.scrubberLineFillFocused,
          ]}
        />
        <View
          style={[
            styles.scrubberKnob,
            {
              left: progressPercent,
              marginLeft: isFocused ? -8 : -5,
            },
            isFocused && styles.scrubberKnobFocused,
          ]}
        />
      </View>

      {/* Bottom Time Pills: [ 00:00 ] (Left) and [ 03:42 ] (Right) */}
      <View style={styles.timePillsRow}>
        <View
          style={[
            styles.timePillBox,
            isFocused && styles.timePillBoxFocused,
          ]}
        >
          <Text
            style={[
              styles.timePillText,
              isFocused && styles.timePillTextFocused,
            ]}
          >
            {formatTime(clampedSeconds)}
          </Text>
        </View>

        {isFocused && (
          <Text style={styles.scrubberSeekHint}>
            ◀ LEFT -10s   •   RIGHT +10s ▶
          </Text>
        )}

        <View
          style={[
            styles.timePillBox,
            isFocused && styles.timePillBoxFocused,
          ]}
        >
          <Text
            style={[
              styles.timePillText,
              isFocused && styles.timePillTextFocused,
            ]}
          >
            {formatTime(safeDuration)}
          </Text>
        </View>
      </View>
    </View>
  );
});

const FullscreenAiOverlay = React.memo(function FullscreenAiOverlay({
  isOpen,
  fullscreenFocusId,
  playingTrack,
  playlistCoverImage,
  aiOverlayStatus,
  aiSongInsight,
  aiErrorMessage,
  onClose,
}: {
  isOpen: boolean;
  fullscreenFocusId: string;
  playingTrack: PlaylistTrack;
  playlistCoverImage: any;
  aiOverlayStatus: AiOverlayStatus;
  aiSongInsight: SongAiInsight | null;
  aiErrorMessage?: string | null;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  // Derive song metadata capsules dynamically
  const durationText = playingTrack.duration || '3:28';
  const bpmMatch = aiSongInsight?.musicalStyle?.match(/(\d+)\s*BPM/i);
  const bpmText = bpmMatch ? `${bpmMatch[1]} BPM` : '82 BPM';
  const energyText = aiSongInsight?.moodAndVibe?.toLowerCase().includes('energetic')
    ? 'UPBEAT'
    : aiSongInsight?.moodAndVibe?.toLowerCase().includes('chill') ||
      aiSongInsight?.moodAndVibe?.toLowerCase().includes('calm') ||
      aiSongInsight?.moodAndVibe?.toLowerCase().includes('gentle')
    ? 'GENTLE'
    : 'MELLOW';
  const genreText = (playingTrack as any).genre || (playingTrack.album?.toLowerCase().includes('chill') ? 'Chillhop' : 'Chillhop');

  return (
    <View style={styles.aiOverlayBackdrop}>
      <View style={styles.aiOverlayModal}>
        {/* Layer 0: High-Resolution Compressed WebP Pastel Panda Music Wallpaper */}
        <Image
          source={require('../../assets/ui/panda_card_bg.webp')}
          style={styles.aiOverlayBgImage}
          resizeMode="cover"
        />
        {/* Layer 1: Translucent Frosted Glass Scrim for Crisp Contrast */}
        <View style={styles.aiOverlayFrostedScrim} />

        {/* Layer 2: Padded Content Container (Zero corner/edge gap) */}
        <View style={styles.aiOverlayContentWrapper}>
          {/* Top Header Row: BACK button (Left) + GEMINI AI LINER NOTES + Close '✕' (Right) */}
          <View style={styles.aiOverlayHeaderRow}>
          <Pressable
            focusable={false}
            onPress={onClose}
            style={[
              styles.aiOverlayBackBtn,
              fullscreenFocusId === FULLSCREEN_FOCUS_IDS.AI_OVERLAY_BACK &&
                styles.aiOverlayBackBtnFocused,
            ]}
          >
            <Text style={styles.aiOverlayBackChevron}>‹</Text>
            <Text style={styles.aiOverlayBackLabel}>BACK</Text>
          </Pressable>

          <View style={styles.aiOverlayHeaderRight}>
            <View style={styles.aiBadgePill}>
              <Text style={styles.aiBadgePillText}>✦ GEMINI AI LINER NOTES</Text>
            </View>
            <Pressable
              focusable={false}
              onPress={onClose}
              style={styles.aiOverlayCloseBtn}
            >
              <Text style={styles.aiOverlayCloseText}>✕</Text>
            </Pressable>
          </View>
        </View>

        {/* Song Hero Section: Album Cover with Peeking Vinyl Disc + Title/Artist + 3 Capsules */}
        <View style={styles.aiHeroContainer}>
          {/* Left: Album Cover + Peeking Vinyl Record */}
          <View style={styles.aiAlbumCluster}>
            {/* Peeking Vinyl Disc */}
            <Image
              source={require('../../assets/ui/vinyl_disc.png')}
              style={styles.aiVinylDisc}
              resizeMode="contain"
            />
            {/* Album Artwork with genre badge & play icon */}
            <View style={styles.aiAlbumArtFrame}>
              <Image
                source={playingTrack.artwork || playlistCoverImage}
                style={styles.aiAlbumArtImg}
                resizeMode="cover"
              />
              {/* Top-left Genre Badge */}
              <View style={styles.aiGenreBadge}>
                <Text style={styles.aiGenreBadgeIcon}>●|||</Text>
                <Text style={styles.aiGenreBadgeText}>{genreText}</Text>
              </View>
              {/* Bottom-right Play Icon Badge */}
              <View style={styles.aiPlayBadge}>
                <Text style={styles.aiPlayBadgeIcon}>▶</Text>
              </View>
            </View>
          </View>

          {/* Middle: Title, Artist/Album, 3 Metadata Glass Capsules */}
          <View style={styles.aiHeroMetaCol}>
            <View style={styles.aiTitleRow}>
              <Text style={styles.aiSparkleIcon}>✦</Text>
              <Text style={styles.aiHeaderTitle}>
                AI GENERATED INFORMATION ABOUT THE SONG
              </Text>
            </View>

            <Text numberOfLines={1} style={styles.aiSongMainTitle}>
              {playingTrack.title}
            </Text>

            <Text numberOfLines={1} style={styles.aiSongSubheader}>
              <Text style={styles.aiSongArtistHighlight}>{playingTrack.artist}</Text>
              {'  •  '}
              <Text style={styles.aiSongAlbumItalic}>{playingTrack.album}</Text>
            </Text>

            {/* 3 Compact Glass Capsules */}
            <View style={styles.aiMetadataCapsulesRow}>
              {/* Capsule 1: Duration */}
              <View style={styles.aiMetaCapsule}>
                <Text style={styles.aiMetaCapsuleIcon}>⏱</Text>
                <View style={styles.aiMetaCapsuleTextCol}>
                  <Text style={styles.aiMetaCapsuleValue}>{durationText}</Text>
                  <Text style={styles.aiMetaCapsuleLabel}>DURATION</Text>
                </View>
              </View>

              {/* Capsule 2: Tempo */}
              <View style={styles.aiMetaCapsule}>
                <Text style={[styles.aiMetaCapsuleIcon, { color: '#4F46E5' }]}>♫</Text>
                <View style={styles.aiMetaCapsuleTextCol}>
                  <Text style={styles.aiMetaCapsuleValue}>{bpmText}</Text>
                  <Text style={styles.aiMetaCapsuleLabel}>TEMPO</Text>
                </View>
              </View>

              {/* Capsule 3: Energy */}
              <View style={styles.aiMetaCapsule}>
                <Text style={[styles.aiMetaCapsuleIcon, { color: '#6366F1' }]}>〽</Text>
                <View style={styles.aiMetaCapsuleTextCol}>
                  <Text style={styles.aiMetaCapsuleValue}>{energyText}</Text>
                  <Text style={styles.aiMetaCapsuleLabel}>ENERGY</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Right space: Left open so the panda in the background shines through! */}
          <View style={styles.aiHeroRightSpacer} />
        </View>

        {/* AI Overlay Body (Loading / Error / Ready) */}
        <View style={styles.aiOverlayBody}>
          {aiOverlayStatus === 'LOADING' && (
            <View style={styles.aiLoadingBox}>
              <Text style={styles.aiLoadingTitle}>✦ CURATING AI SONG STORY</Text>
              <Text style={styles.aiLoadingSubtitle}>
                Analyzing musicality, tempo, and mood for "{playingTrack.title}"...
              </Text>
            </View>
          )}

          {aiOverlayStatus === 'ERROR' && (
            <View style={styles.aiLoadingBox}>
              <Text style={styles.aiErrorTitle}>Unable to load AI insight</Text>
              <Text style={styles.aiLoadingSubtitle}>
                {aiErrorMessage || 'Press BACK to return to the player.'}
              </Text>
            </View>
          )}

          {aiOverlayStatus === 'READY' && aiSongInsight && (
            <View style={styles.aiReadyContent}>
              {/* Glass Overview Box */}
              <View style={styles.aiOverviewGlassCard}>
                <View style={styles.aiOverviewHeaderRow}>
                  <Text style={styles.aiOverviewIcon}>🗎</Text>
                  <Text style={styles.aiOverviewTitle}>OVERVIEW</Text>
                </View>
                <Text style={styles.aiOverviewSummaryText} numberOfLines={3}>
                  {aiSongInsight.summary}
                </Text>
              </View>

              {/* Three Bottom Pastel Floating Insight Cards */}
              <View style={styles.aiMetaGrid}>
                {/* Card 1: Musical Style & Tempo (Teal / Mint) */}
                <View style={[styles.aiMetaCard, styles.aiMetaCardTeal]}>
                  <View style={styles.aiCardHeaderRow}>
                    <Text style={styles.aiMetaLabelTeal}>♫ MUSICAL STYLE & TEMPO</Text>
                  </View>
                  <Text style={styles.aiMetaValueTeal} numberOfLines={2}>
                    {aiSongInsight.musicalStyle}
                  </Text>
                </View>

                {/* Card 2: Mood & Listening Vibe (Rose / Pink) */}
                <View style={[styles.aiMetaCard, styles.aiMetaCardRose]}>
                  <View style={styles.aiCardHeaderRow}>
                    <Text style={styles.aiMetaLabelRose}>❤ MOOD & LISTENING VIBE</Text>
                  </View>
                  <Text style={styles.aiMetaValueRose} numberOfLines={2}>
                    {aiSongInsight.moodAndVibe}
                  </Text>
                </View>

                {/* Card 3: Studio & Production Highlight (Warm Gold) */}
                <View style={[styles.aiMetaCard, styles.aiHighlightBoxAmber]}>
                  <View style={styles.aiCardHeaderRow}>
                    <Text style={styles.aiMetaLabelAmber}>🎧 STUDIO & PRODUCTION HIGHLIGHT</Text>
                  </View>
                  <Text style={styles.aiHighlightValueAmber} numberOfLines={2}>
                    "{aiSongInsight.productionHighlight}"
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
        </View>
      </View>
    </View>
  );
});

export const FullscreenPlayerScreen = React.memo(function FullscreenPlayerScreen({
  playlist,
  playingTrack,
  isPlaying,
  currentTimeSeconds,
  durationSeconds,
  isSongLiked,
  isShuffleActive = false,
  shuffledTrackIds,
  fullscreenFocusId,
  isAiOverlayOpen,
  aiOverlayStatus,
  aiSongInsight,
  aiErrorMessage,
  selectedBackgroundId,
  isBackgroundOverlayOpen,
  onOpenBackgroundOverlay,
  onCloseBackgroundOverlay,
  onSelectBackground,
  onExitFullscreen,
  onTogglePlayPause,
  onPlayNext,
  onPlayPrev,
  onToggleSongLike,
  onOpenAiOverlay,
  onCloseAiOverlay,
  isUsbTrack,
}: FullscreenPlayerScreenProps) {
  // Compute upcoming 4 tracks
  const upcomingTracks = useMemo(() => {
    const tracks = playlist.tracks || [];
    if (tracks.length === 0) return [];

    if (isShuffleActive && shuffledTrackIds && shuffledTrackIds.length > 0) {
      const orderedQueue = shuffledTrackIds
        .map((id) => tracks.find((t) => t.id === id))
        .filter((t): t is PlaylistTrack => !!t);
      if (orderedQueue.length > 0) {
        const currentIdx = orderedQueue.findIndex((t) => t.id === playingTrack.id);
        const startIdx = currentIdx >= 0 ? currentIdx : 0;
        const result: PlaylistTrack[] = [];
        for (let i = 1; i <= 4; i++) {
          result.push(orderedQueue[(startIdx + i) % orderedQueue.length]);
        }
        return result;
      }
    }

    const currentIdx = tracks.findIndex((t) => t.id === playingTrack.id);
    const startIdx = currentIdx >= 0 ? currentIdx : 0;
    const result: PlaylistTrack[] = [];
    for (let i = 1; i <= 4; i++) {
      result.push(tracks[(startIdx + i) % tracks.length]);
    }
    return result;
  }, [playlist.tracks, playingTrack.id, isShuffleActive, shuffledTrackIds]);

  // Determine if user is currently inspecting one of the 4 upcoming tracks
  const focusedUpcomingIdx = (UPCOMING_TRACK_FOCUS_IDS as readonly string[]).indexOf(
    fullscreenFocusId
  );
  const focusedUpcomingTrack =
    focusedUpcomingIdx >= 0 ? upcomingTracks[focusedUpcomingIdx] : null;

  // Stable motion background parameters by playlist context to avoid ExoPlayer destruction & reloading mid-playback
  const playlistMood = useMemo(() => {
    if (playlist.id.includes('workout')) return 'energetic';
    if (playlist.id.includes('party')) return 'party';
    if (playlist.id.includes('study')) return 'study';
    if (playlist.id.includes('sleep') || playlist.id.includes('midnight')) return 'sleep';
    if (playlist.id.includes('chill')) return 'calm';
    return undefined;
  }, [playlist.id]);

  // Effective motion background ID (selected or fallback default)
  const effectiveBgId = useMemo(() => {
    if (selectedBackgroundId) return selectedBackgroundId;
    return getDefaultBackgroundId(playlistMood, playlist.id, playlist.badgeText);
  }, [selectedBackgroundId, playlistMood, playlist.id, playlist.badgeText]);

  const activeCustomSource = useMemo(() => {
    const found = BACKGROUND_OPTIONS.find((b) => b.id === effectiveBgId);
    return found ? found.videoSource : undefined;
  }, [effectiveBgId]);

  const isScrubberFocused = fullscreenFocusId === FULLSCREEN_FOCUS_IDS.SCRUBBER;

  return (
    <View style={styles.screenRoot}>
      {/* Native Hardware-Accelerated Media3 ExoPlayer Motion Background Loop */}
      <TVMotionBackground
        mood={playlistMood}
        context={playlist.id}
        genre={playlist.badgeText}
        scrimOpacity={0.46}
        customSource={activeCustomSource}
      />

      {/* ================= TOP ROW: < BACK (Left) & NEXT 4 TRACKS (Right) ================= */}
      <View style={styles.topBarRow}>
        {/* Top-Left: < BACK (FS_BACK) */}
        <Pressable
          focusable={false}
          onPress={onExitFullscreen}
          style={[
            styles.backBtn,
            fullscreenFocusId === FULLSCREEN_FOCUS_IDS.BACK && styles.backBtnFocused,
          ]}
        >
          <Text
            style={[
              styles.backChevron,
              fullscreenFocusId === FULLSCREEN_FOCUS_IDS.BACK && styles.backTextFocused,
            ]}
          >
            ‹
          </Text>
          <Text
            style={[
              styles.backLabel,
              fullscreenFocusId === FULLSCREEN_FOCUS_IDS.BACK && styles.backTextFocused,
            ]}
          >
            BACK
          </Text>
        </Pressable>

        <FullscreenUpcomingPanel
          upcomingTracks={upcomingTracks}
          fullscreenFocusId={fullscreenFocusId}
          focusedUpcomingIdx={focusedUpcomingIdx}
        />
      </View>

      {/* ================= CENTER STAGE: CIRCULAR SONG COVER & TRACK METADATA ================= */}
      <FullscreenCenterStage
        playingTrack={playingTrack}
        playlistTitle={playlist.title}
        playlistCoverImage={playlist.coverImage}
        isPlaying={isPlaying}
        focusedUpcomingTrack={focusedUpcomingTrack}
        focusedUpcomingIdx={focusedUpcomingIdx}
      />

      {/* ================= AI SONG INFORMATION OVERLAY ================= */}
      <FullscreenAiOverlay
        isOpen={isAiOverlayOpen}
        fullscreenFocusId={fullscreenFocusId}
        playingTrack={playingTrack}
        playlistCoverImage={playlist.coverImage}
        aiOverlayStatus={aiOverlayStatus}
        aiSongInsight={aiSongInsight}
        aiErrorMessage={aiErrorMessage}
        onClose={onCloseAiOverlay}
      />

      {/* ================= BACKGROUND SELECTION OVERLAY ================= */}
      <BackgroundSelectionOverlay
        isOpen={!!isBackgroundOverlayOpen}
        selectedBackgroundId={effectiveBgId}
        fullscreenFocusId={fullscreenFocusId}
        onSelectBackground={onSelectBackground || (() => {})}
        onClose={onCloseBackgroundOverlay || (() => {})}
      />

      {/* ================= BOTTOM SECTION: CONTROLS + FULL-WIDTH SCRUBBER ================= */}
      <View style={styles.bottomSection}>
        <FullscreenControls
          isPlaying={isPlaying}
          isSongLiked={isSongLiked}
          fullscreenFocusId={fullscreenFocusId}
          isAiOverlayOpen={isAiOverlayOpen}
          isBackgroundOverlayOpen={isBackgroundOverlayOpen}
          playingTrackId={playingTrack.id}
          onPlayPrev={onPlayPrev}
          onTogglePlayPause={onTogglePlayPause}
          onPlayNext={onPlayNext}
          onToggleSongLike={onToggleSongLike}
          onOpenAiOverlay={onOpenAiOverlay}
          onOpenBackgroundOverlay={onOpenBackgroundOverlay}
          isUsbTrack={isUsbTrack ?? (playingTrack?.id?.startsWith('usb_') || playlist?.id === 'usb_storage')}
        />

        <FullscreenScrubber
          currentTimeSeconds={currentTimeSeconds}
          durationSeconds={durationSeconds || playingTrack.durationSeconds || 123}
          isFocused={isScrubberFocused}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  screenRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 900,
    elevation: 50,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    paddingHorizontal: 36,
    paddingTop: 24,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  proceduralBgRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 1,
  },
  skyGradientTopGlow: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 620,
    height: 360,
    borderRadius: 310,
    backgroundColor: 'rgba(252, 231, 243, 0.72)',
  },
  skyGradientBottomGlow: {
    position: 'absolute',
    bottom: -140,
    right: -60,
    width: 680,
    height: 380,
    borderRadius: 340,
    backgroundColor: 'rgba(238, 242, 255, 0.85)',
  },
  windStreamRibbonOne: {
    position: 'absolute',
    top: 120,
    left: -100,
    width: 1180,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(251, 207, 232, 0.24)',
  },
  windStreamRibbonTwo: {
    position: 'absolute',
    top: 270,
    left: -80,
    width: 1150,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(224, 231, 255, 0.32)',
  },
  proceduralLeafAnchor: {
    position: 'absolute',
    top: 0,
    left: 0,
  },

  // Top Row: BACK & NEXT 4 TRACKS (Waterglass Treatment)
  topBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    zIndex: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.30)',
    borderTopColor: 'rgba(255, 255, 255, 0.60)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.20,
    shadowRadius: 8,
    elevation: 4,
  },
  backBtnFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    transform: [{ scale: 1.06 }],
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius: 12,
    elevation: 8,
  },
  backChevron: {
    color: 'rgba(255, 255, 255, 0.90)',
    fontSize: 18,
    fontWeight: '800',
    marginTop: -2,
  },
  backLabel: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  backTextFocused: {
    color: '#FFFFFF',
  },

  // Top-Right: NEXT 4 TRACKS Panel (Curved Translucent Waterglass Sheet)
  upcomingPanel: {
    width: 286,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderTopColor: 'rgba(255, 255, 255, 0.55)',
    paddingVertical: 9,
    paddingHorizontal: 11,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  upcomingPanelActive: {
    borderColor: 'rgba(255, 255, 255, 0.45)',
    borderTopColor: 'rgba(255, 255, 255, 0.80)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  upcomingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  upcomingHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  upcomingHeaderBadge: {
    color: 'rgba(255, 255, 255, 0.80)',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4.5,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    gap: 7,
  },
  upcomingRowFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderColor: 'rgba(255, 255, 255, 0.65)',
    borderTopColor: 'rgba(255, 255, 255, 0.85)',
    transform: [{ scale: 1.02 }],
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.30,
    shadowRadius: 8,
  },
  upcomingIndex: {
    width: 14,
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
  },
  upcomingIndexFocused: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  upcomingThumb: {
    width: 24,
    height: 24,
    borderRadius: 5,
  },
  upcomingMetaCol: {
    flex: 1,
  },
  upcomingTrackTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  upcomingTrackTitleFocused: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  upcomingTrackArtist: {
    color: 'rgba(255, 255, 255, 0.70)',
    fontSize: 9.5,
  },
  upcomingTrackArtistFocused: {
    color: '#FFFFFF',
  },
  upcomingDuration: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 9.5,
    fontWeight: '700',
  },
  upcomingDurationFocused: {
    color: '#FFFFFF',
  },

  // Center Stage (ANIMATION)
  centerStage: {
    position: 'absolute',
    top: 32,
    left: 0,
    right: 0,
    bottom: 112,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  visualizerCenterWrap: {
    width: 164,
    height: 164,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  outerPulseRing: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 2,
    backgroundColor: 'rgba(99, 102, 241, 0.10)',
  },
  artworkDiscFrame: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },
  artworkDiscImage: {
    width: '100%',
    height: '100%',
  },
  discCenterHole: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 2.5,
    borderColor: '#6366F1',
  },
  equalizerWaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    gap: 5,
    marginBottom: 8,
  },
  equalizerWaveBar: {
    width: 4.5,
    borderRadius: 3,
  },
  nowPlayingTextBlock: {
    alignItems: 'center',
    maxWidth: 540,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderTopColor: 'rgba(255, 255, 255, 0.50)',
    marginBottom: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  mainSongTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.3,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  mainSongArtist: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13.5,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  upcomingInspectBanner: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    borderTopColor: 'rgba(255, 255, 255, 0.55)',
  },
  upcomingInspectText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },

  // AI Song Information Overlay Modal (PANDIVO Waterglass + Headphone Panda)
  aiOverlayBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.40)',
    zIndex: 80,
  },
  aiOverlayModal: {
    width: 590,
    maxWidth: '64%',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.90)',
    backgroundColor: 'rgba(238, 242, 255, 0.95)',
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 24,
    overflow: 'hidden',
  },
  aiOverlayBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  aiOverlayFrostedScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  aiOverlayContentWrapper: {
    width: '100%',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 9,
    zIndex: 10,
  },
  aiOverlayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  aiOverlayBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5.5,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    borderWidth: 1,
    borderColor: '#6366F1',
    gap: 4,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.30,
    shadowRadius: 6,
    elevation: 4,
  },
  aiOverlayBackBtnFocused: {
    backgroundColor: '#4338CA',
    borderColor: '#FFFFFF',
    borderWidth: 2,
    transform: [{ scale: 1.05 }],
    shadowColor: '#A5B4FC',
    shadowOpacity: 0.50,
  },
  aiOverlayBackChevron: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: -2,
  },
  aiOverlayBackLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  aiOverlayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiBadgePill: {
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  aiBadgePillText: {
    color: '#4F46E5',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  aiOverlayCloseBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 0.80)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiOverlayCloseText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
  },

  // Song Hero Section
  aiHeroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
    minHeight: 88,
  },
  aiAlbumCluster: {
    position: 'relative',
    width: 92,
    height: 80,
    justifyContent: 'center',
  },
  aiVinylDisc: {
    position: 'absolute',
    right: -14,
    top: 4,
    width: 72,
    height: 72,
  },
  aiAlbumArtFrame: {
    width: 78,
    height: 78,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.90)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.20,
    shadowRadius: 6,
    elevation: 4,
  },
  aiAlbumArtImg: {
    width: '100%',
    height: '100%',
  },
  aiGenreBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  aiGenreBadgeIcon: {
    color: '#818CF8',
    fontSize: 7,
    fontWeight: '900',
  },
  aiGenreBadgeText: {
    color: '#FFFFFF',
    fontSize: 7.5,
    fontWeight: '700',
  },
  aiPlayBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.60)',
  },
  aiPlayBadgeIcon: {
    color: '#FFFFFF',
    fontSize: 8,
    marginLeft: 1,
  },
  aiHeroMetaCol: {
    flex: 1,
    marginLeft: 22,
    justifyContent: 'center',
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 1,
  },
  aiSparkleIcon: {
    color: '#4F46E5',
    fontSize: 10,
    fontWeight: '900',
  },
  aiHeaderTitle: {
    color: '#4F46E5',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  aiSongMainTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  aiSongSubheader: {
    fontSize: 10.5,
    marginTop: 1,
    marginBottom: 5,
  },
  aiSongArtistHighlight: {
    color: '#E11D48',
    fontWeight: '800',
  },
  aiSongAlbumItalic: {
    color: '#64748B',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  aiMetadataCapsulesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  aiMetaCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  aiMetaCapsuleIcon: {
    fontSize: 11,
    color: '#0F172A',
  },
  aiMetaCapsuleTextCol: {
    flexDirection: 'column',
  },
  aiMetaCapsuleValue: {
    color: '#0F172A',
    fontSize: 9.5,
    fontWeight: '800',
    lineHeight: 11,
  },
  aiMetaCapsuleLabel: {
    color: '#64748B',
    fontSize: 6.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    lineHeight: 8,
  },
  aiHeroRightSpacer: {
    width: 90,
  },

  // Overview Glass Box
  aiOverviewGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.70)',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 3,
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  aiOverviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiOverviewIcon: {
    fontSize: 10,
    color: '#4F46E5',
  },
  aiOverviewTitle: {
    color: '#4F46E5',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  aiOverviewSummaryText: {
    color: '#1E293B',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },

  // Three Bottom Bento Insight Cards
  aiMetaGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  aiMetaCard: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6.5,
    borderWidth: 1,
    gap: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  aiCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiMetaCardTeal: {
    backgroundColor: 'rgba(240, 253, 250, 0.88)',
    borderColor: '#99F6E4',
  },
  aiMetaLabelTeal: {
    color: '#0D9488',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  aiMetaValueTeal: {
    color: '#134E4A',
    fontSize: 8.5,
    fontWeight: '700',
    lineHeight: 11.5,
  },
  aiMetaCardRose: {
    backgroundColor: 'rgba(255, 241, 242, 0.88)',
    borderColor: '#FECDD3',
  },
  aiMetaLabelRose: {
    color: '#E11D48',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  aiMetaValueRose: {
    color: '#881337',
    fontSize: 8.5,
    fontWeight: '700',
    lineHeight: 11.5,
  },
  aiHighlightBoxAmber: {
    backgroundColor: 'rgba(255, 251, 235, 0.88)',
    borderColor: '#FDE68A',
  },
  aiMetaLabelAmber: {
    color: '#D97706',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  aiHighlightValueAmber: {
    color: '#78350F',
    fontSize: 8.5,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 11.5,
  },
  aiOverlayBody: {
    justifyContent: 'center',
    zIndex: 10,
  },
  aiLoadingBox: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    alignItems: 'center',
  },
  aiLoadingTitle: {
    color: '#6D28D9',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  aiErrorTitle: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  aiLoadingSubtitle: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '500',
  },
  aiReadyContent: {
    gap: 8,
  },

  // Bottom Section: Controls + Full-Width Scrubber
  bottomSection: {
    width: '100%',
    zIndex: 20,
    gap: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 6,
  },
  leftTransportCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  rightActionCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  transportIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.30)',
    borderTopColor: 'rgba(255, 255, 255, 0.60)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.20,
    shadowRadius: 8,
    elevation: 4,
  },
  transportIconBtnFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderColor: '#FFFFFF',
    borderWidth: 1.5,
    transform: [{ scale: 1.12 }],
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius: 12,
    elevation: 8,
  },
  chevronControlIcon: {
    color: 'rgba(255, 255, 255, 0.90)',
    fontSize: 26,
    fontWeight: '700',
    marginTop: -3,
  },
  controlIconFocused: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Play/Pause Primary Glass Control with Luminous Halo Focus
  playCircleRing: {
    padding: 3,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  playCircleRingFocused: {
    borderColor: 'rgba(255, 255, 255, 0.85)',
    backgroundColor: 'rgba(99, 102, 241, 0.32)',
    transform: [{ scale: 1.08 }],
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 16,
  },
  playCircleBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(99, 102, 241, 0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.60)',
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  playCircleBtnFocused: {
    backgroundColor: 'rgba(99, 102, 241, 0.68)',
    borderColor: '#FFFFFF',
    borderWidth: 2,
    shadowColor: '#A5B4FC',
    shadowOpacity: 0.75,
    shadowRadius: 16,
  },
  playCircleVectorIcon: {
    width: 18,
    height: 18,
    tintColor: '#FFFFFF',
  },

  // Right Cluster Buttons: LIKE & SONG INFO (Waterglass Language)
  rightCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.30)',
    borderTopColor: 'rgba(255, 255, 255, 0.60)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.20,
    shadowRadius: 8,
    elevation: 4,
  },
  rightCircleBtnLiked: {
    borderColor: 'rgba(251, 113, 133, 0.60)',
    borderTopColor: 'rgba(254, 205, 211, 0.85)',
    backgroundColor: 'rgba(244, 63, 94, 0.20)',
  },
  rightCircleBtnInfoActive: {
    borderColor: 'rgba(165, 180, 252, 0.70)',
    borderTopColor: 'rgba(224, 231, 255, 0.90)',
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
  },
  rightCircleBtnPaletteActive: {
    borderColor: 'rgba(165, 180, 252, 0.70)',
    borderTopColor: 'rgba(224, 231, 255, 0.90)',
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
  },
  rightCircleBtnFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderColor: '#FFFFFF',
    borderWidth: 1.5,
    transform: [{ scale: 1.12 }],
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius: 12,
    elevation: 8,
  },
  rightVectorIcon: {
    width: 18,
    height: 18,
  },
  infoSymbolText: {
    color: 'rgba(255, 255, 255, 0.90)',
    fontSize: 18,
    fontWeight: '700',
    fontStyle: 'normal',
  },
  infoSymbolTextActive: {
    color: '#FFFFFF',
  },
  infoSymbolTextFocused: {
    color: '#FFFFFF',
  },

  // Full-Width Scrubber (Waterglass Track & Glowing Thumb)
  scrubberContainer: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderTopColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrubberContainerFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.60)',
    borderTopColor: 'rgba(255, 255, 255, 0.90)',
    borderWidth: 1.5,
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  scrubberLineTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 10,
  },
  scrubberLineTrackFocused: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
    borderColor: 'rgba(255, 255, 255, 0.50)',
  },
  scrubberLineFill: {
    height: 4,
    backgroundColor: '#818CF8',
    borderRadius: 2,
  },
  scrubberLineFillFocused: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
  },
  scrubberKnob: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#818CF8',
    position: 'absolute',
    top: -4,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 6,
  },
  scrubberKnobFocused: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#6366F1',
    top: -6,
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 10,
  },
  timePillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  timePillBox: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderTopColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    minWidth: 56,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  timePillBoxFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  timePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  timePillTextFocused: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrubberSeekHint: {
    color: 'rgba(255, 255, 255, 0.90)',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
