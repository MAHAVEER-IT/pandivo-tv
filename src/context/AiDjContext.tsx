import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { Platform, PermissionsAndroid, NativeModules, NativeEventEmitter } from 'react-native';
import {
  parseMusicIntent,
  MusicIntent,
  testGeminiApiLive,
} from '../services/geminiIntentService';
import { TRACK_CATALOG, MusicTrack } from '../services/musicCatalog';
import {
  AIDJSession,
  initDJSession,
} from '../services/aiDjSessionService';
import {
  filterCandidatesWithFallback,
  calculateRelevanceScore,
} from '../services/recommendationEngine';
import {
  AIDJSessionSummary,
  AIDJProcessingStage,
} from '../components/ai-dj';
import {
  AIDJErrorInfo,
  classifyAIDJError,
  classifySpeechError,
} from '../services/aiDjErrorService';
import { PlaylistData } from '../data/playlistData';
import { convertAiDjSessionToPlaylist } from '../utils/aiDjPlaylistAdapter';
import { saveAiDjPlaylist } from '../database';
import { TimeContext, CONTEXTUAL_AIDJ_CONFIGS } from '../constants/timeThemes';
import { AI_DJ_FOCUS_IDS } from '../navigation/aiDjNavGraph';
import { GeminiDiagnosticInfo } from '../components/AiDjScreen';

const { SpeechRecognition } = NativeModules;
const speechEventEmitter = SpeechRecognition ? new NativeEventEmitter(SpeechRecognition) : null;

export interface AiDjContextType {
  isListening: boolean;
  isListeningRef: React.MutableRefObject<boolean>;
  setIsListening: React.Dispatch<React.SetStateAction<boolean>>;
  isProcessing: boolean;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  voiceTranscript: string;
  setVoiceTranscript: React.Dispatch<React.SetStateAction<string>>;
  voiceToast: string | null;
  setVoiceToast: React.Dispatch<React.SetStateAction<string | null>>;
  geminiDiagnostic: GeminiDiagnosticInfo | null;
  geminiDiagnosticRef: React.MutableRefObject<GeminiDiagnosticInfo | null>;
  setGeminiDiagnostic: React.Dispatch<React.SetStateAction<GeminiDiagnosticInfo | null>>;

  // Overlay state
  isAiDjOverlayVisible: boolean;
  isAiDjOverlayVisibleRef: React.MutableRefObject<boolean>;
  setIsAiDjOverlayVisible: React.Dispatch<React.SetStateAction<boolean>>;
  aiDjProcessingStage: AIDJProcessingStage;
  aiDjProcessingStageRef: React.MutableRefObject<AIDJProcessingStage>;
  setAiDjProcessingStage: React.Dispatch<React.SetStateAction<AIDJProcessingStage>>;
  aiDjUserRequest: string;
  setAiDjUserRequest: React.Dispatch<React.SetStateAction<string>>;
  aiDjSessionTitle: string;
  setAiDjSessionTitle: React.Dispatch<React.SetStateAction<string>>;
  aiDjPreviewTracks: MusicTrack[];
  aiDjRevealedCount: number;
  aiDjSessionSummary: AIDJSessionSummary | null;
  aiDjError: AIDJErrorInfo | null;
  aiDjErrorMessage: string | null;
  overlayFocusedBtn: 'retry' | 'back';
  overlayFocusedBtnRef: React.MutableRefObject<'retry' | 'back'>;
  setOverlayFocusedBtn: React.Dispatch<React.SetStateAction<'retry' | 'back'>>;
  readyAiDjSession: AIDJSession | null;
  readyAiDjSessionRef: React.MutableRefObject<AIDJSession | null>;

  // Actions
  handleCancelAiDjProcessing: () => void;
  handleRetryAiDjProcessing: () => void;
  handleProceedToAiDjPlaylist: () => void;
  handleProceedToAiDjPlaylistRef: React.MutableRefObject<(() => void) | null>;
  handleVoiceCommand: (
    commandText: string,
    customSessionTitle?: string,
    preformedIntent?: MusicIntent
  ) => Promise<void>;
  handleLaunchContextualAIDJ: (context: TimeContext) => Promise<void>;
  handleRunDiagnosticTest: () => Promise<void>;
  handleToggleVoice: () => Promise<void>;
  handleCancelVoiceListening: () => void;
}

