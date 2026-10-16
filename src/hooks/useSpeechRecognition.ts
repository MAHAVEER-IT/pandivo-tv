import { useState, useRef, useCallback, useEffect } from 'react';
import { NativeModules, NativeEventEmitter, Platform, PermissionsAndroid } from 'react-native';
import { classifySpeechError, AIDJErrorInfo } from '../services/aiDjErrorService';

const { SpeechRecognition } = NativeModules;
const speechEventEmitter = SpeechRecognition ? new NativeEventEmitter(SpeechRecognition) : null;

export interface UseSpeechRecognitionProps {
  onVoiceCommand: (text: string) => void;
  onSpeechFailure: (reason: 'no_speech' | 'not_recognized' | 'mic_error') => void;
  onPlaylistVoiceResult?: (text: string) => void;
  onPlaylistVoiceFallback?: () => void;
  onSearchVoiceStart?: () => void;
  onSearchVoicePartial?: (text: string) => void;
  onSearchVoiceResult?: (text: string) => void;
  onSearchVoiceError?: () => void;
  isPlaylistActive: () => boolean;
  isSearchActive: () => boolean;
  isAiDjActive: () => boolean;
  pausePlayback?: () => void;
  resumePlayback?: () => void;
}

export function useSpeechRecognition({
  onVoiceCommand,
  onSpeechFailure,
  onPlaylistVoiceResult,
  onPlaylistVoiceFallback,
  onSearchVoiceStart,
  onSearchVoicePartial,
  onSearchVoiceResult,
  onSearchVoiceError,
  isPlaylistActive,
  isSearchActive,
  isAiDjActive,
  pausePlayback,
  resumePlayback,
}: UseSpeechRecognitionProps) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const isListeningRef = useRef<boolean>(false);
  isListeningRef.current = isListening;

  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceToast, setVoiceToast] = useState<string | null>(null);

  const speechFallbackTimerRef = useRef<any>(null);

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

  const handleToggleVoice = useCallback(async () => {
    if (isListeningRef.current) {
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
      resumePlayback?.();
      return;
    }

    const hasPerm = await ensureMicrophonePermission();
    if (!hasPerm) {
      setVoiceToast('⚠️ Microphone permission not granted');
      setTimeout(() => setVoiceToast(null), 3000);
      return;
    }

    pausePlayback?.();
    setIsListening(true);
    isListeningRef.current = true;
    setVoiceTranscript('');
    setVoiceToast('Listening... Speak your mood or request');

    // Safety fallback timer for emulator environments (12s to give native recording and model ample time)
    if (speechFallbackTimerRef.current) {
      clearTimeout(speechFallbackTimerRef.current);
    }
    speechFallbackTimerRef.current = setTimeout(() => {
      if (isListeningRef.current && isAiDjActive()) {
        console.log('[useSpeechRecognition] Timeout reached without native speech, triggering failure fallback.');
        onSpeechFailure('no_speech');
      }
    }, 12000);

    try {
      await SpeechRecognition?.startListening?.();
    } catch (err) {
      console.warn('SpeechRecognition startListening error:', err);
      if (isListeningRef.current && isAiDjActive()) {
        onSpeechFailure('mic_error');
      }
    }
  }, [
    ensureMicrophonePermission,
    pausePlayback,
    resumePlayback,
    isAiDjActive,
    onSpeechFailure,
  ]);

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
    resumePlayback?.();
  }, [resumePlayback]);

  // Event listener setup
  useEffect(() => {
    if (!speechEventEmitter) return;

    const subStart = speechEventEmitter.addListener('onSpeechStart', () => {
      if (isPlaylistActive()) {
        setVoiceToast('🎙️ Listening... Speak song title');
      } else if (isSearchActive()) {
        onSearchVoiceStart?.();
      } else {
        setIsListening(true);
        setVoiceToast('Listening... Speak your mood or request');
      }
    });

    const subPartial = speechEventEmitter.addListener('onSpeechPartialResults', (data: any) => {
      const partialText = data?.text || '';
      if (isPlaylistActive() && partialText.trim().length > 0) {
        if (speechFallbackTimerRef.current) {
          clearTimeout(speechFallbackTimerRef.current);
          speechFallbackTimerRef.current = null;
        }
      } else if (isSearchActive()) {
        onSearchVoicePartial?.(partialText);
      }
    });

    const subResults = speechEventEmitter.addListener('onSpeechResults', (data: any) => {
      const text = (data?.text || '').trim();
      if (speechFallbackTimerRef.current) {
        clearTimeout(speechFallbackTimerRef.current);
        speechFallbackTimerRef.current = null;
      }

      if (isPlaylistActive()) {
        if (text.length > 0) {
          onPlaylistVoiceResult?.(text);
        } else {
          onPlaylistVoiceFallback?.();
        }
        return;
      }

      if (isSearchActive()) {
        onSearchVoiceResult?.(text);
        return;
      }

      setIsListening(false);
      isListeningRef.current = false;
      if (text.length > 0) {
        setVoiceTranscript(text);
        setVoiceToast(`" ${text} "`);
        onVoiceCommand(text);
      } else {
        onSpeechFailure('no_speech');
      }
    });

    const subError = speechEventEmitter.addListener('onSpeechError', (data: any) => {
      if (speechFallbackTimerRef.current) {
        clearTimeout(speechFallbackTimerRef.current);
        speechFallbackTimerRef.current = null;
      }

      if (isPlaylistActive()) {
        onPlaylistVoiceFallback?.();
        return;
      }

      if (isSearchActive()) {
        onSearchVoiceError?.();
        return;
      }

      if (isListeningRef.current && isAiDjActive()) {
        const errorCode = data?.errorCode;
        if (errorCode === 6) {
          onSpeechFailure('no_speech');
        } else if (errorCode === 7) {
          onSpeechFailure('not_recognized');
        } else {
          onSpeechFailure('mic_error');
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
  }, [
    isPlaylistActive,
    isSearchActive,
    isAiDjActive,
    onVoiceCommand,
    onSpeechFailure,
    onPlaylistVoiceResult,
    onPlaylistVoiceFallback,
    onSearchVoiceStart,
    onSearchVoicePartial,
    onSearchVoiceResult,
    onSearchVoiceError,
  ]);

  return {
    isListening,
    setIsListening,
    isListeningRef,
    voiceTranscript,
    setVoiceTranscript,
    voiceToast,
    setVoiceToast,
    ensureMicrophonePermission,
    handleToggleVoice,
    handleCancelVoiceListening,
    speechFallbackTimerRef,
  };
}
