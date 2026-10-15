import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { PLAYLISTS, PlaylistData } from '../data/playlistData';
import { LIBRARY_CARD_IDS } from '../navigation/libraryNavGraph';
import { UsbStatus } from '../services/usbStorageService';

export interface LibraryScreenProps {
  onSelectPlaylist: (playlist: PlaylistData) => void;
  focusedId: string;
  setFocusedId: (id: string) => void;
  playlistLikedMap?: Record<string, boolean>;
  onTogglePlaylistLike?: (playlistId: string) => void;
  onSelectUsbCard?: () => void;
  usbStatus?: UsbStatus;
  activePlayingPlaylistId?: string;
  isPlaying?: boolean;
  onPlayPlaylist?: (playlist: PlaylistData) => void;
}

interface PlaylistCardItem {
  id: string;
  focusId: string;
  title: string;
  description: string;
  songsCount: string;
  totalDuration: string;
  badgeText: string;
  accentColor: string;
  coverImage: any;
  playlistData: PlaylistData;
}

const PLAYLIST_ITEMS: PlaylistCardItem[] = [
  {
    id: 'chill_vibes',
    focusId: LIBRARY_CARD_IDS.CHILL,
    title: 'Chill Vibes',
    description: 'Relax. Focus. Feel good.',
    songsCount: PLAYLISTS.chill_vibes.songsCount,
    totalDuration: PLAYLISTS.chill_vibes.totalDuration,
    badgeText: 'CHILLHOP',
    accentColor: '#6366F1',
    coverImage: require('../../assets/playlists/banner_chill_vibes.jpg'),
    playlistData: PLAYLISTS.chill_vibes,
  },
  {
    id: 'focus_mix',
    focusId: LIBRARY_CARD_IDS.FOCUS,
    title: 'Focus Mix',
    description: 'Deep focus for productive moments.',
    songsCount: PLAYLISTS.focus_mix.songsCount,
    totalDuration: PLAYLISTS.focus_mix.totalDuration,
    badgeText: 'INSTRUMENTAL',
    accentColor: '#0284C7',
    coverImage: require('../../assets/playlists/banner_focus_mix.jpg'),
    playlistData: PLAYLISTS.focus_mix,
  },
  {
    id: 'workout_mix',
    focusId: LIBRARY_CARD_IDS.WORKOUT,
    title: 'Workout Mix',
    description: 'High energy beats. Maximum adrenaline.',
    songsCount: PLAYLISTS.workout_mix.songsCount,
    totalDuration: PLAYLISTS.workout_mix.totalDuration,
    badgeText: 'HIGH ENERGY',
    accentColor: '#E11D48',
    coverImage: require('../../assets/playlists/banner_workout_mix.jpg'),
    playlistData: PLAYLISTS.workout_mix,
  },
  {
    id: 'study_mix',
    focusId: LIBRARY_CARD_IDS.STUDY,
    title: 'Study Mix',
    description: 'Warm vinyl, rainy days, calm minds.',
    songsCount: PLAYLISTS.study_mix.songsCount,
    totalDuration: PLAYLISTS.study_mix.totalDuration,
    badgeText: 'LO-FI STUDY',
    accentColor: '#0D9488',
    coverImage: require('../../assets/playlists/banner_study_mix.jpg'),
    playlistData: PLAYLISTS.study_mix,
  },
  {
    id: 'energize_morning',
    focusId: LIBRARY_CARD_IDS.ENERGIZE,
    title: 'Energize & Wake Up',
    description: 'Start your morning with bright acoustic energy.',
    songsCount: PLAYLISTS.energize_morning.songsCount,
    totalDuration: PLAYLISTS.energize_morning.totalDuration,
    badgeText: 'MORNING SUNRISE',
    accentColor: '#F59E0B',
    coverImage: require('../../assets/playlists/banner_energize_morning.jpg'),
    playlistData: PLAYLISTS.energize_morning,
  },
  {
    id: 'midnight_dreams',
    focusId: LIBRARY_CARD_IDS.MIDNIGHT,
    title: 'Midnight Dreams',
    description: 'Dreamy synthwave, starry skies, and late-night calm.',
    songsCount: PLAYLISTS.midnight_dreams.songsCount,
    totalDuration: PLAYLISTS.midnight_dreams.totalDuration,
    badgeText: 'NIGHT SYNTH & CHILL',
    accentColor: '#7C3AED',
    coverImage: require('../../assets/playlists/banner_midnight_dreams.jpg'),
    playlistData: PLAYLISTS.midnight_dreams,
  },
];

