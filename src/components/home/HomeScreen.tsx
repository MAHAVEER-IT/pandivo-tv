import React from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MusicTrack } from '../../services/musicCatalog';
import { TimeTheme, TimeOfDay, getAIDJCTA } from '../../constants/timeThemes';
import { RecentlyPlayedTrackItem } from '../../constants/recentlyPlayed';
import { FOR_YOU_MIXES } from '../../constants/forYouMixes';
import { appStyles as styles } from '../../styles/appStyles';

export interface HomeScreenProps {
  homeScrollViewRef: React.RefObject<ScrollView | null>;
  recentlyPlayedScrollRef: React.RefObject<ScrollView | null>;
  forYouScrollRef: React.RefObject<ScrollView | null>;
  currentTheme: TimeTheme;
  selectedTimeOfDay: TimeOfDay;
  focusedId: string;
  currentTrack: MusicTrack;
  isPlaying: boolean;
  recentlyPlayedTracks: RecentlyPlayedTrackItem[];
  onDpadPress: (id: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  homeScrollViewRef,
  recentlyPlayedScrollRef,
  forYouScrollRef,
  currentTheme,
  selectedTimeOfDay,
  focusedId,
  currentTrack,
  isPlaying,
  recentlyPlayedTracks,
  onDpadPress,
}) => {
  const renderFocusedTrackTitle = (title: string) => {
    if (!title) return null;

    if (title.includes(' - ')) {
      const parts = title.split(' - ');
      return (
        <Text style={styles.trackTitle} numberOfLines={1}>
          <Text style={styles.trackTitlePart1}>{parts[0]}</Text>
          <Text style={styles.trackTitleDash}> - </Text>
          <Text style={styles.trackTitlePart2}>{parts.slice(1).join(' - ')}</Text>
        </Text>
      );
    }

    const words = title.trim().split(/\s+/);

    if (words.length === 1) {
      const w = words[0];
      if (w.length <= 3) {
        return (
          <Text style={styles.trackTitle} numberOfLines={1}>
            <Text style={styles.trackTitlePart1}>{w[0]}</Text>
            {w[1] ? <Text style={styles.trackTitleDash}>{w[1]}</Text> : null}
            {w.length > 2 ? <Text style={styles.trackTitlePart2}>{w.slice(2)}</Text> : null}
          </Text>
        );
      }
      const idx1 = Math.max(1, Math.floor(w.length / 3));
      const idx2 = Math.min(w.length - 1, Math.floor((w.length * 2) / 3));
      return (
        <Text style={styles.trackTitle} numberOfLines={1}>
          <Text style={styles.trackTitlePart1}>{w.slice(0, idx1)}</Text>
          <Text style={styles.trackTitleDash}>{w.slice(idx1, idx2)}</Text>
          <Text style={styles.trackTitlePart2}>{w.slice(idx2)}</Text>
        </Text>
      );
    }

    if (words.length === 2) {
      return (
        <Text style={styles.trackTitle} numberOfLines={1}>
          <Text style={styles.trackTitlePart1}>{words[0]}</Text>
          <Text style={styles.trackTitleDash}> </Text>
          <Text style={styles.trackTitlePart2}>{words[1]}</Text>
        </Text>
      );
    }

    // 3 or more words: word 0 Purple, word 1 Blue, remaining words Cyan
    return (
      <Text style={styles.trackTitle} numberOfLines={1}>
        <Text style={styles.trackTitlePart1}>{words[0]} </Text>
        <Text style={styles.trackTitleDash}>{words[1]} </Text>
        <Text style={styles.trackTitlePart2}>{words.slice(2).join(' ')}</Text>
      </Text>
    );
  };

  return (
    <ScrollView
      ref={homeScrollViewRef as any}
      focusable={false}
      scrollEnabled={false}
      style={styles.mainScrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Prompt Banner Card with Dynamic Time-of-Day Panoramic Art */}
      <View style={styles.heroBannerCard}>
        {/* Background Panoramic Artwork */}
        <Image
          source={currentTheme.bannerImage}
          style={styles.heroBannerImage}
          resizeMode="cover"
        />

        {/* Progressive 100% -> 75% -> 50% -> 25% -> 0% Smooth Gradient Overlay */}
        <Image
          source={currentTheme.gradientOverlay}
          style={styles.heroGradientOverlay}
          resizeMode="stretch"
        />

        {/* Left Column: Greeting, Headline, Subheadline & Voice Capsule */}
        <View style={styles.heroLeftCol}>
          <View style={styles.heroGreetingPill}>
            <Text style={[styles.heroGreetingText, { color: currentTheme.textColor }]}>
              {currentTheme.greeting}
            </Text>
          </View>

          <Text style={[styles.heroTitle, { color: currentTheme.textColor }]}>
            What do you want to{' '}
            <Text style={{ color: currentTheme.hearAccent, textDecorationLine: 'underline' }}>
              hear?
            </Text>
          </Text>

          <Text style={[styles.heroSubtitle, { color: currentTheme.subtextColor }]}>
            Ask Pandivo to play music for any mood, moment, or activity.
          </Text>

          {/* Contextual AI DJ Action Capsule */}
          <Pressable
            focusable={false}
            onPress={() => onDpadPress('HERO_VOICE')}
            style={({ pressed }) => [
              styles.heroVoiceCapsule,
              focusedId === 'HERO_VOICE' && styles.heroVoiceCapsuleFocused,
              pressed && styles.btnPressed,
            ]}
          >
            <View
              style={[
                styles.heroVoiceCapsuleBadge,
                focusedId === 'HERO_VOICE' && styles.heroVoiceCapsuleBadgeFocused,
              ]}
            >
              <Ionicons
                name="sparkles"
                size={13}
                color={focusedId === 'HERO_VOICE' ? '#FFFFFF' : '#6366F1'}
              />
            </View>
            <Text
              style={[
                styles.heroVoiceCapsuleText,
                focusedId === 'HERO_VOICE' && styles.heroVoiceCapsuleTextFocused,
              ]}
            >
              {getAIDJCTA({ context: selectedTimeOfDay })}
            </Text>
          </Pressable>
        </View>

        {/* Floating Quick Play Card */}
        <Pressable
          focusable={false}
          onPress={() => onDpadPress('HERO_CHILL')}
          style={({ pressed }) => [
            styles.heroFloatingCard,
            focusedId === 'HERO_CHILL' && styles.heroFloatingCardFocused,
            pressed && styles.btnPressed,
          ]}
        >
          {Boolean(currentTheme.quickCardTag) && (
            <Text style={styles.heroFloatingTag}>{currentTheme.quickCardTag}</Text>
          )}
          <Text style={styles.heroFloatingTitle}>{currentTheme.quickCardTitle || 'Random Playlist'}</Text>
          <View style={styles.heroFloatingPlayRow}>
            <View style={styles.heroFloatingPlayBtn}>
              <Text style={styles.heroFloatingPlayIcon}>▶</Text>
            </View>
            <Text style={styles.heroFloatingPlayLabel}>Play</Text>
          </View>
        </Pressable>
      </View>

      {/* Recently Played Carousel */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Recently Played</Text>
        {recentlyPlayedTracks.length > 0 && (
          <Text style={styles.sectionSeeAll}>See All →</Text>
        )}
      </View>

      {recentlyPlayedTracks.length > 0 ? (
        <ScrollView
          ref={recentlyPlayedScrollRef as any}
          focusable={false}
          scrollEnabled={false}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ overflow: 'visible' }}
          contentContainerStyle={styles.carouselScroll}
        >
          {recentlyPlayedTracks.map((track, idx) => {
            const cardId = `REC_${idx}`;
            const isCardFocused = focusedId === cardId;
            const isTrackPlaying = currentTrack.id === track.id && isPlaying;

            return (
              <Pressable
                key={`rec_${track.id}_${idx}`}
                focusable={false}
                onPress={() => onDpadPress(cardId)}
                style={({ pressed }) => [
                  styles.trackCard,
                  isCardFocused && styles.trackCardFocused,
                  pressed && styles.btnPressed,
                ]}
              >
                <View style={[styles.cardInner, !isCardFocused && styles.cardInnerShadow]}>
                  <Image source={track.localArtwork} style={styles.trackArtwork} resizeMode="cover" />
                  {/* Dark translucent gradient overlay at the bottom of the artwork */}
                  <Image
                    source={require('../../../assets/ui/rec_card_gradient.png')}
                    style={styles.cardGradientOverlay}
                    resizeMode="stretch"
                  />
                  {/* Bottom information area */}
                  <View style={styles.cardInfoContainer}>
                    <View style={styles.cardTextCol}>
                      {isCardFocused ? (
                        renderFocusedTrackTitle(track.displayTitle)
                      ) : (
                        <Text style={styles.trackTitle} numberOfLines={1}>
                          {track.displayTitle}
                        </Text>
                      )}
                      <Text style={styles.trackArtist} numberOfLines={1}>
                        {track.displayArtist}
                      </Text>
                    </View>
                    {/* Subtle monochrome music-note icon */}
                    <Image
                      source={require('../../../assets/ui/icon_music_note.png')}
                      style={styles.cardMusicNoteIcon}
                      resizeMode="contain"
                    />
                  </View>
                  {isTrackPlaying && (
                    <View style={styles.playingBadge}>
                      <Text style={styles.playingBadgeIcon}>▶</Text>
                    </View>
                  )}
                </View>
                {/* Multicolor PANDIVO focus indicator and subtle outer glow */}
                {isCardFocused && (
                  <Image
                    source={require('../../../assets/ui/pandivo_focus_border.png')}
                    style={styles.cardFocusBorderOverlay}
                    resizeMode="stretch"
                  />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.recentlyPlayedEmptyRow}>
          <Text style={styles.recentlyPlayedEmptyText}>
            No recently played songs yet. Songs you play will appear here.
          </Text>
        </View>
      )}

      {/* For You Curated Mixes Carousel */}
      <View style={[styles.sectionHeaderRow, { marginTop: recentlyPlayedTracks.length > 0 ? 32 : 24 }]}>
        <Text style={styles.sectionTitle}>For You</Text>
        <Text style={styles.sectionSeeAll}>See All →</Text>
      </View>

      <ScrollView
        ref={forYouScrollRef as any}
        focusable={false}
        scrollEnabled={false}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ overflow: 'visible' }}
        contentContainerStyle={styles.carouselScroll}
      >
        {FOR_YOU_MIXES.map((mix, idx) => {
          const mixId = `MIX_${idx}`;
          const isMixFocused = focusedId === mixId;

          return (
            <Pressable
              key={mix.id}
              focusable={false}
              onPress={() => onDpadPress(mixId)}
              style={({ pressed }) => [
                styles.playlistCard,
                isMixFocused && styles.playlistCardFocused,
                pressed && styles.btnPressed,
              ]}
            >
              <View style={[styles.playlistCardInner, !isMixFocused && styles.playlistCardInnerShadow]}>
                <Image source={mix.localArtwork} style={styles.playlistArtwork} resizeMode="cover" />
                {/* Dark translucent gradient overlay at the bottom of the artwork */}
                <Image
                  source={require('../../../assets/ui/playlist_card_gradient.png')}
                  style={styles.playlistGradientOverlay}
                  resizeMode="stretch"
                />
                {/* Bottom information area */}
                <View style={styles.playlistInfoContainer}>
                  <View style={styles.playlistTextCol}>
                    <Text style={styles.playlistTitle} numberOfLines={1}>
                      {mix.title}
                    </Text>
                    <Text style={styles.playlistSubtitle} numberOfLines={1}>
                      {mix.subtitle}
                    </Text>
                  </View>
                  {/* Minimal playlist icon */}
                  <Image
                    source={require('../../../assets/ui/icon_playlist.png')}
                    style={styles.playlistIcon}
                    resizeMode="contain"
                  />
                </View>
              </View>
              {/* Multicolor PANDIVO focus indicator and soft outer glow */}
              {isMixFocused && (
                <Image
                  source={require('../../../assets/ui/pandivo_playlist_focus_border.png')}
                  style={styles.playlistFocusBorderOverlay}
                  resizeMode="stretch"
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </ScrollView>
  );
};
