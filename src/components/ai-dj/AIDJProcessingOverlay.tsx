import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MusicTrack } from '../../services/musicCatalog';
import { AIMusicVisualizer } from './AIMusicVisualizer';
import { AIDJTrackRevealRow, AIDJProcessingStage } from './AIDJTrackRevealRow';
import { AIDJProcessingProgress } from './AIDJProcessingProgress';
import { AIDJErrorInfo } from '../../services/aiDjErrorService';

export interface AIDJSessionSummary {
  trackCount: number;
  durationMinutes: number;
  mood?: string;
  energy?: string;
  title?: string;
}

interface AIDJProcessingOverlayProps {
  visible: boolean;
  userRequest: string;
  sessionTitle?: string;
  stage: AIDJProcessingStage;
  tracks: MusicTrack[];
  revealedCount: number;
  sessionSummary?: AIDJSessionSummary | null;
  errorInfo?: AIDJErrorInfo | null;
  errorMessage?: string | null;
  onCancel?: () => void;
  onRetry?: () => void;
  onProceed?: () => void;
  focusedErrorButton?: 'retry' | 'back';
  onFocusErrorButton?: (button: 'retry' | 'back') => void;
}

export const AIDJProcessingOverlay: React.FC<AIDJProcessingOverlayProps> = ({
  visible,
  userRequest,
  sessionTitle,
  stage,
  tracks,
  revealedCount,
  sessionSummary,
  errorInfo,
  errorMessage,
  onCancel,
  onRetry,
  onProceed,
  focusedErrorButton = 'retry',
  onFocusErrorButton,
}) => {
  if (!visible) return null;

  const isReady = stage === 'READY';
  const isError = stage === 'ERROR';

  // Status text for each stage (when not in error state)
  const renderStatusText = () => {
    switch (stage) {
      case 'UNDERSTANDING':
        return (
          <Text style={styles.statusText}>
            <Text style={styles.statusAction}>Understanding</Text> your vibe
          </Text>
        );
      case 'FINDING_TRACKS':
        return (
          <Text style={styles.statusText}>
            <Text style={styles.statusAction}>Finding</Text> your tracks for you
          </Text>
        );
      case 'BUILDING_MIX':
        return (
          <Text style={styles.statusText}>
            <Text style={styles.statusAction}>Building</Text> your mix
          </Text>
        );
      case 'BALANCING_SESSION':
        return (
          <Text style={styles.statusText}>
            <Text style={styles.statusAction}>Balancing</Text> your listening flow
          </Text>
        );
      case 'READY':
        return (
          <View style={styles.readySummaryColumn}>
            <View style={styles.readyPillRow}>
              <View style={styles.readyPill}>
                <Text style={styles.readyPillText}>
                  {sessionSummary?.trackCount || 18} tracks · {sessionSummary?.durationMinutes || 72} min
                </Text>
              </View>
              {sessionSummary?.mood && (
                <View style={styles.readyPillSecondary}>
                  <Text style={styles.readyPillSecondaryText}>
                    {sessionSummary.mood.charAt(0).toUpperCase() + sessionSummary.mood.slice(1)}
                    {sessionSummary.energy ? ` · ${sessionSummary.energy}` : ''}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.backdropOverlay}>
      {/* Tap backdrop outside modal card to dismiss / return */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onCancel}
        accessible={false}
      />
      {/* 
        Centered Glassmorphic Modal Card
        - Pure light pastel background with subtle atmospheric tint
        - Preserves identical dimensions (~56% width, ~68% height) in both processing and error states
        - Seamless transition without jarring resizing
      */}
      <View style={styles.modalCard}>
        {/* 1. TOP: AI / MUSIC VISUALIZER (Static & gentle during error) */}
        <AIMusicVisualizer isAnimated={!isError} />

        {/* 2. TITLE: "Creating your session" / "Your session is ready" / Friendly Error Title */}
        <View style={styles.titleSection}>
          {isError ? (
            <Text style={styles.titleErrorTheme}>
              {errorInfo?.title || "We couldn't create your session"}
            </Text>
          ) : isReady ? (
            <Text style={styles.titleRow}>
              <Text style={styles.titleAction}>Your session</Text>
              <Text style={styles.titleRest}> is ready</Text>
            </Text>
          ) : sessionTitle ? (
            <Text style={styles.titleRow}>
              <Text style={styles.titleAction}>{sessionTitle.split(' ')[0]}</Text>
              <Text style={styles.titleRest}> {sessionTitle.substring(sessionTitle.indexOf(' ') + 1)}</Text>
            </Text>
          ) : (
            <Text style={styles.titleRow}>
              <Text style={styles.titleAction}>Creating</Text>
              <Text style={styles.titleRest}> your session</Text>
            </Text>
          )}

          {/* 3. USER REQUEST: Dynamic Speech Query in Quotes (Only actual recognized speech) */}
          {userRequest && userRequest.trim().length > 0 ? (
            <Text numberOfLines={1} style={styles.userRequestText}>
              "{userRequest.trim()}"
            </Text>
          ) : !isError ? (
            <Text numberOfLines={1} style={styles.userRequestText}>
              Listening to your request...
            </Text>
          ) : null}
        </View>

        {/* 4. CONTENT AREA: Tracks preview & progress during processing, or User-Friendly Error Block */}
        {!isError ? (
          <>
            {/* 4a. TRACK PREVIEW ROW: 5 Real Album Artworks Progressively Revealed */}
            <AIDJTrackRevealRow
              tracks={tracks}
              revealedCount={revealedCount}
              stage={stage}
            />

            {/* 4b. PROGRESS INDICATOR: 5-Stage Step Line */}
            <AIDJProcessingProgress stage={stage} />

            {/* 4c. BOTTOM PROCESSING STATUS TEXT / READY SUMMARY */}
            <Pressable
              onPress={isReady ? onProceed : undefined}
              focusable={false}
              style={styles.bottomStatusSection}
            >
              {renderStatusText()}
            </Pressable>
          </>
        ) : (
          /* 4d. ERROR STATE VIEW: Gentle neutral/purple styling, zero aggressive red */
          <View style={styles.errorContentContainer}>
            <Text style={styles.errorSupportingText}>
              {errorInfo?.supportingText || "Something went wrong while preparing your AI DJ session."}
            </Text>

            {/* Action Buttons: [ Try Again ] and [ Back ] */}
            <View style={styles.errorActionRow}>
              {/* Primary Action: Try Again */}
              <Pressable
                onPress={onRetry}
                onFocus={() => onFocusErrorButton?.('retry')}
                style={({ pressed }) => [
                  styles.errorButtonPrimary,
                  focusedErrorButton === 'retry' && styles.errorButtonPrimaryFocused,
                  pressed && styles.errorButtonPressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="refresh"
                  size={15}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.errorButtonPrimaryText}>Try Again</Text>
              </Pressable>

              {/* Secondary Action: Back */}
              <Pressable
                onPress={onCancel}
                onFocus={() => onFocusErrorButton?.('back')}
                style={({ pressed }) => [
                  styles.errorButtonSecondary,
                  focusedErrorButton === 'back' && styles.errorButtonSecondaryFocused,
                  pressed && styles.errorButtonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.errorButtonSecondaryText,
                    focusedErrorButton === 'back' && styles.errorButtonSecondaryTextFocused,
                  ]}
                >
                  Back
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* 5. FOOTER TIP FOR REMOTE */}
        <Text style={styles.remoteHint}>
          {isError
            ? 'Press Back to return · Select Try Again to restart'
            : isReady
            ? 'Session Prepared · Press Select to open playlist'
            : 'Press Back on remote to cancel'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.38)', // Keeps underlying AI DJ page clearly visible with subtle dimming
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },

  // Centered Glassmorphic Landscape Modal Card (~56% width, ~68% height of TV canvas)
  modalCard: {
    width: 546,
    maxWidth: '58%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    paddingVertical: 16,
    paddingHorizontal: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    // Extremely subtle atmospheric pastel tint, zero decorative waves
    position: 'relative',
    overflow: 'hidden',
  },

  // Title Section
  titleSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: 2,
  },
  titleRow: {
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  titleAction: {
    color: '#6366F1', // Premium violet/purple
    fontWeight: '900',
  },
  titleRest: {
    color: '#0F172A', // Dark navy/black
    fontWeight: '800',
  },
  titleErrorTheme: {
    fontSize: 18.5,
    fontWeight: '800',
    color: '#1E1B4B', // Premium deep navy/indigo, never aggressive red
    textAlign: 'center',
    letterSpacing: -0.2,
    marginTop: 2,
  },

  // User Request (Dynamic Quote)
  userRequestText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
    maxWidth: 440,
  },

  // Error State View Container
  errorContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 10,
    minHeight: 110,
  },
  errorSupportingText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#475569', // Subtle neutral slate, friendly and non-technical
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 420,
  },
  errorActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 6,
  },
  errorButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1', // Premium indigo/violet
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#818CF8',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  errorButtonPrimaryFocused: {
    backgroundColor: '#4F46E5',
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.06 }],
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 8,
  },
  errorButtonPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  errorButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9', // Soft light gray
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  errorButtonSecondaryFocused: {
    backgroundColor: '#E2E8F0',
    borderColor: '#6366F1',
    transform: [{ scale: 1.06 }],
    elevation: 6,
  },
  errorButtonSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  errorButtonSecondaryTextFocused: {
    color: '#1E1B4B',
    fontWeight: '700',
  },
  errorButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  // Bottom Status Section
  bottomStatusSection: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
    marginTop: 2,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  statusAction: {
    color: '#7C3AED',
    fontWeight: '800',
  },
  statusTextReady: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },

  // Ready State Summary Badges
  readySummaryColumn: {
    alignItems: 'center',
    gap: 6,
  },
  readyPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  readyPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  readyPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  readyPillSecondary: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  readyPillSecondaryText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#7E22CE',
  },

  // Footer Tip for Remote Back
  remoteHint: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 4,
  },
});