const AiDjContext = createContext<AiDjContextType | null>(null);

export interface AiDjProviderProps {
  children: React.ReactNode;
  player: any;
  currentTrackRef: React.MutableRefObject<MusicTrack>;
  setCurrentTrack: (track: MusicTrack) => void;
  session: AIDJSession | null;
  setSession: (session: AIDJSession | null) => void;
  pausePlaybackForVoice: () => void;
  resumePlaybackAfterVoice: () => void;
  wasPlayingBeforeVoiceRef: React.MutableRefObject<boolean>;
  userAiPlaylistsRef: React.MutableRefObject<PlaylistData[]>;
  setUserAiPlaylists: React.Dispatch<React.SetStateAction<PlaylistData[]>>;
  activeNavTabRef: React.MutableRefObject<string>;
  setActiveNavTab: (tab: string) => void;
  selectedPlaylistRef: React.MutableRefObject<PlaylistData | null>;
  setSelectedPlaylist: (pl: PlaylistData | null) => void;
  setFocusedId: (id: string) => void;
  handleSelectPlaylist: (playlist: PlaylistData, origin?: 'library' | 'home' | 'ai_dj' | 'favorites') => void;
  searchScreenRef?: React.RefObject<any>;
  handleStartPlaylistVoiceSearch?: () => Promise<void>;
}

export type UseAiDjControllerParams = Omit<AiDjProviderProps, 'children'>;

