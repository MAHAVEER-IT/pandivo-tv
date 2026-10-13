import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  AccessibilityInfo,
  Image,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AI_DJ_FOCUS_IDS } from '../navigation/aiDjNavGraph';
import { PLAYLISTS, PlaylistData } from '../data/playlistData';

// Pre-resolved optimized 1920x1080 silk wave background texture & 6 AI playlist cover artworks
const AI_DJ_WAVE_BG = require('../../assets/ui/ai_dj_wave_bg.jpg');
const AI_DJ_CARD_COVERS = [
  require('../../assets/ui/ai_dj_card_0.jpg'),
  require('../../assets/ui/ai_dj_card_1.jpg'),
  require('../../assets/ui/ai_dj_card_2.jpg'),
  require('../../assets/ui/ai_dj_card_3.jpg'),
  require('../../assets/ui/ai_dj_card_4.jpg'),
  require('../../assets/ui/ai_dj_card_5.jpg'),
];
Image.resolveAssetSource(AI_DJ_WAVE_BG);
AI_DJ_CARD_COVERS.forEach((img) => Image.resolveAssetSource(img));

export interface AiHistoryPlaylistCardItem {
  id: string;
  focusId: string;
  title: string;
  songsCount: number;
  durationLabel: string;
  playlistKey: string;
  accentTop: string;
  accentBottom: string;
  badgeHue: string;
  iconName: string;
  coverImage: any;
}

export const USER_AI_HISTORY_PLAYLISTS: AiHistoryPlaylistCardItem[] = [];

export interface GeminiDiagnosticInfo {
  isResponding: boolean;
  latencyMs: number;
  model: string;
  statusCode?: number;
  action?: string;
  mood?: string | null;
  energy?: string | null;
  reason?: string;
  errorMessage?: string;
  timestamp?: number;
  testPrompt?: string;
}

interface AiDjScreenProps {
  focusedId: string;
  setFocusedId: (id: string) => void;
  onPressMic: () => void;
  onSelectHistoryPlaylist: (playlist: PlaylistData) => void;
  onPressViewAll: () => void;
  isListening?: boolean;
  isProcessing?: boolean;
  voiceTranscript?: string;
  geminiDiagnostic?: GeminiDiagnosticInfo | null;
  onTriggerTestPrompt?: (prompt: string) => void;
  onRunDiagnosticTest?: () => void;
  onCloseDiagnosticModal?: () => void;
  userPlaylists?: PlaylistData[];
  playlistLikedMap?: Record<string, boolean>;
  onTogglePlaylistLike?: (playlistId: string) => void;
}

