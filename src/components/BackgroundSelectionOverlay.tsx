import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  FULLSCREEN_FOCUS_IDS,
  BG_THUMB_FOCUS_IDS,
} from '../navigation/fullscreenNavGraph';

export interface BackgroundOption {
  id: string;
  label: string;
  videoSource: any;
  thumbnailSource: any;
}

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  {
    id: 'classical_cello',
    label: 'Classical Cello',
    videoSource: require('../../assets/motion_bgs/classical_cello.mp4'),
    thumbnailSource: require('../../assets/motion_bgs/thumbnails/classical_cello.png'),
  },
  {
    id: 'cyan_ribbon',
    label: 'Cyan Ribbon',
    videoSource: require('../../assets/motion_bgs/cyan_ribbon.mp4'),
    thumbnailSource: require('../../assets/motion_bgs/thumbnails/cyan_ribbon.png'),
  },
  {
    id: 'disco_ball',
    label: 'Disco Ball',
    videoSource: require('../../assets/motion_bgs/disco_ball.mp4'),
    thumbnailSource: require('../../assets/motion_bgs/thumbnails/disco_ball.png'),
  },
  {
    id: 'emerald_nature',
    label: 'Emerald Nature',
    videoSource: require('../../assets/motion_bgs/emerald_nature.mp4'),
    thumbnailSource: require('../../assets/motion_bgs/thumbnails/emerald_nature.png'),
  },
  {
    id: 'starlight_helix',
    label: 'Starlight Helix',
    videoSource: require('../../assets/motion_bgs/starlight_helix.mp4'),
    thumbnailSource: require('../../assets/motion_bgs/thumbnails/starlight_helix.png'),
  },
  {
    id: 'warm_amber',
    label: 'Warm Amber',
    videoSource: require('../../assets/motion_bgs/warm_amber.mp4'),
    thumbnailSource: require('../../assets/motion_bgs/thumbnails/warm_amber.png'),
  },
  {
    id: 'workout_tunnel',
    label: 'Workout Tunnel',
    videoSource: require('../../assets/motion_bgs/workout_tunnel.mp4'),
    thumbnailSource: require('../../assets/motion_bgs/thumbnails/workout_tunnel.png'),
  },
];

export function getDefaultBackgroundId(
  mood?: string | null,
  context?: string | null,
  genre?: string | null
): string {
  const m = (mood || '').toLowerCase();
  const c = (context || '').toLowerCase();
  const g = (genre || '').toLowerCase();

  if (c.includes('workout') || m === 'energetic' || c.includes('gym')) {
    return 'workout_tunnel';
  }
  if (c.includes('party') || m === 'party' || g.includes('dance')) {
    return 'disco_ball';
  }
  if (c.includes('sleep') || m === 'relax' || m === 'peaceful') {
    return 'starlight_helix';
  }
  if (c.includes('study') || g.includes('classical') || g.includes('orchestral')) {
    return 'classical_cello';
  }
  if (m === 'happy' || c.includes('morning') || c.includes('sunrise')) {
    return 'warm_amber';
  }
  if (m === 'calm' || g.includes('acoustic') || c.includes('rain')) {
    return 'emerald_nature';
  }
  return 'cyan_ribbon';
}

export interface BackgroundSelectionOverlayProps {
  isOpen: boolean;
  selectedBackgroundId: string;
  fullscreenFocusId: string;
  onSelectBackground: (id: string) => void;
  onClose: () => void;
}

