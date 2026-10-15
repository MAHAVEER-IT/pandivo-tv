import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  AvatarId,
  AVATAR_COMPANIONS,
} from '../database/repositories/avatarPreferenceRepository';
import { SETTINGS_FOCUS_IDS } from '../navigation/settingsNavGraph';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface SettingsScreenProps {
  savedAvatarId: AvatarId | null;
  focusedId: string;
  setFocusedId: (id: string) => void;
  onChangeAvatar: () => void;
}

// Letter-by-letter gradient letters for "SETTINGS" (Electric Blue -> Royal Iris -> Vibrant Purple)
const SETTINGS_GRADIENT_LETTERS = [
  { char: 'S', color: '#0091FF' },
  { char: 'E', color: '#1E6BFF' },
  { char: 'T', color: '#2D5BFF' },
  { char: 'T', color: '#4338CA' },
  { char: 'I', color: '#6366F1' },
  { char: 'N', color: '#8B5CF6' },
  { char: 'G', color: '#A855F7' },
  { char: 'S', color: '#C084FC' },
];

export function getCompanionArtwork(avatarId: AvatarId | null) {
  switch (avatarId) {
    case 'bamboo':
      return require('../../assets/avatars/avatar_bamboo.webp');
    case 'ember':
      return require('../../assets/avatars/avatar_ember.webp');
    case 'frost':
      return require('../../assets/avatars/avatar_frost.webp');
    case 'sunny':
      return require('../../assets/avatars/avatar_sunny.webp');
    case 'shadow':
      return require('../../assets/avatars/avatar_shadow.webp');
    default:
      return require('../../assets/avatars/avatar_bamboo.webp');
  }
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  savedAvatarId,
  focusedId,
  setFocusedId,
  onChangeAvatar,
}) => {
  const companion = savedAvatarId ? AVATAR_COMPANIONS[savedAvatarId] : AVATAR_COMPANIONS.bamboo;
  const isChangeAvatarFocused = focusedId === SETTINGS_FOCUS_IDS.CHANGE_AVATAR;
  const isQrCardFocused = focusedId === SETTINGS_FOCUS_IDS.QR_CARD;

  return (
    <View style={styles.container}>
      {/* 1. Page Header: Title with Gradient Letters & Subtitle */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeftCol}>
          <Text style={styles.headerTitle}>
            {SETTINGS_GRADIENT_LETTERS.map((item, index) => (
              <Text key={index} style={{ color: item.color }}>
                {item.char}
              </Text>
            ))}
          </Text>
          <Text style={styles.headerSubtitle}>
            Companion Profile, Local Storage & Privacy Transparency
          </Text>
        </View>
      </View>

      {/* 2. Main 2-Column Content Layout */}
      <View style={styles.contentRow}>
        {/* Left Column: User Profile & Companion Avatar Card */}
        <View style={styles.profileCard}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="account-star" size={20} color="#6366F1" />
            <Text style={styles.cardHeaderTitle}>Music Companion</Text>
          </View>

          <View style={styles.avatarShowcaseContainer}>
            <View style={styles.avatarGlowRing}>
              <Image
                source={getCompanionArtwork(savedAvatarId)}
                style={styles.avatarLargeImage}
                resizeMode="cover"
              />
            </View>

            <View style={styles.companionInfoBox}>
              <Text style={styles.companionNameText}>{companion.name}</Text>
              <Text style={styles.companionSpeciesText}>
                {companion.species} • DJ Persona
              </Text>
              <View style={styles.activePill}>
                <View style={styles.activeDot} />
                <Text style={styles.activePillText}>Active Companion</Text>
              </View>
            </View>
          </View>

          {/* Change Avatar Button */}
          <Pressable
            style={[
              styles.changeAvatarBtn,
              isChangeAvatarFocused && styles.changeAvatarBtnFocused,
            ]}
            onPress={onChangeAvatar}
            onFocus={() => setFocusedId(SETTINGS_FOCUS_IDS.CHANGE_AVATAR)}
          >
            <Feather
              name="refresh-cw"
              size={15}
              color={isChangeAvatarFocused ? '#FFFFFF' : '#4338CA'}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.changeAvatarBtnText,
                isChangeAvatarFocused && styles.changeAvatarBtnTextFocused,
              ]}
            >
              Change Companion Avatar
            </Text>
          </Pressable>
        </View>

        {/* Right Column: Privacy & Policy (Hybrid TV Highlights + Scannable QR Code) */}
        <View style={styles.privacyCard}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="shield-check" size={20} color="#10B981" />
            <Text style={styles.cardHeaderTitle}>Privacy & Data Policy</Text>
            <View style={styles.trustBadge}>
              <Text style={styles.trustBadgeText}>Privacy-First Architecture</Text>
            </View>
          </View>

          <View style={styles.privacyBodyRow}>
            {/* 3 Important Highlights */}
            <View style={styles.highlightsContainer}>
              {/* Point 1: Mic */}
              <View style={styles.highlightItem}>
                <View style={styles.highlightIconBox}>
                  <Feather name="mic" size={14} color="#6366F1" />
                </View>
                <View style={styles.highlightTextBox}>
                  <Text style={styles.highlightTitle}>Zero Passive Listening</Text>
                  <Text style={styles.highlightDesc}>
                    Mic activates only when pressed. Voice processed locally on-device via C++ Whistle engine. Zero ambient listening.
                  </Text>
                </View>
              </View>

              {/* Point 2: Bedrock & Gemini AI */}
              <View style={styles.highlightItem}>
                <View style={styles.highlightIconBox}>
                  <MaterialCommunityIcons name="robot-outline" size={14} color="#06B6D4" />
                </View>
                <View style={styles.highlightTextBox}>
                  <Text style={styles.highlightTitle}>Amazon Bedrock & Gemini AI</Text>
                  <Text style={styles.highlightDesc}>
                    Natural language intents and live AI DJ curated via Amazon Bedrock (Nova Lite) & Gemini. Zero PII transmitted.
                  </Text>
                </View>
              </View>

              {/* Point 3: Hybrid Storage */}
              <View style={styles.highlightItem}>
                <View style={styles.highlightIconBox}>
                  <MaterialCommunityIcons name="cloud-sync-outline" size={14} color="#10B981" />
                </View>
                <View style={styles.highlightTextBox}>
                  <Text style={styles.highlightTitle}>Hybrid SQLite & DynamoDB</Text>
                  <Text style={styles.highlightDesc}>
                    Ultra-fast 60 FPS local SQLite WAL storage with encrypted, anonymous cloud sync to Amazon DynamoDB.
                  </Text>
                </View>
              </View>
            </View>

            {/* QR Code Card */}
            <Pressable
              style={[
                styles.qrContainer,
                isQrCardFocused && styles.qrContainerFocused,
              ]}
              onFocus={() => setFocusedId(SETTINGS_FOCUS_IDS.QR_CARD)}
            >
              <View style={styles.qrWhiteBox}>
                <Image
                  source={require('../../assets/settings/privacy_qr.png')}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.qrCaptionTitle}>Full Policy Online</Text>
              <Text style={styles.qrCaptionDesc}>
                Scan with phone camera to read complete document
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingLeft: 4,
  },
  headerLeftCol: {
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    letterSpacing: 0.2,
  },
  contentRow: {
    flexDirection: 'row',
    gap: 14,
    flex: 1,
  },
  // Profile & Avatar Card
  profileCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  avatarShowcaseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 1,
  },
  avatarGlowRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2.5,
    borderColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 6,
  },
  avatarLargeImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  companionInfoBox: {
    alignItems: 'center',
  },
  companionNameText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 1,
  },
  companionSpeciesText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.2,
  },
  changeAvatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    marginTop: 6,
  },
  changeAvatarBtnFocused: {
    backgroundColor: '#4338CA',
    borderColor: '#818CF8',
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  changeAvatarBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  changeAvatarBtnTextFocused: {
    color: '#FFFFFF',
  },
  // Privacy & Policy Card
  privacyCard: {
    flex: 1.6,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  trustBadge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  trustBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#059669',
  },
  privacyBodyRow: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  highlightsContainer: {
    flex: 1.35,
    justifyContent: 'flex-start',
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 5,
  },
  highlightIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  highlightTextBox: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 1,
  },
  highlightDesc: {
    fontSize: 9.5,
    color: '#64748B',
    lineHeight: 12.5,
  },
  // QR Code Box
  qrContainer: {
    flex: 0.85,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  qrContainerFocused: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
    transform: [{ scale: 1.02 }],
  },
  qrWhiteBox: {
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  qrImage: {
    width: 76,
    height: 76,
  },
  qrCaptionTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 1,
    textAlign: 'center',
  },
  qrCaptionDesc: {
    fontSize: 8.5,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 11,
  },
});