export function LibraryScreen({
  onSelectPlaylist,
  focusedId,
  playlistLikedMap,
  onTogglePlaylistLike,
  onSelectUsbCard,
  usbStatus,
  activePlayingPlaylistId,
  isPlaying,
  onPlayPlaylist,
}: LibraryScreenProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!scrollViewRef.current) return;
    if (focusedId === LIBRARY_CARD_IDS.USB) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    } else if (
      focusedId === LIBRARY_CARD_IDS.ENERGIZE ||
      focusedId === LIBRARY_CARD_IDS.MIDNIGHT
    ) {
      scrollViewRef.current.scrollTo({ y: 310, animated: true });
    } else if (
      focusedId === LIBRARY_CARD_IDS.WORKOUT ||
      focusedId === LIBRARY_CARD_IDS.STUDY
    ) {
      scrollViewRef.current.scrollTo({ y: 110, animated: true });
    } else if (
      focusedId === LIBRARY_CARD_IDS.CHILL ||
      focusedId === LIBRARY_CARD_IDS.FOCUS ||
      focusedId === 'LIB_BACK' ||
      focusedId === 'LIB_SEARCH'
    ) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [focusedId]);

  // Row 1: Chill Vibes, Focus Mix
  const row1 = [PLAYLIST_ITEMS[0], PLAYLIST_ITEMS[1]];
  // Row 2: Workout Mix, Study Mix
  const row2 = [PLAYLIST_ITEMS[2], PLAYLIST_ITEMS[3]];
  // Row 3: Energize & Wake Up, Midnight Dreams
  const row3 = [PLAYLIST_ITEMS[4], PLAYLIST_ITEMS[5]];

  const renderCard = (item: PlaylistCardItem) => {
    const isFocused = focusedId === item.focusId;
    const isPlaylistActive = activePlayingPlaylistId === item.id;
    const isCardPlaying = isPlaylistActive && isPlaying;

    return (
      <Pressable
        key={item.id}
        focusable={false}
        onPress={() => onSelectPlaylist(item.playlistData)}
        style={({ pressed }) => [
          styles.playlistCard,
          isFocused && styles.playlistCardFocused,
          pressed && styles.playlistCardPressed,
        ]}
      >
        {/* Cover Artwork Container */}
        <View style={styles.coverWrapper}>
          <Image
            source={item.coverImage}
            style={styles.coverImage}
            resizeMode="cover"
          />
          {/* Subtle Accent Glow Overlay */}
          <View
            style={[
              styles.coverAccentGlow,
              { backgroundColor: item.accentColor },
            ]}
          />
          {/* Category Badge Pill */}
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>{item.badgeText}</Text>
          </View>
          {/* Top-Right Heart Like Badge / Button */}
          {onTogglePlaylistLike && (
            <Pressable
              focusable={false}
              onPress={(e) => {
                e.stopPropagation?.();
                onTogglePlaylistLike(item.id);
              }}
              style={styles.cardHeartHit}
            >
              <Image
                source={
                  playlistLikedMap?.[item.id]
                    ? require('../../assets/ui/icon_heart_filled.png')
                    : require('../../assets/ui/icon_heart_outline.png')
                }
                style={[
                  styles.cardHeartIcon,
                  {
                    tintColor: playlistLikedMap?.[item.id] ? '#EC4899' : '#FFFFFF',
                  },
                ]}
                resizeMode="contain"
              />
            </Pressable>
          )}
        </View>

        {/* Floating Play Icon Circle straddling the cover/info divider line */}
        <Pressable
          focusable={false}
          onPress={(e) => {
            e.stopPropagation?.();
            if (onPlayPlaylist) {
              onPlayPlaylist(item.playlistData);
            } else {
              onSelectPlaylist(item.playlistData);
            }
          }}
          style={({ pressed }) => [
            styles.playOverlayCircle,
            isFocused && styles.playOverlayCircleFocused,
            pressed && styles.playlistCardPressed,
          ]}
        >
          <Image
            source={
              isCardPlaying
                ? require('../../assets/ui/icon_pause.png')
                : require('../../assets/ui/icon_play.png')
            }
            style={[
              styles.playOverlayVectorIcon,
              { tintColor: isFocused ? '#FFFFFF' : '#0F172A' },
            ]}
            resizeMode="contain"
          />
        </Pressable>

        {/* Content Info */}
        <View style={styles.infoWrapper}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={styles.cardTitle}>
              {item.title}
            </Text>
          </View>
          <Text numberOfLines={1} style={styles.cardDescription}>
            {item.description}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.cardMeta}>
              {item.songsCount} • {item.totalDuration}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        focusable={false}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header */}
        <View style={styles.headerSection}>
          <Text style={styles.pageTitle}>Your Library</Text>
          <Text style={styles.pageSubtitle}>
            Your playlists, all in one place.
          </Text>
        </View>

        {/* 3x2 Grid of Playlist Cards */}
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            {row1.map(renderCard)}
          </View>
          <View style={styles.gridRow}>
            {row2.map(renderCard)}
          </View>
          <View style={styles.gridRow}>
            {row3.map(renderCard)}
          </View>
          {/* Row 4: USB Drive / Local Storage Card */}
          <View style={styles.gridRow}>
            <Pressable
              focusable={false}
              onPress={onSelectUsbCard}
              style={({ pressed }) => [
                styles.playlistCard,
                focusedId === LIBRARY_CARD_IDS.USB && styles.playlistCardFocused,
                pressed && styles.playlistCardPressed,
              ]}
            >
              {/* Cover Artwork Container */}
              <View style={styles.coverWrapper}>
                <Image
                  source={require('../../assets/playlists/banner_usb_drive.png')}
                  style={styles.coverImage}
                  resizeMode="cover"
                />
                <View
                  style={[
                    styles.coverAccentGlow,
                    { backgroundColor: '#06B6D4' },
                  ]}
                />
                <View style={[styles.badgePill, { backgroundColor: '#0284C7' }]}>
                  <Text style={styles.badgeText}>USB STORAGE</Text>
                </View>
                {/* Dynamic Connection Indicator */}
                <View
                  style={[
                    styles.statusIndicatorPill,
                    usbStatus?.isConnected ? styles.statusConnected : styles.statusDisconnected,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      usbStatus?.isConnected ? styles.statusDotConnected : styles.statusDotDisconnected,
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {usbStatus?.isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                  </Text>
                </View>
              </View>

              {/* Play / Browse USB Icon Circle */}
              <View
                style={[
                  styles.playOverlayCircle,
                  focusedId === LIBRARY_CARD_IDS.USB && styles.playOverlayCircleFocused,
                ]}
              >
                <Image
                  source={require('../../assets/ui/icon_usb.png')}
                  style={[
                    styles.usbVectorIcon,
                    { tintColor: focusedId === LIBRARY_CARD_IDS.USB ? '#FFFFFF' : '#0F172A' },
                  ]}
                  resizeMode="contain"
                />
              </View>

              {/* Content Info */}
              <View style={styles.infoWrapper}>
                <View style={styles.titleRow}>
                  <Text numberOfLines={1} style={styles.cardTitle}>
                    {usbStatus?.driveName ? `USB: ${usbStatus.driveName}` : 'USB Flash Drive'}
                  </Text>
                </View>
                <Text numberOfLines={1} style={styles.cardDescription}>
                  {usbStatus?.isConnected
                    ? 'Browse and play music files from your connected drive.'
                    : 'Plug in any USB stick (FAT32/exFAT) to load local audio.'}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.cardMeta}>
                    {usbStatus?.isConnected
                      ? `${usbStatus.songCount} ${usbStatus.songCount === 1 ? 'song' : 'songs'} available`
                      : 'Offline Audio • Removable Drive'}
                  </Text>
                  {/* Format Badges (MP3, FLAC, AAC, WAV) */}
                  <View style={styles.usbFormatRow}>
                    <View style={styles.formatTag}><Text style={styles.formatTagText}>MP3</Text></View>
                    <View style={styles.formatTag}><Text style={styles.formatTagText}>FLAC</Text></View>
                    <View style={styles.formatTag}><Text style={styles.formatTagText}>AAC</Text></View>
                    <View style={styles.formatTag}><Text style={styles.formatTagText}>WAV</Text></View>
                  </View>
                </View>
              </View>
            </Pressable>

            {/* Empty column spacer to preserve 2-column grid alignment */}
            <View style={{ flex: 1 }} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 0,
    paddingRight: 8,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 36,
    paddingLeft: 16,
    paddingRight: 20,
  },
  headerSection: {
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 4,
  },
  gridContainer: {
    gap: 18,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 18,
  },
  playlistCard: {
    flex: 1,
    height: 204,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  playlistCardFocused: {
    borderColor: '#6366F1',
    borderWidth: 2.5,
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 1.02 }],
    shadowColor: '#6366F1',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  playlistCardPressed: {
    transform: [{ scale: 0.99 }],
  },
  coverWrapper: {
    width: '100%',
    height: 122,
    position: 'relative',
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverAccentGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.9,
  },
  badgePill: {
    position: 'absolute',
    top: 10,
    left: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  cardHeartHit: {
    position: 'absolute',
    top: 9,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeartIcon: {
    width: 15,
    height: 15,
  },
  playOverlayCircle: {
    position: 'absolute',
    top: 101,
    right: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 6,
  },
  playOverlayCircleFocused: {
    backgroundColor: '#6366F1',
    borderColor: '#FFFFFF',
    borderWidth: 1.8,
    transform: [{ scale: 1.08 }],
    shadowColor: '#4F46E5',
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  playOverlayVectorIcon: {
    width: 15,
    height: 15,
    marginLeft: 2,
  },
  infoWrapper: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  cardDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  cardMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
  },
  statusIndicatorPill: {
    position: 'absolute',
    top: 10,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  statusConnected: {
    backgroundColor: 'rgba(6, 78, 59, 0.88)',
  },
  statusDisconnected: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotConnected: {
    backgroundColor: '#34D399',
  },
  statusDotDisconnected: {
    backgroundColor: '#94A3B8',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  usbVectorIcon: {
    width: 20,
    height: 20,
  },
  usbFormatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  formatTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
  },
  formatTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
});