export function useAiDjController({
  player,
  currentTrackRef,
  setCurrentTrack,
  session,
  setSession,
  pausePlaybackForVoice,
  resumePlaybackAfterVoice,
  wasPlayingBeforeVoiceRef,
  userAiPlaylistsRef,
  setUserAiPlaylists,
  activeNavTabRef,
  setActiveNavTab,
  selectedPlaylistRef,
  setSelectedPlaylist,
  setFocusedId,
  handleSelectPlaylist,
  searchScreenRef,
  handleStartPlaylistVoiceSearch,
}: UseAiDjControllerParams): AiDjContextType {
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceToast, setVoiceToast] = useState<string | null>(null);
  const [geminiDiagnostic, setGeminiDiagnostic] = useState<GeminiDiagnosticInfo | null>(null);
  const geminiDiagnosticRef = useRef<GeminiDiagnosticInfo | null>(null);
  geminiDiagnosticRef.current = geminiDiagnostic;

  const [isListening, setIsListening] = useState<boolean>(false);
  const isListeningRef = useRef<boolean>(false);
  isListeningRef.current = isListening;

  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Module 1: AI DJ Processing / Session Creation Overlay State
  const [isAiDjOverlayVisible, setIsAiDjOverlayVisible] = useState<boolean>(false);
  const isAiDjOverlayVisibleRef = useRef<boolean>(false);
  isAiDjOverlayVisibleRef.current = isAiDjOverlayVisible;

  const [aiDjProcessingStage, setAiDjProcessingStage] = useState<AIDJProcessingStage>('UNDERSTANDING');
  const aiDjProcessingStageRef = useRef<AIDJProcessingStage>('UNDERSTANDING');
  aiDjProcessingStageRef.current = aiDjProcessingStage;

  const [aiDjUserRequest, setAiDjUserRequest] = useState<string>('');
  const [aiDjSessionTitle, setAiDjSessionTitle] = useState<string>('Creating your session');
  const lastUserRequestRef = useRef<string>('');
  const [aiDjPreviewTracks, setAiDjPreviewTracks] = useState<MusicTrack[]>([]);
  const [aiDjRevealedCount, setAiDjRevealedCount] = useState<number>(0);
  const [aiDjSessionSummary, setAiDjSessionSummary] = useState<AIDJSessionSummary | null>(null);
  const [aiDjError, setAiDjError] = useState<AIDJErrorInfo | null>(null);
  const [aiDjErrorMessage, setAiDjErrorMessage] = useState<string | null>(null);

  const [overlayFocusedBtn, setOverlayFocusedBtn] = useState<'retry' | 'back'>('retry');
  const overlayFocusedBtnRef = useRef<'retry' | 'back'>('retry');
  overlayFocusedBtnRef.current = overlayFocusedBtn;

  const aiDjRequestIdRef = useRef<number>(0);
  const readyAutoProceedTimerRef = useRef<any>(null);
  const speechFallbackTimerRef = useRef<any>(null);
  const lastIntentRef = useRef<MusicIntent | null>(null);

  const [readyAiDjSession, setReadyAiDjSession] = useState<AIDJSession | null>(null);
  const readyAiDjSessionRef = useRef<AIDJSession | null>(null);
  readyAiDjSessionRef.current = readyAiDjSession;

  const handleProceedToAiDjPlaylistRef = useRef<(() => void) | null>(null);
  const handleVoiceCommandRef = useRef<any>(null);
  const handleToggleVoiceRef = useRef<(() => Promise<void>) | null>(null);

  const ensureMicrophonePermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const has = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      if (has) return true;
      const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
        title: 'Microphone Permission',
        message: 'This app needs access to your microphone for voice requests and AI DJ testing.',
        buttonPositive: 'Allow',
      });
      return res === PermissionsAndroid.RESULTS.GRANTED;
    } catch (e) {
      console.warn('Microphone permission request failed:', e);
      return false;
    }
  }, []);

  const handleCancelAiDjProcessing = useCallback(() => {
    console.log('[Module 1] handleCancelAiDjProcessing called! Dismissing overlay.');
    if (readyAutoProceedTimerRef.current) {
      clearTimeout(readyAutoProceedTimerRef.current);
      readyAutoProceedTimerRef.current = null;
    }
    aiDjRequestIdRef.current++;
    isAiDjOverlayVisibleRef.current = false;
    setIsAiDjOverlayVisible(false);
    setAiDjProcessingStage('UNDERSTANDING');
    setAiDjError(null);
    setAiDjErrorMessage(null);
    setAiDjPreviewTracks([]);
    setAiDjRevealedCount(0);
    setAiDjSessionSummary(null);
    setOverlayFocusedBtn('retry');
    setIsListening(false);
    setIsProcessing(false);
    setVoiceToast(null);
    resumePlaybackAfterVoice();
  }, [resumePlaybackAfterVoice]);

  const handleVoiceCommand = useCallback(
    async (
      commandText: string,
      customSessionTitle?: string,
      preformedIntent?: MusicIntent
    ) => {
      if (!commandText || commandText.trim().length === 0) {
        console.warn('[AI DJ] handleVoiceCommand called with empty text, rejecting.');
        return;
      }
      const trimmedCommand = commandText.trim();
      const currentReqId = ++aiDjRequestIdRef.current;
      lastUserRequestRef.current = trimmedCommand;
      const isAiDjContext = activeNavTabRef.current === 'ai_dj';

      if (isAiDjContext) {
        isAiDjOverlayVisibleRef.current = true;
        setIsAiDjOverlayVisible(true);
        setAiDjProcessingStage('UNDERSTANDING');
        setAiDjUserRequest(trimmedCommand);
        setAiDjSessionTitle(customSessionTitle || 'Creating your session');
        setAiDjPreviewTracks([]);
        setAiDjRevealedCount(0);
        setAiDjSessionSummary(null);
        setAiDjError(null);
        setAiDjErrorMessage(null);
        setOverlayFocusedBtn('retry');
      }

      setIsProcessing(true);
      setVoiceToast(null);
      const startTime = Date.now();

      try {
        let intent: MusicIntent;
        if (preformedIntent) {
          try {
            const liveParsed = await parseMusicIntent(trimmedCommand);
            intent = {
              ...liveParsed,
              action: 'create_playlist',
              mood: preformedIntent.mood || liveParsed.mood || 'chill',
              context: preformedIntent.context || liveParsed.context || null,
              energy: preformedIntent.energy || liveParsed.energy || 'medium',
            };
          } catch (_e) {
            intent = preformedIntent;
          }
        } else {
          intent = await parseMusicIntent(trimmedCommand);
        }

        if (aiDjRequestIdRef.current !== currentReqId) return;
        lastIntentRef.current = intent;

        if (trimmedCommand.includes('[simulate:no_tracks]')) {
          const errInfo = classifyAIDJError(null, null, 0);
          setAiDjError(errInfo);
          setAiDjProcessingStage('ERROR');
          setIsProcessing(false);
          return;
        }

        if (intent.action === 'unsupported') {
          const errInfo = classifyAIDJError(null, intent);
          setAiDjError(errInfo);
          setAiDjProcessingStage('ERROR');
          setIsProcessing(false);
          return;
        }

        if (trimmedCommand.includes('[simulate:') && !intent.geminiLive && intent.error) {
          const errInfo = classifyAIDJError(new Error(intent.error), intent);
          setAiDjError(errInfo);
          setAiDjProcessingStage('ERROR');
          setIsProcessing(false);
          return;
        }

        if (isAiDjContext || intent.action === 'start_ai_dj' || intent.action === 'create_playlist') {
          if (!isAiDjOverlayVisibleRef.current) {
            setIsAiDjOverlayVisible(true);
            setAiDjUserRequest(trimmedCommand);
            setAiDjSessionTitle(customSessionTitle || 'Creating your session');
          }

          setAiDjProcessingStage('FINDING_TRACKS');

          const { candidates } = filterCandidatesWithFallback(TRACK_CATALOG, intent, 18);
          if (aiDjRequestIdRef.current !== currentReqId) return;

          if (!candidates || candidates.length === 0) {
            const errInfo = classifyAIDJError(null, null, 0);
            setAiDjError(errInfo);
            setAiDjProcessingStage('ERROR');
            setIsProcessing(false);
            return;
          }

          const scored = candidates.map((t) => calculateRelevanceScore(t, intent));
          scored.sort((a, b) => b.score - a.score);
          const top5Preview = scored.slice(0, 5).map((s) => s.track);
          while (top5Preview.length < 5) {
            const extra = TRACK_CATALOG.find((t) => !top5Preview.some((p) => p.id === t.id));
            if (!extra) break;
            top5Preview.push(extra);
          }

          setAiDjProcessingStage('BUILDING_MIX');
          setAiDjPreviewTracks(top5Preview);

          for (let count = 1; count <= 5; count++) {
            if (aiDjRequestIdRef.current !== currentReqId) return;
            setAiDjRevealedCount(count);
            await new Promise((resolve) => setTimeout(resolve, 140));
          }

          if (aiDjRequestIdRef.current !== currentReqId) return;
          setAiDjProcessingStage('BALANCING_SESSION');

          const newSession = initDJSession(intent, TRACK_CATALOG);
          if (aiDjRequestIdRef.current !== currentReqId) return;

          if (!newSession || !newSession.currentTrack) {
            throw new Error('AI DJ session generation failure');
          }

          const allSessionTracks: MusicTrack[] = [
            newSession.currentTrack,
            ...(newSession.queue || []),
          ];

          const previewCards: MusicTrack[] = allSessionTracks.slice(0, 5);
          setAiDjPreviewTracks(previewCards);
          setAiDjRevealedCount(previewCards.length);

          const totalSecs = allSessionTracks.reduce(
            (acc, t) => acc + (t.duration || 240),
            0
          );
          const calculatedMinutes = Math.round(totalSecs / 60);

          const summary: AIDJSessionSummary = {
            trackCount: allSessionTracks.length,
            durationMinutes: calculatedMinutes || newSession.totalDurationMinutes || 72,
            mood: newSession.targetMood,
            energy: newSession.targetEnergyLevel,
          };

          if (aiDjRequestIdRef.current !== currentReqId) return;
          setAiDjSessionSummary(summary);
          setReadyAiDjSession(newSession);
          setSession(newSession);
          setAiDjProcessingStage('READY');
          setIsProcessing(false);

          if (readyAutoProceedTimerRef.current) {
            clearTimeout(readyAutoProceedTimerRef.current);
          }
          readyAutoProceedTimerRef.current = setTimeout(() => {
            if (isAiDjOverlayVisibleRef.current && aiDjProcessingStageRef.current === 'READY') {
              handleProceedToAiDjPlaylistRef.current?.();
            }
          }, 2200);

          return;
        }

        const isLive = intent.geminiLive ?? true;
        const latency = intent.latencyMs || (Date.now() - startTime);
        if (isLive) {
          setVoiceToast(`🟢 Bedrock Responded (${latency}ms) • ${intent.action.toUpperCase()} • ${intent.mood || intent.energy || 'Curating'}`);
        } else {
          setVoiceToast(`🟡 Offline Fallback: ${intent.error || 'Bedrock timeout'}`);
        }

        const matched = TRACK_CATALOG.find((t) => t.mood === intent.mood) || TRACK_CATALOG[0];
        setCurrentTrack(matched);
        if (player) {
          player.replace(matched.audioUrl);
          player.play();
        }
        setIsProcessing(false);
        setTimeout(() => setVoiceToast(null), 4500);
      } catch (e: any) {
        if (aiDjRequestIdRef.current !== currentReqId) return;
        setIsProcessing(false);
        if (isAiDjContext || isAiDjOverlayVisibleRef.current) {
          const errInfo = classifyAIDJError(e);
          setAiDjError(errInfo);
          setAiDjProcessingStage('ERROR');
        } else {
          setVoiceToast(`❌ Error: ${e.message}`);
          setTimeout(() => setVoiceToast(null), 3500);
        }
      }
    },
    [player, activeNavTabRef, setCurrentTrack, setSession]
  );
  handleVoiceCommandRef.current = handleVoiceCommand;

  const handleRetryAiDjProcessing = useCallback(() => {
    const promptToRetry = (lastUserRequestRef.current || aiDjUserRequest || '').trim();
    console.log('[Module 1] handleRetryAiDjProcessing called! promptToRetry:', promptToRetry);
    setOverlayFocusedBtn('retry');

    if (promptToRetry.length > 0) {
      handleVoiceCommandRef.current?.(promptToRetry);
    } else {
      handleCancelAiDjProcessing();
      handleToggleVoiceRef.current?.();
    }
  }, [handleCancelAiDjProcessing, aiDjUserRequest]);

  const handleProceedToAiDjPlaylist = useCallback(() => {
    wasPlayingBeforeVoiceRef.current = false;
    if (readyAutoProceedTimerRef.current) {
      clearTimeout(readyAutoProceedTimerRef.current);
      readyAutoProceedTimerRef.current = null;
    }
    const sessionToLoad = readyAiDjSessionRef.current || session;
    if (!sessionToLoad) {
      console.warn('[Module 2] No AI DJ session found to load into Playlist Detail.');
      handleCancelAiDjProcessing();
      return;
    }

    console.log('[Module 2] Transitioning to Playlist Detail with full AI DJ session:', sessionToLoad.id);
    isAiDjOverlayVisibleRef.current = false;
    setIsAiDjOverlayVisible(false);

    const userPrompt = lastUserRequestRef.current || aiDjUserRequest || undefined;
    const aiDjPlaylist = convertAiDjSessionToPlaylist(
      sessionToLoad,
      userPrompt,
      lastIntentRef.current || undefined
    );

    setUserAiPlaylists((prev) => {
      const filtered = prev.filter(
        (p) => p.id !== aiDjPlaylist.id && p.title !== aiDjPlaylist.title
      );
      return [aiDjPlaylist, ...filtered];
    });

    saveAiDjPlaylist({
      session_id: aiDjPlaylist.id,
      title: aiDjPlaylist.title,
      user_prompt: userPrompt || null,
      mood: sessionToLoad.targetMood || null,
      track_ids: aiDjPlaylist.tracks.map((t) => t.id),
      created_at: Date.now(),
    }).catch((err) => {
      console.error('[AiDjContext] Failed to save AI DJ playlist to SQLite:', err);
    });

    handleSelectPlaylist(aiDjPlaylist, 'ai_dj');
  }, [
    session,
    handleCancelAiDjProcessing,
    handleSelectPlaylist,
    aiDjUserRequest,
    setUserAiPlaylists,
    wasPlayingBeforeVoiceRef,
  ]);
  handleProceedToAiDjPlaylistRef.current = handleProceedToAiDjPlaylist;

  const handleLaunchContextualAIDJ = useCallback(
    async (context: TimeContext) => {
      const config = CONTEXTUAL_AIDJ_CONFIGS[context] || CONTEXTUAL_AIDJ_CONFIGS.evening;
      console.log('[AI DJ] Launching Contextual Session from Home:', config.context, config.intent);

      if (speechFallbackTimerRef.current) {
        clearTimeout(speechFallbackTimerRef.current);
        speechFallbackTimerRef.current = null;
      }
      setIsListening(false);
      setVoiceToast(null);
      setGeminiDiagnostic(null);

      selectedPlaylistRef.current = null;
      setSelectedPlaylist(null);

      activeNavTabRef.current = 'ai_dj';
      setActiveNavTab('ai_dj');
      setFocusedId(AI_DJ_FOCUS_IDS.MIC);

      await handleVoiceCommand(
        config.prompt,
        config.sessionTitle,
        {
          action: 'create_playlist',
          mood: config.intent.mood,
          energy: config.intent.energy || 'medium',
          context: config.intent.context,
          confidence: 1.0,
          reason: `Contextual ${config.context} music request from Home screen`,
          geminiLive: true,
        }
      );
    },
    [handleVoiceCommand, setFocusedId, selectedPlaylistRef, setSelectedPlaylist, activeNavTabRef, setActiveNavTab]
  );

  const handleRunDiagnosticTest = useCallback(async () => {
    setIsProcessing(true);
    setVoiceToast('🧪 Testing Mic & Amazon Bedrock API...');
    await ensureMicrophonePermission();
    const pingRes = await testGeminiApiLive();
    const testPrompt = 'Play upbeat energetic workout tracks';
    const intent = await parseMusicIntent(testPrompt);

    const report: GeminiDiagnosticInfo = {
      isResponding: pingRes.isResponding || (intent.geminiLive ?? true),
      latencyMs: pingRes.latencyMs || intent.latencyMs || 0,
      model: 'amazon-bedrock-nova-lite',
      statusCode: pingRes.statusCode || (intent.geminiLive ? 200 : 500),
      action: intent.action,
      mood: intent.mood || 'energetic',
      energy: intent.energy || 'high',
      reason: intent.reason,
      errorMessage: pingRes.errorMessage || intent.error,
      timestamp: Date.now(),
      testPrompt,
    };
    setGeminiDiagnostic(report);
    setIsProcessing(false);
    if (report.isResponding) {
      setVoiceToast(`🟢 Bedrock Online (${report.latencyMs}ms • 200 OK) • Intent: ${intent.action.toUpperCase()}`);
    } else {
      setVoiceToast(`🔴 Bedrock Offline: ${report.errorMessage || 'Error'}`);
    }
    setTimeout(() => setVoiceToast(null), 5000);
  }, [ensureMicrophonePermission]);

  const handleSpeechFailure = useCallback((errorType: 'no_speech' | 'not_recognized' | 'mic_error') => {
    setIsListening(false);
    isListeningRef.current = false;
    setVoiceToast(null);
    resumePlaybackAfterVoice();

    if (activeNavTabRef.current === 'ai_dj') {
      const speechErr = classifySpeechError(errorType);
      setAiDjError(speechErr);
      setAiDjProcessingStage('ERROR');
      isAiDjOverlayVisibleRef.current = true;
      setIsAiDjOverlayVisible(true);
      setOverlayFocusedBtn('retry');
    }
  }, [activeNavTabRef, resumePlaybackAfterVoice]);

  const handleToggleVoice = useCallback(async () => {
    if (selectedPlaylistRef.current !== null) {
      if (handleStartPlaylistVoiceSearch) {
        await handleStartPlaylistVoiceSearch();
      }
      return;
    }
    if (activeNavTabRef.current === 'search') {
      searchScreenRef?.current?.startVoiceSearch();
      return;
    }
    if (isListening) {
      if (speechFallbackTimerRef.current) {
        clearTimeout(speechFallbackTimerRef.current);
        speechFallbackTimerRef.current = null;
      }
      try {
        await SpeechRecognition?.stopListening?.();
      } catch (_e) {}
      setIsListening(false);
      isListeningRef.current = false;
      setVoiceToast(null);
      resumePlaybackAfterVoice();
    } else {
      const hasPerm = await ensureMicrophonePermission();
      if (!hasPerm) {
        setVoiceToast('⚠️ Microphone permission not granted');
        setTimeout(() => setVoiceToast(null), 3000);
        return;
      }

      pausePlaybackForVoice();

      aiDjRequestIdRef.current++;
      setVoiceTranscript('');
      lastUserRequestRef.current = '';
      setAiDjUserRequest('');
      setAiDjError(null);
      setAiDjErrorMessage(null);

      setIsListening(true);
      isListeningRef.current = true;
      setVoiceToast('🎙️ Listening... Tell me your mood');

      if (speechFallbackTimerRef.current) {
        clearTimeout(speechFallbackTimerRef.current);
      }
      speechFallbackTimerRef.current = setTimeout(() => {
        if (isListeningRef.current && activeNavTabRef.current === 'ai_dj') {
          handleSpeechFailure('no_speech');
        }
      }, 8000);

      try {
        await SpeechRecognition?.startListening?.();
      } catch (err) {
        console.warn('SpeechRecognition startListening error:', err);
        if (isListeningRef.current && activeNavTabRef.current === 'ai_dj') {
          handleSpeechFailure('mic_error');
        }
      }
    }
  }, [
    isListening,
    selectedPlaylistRef,
    handleStartPlaylistVoiceSearch,
    activeNavTabRef,
    searchScreenRef,
    ensureMicrophonePermission,
    pausePlaybackForVoice,
    resumePlaybackAfterVoice,
    handleSpeechFailure,
  ]);
  handleToggleVoiceRef.current = handleToggleVoice;

  const handleCancelVoiceListening = useCallback(() => {
    if (speechFallbackTimerRef.current) {
      clearTimeout(speechFallbackTimerRef.current);
      speechFallbackTimerRef.current = null;
    }
    try {
      SpeechRecognition?.stopListening?.();
    } catch (_e) {}
    setIsListening(false);
    isListeningRef.current = false;
    setVoiceToast(null);
    setFocusedId(AI_DJ_FOCUS_IDS.MIC);
    resumePlaybackAfterVoice();
  }, [setFocusedId, resumePlaybackAfterVoice]);

  // Native Speech Event Listeners (handles on-device Whistle, System Recognizer & Simulated Input)
  useEffect(() => {
    if (!speechEventEmitter) return;

    const subStart = speechEventEmitter.addListener('onSpeechStart', (data: any) => {
      console.log('[AiDjContext] onSpeechStart:', data);
      if (selectedPlaylistRef.current !== null) {
        setVoiceToast('🎙️ Listening... Speak song title');
      } else if (activeNavTabRef.current === 'search') {
        searchScreenRef?.current?.handleVoiceStart?.();
      } else {
        setIsListening(true);
        isListeningRef.current = true;
        setVoiceToast('🎙️ Listening... Tell me your mood');
      }
    });

    const subPartial = speechEventEmitter.addListener('onSpeechPartialResults', (data: any) => {
      const partialText = (data?.text || '').trim();
      console.log('[AiDjContext] onSpeechPartialResults:', partialText);
      if (speechFallbackTimerRef.current) {
        clearTimeout(speechFallbackTimerRef.current);
        speechFallbackTimerRef.current = null;
      }
      if (selectedPlaylistRef.current !== null) {
        // Handled in playlist search if active
      } else if (activeNavTabRef.current === 'search') {
        searchScreenRef?.current?.handleVoicePartialResult?.(partialText);
      } else {
        setVoiceTranscript(partialText);
        setVoiceToast(`" ${partialText} "`);
      }
    });

    const subResults = speechEventEmitter.addListener('onSpeechResults', (data: any) => {
      const text = (data?.text || '').trim();
      console.log('[AiDjContext] onSpeechResults:', text);
      if (speechFallbackTimerRef.current) {
        clearTimeout(speechFallbackTimerRef.current);
        speechFallbackTimerRef.current = null;
      }

      if (selectedPlaylistRef.current !== null) {
        return;
      }

      if (activeNavTabRef.current === 'search') {
        searchScreenRef?.current?.handleVoiceResult?.(text);
        return;
      }

      setIsListening(false);
      isListeningRef.current = false;
      if (text.length > 0) {
        setVoiceTranscript(text);
        setVoiceToast(`" ${text} "`);
        handleVoiceCommandRef.current?.(text);
      } else {
        handleSpeechFailure('no_speech');
      }
    });

    const subError = speechEventEmitter.addListener('onSpeechError', (data: any) => {
      console.log('[AiDjContext] onSpeechError:', data);
      if (speechFallbackTimerRef.current) {
        clearTimeout(speechFallbackTimerRef.current);
        speechFallbackTimerRef.current = null;
      }

      if (selectedPlaylistRef.current !== null) {
        return;
      }

      if (activeNavTabRef.current === 'search') {
        searchScreenRef?.current?.handleVoiceError?.(data);
        return;
      }

      if (isListeningRef.current && activeNavTabRef.current === 'ai_dj') {
        const errorCode = data?.errorCode;
        if (errorCode === 6) {
          handleSpeechFailure('no_speech');
        } else if (errorCode === 7) {
          handleSpeechFailure('not_recognized');
        } else {
          handleSpeechFailure('mic_error');
        }
      } else {
        setIsListening(false);
        isListeningRef.current = false;
        setVoiceToast(null);
      }
    });

    return () => {
      subStart.remove();
      subPartial.remove();
      subResults.remove();
      subError.remove();
    };
  }, [selectedPlaylistRef, activeNavTabRef, searchScreenRef, handleSpeechFailure]);

  const value: AiDjContextType = {
    isListening,
    isListeningRef,
    setIsListening,
    isProcessing,
    setIsProcessing,
    voiceTranscript,
    setVoiceTranscript,
    voiceToast,
    setVoiceToast,
    geminiDiagnostic,
    geminiDiagnosticRef,
    setGeminiDiagnostic,
    isAiDjOverlayVisible,
    isAiDjOverlayVisibleRef,
    setIsAiDjOverlayVisible,
    aiDjProcessingStage,
    aiDjProcessingStageRef,
    setAiDjProcessingStage,
    aiDjUserRequest,
    setAiDjUserRequest,
    aiDjSessionTitle,
    setAiDjSessionTitle,
    aiDjPreviewTracks,
    aiDjRevealedCount,
    aiDjSessionSummary,
    aiDjError,
    aiDjErrorMessage,
    overlayFocusedBtn,
    overlayFocusedBtnRef,
    setOverlayFocusedBtn,
    readyAiDjSession,
    readyAiDjSessionRef,
    handleCancelAiDjProcessing,
    handleRetryAiDjProcessing,
    handleProceedToAiDjPlaylist,
    handleProceedToAiDjPlaylistRef,
    handleVoiceCommand,
    handleLaunchContextualAIDJ,
    handleRunDiagnosticTest,
    handleToggleVoice,
    handleCancelVoiceListening,
  };

  return value;
}

export const AiDjProvider: React.FC<AiDjProviderProps> = ({ children, ...params }) => {
  const value = useAiDjController(params);
  return <AiDjContext.Provider value={value}>{children}</AiDjContext.Provider>;
};

export const useAiDj = (): AiDjContextType => {
  const context = useContext(AiDjContext);
  if (!context) {
    throw new Error('useAiDj must be used within an AiDjProvider');
  }
  return context;
};