export const AiDjScreen: React.FC<AiDjScreenProps> = ({
  focusedId,
  setFocusedId,
  onPressMic,
  onSelectHistoryPlaylist,
  onPressViewAll,
  isListening = false,
  isProcessing = false,
  voiceTranscript = '',
  geminiDiagnostic = null,
  onTriggerTestPrompt,
  onRunDiagnosticTest,
  onCloseDiagnosticModal,
  userPlaylists = [],
  playlistLikedMap,
  onTogglePlaylistLike,
}) => {
  // Subtle breathing pulse for the central AI DJ orb
  const orbPulseAnim = useRef(new Animated.Value(1)).current;

  // 6 Clean Native-Vector Horseshoe Gauge Segments (tight 2.2° gaps, 37.4° span each)
  const gaugeSegments = useMemo(
    () => [
      {
        id: 'seg_0',
        midDeg: -98.2,
        cStart: '#DCE3EE',
        cMid: '#D5DFEC',
        cEnd: '#CFD9E7',
      },
      {
        id: 'seg_1',
        midDeg: -58.9,
        cStart: '#55CEFA',
        cMid: '#5BB2FA',
        cEnd: '#6196FA',
      },
      {
        id: 'seg_2',
        midDeg: -19.6,
        cStart: '#648EFA',
        cMid: '#787EFA',
        cEnd: '#8E6FFA',
      },
      {
        id: 'seg_3',
        midDeg: 19.6,
        cStart: '#A966FA',
        cMid: '#C867F7',
        cEnd: '#E56BF4',
      },
      {
        id: 'seg_4',
        midDeg: 58.9,
        cStart: '#F26DC8',
        cMid: '#F877B2',
        cEnd: '#FE839D',
      },
      {
        id: 'seg_5',
        midDeg: 98.2,
        cStart: '#B4C6E0',
        cMid: '#C2D1E8',
        cEnd: '#D2DCEF',
      },
    ],
    []
  );

  // Master coupled pipeline wave (0 -> 6):
  // Guarantees every active color is locked at exactly 39.28° (1 segment slot) behind its predecessor:
  // w = 1: C6 (last) in Slot 1
  // w = 2: C6 in Slot 2, C5 (last-1) in Slot 1
  // w = 3: C6 in Slot 3, C5 in Slot 2, C4 (last-2) in Slot 1
  // w = 4: C6 in Slot 4, C5 in Slot 3, C4 in Slot 2, C3 (last-3) in Slot 1
  // w = 5: C6 in Slot 5, C5 in Slot 4, C4 in Slot 3, C3 in Slot 2, C2 (last-4) in Slot 1
  // w = 6: C6 in Slot 6, C5 in Slot 5, C4 in Slot 4, C3 in Slot 3, C2 in Slot 2, C1 (first) in Slot 1
  const pipelineWave = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulseAnim, {
          toValue: 1.045,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbPulseAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [orbPulseAnim]);

  // Ultra-smooth 60fps native coupled pipeline wave animation when AI DJ page becomes active
  useEffect(() => {
    let isMounted = true;
    let waveAnim: Animated.CompositeAnimation | null = null;

    const snapToFinalSettledState = () => {
      pipelineWave.stopAnimation();
      pipelineWave.setValue(6);
    };

    const startFluidPipelineWave = () => {
      pipelineWave.setValue(0);
      waveAnim = Animated.timing(pipelineWave, {
        toValue: 6,
        duration: 2100,
        easing: Easing.bezier(0.22, 0.61, 0.36, 1),
        useNativeDriver: true,
      });
      waveAnim.start();
    };

    // Start immediately on frame 0
    startFluidPipelineWave();

    // Respect reduced-motion accessibility setting if enabled
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduceMotion) => {
        if (isMounted && reduceMotion) {
          waveAnim?.stop();
          snapToFinalSettledState();
        }
      })
      .catch(() => {});

    const reduceMotionSub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (reduceMotion) => {
        if (reduceMotion) {
          waveAnim?.stop();
          snapToFinalSettledState();
        }
      }
    );

    return () => {
      isMounted = false;
      waveAnim?.stop();
      reduceMotionSub.remove();
    };
  }, [pipelineWave]);

  const isMicFocused = focusedId === AI_DJ_FOCUS_IDS.MIC;
  const isViewAllFocused = focusedId === AI_DJ_FOCUS_IDS.VIEW_ALL;

  return (
    <View style={styles.container}>
      {/* ===================================================================== */}
      {/* GEMINI & MIC LIVE DIAGNOSTIC HUD OVERLAY                              */}
      {/* ===================================================================== */}
      {geminiDiagnostic && (
        <View style={styles.diagnosticHudOverlay} pointerEvents="box-none">
          <View style={styles.diagnosticHudCard}>
            <View style={styles.diagnosticHudHeader}>
              <View style={styles.diagnosticHudTitleRow}>
                <View
                  style={[
                    styles.statusPillBadge,
                    geminiDiagnostic.isResponding
                      ? styles.statusPillGreen
                      : styles.statusPillRed,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: geminiDiagnostic.isResponding
                          ? '#10B981'
                          : '#EF4444',
                      },
                    ]}
                  />
                  <Text style={styles.statusPillText}>
                    {geminiDiagnostic.isResponding
                      ? 'GEMINI 3.5 FLASH LITE: 200 OK'
                      : 'GEMINI: NOT RESPONDING'}
                  </Text>
                </View>
                <Text style={styles.diagnosticLatencyText}>
                  ⚡ {geminiDiagnostic.latencyMs}ms Latency
                </Text>
              </View>
              <Pressable
                onPress={onCloseDiagnosticModal}
                style={styles.closeHudBtn}
              >
                <Feather name="x" size={15} color="#94A3B8" />
              </Pressable>
            </View>

            <View style={styles.diagnosticHudBody}>
              {/* Mic Status */}
              <View style={styles.diagnosticReportRow}>
                <Text style={styles.diagnosticReportLabel}>🎙️ Mic Input:</Text>
                <Text style={styles.diagnosticReportValue} numberOfLines={1}>
                  "{geminiDiagnostic.testPrompt || voiceTranscript || 'Voice Captured'}"
                </Text>
              </View>

              {/* Gemini Response Status */}
              <View style={styles.diagnosticReportRow}>
                <Text style={styles.diagnosticReportLabel}>✨ Gemini Intent:</Text>
                <Text style={styles.diagnosticReportValue} numberOfLines={1}>
                  Action: {(geminiDiagnostic.action || 'start_ai_dj').toUpperCase()} • Mood: {geminiDiagnostic.mood || 'Energetic'} • Energy: {geminiDiagnostic.energy || 'High'}
                </Text>
              </View>

              {/* Reason / Curated Commentary */}
              {geminiDiagnostic.reason && (
                <View style={styles.diagnosticReportRow}>
                  <Text style={styles.diagnosticReportLabel}>🧠 AI Reasoning:</Text>
                  <Text style={styles.diagnosticReportReason} numberOfLines={2}>
                    "{geminiDiagnostic.reason}"
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
      {/* ===================================================================== */}
      {/* 1. OPTIMIZED HARDWARE-DECODED SILK WAVE BACKGROUND IMAGE (29 KB)      */}
      {/* ===================================================================== */}
      <View style={styles.waveCanvas} pointerEvents="none">
        <Image
          source={AI_DJ_WAVE_BG}
          style={styles.waveBgImage}
          resizeMode="stretch"
          resizeMethod="resize"
          fadeDuration={0}
        />
      </View>

      {/* ===================================================================== */}
      {/* 2. CENTERED TOP HEADER: "AI DJ" + SUBTITLE                            */}
      {/* ===================================================================== */}
      <View style={styles.titleSection}>
        <View style={styles.titleWordRow}>
          <Text style={styles.titleAiText}>AI </Text>
          <Text style={styles.titleDjText}>DJ</Text>
        </View>
        <Text style={styles.titleSubtext}>Your personal DJ, powered by AI</Text>
      </View>

      {/* ===================================================================== */}
      {/* 3. THREE-COLUMN HERO STAGE (LEFT CARD | MIC ORB | RIGHT CARD)         */}
      {/* ===================================================================== */}
      <View style={styles.heroThreeColRow}>
        {/* LEFT CARD: "Let AI build your perfect playlist" */}
        <View style={styles.leftFeatureCard}>
          <View style={styles.sparkleIconWrap}>
            <MaterialCommunityIcons name="star-four-points" size={20} color="#5B5AF7" />
          </View>
          <Text style={styles.leftCardTitle}>
            {'Let AI build\nyour perfect playlist'}
          </Text>
          <Text style={styles.leftCardDesc}>
            {"Just say what you're in the mood for\nand I'll take care of the rest."}
          </Text>
        </View>

        {/* CENTER HERO: Pure-Code 6-Segment Half-Round Gauge + Glowing 3D Mic Button */}
        <View style={styles.centerMicColumn}>
          <Pressable
            focusable={false}
            onPress={() => {
              setFocusedId(AI_DJ_FOCUS_IDS.MIC);
              onPressMic();
            }}
            style={({ pressed }) => [
              styles.gaugeInteractiveWrap,
              pressed && styles.btnPressed,
            ]}
          >
            {/* 168x168 Pure-Code Native Vector Gauge & Shaded Bevel Mic Circle */}
            <View style={styles.gaugeCanvas} pointerEvents="none">
              {/* LAYER A: Initial Soft Neutral 6-Segment Track (Stationary Base) */}
              {gaugeSegments.map((seg) => (
                <View
                  key={`${seg.id}_base_neutral`}
                  pointerEvents="none"
                  style={[
                    styles.segmentRotator,
                    { transform: [{ rotate: `${seg.midDeg}deg` }] },
                  ]}
                >
                  <View style={styles.segmentClipWindow}>
                    <View
                      style={[
                        styles.segmentFullRing,
                        { left: -62.2, borderColor: '#E6ECF5' },
                      ]}
                    />
                  </View>
                  <View
                    style={[
                      styles.segmentCap,
                      { left: 57.2, top: 3.1, backgroundColor: '#E6ECF5' },
                    ]}
                  />
                  <View
                    style={[
                      styles.segmentCap,
                      { left: 100.8, top: 3.1, backgroundColor: '#E6ECF5' },
                    ]}
                  />
                </View>
              ))}

              {/* LAYER B: Synchronized 6-Stage Pipeline Color Train (C6 enters Slot 1 first, followed by C5, C4, C3, C2, C1) */}
              {gaugeSegments.map((seg, idx) => {
                const entryTime = 5 - idx;
                const startMove = entryTime + 1;

                // 1. Angular rotation strictly along the outer horseshoe track (never below -98.2°, never inside the mic)
                const animatedRotate =
                  idx === 0
                    ? pipelineWave.interpolate({
                        inputRange: [0, 6],
                        outputRange: ['-98.2deg', '-98.2deg'],
                      })
                    : pipelineWave.interpolate({
                        inputRange: [0, startMove, 6],
                        outputRange: ['-98.2deg', '-98.2deg', `${seg.midDeg}deg`],
                      });

                // 2. Pure track opacity fill at Slot 1 (zero radial scaling, segments stay permanently at radius 84 outside mic circle)
                const animatedOpacity =
                  entryTime === 0
                    ? pipelineWave.interpolate({
                        inputRange: [0, 0.65, 6],
                        outputRange: [0, 1, 1],
                      })
                    : pipelineWave.interpolate({
                        inputRange: [0, entryTime, entryTime + 0.65, 6],
                        outputRange: [0, 0, 1, 1],
                      });

                return (
                  <Animated.View
                    key={seg.id}
                    pointerEvents="none"
                    style={[
                      styles.segmentRotator,
                      {
                        opacity: animatedOpacity,
                        transform: [
                          { rotate: animatedRotate },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.segmentClipWindow}>
                      <View style={styles.segmentSliceLeft}>
                        <View
                          style={[
                            styles.segmentFullRing,
                            { left: -62.2, borderColor: seg.cStart },
                          ]}
                        />
                      </View>
                      <View style={styles.segmentSliceMid}>
                        <View
                          style={[
                            styles.segmentFullRing,
                            { left: -76.2, borderColor: seg.cMid },
                          ]}
                        />
                      </View>
                      <View style={styles.segmentSliceRight}>
                        <View
                          style={[
                            styles.segmentFullRing,
                            { left: -90.8, borderColor: seg.cEnd },
                          ]}
                        />
                      </View>
                    </View>
                    <View
                      style={[
                        styles.segmentCap,
                        { left: 57.2, top: 3.1, backgroundColor: seg.cStart },
                      ]}
                    />
                    <View
                      style={[
                        styles.segmentCap,
                        { left: 100.8, top: 3.1, backgroundColor: seg.cEnd },
                      ]}
                    />
                  </Animated.View>
                );
              })}

              {/* LAYER C: 5 Stationary Inter-Segment Gap Dividers (Keeps the 6 segment gaps crisp during flow) */}
              {[-78.55, -39.25, 0, 39.25, 78.55].map((gapDeg) => (
                <View
                  key={`gap_div_${gapDeg}`}
                  pointerEvents="none"
                  style={[
                    styles.segmentRotator,
                    { transform: [{ rotate: `${gapDeg}deg` }] },
                  ]}
                >
                  <View style={styles.stationaryGapNotch} />
                </View>
              ))}

              {/* Borderless Soft Diffuse Lavender Aura Behind Mic Circle */}
              <View style={styles.micDiffuseAuraOuter} />
              <View style={styles.micDiffuseAuraMid} />
              <View style={styles.micDiffuseAuraInner} />

              {/* Main Shaded Purple Mic Circle (Seamless Feathered Rim & Radial Shade) */}
              <Animated.View
                style={[
                  styles.orbCoreSphere,
                  isMicFocused && styles.orbCoreSphereFocused,
                  isListening && styles.orbCoreSphereListening,
                  { transform: [{ scale: orbPulseAnim }] },
                ]}
              >
                {/* Micro-feathered inner rim glow (blends outer edge smoothly into #5542F2) */}
                <View style={styles.orbFeatherRim1} />
                <View style={styles.orbFeatherRim2} />
                <View style={styles.orbFeatherRim3} />

                {/* Ultra-soft 4% alpha radial center glow layers (no visible circle boundary) */}
                <View style={styles.orbSoftCenter1} />
                <View style={styles.orbSoftCenter2} />
                <View style={styles.orbSoftCenter3} />

                {/* Pure-Code Vector Microphone Icon (Exact Stem-Only Silhouette) */}
                <View style={styles.codeMicWrapper}>
                  {/* Mic Capsule Head */}
                  <View style={styles.codeMicCapsule} />
                  {/* Mic U-Shaped Cradle with Rounded Arm Tips */}
                  <View style={styles.codeMicCradleWrap}>
                    <View style={styles.codeMicCradleTipLeft} />
                    <View style={styles.codeMicCradleTipRight} />
                    <View style={styles.codeMicCradle} />
                  </View>
                  {/* Mic Vertical Rounded Stem (No Horizontal Crossbar) */}
                  <View style={styles.codeMicStem} />
                </View>
              </Animated.View>
            </View>
          </Pressable>

          {/* Call to Action Label / Dynamic Testing State Below Orb */}
          {isListening ? (
            <View style={styles.listeningStatusContainer}>
              <View style={styles.listeningWaveRow}>
                <View style={[styles.listenWaveBar, styles.listenWaveBar1]} />
                <View style={[styles.listenWaveBar, styles.listenWaveBar2]} />
                <View style={[styles.listenWaveBar, styles.listenWaveBar3]} />
                <View style={[styles.listenWaveBar, styles.listenWaveBar4]} />
                <View style={[styles.listenWaveBar, styles.listenWaveBar5]} />
              </View>
              <Text style={styles.tapSpeakTitleListening}>
                🎙️ Listening for voice...
              </Text>
              <Text style={styles.tapSpeakSubtitle}>
                Speak into remote or test a prompt:
              </Text>
              <View style={styles.quickPromptRow}>
                <Pressable
                  focusable={false}
                  onPress={() => onTriggerTestPrompt?.('create a travelling playlist')}
                  style={styles.quickPromptChip}
                >
                  <Text style={styles.quickPromptChipText}>🚗 Travelling</Text>
                </Pressable>
                <Pressable
                  focusable={false}
                  onPress={() => onTriggerTestPrompt?.('chill playlist')}
                  style={styles.quickPromptChip}
                >
                  <Text style={styles.quickPromptChipText}>☕ Chill</Text>
                </Pressable>
                <Pressable
                  focusable={false}
                  onPress={() => onTriggerTestPrompt?.('Play energetic workout music')}
                  style={styles.quickPromptChip}
                >
                  <Text style={styles.quickPromptChipText}>⚡ Energetic</Text>
                </Pressable>
                <Pressable
                  focusable={false}
                  onPress={() => onTriggerTestPrompt?.("What's the capital of France?")}
                  style={styles.quickPromptChip}
                >
                  <Text style={styles.quickPromptChipText}>❓ General Fail</Text>
                </Pressable>
                <Pressable
                  focusable={false}
                  onPress={() => onTriggerTestPrompt?.('Rare obscure songs [simulate:no_tracks]')}
                  style={styles.quickPromptChip}
                >
                  <Text style={styles.quickPromptChipText}>🔍 No Tracks</Text>
                </Pressable>
                <Pressable
                  focusable={false}
                  onPress={() => onTriggerTestPrompt?.('Chill beats [simulate:timeout]')}
                  style={styles.quickPromptChip}
                >
                  <Text style={styles.quickPromptChipText}>📡 Timeout</Text>
                </Pressable>
                <Pressable
                  focusable={false}
                  onPress={() => onTriggerTestPrompt?.('Vibe check [simulate:ai_unavailable]')}
                  style={styles.quickPromptChip}
                >
                  <Text style={styles.quickPromptChipText}>🤖 AI Down</Text>
                </Pressable>
              </View>
            </View>
          ) : isProcessing ? (
            <View style={styles.processingStatusContainer}>
              <Text style={styles.tapSpeakTitleProcessing}>
                ✨ Asking Gemini 3.5 Flash Lite...
              </Text>
              <Text style={styles.tapSpeakSubtitle}>
                Extracting music mood, tempo & context
              </Text>
            </View>
          ) : (
            <View style={styles.idleActionContainer}>
              <Text
                style={[
                  styles.tapSpeakTitle,
                  isMicFocused && styles.tapSpeakTitleFocused,
                ]}
              >
                Tap and speak your vibe
              </Text>
              <Text style={styles.tapSpeakSubtitle}>
                Tell me what you want to listen to.
              </Text>
            </View>
          )}
        </View>

        {/* RIGHT CARD: "120-minute session" */}
        <View style={styles.rightFeatureCard}>
          {/* Top Row: Pure-Code 5-Bar Equalizer Waveform + Title & Subtitle */}
          <View style={styles.rightCardHeaderRow}>
            <View style={styles.fiveBarWaveform}>
              <View style={[styles.waveBar, { height: 7, backgroundColor: '#C084FC' }]} />
              <View style={[styles.waveBar, { height: 15, backgroundColor: '#A855F7' }]} />
              <View style={[styles.waveBar, { height: 23, backgroundColor: '#9333EA' }]} />
              <View style={[styles.waveBar, { height: 15, backgroundColor: '#C084FC' }]} />
              <View style={[styles.waveBar, { height: 7, backgroundColor: '#E879F9' }]} />
            </View>
            <View style={styles.rightCardTitleCol}>
              <Text numberOfLines={1} style={styles.rightCardTitle}>
                120-minute session
              </Text>
              <Text style={styles.rightCardSubtitle}>
                Seamless music, tailored to your mood.
              </Text>
            </View>
          </View>

          {/* Bottom 3-Column Specs Row */}
          <View style={styles.rightSpecsRow}>
            {/* Spec 1: 120 min / Continuous */}
            <View style={styles.specItemCol}>
              <View style={styles.specIconCircle}>
                <Feather name="clock" size={15} color="#475569" />
              </View>
              <Text style={styles.specMainLabel}>120 min</Text>
              <Text style={styles.specSubLabel}>Continuous</Text>
            </View>

            {/* Spec 2: No repeats / Smart mix */}
            <View style={styles.specItemCol}>
              <View style={styles.specIconCircle}>
                <Ionicons name="infinite" size={18} color="#475569" />
              </View>
              <Text style={styles.specMainLabel}>No repeats</Text>
              <Text style={styles.specSubLabel}>Smart mix</Text>
            </View>

            {/* Spec 3: Your vibe / Always on */}
            <View style={styles.specItemCol}>
              <View style={styles.specIconCircle}>
                <Feather name="heart" size={15} color="#475569" />
              </View>
              <Text style={styles.specMainLabel}>Your vibe</Text>
              <Text style={styles.specSubLabel}>Always on</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ===================================================================== */}
      {/* 4. BOTTOM SECTION: "Your AI Playlists" (USER HISTORY PLAYLIST CARDS)  */}
      {/* ===================================================================== */}
      <View style={styles.historySection}>
        <View style={styles.historyHeaderRow}>
          <Text style={styles.historySectionTitle}>Your AI Playlists</Text>
          <Pressable
            focusable={false}
            onPress={() => {
              setFocusedId(AI_DJ_FOCUS_IDS.VIEW_ALL);
              onPressViewAll();
            }}
            style={({ pressed }) => [
              styles.viewAllBtn,
              isViewAllFocused && styles.viewAllBtnFocused,
              pressed && styles.btnPressed,
            ]}
          >
            <Text
              style={[
                styles.viewAllText,
                isViewAllFocused && styles.viewAllTextFocused,
              ]}
            >
              View All
            </Text>
            <Feather
              name="chevron-right"
              size={13}
              color={isViewAllFocused ? '#4F46E5' : '#64748B'}
            />
          </Pressable>
        </View>

        {/* Dynamic User-Generated AI Playlists */}
        {userPlaylists && userPlaylists.length > 0 ? (
          <View style={styles.historyCardsRow}>
            {userPlaylists.slice(0, 6).map((playlist, idx) => {
              const cardFocusId = `AI_DJ_CARD_${idx}`;
              const isCardFocused = focusedId === cardFocusId;
              const accentColor = playlist.bannerAccentColor || '#6366F1';
              const coverGridArtworks =
                playlist.coverGrid && playlist.coverGrid.length >= 4
                  ? playlist.coverGrid
                  : playlist.tracks && playlist.tracks.length >= 4
                  ? playlist.tracks.slice(0, 4).map((t) => t.artwork)
                  : null;
              const coverSrc =
                playlist.coverImage ||
                (playlist.tracks && playlist.tracks[0]?.artwork) ||
                AI_DJ_CARD_COVERS[idx % AI_DJ_CARD_COVERS.length];
              const songsCountDisplay = playlist.tracks
                ? `${playlist.tracks.length} songs`
                : playlist.songsCount || '18 songs';
              const durationDisplay = playlist.totalDuration || '1h 14m';

              return (
                <Pressable
                  key={playlist.id || `aidj_pl_${idx}`}
                  focusable={false}
                  onPress={() => {
                    setFocusedId(cardFocusId);
                    onSelectHistoryPlaylist(playlist);
                  }}
                  style={({ pressed }) => [
                    styles.historyCard,
                    isCardFocused && styles.historyCardFocused,
                    pressed && styles.btnPressed,
                  ]}
                >
                  {/* Optimized Full-Bleed 2x2 Artwork Matrix or Fallback Banner */}
                  <View
                    style={[
                      styles.cardBannerCodeCanvas,
                      { backgroundColor: accentColor },
                    ]}
                  >
                    {coverGridArtworks && coverGridArtworks.length >= 4 ? (
                      <View style={styles.cardCoverGridContainer}>
                        <View style={styles.cardCoverGridRow}>
                          <Image
                            source={coverGridArtworks[0]}
                            style={styles.cardCoverGridTile}
                            resizeMode="cover"
                            fadeDuration={0}
                          />
                          <Image
                            source={coverGridArtworks[1]}
                            style={styles.cardCoverGridTile}
                            resizeMode="cover"
                            fadeDuration={0}
                          />
                        </View>
                        <View style={styles.cardCoverGridRow}>
                          <Image
                            source={coverGridArtworks[2]}
                            style={styles.cardCoverGridTile}
                            resizeMode="cover"
                            fadeDuration={0}
                          />
                          <Image
                            source={coverGridArtworks[3]}
                            style={styles.cardCoverGridTile}
                            resizeMode="cover"
                            fadeDuration={0}
                          />
                        </View>
                      </View>
                    ) : (
                      <Image
                        source={coverSrc}
                        style={styles.cardCoverImage}
                        resizeMode="cover"
                        resizeMethod="resize"
                        fadeDuration={0}
                      />
                    )}

                    {/* Top-Right Heart Indicator / Like Toggle */}
                    {onTogglePlaylistLike && (
                      <Pressable
                        focusable={false}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          onTogglePlaylistLike(playlist.id);
                        }}
                        style={styles.cardHeartHit}
                      >
                        <Image
                          source={
                            playlistLikedMap?.[playlist.id]
                              ? require('../../assets/ui/icon_heart_filled.png')
                              : require('../../assets/ui/icon_heart_outline.png')
                          }
                          style={[
                            styles.cardHeartIcon,
                            {
                              tintColor: playlistLikedMap?.[playlist.id]
                                ? '#EC4899'
                                : '#FFFFFF',
                            },
                          ]}
                          resizeMode="contain"
                        />
                      </Pressable>
                    )}
                  </View>

                  {/* Bottom White Metadata Footer */}
                  <View style={styles.cardFooterRow}>
                    <View style={styles.cardMetaCol}>
                      <Text numberOfLines={1} style={styles.cardTitleText}>
                        {playlist.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.cardSubMetaText}>
                        {songsCountDisplay} • {durationDisplay}
                      </Text>
                    </View>

                    {/* Pure-Code 4-Bar Mini Equalizer Icon on Right */}
                    <View style={styles.miniEqWrap}>
                      <View style={[styles.miniEqBar, { height: 6 }]} />
                      <View style={[styles.miniEqBar, { height: 12 }]} />
                      <View style={[styles.miniEqBar, { height: 8 }]} />
                      <View style={[styles.miniEqBar, { height: 10 }]} />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyHistoryBox}>
            <View style={styles.emptyHistoryIconCircle}>
              <MaterialCommunityIcons
                name="robot-happy-outline"
                size={30}
                color="#6366F1"
              />
            </View>
            <View style={styles.emptyHistoryTextCol}>
              <Text style={styles.emptyHistoryTitle}>
                No AI Playlists Created Yet
              </Text>
              <Text style={styles.emptyHistorySubtitle}>
                Tap the microphone above or say what mood you want to hear to generate your customized AI vibe session.
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    marginLeft: 0,
    marginRight: -28,
    paddingLeft: 4,
    paddingRight: 22,
    paddingTop: 2,
    paddingBottom: 10,
    justifyContent: 'space-between',
    overflow: 'hidden',
    backgroundColor: '#F8F9FB',
  },

  // =========================================================================
  // 1. OPTIMIZED 1920x1080 SILK WAVE BACKGROUND IMAGE STYLES
  // =========================================================================
  waveCanvas: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
  waveBgImage: {
    width: '100%',
    height: '100%',
  },

  // =========================================================================
  // 2. TOP HEADER TITLE
  // =========================================================================
  titleSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    zIndex: 2,
  },
  titleWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleAiText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#7C5CFC',
    letterSpacing: -0.6,
  },
  titleDjText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.6,
  },
  titleSubtext: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },

  // =========================================================================
  // 3. THREE-COLUMN HERO STAGE (DRAWER OPEN / CLOSE RESPONSIVE)
  // =========================================================================
  heroThreeColRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    gap: 12,
    marginTop: 4,
    zIndex: 2,
  },

  // Left Card ("Let AI build your perfect playlist")
  leftFeatureCard: {
    width: 256,
    maxWidth: 266,
    minWidth: 196,
    height: 150,
    borderRadius: 18,
    backgroundColor: 'rgba(226, 239, 254, 0.50)',
    borderWidth: 1.2,
    borderColor: 'rgba(205, 226, 252, 0.68)',
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  sparkleIconWrap: {
    marginBottom: 6,
  },
  leftCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 5,
  },
  leftCardDesc: {
    fontSize: 9.7,
    fontWeight: '500',
    color: '#475569',
    lineHeight: 14,
  },

  // Center Microphone & Segmented Gauge Column
  centerMicColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 196,
    flexShrink: 0,
  },
  gaugeInteractiveWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeCanvas: {
    width: 168,
    height: 168,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentRotator: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 168,
    height: 168,
  },
  segmentClipWindow: {
    position: 'absolute',
    left: 62.2,
    top: 0,
    width: 43.6,
    height: 28,
    overflow: 'hidden',
  },
  segmentSliceLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 15.5,
    height: 28,
    overflow: 'hidden',
  },
  segmentSliceMid: {
    position: 'absolute',
    left: 14,
    top: 0,
    width: 16.5,
    height: 28,
    overflow: 'hidden',
  },
  segmentSliceRight: {
    position: 'absolute',
    left: 28.6,
    top: 0,
    width: 15,
    height: 28,
    overflow: 'hidden',
  },
  segmentFullRing: {
    position: 'absolute',
    top: 0,
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 10,
  },
  segmentCap: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stationaryGapNotch: {
    position: 'absolute',
    left: 82.4,
    top: -1,
    width: 3.2,
    height: 13,
    borderRadius: 1.6,
    backgroundColor: '#F5F6FB',
  },
  micDiffuseAuraOuter: {
    position: 'absolute',
    top: 24,
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  micDiffuseAuraMid: {
    position: 'absolute',
    top: 27,
    width: 129,
    height: 129,
    borderRadius: 64.5,
    backgroundColor: 'rgba(139, 92, 246, 0.14)',
  },
  micDiffuseAuraInner: {
    position: 'absolute',
    top: 30,
    width: 123,
    height: 123,
    borderRadius: 61.5,
    backgroundColor: 'rgba(124, 58, 237, 0.22)',
  },
  orbCoreSphere: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: '#5743F2',
    borderWidth: 1.6,
    borderColor: 'rgba(232, 230, 255, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#6D5DF8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
    zIndex: 20,
  },
  orbCoreSphereFocused: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.03 }],
  },
  orbCoreSphereListening: {
    backgroundColor: '#EC4899',
  },
  orbFeatherRim1: {
    position: 'absolute',
    width: 115,
    height: 115,
    borderRadius: 57.5,
    borderWidth: 2,
    borderColor: 'rgba(170, 162, 255, 0.28)',
  },
  orbFeatherRim2: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    borderColor: 'rgba(150, 140, 255, 0.16)',
  },
  orbFeatherRim3: {
    position: 'absolute',
    width: 109,
    height: 109,
    borderRadius: 54.5,
    borderWidth: 2,
    borderColor: 'rgba(130, 118, 255, 0.08)',
  },
  orbSoftCenter1: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(130, 118, 255, 0.05)',
  },
  orbSoftCenter2: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(145, 134, 255, 0.06)',
  },
  orbSoftCenter3: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(165, 156, 255, 0.06)',
  },

  // Pure-Code Vector Microphone Icon inside the Orb
  codeMicWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  codeMicCapsule: {
    width: 21,
    height: 33,
    borderRadius: 10.5,
    backgroundColor: '#FFFFFF',
  },
  codeMicCradleWrap: {
    position: 'relative',
    width: 37,
    height: 20,
    marginTop: -12,
    alignItems: 'center',
  },
  codeMicCradleTipLeft: {
    position: 'absolute',
    left: 0,
    top: -2.1,
    width: 4.2,
    height: 4.2,
    borderRadius: 2.1,
    backgroundColor: '#FFFFFF',
  },
  codeMicCradleTipRight: {
    position: 'absolute',
    right: 0,
    top: -2.1,
    width: 4.2,
    height: 4.2,
    borderRadius: 2.1,
    backgroundColor: '#FFFFFF',
  },
  codeMicCradle: {
    width: 37,
    height: 20,
    borderBottomLeftRadius: 18.5,
    borderBottomRightRadius: 18.5,
    borderWidth: 4.2,
    borderTopWidth: 0,
    borderColor: '#FFFFFF',
  },
  codeMicStem: {
    width: 4.4,
    height: 9,
    borderRadius: 2.2,
    backgroundColor: '#FFFFFF',
    marginTop: -1,
  },

  tapSpeakTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  tapSpeakTitleFocused: {
    color: '#4F46E5',
  },
  tapSpeakSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  idleActionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  diagnosticBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(238, 242, 255, 0.92)',
    borderWidth: 1.2,
    borderColor: '#C7D2FE',
    paddingHorizontal: 11,
    paddingVertical: 4.5,
    borderRadius: 14,
    marginTop: 6,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  diagnosticBtnFocused: {
    backgroundColor: '#4F46E5',
    borderColor: '#3730A3',
    transform: [{ scale: 1.05 }],
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  diagnosticBtnText: {
    fontSize: 10.8,
    fontWeight: '700',
    color: '#4F46E5',
    letterSpacing: 0.2,
  },
  diagnosticBtnTextFocused: {
    color: '#FFFFFF',
  },
  listeningStatusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  listeningWaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 14,
    marginBottom: 3,
  },
  listenWaveBar: {
    width: 3.5,
    borderRadius: 2,
    backgroundColor: '#EC4899',
  },
  listenWaveBar1: { height: 7 },
  listenWaveBar2: { height: 13 },
  listenWaveBar3: { height: 10 },
  listenWaveBar4: { height: 14 },
  listenWaveBar5: { height: 8 },
  tapSpeakTitleListening: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#EC4899',
  },
  quickPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  quickPromptChip: {
    backgroundColor: 'rgba(253, 236, 246, 0.90)',
    borderWidth: 1,
    borderColor: '#F472B6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  quickPromptChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#BE185D',
  },
  processingStatusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  tapSpeakTitleProcessing: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#7C3AED',
  },

  // Floating Diagnostic HUD
  diagnosticHudOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
    elevation: 30,
  },
  diagnosticHudCard: {
    width: 500,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.75)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 32,
  },
  diagnosticHudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  diagnosticHudTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  statusPillRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.22)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.3,
  },
  diagnosticLatencyText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#A5B4FC',
  },
  closeHudBtn: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  diagnosticHudBody: {
    paddingTop: 8,
    gap: 5,
  },
  diagnosticReportRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  diagnosticReportLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#94A3B8',
    minWidth: 92,
  },
  diagnosticReportValue: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  diagnosticReportReason: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: '#CBD5E1',
    fontStyle: 'italic',
  },

  // Right Card ("120-minute session")
  rightFeatureCard: {
    width: 292,
    maxWidth: 302,
    minWidth: 222,
    height: 150,
    borderRadius: 18,
    backgroundColor: 'rgba(253, 236, 246, 0.52)',
    borderWidth: 1.2,
    borderColor: 'rgba(251, 214, 235, 0.68)',
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'space-between',
  },
  rightCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fiveBarWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginRight: 9,
  },
  waveBar: {
    width: 3.2,
    borderRadius: 2,
  },
  rightCardTitleCol: {
    flex: 1,
  },
  rightCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  rightCardSubtitle: {
    fontSize: 9.1,
    fontWeight: '500',
    color: '#475569',
    marginTop: 1,
  },
  rightSpecsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(244, 114, 182, 0.18)',
  },
  specItemCol: {
    alignItems: 'center',
    flex: 1,
  },
  specIconCircle: {
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  specMainLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  specSubLabel: {
    fontSize: 9.5,
    fontWeight: '500',
    color: '#64748B',
  },

  // =========================================================================
  // 4. BOTTOM SECTION: "Your AI Playlists" (USER HISTORY CARDS)
  // =========================================================================
  historySection: {
    marginTop: 18,
    zIndex: 2,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  historySectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  viewAllBtnFocused: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  viewAllTextFocused: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  historyCardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
  },
  historyCard: {
    width: 132,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  historyCardFocused: {
    borderColor: '#6366F1',
    backgroundColor: '#F5F3FF',
    transform: [{ scale: 1.04 }],
  },
  emptyHistoryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 16,
  },
  emptyHistoryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  emptyHistoryTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyHistoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  emptyHistorySubtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 16,
  },
  cardBannerCodeCanvas: {
    height: 64,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  cardCoverImage: {
    width: '100%',
    height: '100%',
  },
  cardCoverGridContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    backgroundColor: '#0F172A',
  },
  cardCoverGridRow: {
    width: '100%',
    height: '50%',
    flexDirection: 'row',
  },
  cardCoverGridTile: {
    width: '50%',
    height: '100%',
  },
  cardHeartHit: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeartIcon: {
    width: 12,
    height: 12,
  },
  cardAiBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  cardAiBadgeText: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6.5,
    paddingVertical: 7,
    backgroundColor: '#FFFFFF',
  },
  cardMetaCol: {
    flex: 1,
    paddingRight: 3,
  },
  cardTitleText: {
    fontSize: 9.8,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSubMetaText: {
    fontSize: 8.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  miniEqWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1.5,
    height: 12,
  },
  miniEqBar: {
    width: 2,
    borderRadius: 1,
    backgroundColor: '#6366F1',
  },
  btnPressed: {
    opacity: 0.85,
  },
  testErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  testErrorChip: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  testErrorChipFocused: {
    backgroundColor: '#4F46E5',
    borderColor: '#3730A3',
    transform: [{ scale: 1.08 }],
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  testErrorChipText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#4F46E5',
  },
  testErrorChipTextFocused: {
    color: '#FFFFFF',
  },
});
