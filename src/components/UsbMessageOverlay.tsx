import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Modal,
} from 'react-native';

export interface UsbMessageOverlayProps {
  visible: boolean;
  type: 'NOT_CONNECTED' | 'NO_SONGS';
  title?: string;
  message?: string;
  onClose: () => void;
  isFocused?: boolean;
}

export function UsbMessageOverlay({
  visible,
  type,
  title,
  message,
  onClose,
  isFocused = true,
}: UsbMessageOverlayProps) {
  if (!visible) return null;

  const defaultTitle =
    type === 'NOT_CONNECTED'
      ? 'No USB Drive Connected'
      : 'No Songs Found on USB';

  const defaultMessage =
    type === 'NOT_CONNECTED'
      ? 'Please insert a USB flash drive (FAT32 or exFAT) into your TV or OTG adapter. Your music tracks will be loaded automatically.'
      : 'Your USB drive is connected, but no supported audio tracks (.mp3, .flac, .m4a, .wav, .aac) were detected. Copy audio files to your drive and try again.';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.dialogCard}>
          {/* Top Status Icon Badge */}
          <View
            style={[
              styles.iconBadge,
              type === 'NOT_CONNECTED' ? styles.iconBadgeAmber : styles.iconBadgeBlue,
            ]}
          >
            <Image
              source={require('../../assets/ui/icon_usb.png')}
              style={[
                styles.badgeIcon,
                {
                  tintColor: type === 'NOT_CONNECTED' ? '#EA580C' : '#6366F1',
                },
              ]}
              resizeMode="contain"
            />
          </View>

          {/* Dialog Title */}
          <Text style={styles.titleText}>{title || defaultTitle}</Text>

          {/* Dialog Message */}
          <Text style={styles.messageText}>{message || defaultMessage}</Text>

          {/* Requirements & Formats Info Row */}
          <View style={styles.pillsRow}>
            <View style={styles.pillItem}>
              <Text style={styles.pillText}>Formats: MP3, FLAC, M4A, WAV, AAC</Text>
            </View>
            <View style={styles.pillItem}>
              <Text style={styles.pillText}>File System: FAT32 / exFAT</Text>
            </View>
          </View>

          {/* Action Button: Back to Library */}
          <Pressable
            focusable={false}
            onPress={onClose}
            style={({ pressed }) => [
              styles.backButton,
              isFocused && styles.backButtonFocused,
              pressed && styles.backButtonPressed,
            ]}
          >
            <Text
              style={[
                styles.backButtonText,
                isFocused && styles.backButtonTextFocused,
              ]}
            >
              Back to Library
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialogCard: {
    width: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 32,
    paddingHorizontal: 36,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 16,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconBadgeAmber: {
    backgroundColor: '#FFF7ED',
    borderWidth: 2,
    borderColor: '#FED7AA',
  },
  iconBadgeBlue: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#C7D2FE',
  },
  badgeIcon: {
    width: 32,
    height: 32,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 10,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 13.5,
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 26,
  },
  pillItem: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  backButton: {
    minWidth: 220,
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonFocused: {
    backgroundColor: '#4F46E5',
    borderColor: '#6366F1',
    borderWidth: 2,
    transform: [{ scale: 1.04 }],
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  backButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: 0.2,
  },
  backButtonTextFocused: {
    color: '#FFFFFF',
  },
});