export const BackgroundSelectionOverlay: React.FC<BackgroundSelectionOverlayProps> = React.memo(
  function BackgroundSelectionOverlay({
    isOpen,
    selectedBackgroundId,
    fullscreenFocusId,
    onSelectBackground,
    onClose,
  }) {
    if (!isOpen) return null;

    const isCloseFocused = fullscreenFocusId === FULLSCREEN_FOCUS_IDS.BG_OVERLAY_CLOSE;

    return (
      <View style={styles.backdropRoot} pointerEvents="box-none">
        {/* Centered Glassmorphic Modal Card */}
        <View style={styles.glassModal}>
          {/* Subtle Ambient Glass Highlights */}
          <View style={styles.glassHighlightTop} />

          {/* ================= HEADER ROW ================= */}
          <View style={styles.headerRow}>
            {/* Left: Circular Close Button with '✕' */}
            <Pressable
              focusable={false}
              onPress={onClose}
              style={[
                styles.headerCircleBtn,
                isCloseFocused && styles.headerCircleBtnFocused,
              ]}
            >
              <Text
                style={[
                  styles.closeIconText,
                  isCloseFocused && styles.closeIconTextFocused,
                ]}
              >
                ✕
              </Text>
            </Pressable>

            {/* Center-Left: Title and Subtitle */}
            <View style={styles.headerTitleContainer}>
              <Text style={styles.titleText}>Choose Your Background</Text>
              <Text style={styles.subtitleText}>
                Personalize your listening experience
              </Text>
            </View>

            {/* Right: Circular Palette Icon Button */}
            <View style={styles.headerCircleBtn}>
              <MaterialCommunityIcons
                name="palette"
                size={22}
                color="#FFFFFF"
              />
            </View>
          </View>

          {/* ================= 3-COLUMN THUMBNAIL GRID ================= */}
          <View style={styles.gridContainer}>
            {BACKGROUND_OPTIONS.map((item, idx) => {
              const focusId = BG_THUMB_FOCUS_IDS[idx];
              const isFocused = fullscreenFocusId === focusId;
              const isSelected = selectedBackgroundId === item.id;

              return (
                <Pressable
                  key={item.id}
                  focusable={false}
                  onPress={() => onSelectBackground(item.id)}
                  style={[
                    styles.cardWrapper,
                    isFocused && styles.cardWrapperFocused,
                  ]}
                >
                  {/* Thumbnail Container */}
                  <View
                    style={[
                      styles.thumbnailBox,
                      isSelected && styles.thumbnailBoxSelected,
                      isFocused && styles.thumbnailBoxFocused,
                    ]}
                  >
                    <Image
                      source={item.thumbnailSource}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />

                    {/* Selected Checkmark Badge (Top-Right) */}
                    {isSelected && (
                      <View style={styles.checkmarkBadge}>
                        <MaterialCommunityIcons
                          name="check"
                          size={13}
                          color="#FFFFFF"
                        />
                      </View>
                    )}
                  </View>

                  {/* Option Label */}
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.cardLabel,
                      isFocused && styles.cardLabelFocused,
                      isSelected && styles.cardLabelSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ================= DIVIDER LINE ================= */}
          <View style={styles.dividerLine} />

          {/* ================= FOOTER MESSAGE ================= */}
          <View style={styles.footerRow}>
            <MaterialCommunityIcons
              name="information-outline"
              size={15}
              color="rgba(255, 255, 255, 0.72)"
              style={styles.footerIcon}
            />
            <Text style={styles.footerText}>
              Select a background to apply immediately.
            </Text>
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  backdropRoot: {
    position: 'absolute',
    top: -24,
    left: -36,
    right: -36,
    bottom: -20,
    zIndex: 950,
    elevation: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 10, 20, 0.45)',
  },
  glassModal: {
    width: 524,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: 'rgba(18, 32, 45, 0.82)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    borderTopColor: 'rgba(255, 255, 255, 0.42)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 30,
    overflow: 'hidden',
  },
  glassHighlightTop: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    borderTopColor: 'rgba(255, 255, 255, 0.40)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCircleBtnFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
    borderColor: '#FFFFFF',
    borderWidth: 2,
    transform: [{ scale: 1.08 }],
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  closeIconText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: -1,
  },
  closeIconTextFocused: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  subtitleText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 1,
  },

  /* 3-Column Grid */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    rowGap: 10,
    columnGap: 14,
    width: 484,
  },
  cardWrapper: {
    width: 152,
    alignItems: 'center',
  },
  cardWrapperFocused: {
    transform: [{ scale: 1.03 }],
  },
  thumbnailBox: {
    width: 152,
    height: 86,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  thumbnailBoxSelected: {
    borderWidth: 2.2,
    borderColor: '#60A5FA',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 10,
    elevation: 6,
  },
  thumbnailBoxFocused: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 12,
    elevation: 10,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  checkmarkBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  cardLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.90)',
    textAlign: 'center',
  },
  cardLabelFocused: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardLabelSelected: {
    color: '#93C5FD',
    fontWeight: '700',
  },

  dividerLine: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    marginTop: 12,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerIcon: {
    marginRight: 6,
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.72)',
    letterSpacing: 0.1,
  },
});
