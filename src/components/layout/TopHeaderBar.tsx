import React from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  Animated,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { PlaylistData } from '../../data/playlistData';
import { AvatarId } from '../../database';
import { TimeTheme } from '../../constants/timeThemes';
import { getCompanionArtwork } from '../../utils/avatarUtils';
import { appStyles as styles } from '../../styles/appStyles';

export interface TopHeaderBarProps {
  sidebarWidth: Animated.Value;
  labelOpacity: Animated.AnimatedInterpolation<number | string>;
  labelTranslateX: Animated.AnimatedInterpolation<number | string>;
  isSidebarHovered: boolean;
  setIsSidebarHovered: React.Dispatch<React.SetStateAction<boolean>>;
  selectedPlaylist: PlaylistData | null;
  activeNavTab: string;
  focusedId: string;
  currentTime: string;
  currentDate: string;
  savedAvatarId: AvatarId | null;
  currentTheme: TimeTheme;
  handleBackFromPlaylist: () => void;
  handleBackToHome: () => void;
  handleCycleTheme: () => void;
  handleReplayIntro: () => void;
  isListening?: boolean;
}

export const TopHeaderBar: React.FC<TopHeaderBarProps> = ({
  sidebarWidth,
  labelOpacity,
  labelTranslateX,
  setIsSidebarHovered,
  selectedPlaylist,
  activeNavTab,
  focusedId,
  currentTime,
  currentDate,
  savedAvatarId,
  currentTheme,
  handleBackFromPlaylist,
  handleBackToHome,
  handleCycleTheme,
  handleReplayIntro,
  isListening = false,
}) => {
  return (
    <View style={styles.topHeader}>
      {/* Left Brand Identity: Collapses icon-only (76px) / Expands full title */}
      <Animated.View
        style={[
          styles.brandRow,
          {
            width: sidebarWidth.interpolate({
              inputRange: [76, 188],
              outputRange: [104, 216],
            }),
          },
        ]}
      >
        <Pressable
          focusable={false}
          onHoverIn={() => setIsSidebarHovered(true)}
          onHoverOut={() => setIsSidebarHovered(false)}
          onPress={() => setIsSidebarHovered((prev) => !prev)}
          style={styles.brandPressable}
        >
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.headerLogoImage}
            resizeMode="contain"
          />
          <Animated.View
            style={[
              styles.brandTitleWrapper,
              {
                opacity: labelOpacity,
                transform: [{ translateX: labelTranslateX }],
              },
            ]}
          >
            <Text numberOfLines={1} style={styles.brandTitle}>PANDIVO</Text>
          </Animated.View>
        </Pressable>
      </Animated.View>

      {/* Right Header Utilities: Search bar & Back when playlist or library is open, or Home widgets */}
      {selectedPlaylist ? (
        <View style={styles.playlistHeaderRow}>
          <Pressable
            focusable={false}
            onPress={handleBackFromPlaylist}
            style={({ pressed }) => [
              styles.playlistBackBtn,
              focusedId === 'PL_BACK' && styles.playlistBackBtnFocused,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.playlistBackArrow}>←</Text>
            <Text style={styles.playlistBackText}>Back</Text>
          </Pressable>

          <View style={styles.headerRightRow}>
            {isListening && (
              <View style={styles.headerLiveMicPill}>
                <View style={styles.headerLiveMicDot} />
                <MaterialCommunityIcons name="microphone" size={14} color="#10B981" />
                <Text style={styles.headerLiveMicText}>MIC LIVE</Text>
              </View>
            )}
            <View style={styles.clockContainer}>
              <Text style={styles.clockTime}>{currentTime}</Text>
              <Text style={styles.clockDate}>{currentDate}</Text>
            </View>
            <View style={styles.avatarBorder}>
              <Image
                source={getCompanionArtwork(savedAvatarId)}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
          </View>
        </View>
      ) : activeNavTab === 'library' ? (
        <View style={styles.playlistHeaderRow}>
          <Pressable
            focusable={false}
            onPress={handleBackToHome}
            style={({ pressed }) => [
              styles.playlistBackBtn,
              focusedId === 'LIB_BACK' && styles.playlistBackBtnFocused,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.playlistBackArrow}>←</Text>
            <Text style={styles.playlistBackText}>Back</Text>
          </Pressable>

          <View style={styles.headerRightRow}>
            {isListening && (
              <View style={styles.headerLiveMicPill}>
                <View style={styles.headerLiveMicDot} />
                <MaterialCommunityIcons name="microphone" size={14} color="#10B981" />
                <Text style={styles.headerLiveMicText}>MIC LIVE</Text>
              </View>
            )}
            <View style={styles.clockContainer}>
              <Text style={styles.clockTime}>{currentTime}</Text>
              <Text style={styles.clockDate}>{currentDate}</Text>
            </View>
            <View style={styles.avatarBorder}>
              <Image
                source={getCompanionArtwork(savedAvatarId)}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
          </View>
        </View>
      ) : activeNavTab === 'ai_dj' || activeNavTab === 'search' || activeNavTab === 'favorites' || activeNavTab === 'settings' ? (
        <View style={styles.playlistHeaderRow}>
          <View />
          <View style={styles.headerRightRow}>
            {isListening && (
              <View style={styles.headerLiveMicPill}>
                <View style={styles.headerLiveMicDot} />
                <MaterialCommunityIcons name="microphone" size={14} color="#10B981" />
                <Text style={styles.headerLiveMicText}>MIC LIVE</Text>
              </View>
            )}
            <View style={styles.clockContainer}>
              <Text style={styles.clockTime}>{currentTime}</Text>
              <Text style={styles.clockDate}>{currentDate}</Text>
            </View>
            <View style={styles.avatarBorder}>
              <Image
                source={getCompanionArtwork(savedAvatarId)}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.headerRightRow}>
          {isListening && (
            <View style={styles.headerLiveMicPill}>
              <View style={styles.headerLiveMicDot} />
              <MaterialCommunityIcons name="microphone" size={14} color="#10B981" />
              <Text style={styles.headerLiveMicText}>MIC LIVE</Text>
            </View>
          )}
          {/* Dynamic Time of Day Theme Cycler */}
          <Pressable
            focusable={false}
            onPress={handleCycleTheme}
            style={({ pressed }) => [
              styles.headerThemeBtn,
              focusedId === 'HDR_THEME' && styles.headerThemeBtnFocused,
              pressed && styles.btnPressed,
            ]}
          >
            <Feather
              name={currentTheme.iconName}
              size={14}
              color={focusedId === 'HDR_THEME' ? '#4338CA' : currentTheme.iconColor}
            />
            <Text
              style={[
                styles.headerThemeLabel,
                focusedId === 'HDR_THEME' && styles.headerThemeLabelFocused,
              ]}
            >
              {currentTheme.label}
            </Text>
          </Pressable>

          {/* Intro Replay Utility Button */}
          <Pressable
            focusable={false}
            onPress={handleReplayIntro}
            style={({ pressed }) => [
              styles.headerIconBtn,
              focusedId === 'HDR_REPLAY' && styles.headerIconBtnFocused,
              pressed && styles.btnPressed,
            ]}
          >
            <MaterialCommunityIcons
              name="movie-play-outline"
              size={19}
              color={focusedId === 'HDR_REPLAY' ? '#4338CA' : '#475569'}
            />
          </Pressable>

          {/* Live Time / Date Indicator */}
          <View style={styles.clockContainer}>
            <Text style={styles.clockTime}>{currentTime}</Text>
            <Text style={styles.clockDate}>{currentDate}</Text>
          </View>

          {/* User Profile Avatar */}
          <View style={styles.avatarBorder}>
            <Image
              source={getCompanionArtwork(savedAvatarId)}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          </View>
        </View>
      )}
    </View>
  );
};
