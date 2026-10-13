import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PlaylistData } from '../data/playlistData';
import { FAVORITES_FOCUS_IDS } from '../navigation/favoritesNavGraph';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface FavoritesScreenProps {
  likedSongsPlaylist: PlaylistData;
  likedPlaylists: PlaylistData[];
  focusedId: string;
  setFocusedId: (id: string) => void;
  onSelectPlaylist: (playlist: PlaylistData) => void;
  onTogglePlaylistLike: (playlistId: string) => void;
  currentTime?: string;
}

// Letter-by-letter blue-to-purple gradient for "FAVORITES" matching reference UI (Sky Blue -> Indigo -> Royal Purple)
const FAVORITES_GRADIENT_LETTERS = [
  { char: 'F', color: '#0091FF' }, // Bright sky blue
  { char: 'A', color: '#1E6BFF' }, // Azure blue
  { char: 'V', color: '#2D5BFF' }, // Royal blue
  { char: 'O', color: '#3E4DFE' }, // Blurple
  { char: 'R', color: '#4F3CF0' }, // Indigo
  { char: 'I', color: '#6432E0' }, // Violet
  { char: 'T', color: '#7C2BE0' }, // Royal purple
  { char: 'E', color: '#9333EA' }, // Rich purple
  { char: 'S', color: '#A855F7' }, // Orchid purple
];

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({
  likedSongsPlaylist,
  likedPlaylists,
  focusedId,
  setFocusedId,
  onSelectPlaylist,
  onTogglePlaylistLike,
}) => {
  const horizontalScrollRef = useRef<ScrollView>(null);

  // Auto-scroll horizontal playlist row when D-Pad focus changes
  useEffect(() => {
    if (focusedId.startsWith(FAVORITES_FOCUS_IDS.PLAYLIST_PREFIX)) {
      const idx = parseInt(
        focusedId.replace(FAVORITES_FOCUS_IDS.PLAYLIST_PREFIX, ''),
        10
      );
      if (!isNaN(idx) && horizontalScrollRef.current) {
        const CARD_WIDTH_WITH_GAP = 244;
        horizontalScrollRef.current.scrollTo({
          x: Math.max(0, (idx - 1) * CARD_WIDTH_WITH_GAP),
          animated: true,
        });
      }
    }
  }, [focusedId]);

  const isHeroFocused = focusedId === FAVORITES_FOCUS_IDS.LIKED_SONGS;
  const songsCount = likedSongsPlaylist.tracks ? likedSongsPlaylist.tracks.length : 0;
  const durationText = likedSongsPlaylist.totalDuration || '0m';

  return (
    <View style={styles.container}>
      {/* 1. Page Header: Title with Blue-to-Purple Gradient & Subtitle */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeftCol}>
          <Text style={styles.headerTitle}>
            YOUR{' '}
            {FAVORITES_GRADIENT_LETTERS.map((item, index) => (
              <Text key={index} style={{ color: item.color }}>
                {item.char}
              </Text>
            ))}
          </Text>
          <Text style={styles.headerSubtitle}>
            All your liked songs and playlists in one place.
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.contentScrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. SECTION 1: HERO "LIKED SONGS" CARD */}
        <View style={styles.sectionWrap}>
          <Pressable
            focusable={false}
            onPress={() => {
              setFocusedId(FAVORITES_FOCUS_IDS.LIKED_SONGS);
              onSelectPlaylist(likedSongsPlaylist);
            }}
            style={({ pressed }) => [
              styles.heroLikedCard,
              isHeroFocused && styles.heroLikedCardFocused,
              pressed && styles.cardPressed,
            ]}
          >
            {/* High-fidelity Liked Songs Hero Card wave background image */}
            <Image
              source={require('../../assets/ui/liked_songs_hero_bg.png')}
              style={styles.heroCardBgImage}
              resizeMode="cover"
            />

            {/* Card Content Row */}
            <View style={styles.heroCardContentRow}>
              {/* Left 3D Layered Gradient Heart Icon */}
              <View style={styles.heroHeartIconWrap}>
                <Image
                  source={require('../../assets/ui/liked_songs_heart_3d.png')}
                  style={styles.heroHeartIconImage}
                  resizeMode="contain"
                />
              </View>

              {/* Center Metadata & Editorial Info */}
              <View style={styles.heroMetaCol}>
                {/* COLLECTION badge with subtle cyan-to-magenta gradient accent */}
                <View style={styles.collectionBadgeRow}>
                  <Text style={[styles.collectionBadgeText, { color: '#0091FF' }]}>COLL</Text>
                  <Text style={[styles.collectionBadgeText, { color: '#6366F1' }]}>EC</Text>
                  <Text style={[styles.collectionBadgeText, { color: '#D946EF' }]}>TION</Text>
                </View>

                <View style={styles.heroTitleRow}>
                  <Text style={styles.heroTitleText}>Liked Songs</Text>
                  <View style={styles.heroSongCountPill}>
                    <Text style={styles.heroSongCountText}>
                      {songsCount} {songsCount === 1 ? 'song' : 'songs'} • {durationText}
                    </Text>
                  </View>
                </View>
                <Text style={styles.heroDescText} numberOfLines={2}>
                  {songsCount > 0
                    ? 'Every track you have liked across Search, Playlists, and AI DJ is gathered here into your personal soundtrack.'
                    : 'No liked songs yet. Tap the heart button while listening or searching to collect your favorite tracks here.'}
                </Text>
              </View>

              {/* Right Large Circular Purple-Gradient Play Button */}
              <View style={styles.heroPlayButtonContainer}>
                <View
                  style={[
                    styles.heroPlayOuterRing,
                    isHeroFocused && styles.heroPlayOuterRingFocused,
                  ]}
                >
                  <View
                    style={[
                      styles.heroPlayInnerCircle,
                      isHeroFocused && styles.heroPlayInnerCircleFocused,
                    ]}
                  >
                    {/* Purple / Orchid gradient sheen overlay */}
                    <View style={styles.playGradientOverlay} />
                    {/* Solid filled white play triangle */}
                    <MaterialCommunityIcons
                      name="play"
                      size={30}
                      color="#FFFFFF"
                      style={styles.heroPlayIcon}
                    />
                  </View>
                </View>
              </View>
            </View>
          </Pressable>
        </View>

        {/* 3. SECTION 2: "LIKED PLAYLISTS" SECTION */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWithBadge}>
              <Text style={styles.sectionTitle}>Liked Playlists</Text>
              <View style={styles.sectionCountBadge}>
                <Text style={styles.sectionCountBadgeText}>
                  {likedPlaylists.length}
                </Text>
              </View>
            </View>
          </View>

          {likedPlaylists && likedPlaylists.length > 0 ? (
            <ScrollView
              ref={horizontalScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.playlistsHorizontalRow}
            >
              {likedPlaylists.map((playlist, idx) => {
                const cardFocusId = `${FAVORITES_FOCUS_IDS.PLAYLIST_PREFIX}${idx}`;
                const isCardFocused = focusedId === cardFocusId;
                const accentColor = playlist.bannerAccentColor || '#6366F1';

                // Check for 2x2 matrix artwork collage (AI DJ playlists)
                const coverGridArtworks =
                  playlist.coverGrid && playlist.coverGrid.length >= 4
                    ? playlist.coverGrid
                    : playlist.tracks && playlist.tracks.length >= 4 && playlist.id.startsWith('aidj_')
                    ? playlist.tracks.slice(0, 4).map((t) => t.artwork)
                    : null;

                // For Chill Vibes, prioritize the real scenic landscape banner
                const coverSrc =
                  playlist.id === 'chill_vibes'
                    ? require('../../assets/playlists/banner_chill_vibes.jpg')
                    : playlist.coverImage ||
                      (playlist.tracks && playlist.tracks[0]?.artwork) ||
                      require('../../assets/playlists/banner_chill_vibes.jpg');

                const songsCountStr = playlist.tracks
                  ? `${playlist.tracks.length} songs`
                  : playlist.songsCount || '18 songs';
                const durationStr = playlist.totalDuration || '1h 14m';

                return (
                  <Pressable
                    key={playlist.id || `fav_pl_${idx}`}
                    focusable={false}
                    onPress={() => {
                      setFocusedId(cardFocusId);
                      onSelectPlaylist(playlist);
                    }}
                    style={({ pressed }) => [
                      styles.playlistCard,
                      isCardFocused && styles.playlistCardFocused,
                      pressed && styles.cardPressed,
                    ]}
                  >
                    {/* Artwork Banner (Prominent Upper Portion) */}
                    <View
                      style={[
                        styles.cardArtworkCanvas,
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
                            />
                            <Image
                              source={coverGridArtworks[1]}
                              style={styles.cardCoverGridTile}
                              resizeMode="cover"
                            />
                          </View>
                          <View style={styles.cardCoverGridRow}>
                            <Image
                              source={coverGridArtworks[2]}
                              style={styles.cardCoverGridTile}
                              resizeMode="cover"
                            />
                            <Image
                              source={coverGridArtworks[3]}
                              style={styles.cardCoverGridTile}
                              resizeMode="cover"
                            />
                          </View>
                        </View>
                      ) : (
                        <Image
                          source={coverSrc}
                          style={styles.cardCoverImage}
                          resizeMode="cover"
                        />
                      )}

                      {/* Floating Gradient Heart Icon in top-right matching reference UI */}
                      <View style={styles.cardHeartIconWrap}>
                        <Image
                          source={require('../../assets/drawer/FAV.png')}
                          style={styles.cardHeartIconImage}
                          resizeMode="contain"
                        />
                      </View>
                    </View>

                    {/* Clean White Card Footer Area */}
                    <View style={styles.cardFooterRow}>
                      <View style={styles.cardMetaCol}>
                        <Text numberOfLines={1} style={styles.cardTitleText}>
                          {playlist.title}
                        </Text>
                        <Text numberOfLines={1} style={styles.cardSubMetaText}>
                          {songsCountStr} • {durationStr}
                        </Text>
                      </View>

                      {/* Equalizer Waveform Graphic matching reference (Blue-to-Magenta gradient bars) */}
                      <View style={styles.miniEqWrap}>
                        <View style={[styles.miniEqBar, { height: 7, backgroundColor: '#6366F1' }]} />
                        <View style={[styles.miniEqBar, { height: 16, backgroundColor: '#8B5CF6' }]} />
                        <View style={[styles.miniEqBar, { height: 10, backgroundColor: '#A855F7' }]} />
                        <View style={[styles.miniEqBar, { height: 14, backgroundColor: '#D946EF' }]} />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            /* Clean Empty State for Liked Playlists */
            <View style={styles.emptyPlaylistsBox}>
              <View style={styles.emptyPlaylistsIconCircle}>
                <MaterialCommunityIcons
                  name="heart-outline"
                  size={26}
                  color="#EC4899"
                />
              </View>
              <View style={styles.emptyPlaylistsTextCol}>
                <Text style={styles.emptyPlaylistsTitle}>
                  No Favorite Playlists Yet
                </Text>
                <Text style={styles.emptyPlaylistsSubtitle}>
                  Tap the heart icon on any playlist in Library, Home, or AI DJ to save and pin it here.
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 20,
    paddingRight: 24,
    paddingTop: 4,
    paddingBottom: 8,
    position: 'relative',
    overflow: 'visible',
    backgroundColor: '#FFFFFF',
  },

  // 1. Header Row
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    zIndex: 3,
  },
  headerLeftCol: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.6,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2.5,
  },

  contentScrollView: {
    flex: 1,
    zIndex: 2,
    overflow: 'visible',
  },
  contentContainer: {
    paddingBottom: 16,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  sectionWrap: {
    marginBottom: 12,
  },

  // 2. Liked Songs Wide Hero Card
  heroLikedCard: {
    position: 'relative',
    backgroundColor: 'transparent',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    elevation: 4,
    shadowColor: '#6366F1',
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    overflow: 'hidden',
  },
  heroLikedCardFocused: {
    borderColor: '#7C3AED',
    borderWidth: 2,
    transform: [{ scale: 1.008 }],
    elevation: 8,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.35,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },

  // High-Fidelity Hero Card Background Image
  heroCardBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },

  // Hero Card Foreground Layout
  heroCardContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 26,
    zIndex: 2,
  },
  heroHeartIconWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  heroHeartIconImage: {
    width: 118,
    height: 118,
  },

  heroMetaCol: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  collectionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  collectionBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 2.4,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 5,
  },
  heroTitleText: {
    fontSize: 23,
    fontWeight: '900',
    color: '#0B132B',
    letterSpacing: -0.2,
  },
  heroSongCountPill: {
    backgroundColor: 'rgba(238, 242, 255, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  heroSongCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
    letterSpacing: 0.1,
  },
  heroDescText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 17,
    maxWidth: '92%',
  },

  // Play Button
  heroPlayButtonContainer: {
    paddingLeft: 10,
    paddingRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlayOuterRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  heroPlayOuterRingFocused: {
    backgroundColor: 'rgba(216, 180, 254, 0.35)',
    borderColor: '#7C3AED',
    transform: [{ scale: 1.05 }],
  },
  heroPlayInnerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  heroPlayInnerCircleFocused: {
    elevation: 12,
    shadowOpacity: 0.55,
  },
  playGradientOverlay: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(192, 38, 211, 0.72)',
  },
  heroPlayIcon: {
    marginLeft: 3,
    zIndex: 2,
  },

  // 3. Section 2: Liked Playlists
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 2,
  },
  sectionTitleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#0B132B',
    letterSpacing: -0.2,
  },
  sectionCountBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  sectionCountBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
  },
  playlistsHorizontalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
    paddingHorizontal: 6,
    overflow: 'visible',
  },

  // Playlist Card
  playlistCard: {
    width: 224,
    height: 154,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  playlistCardFocused: {
    borderColor: '#7C3AED',
    borderWidth: 2,
    backgroundColor: '#FAF5FF',
    transform: [{ scale: 1.025 }],
    elevation: 8,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.35,
  },
  cardArtworkCanvas: {
    height: 100,
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
  cardHeartIconWrap: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 3,
  },
  cardHeartIconImage: {
    width: 22,
    height: 22,
  },

  // Card Footer Info Area
  cardFooterRow: {
    height: 54,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardMetaCol: {
    flex: 1,
    paddingRight: 8,
    justifyContent: 'center',
  },
  cardTitleText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0B132B',
    letterSpacing: -0.2,
  },
  cardSubMetaText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1.5,
  },

  // 4 Equalizer Bars
  miniEqWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2.5,
    height: 16,
    paddingBottom: 1,
  },
  miniEqBar: {
    width: 3,
    borderRadius: 1.5,
  },

  // Empty State
  emptyPlaylistsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  emptyPlaylistsIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  emptyPlaylistsTextCol: {
    flex: 1,
  },
  emptyPlaylistsTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0B132B',
    marginBottom: 2,
  },
  emptyPlaylistsSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 15,
  },
});
