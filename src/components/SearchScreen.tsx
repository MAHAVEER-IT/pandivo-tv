import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Animated,
  NativeModules,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { PlaylistTrack } from '../data/playlistData';
import { searchRankedTracks, SearchResultItem } from '../data/searchCatalog';
import {
  SEARCH_FOCUS_IDS,
  KEYBOARD_ROWS,
  DPadDirection,
  getSearchNextFocus,
} from '../navigation/searchNavGraph';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getRecentSearches,
  recordSearch,
  clearSearchHistory,
  ensureDefaultSearchHistoryCleaned,
} from '../database';

const { SpeechRecognition } = NativeModules;

// Letter-by-letter blue-to-purple gradient for "SONGS" matching reference image 1
const SONGS_GRADIENT_LETTERS = [
  { char: 'S', color: '#0091FF' },
  { char: 'O', color: '#2563EB' },
  { char: 'N', color: '#6366F1' },
  { char: 'G', color: '#8B5CF6' },
  { char: 'S', color: '#D946EF' },
];

// Letter-by-letter blue-to-purple gradient for "SEARCHES" matching reference image 1
const SEARCHES_GRADIENT_LETTERS = [
  { char: 'S', color: '#0091FF' },
  { char: 'E', color: '#2563EB' },
  { char: 'A', color: '#4F46E5' },
  { char: 'R', color: '#6366F1' },
  { char: 'C', color: '#7C3AED' },
  { char: 'H', color: '#A855F7' },
  { char: 'E', color: '#C026D3' },
  { char: 'S', color: '#D946EF' },
];

// Letter-by-letter blue-to-purple gradient for "RESULTS" matching reference image 2 ("RES" navy, "ULTS" gradient)
const RESULTS_GRADIENT_LETTERS = [
  { char: 'U', color: '#0091FF' },
  { char: 'L', color: '#3E4DFE' },
  { char: 'T', color: '#7C3AED' },
  { char: 'S', color: '#C026D3' },
];

export type VoiceStatus = 'idle' | 'listening' | 'success' | 'error';

export interface SearchScreenRef {
  handleSelect: (currentFocusId: string) => void;
  handleBack: () => boolean; // returns true if event was consumed internally
  handleDirection: (direction: DPadDirection, currentFocusId: string) => string | null;
  startVoiceSearch: () => void;
  handleVoiceStart: () => void;
  handleVoicePartialResult: (text: string) => void;
  handleVoiceResult: (text: string) => void;
  handleVoiceError: (err?: any) => void;
}

export interface SearchScreenProps {
  focusedId: string;
  setFocusedId: (id: string) => void;
  onBackToHome: () => void;
  onPlayTrack: (track: PlaylistTrack) => void;
  onTogglePlayPause?: () => void;
  currentPlayingTrackId?: string;
  isPlaying?: boolean;
  songFavoriteMap?: Record<string, boolean>;
  onToggleSongFavorite?: (trackId: string) => void;
  onSubScreenChange?: (subScreen: 'landing' | 'results') => void;
  onVoiceStateChange?: (isListening: boolean) => void;
}


export const SearchScreen = forwardRef<SearchScreenRef, SearchScreenProps>(
  (
    {
      focusedId,
      setFocusedId,
      onBackToHome,
      onPlayTrack,
      onTogglePlayPause,
      currentPlayingTrackId,
      isPlaying,
      songFavoriteMap,
      onToggleSongFavorite,
      onSubScreenChange,
      onVoiceStateChange,
    },
    ref
  ) => {
    // Screen sub-state: 'landing' or 'results'
    const [subScreen, setSubScreen] = useState<'landing' | 'results'>('landing');

    // Notify parent App when subScreen transitions between landing and results
    useEffect(() => {
      onSubScreenChange?.(subScreen);
    }, [subScreen, onSubScreenChange]);

    const [query, setQuery] = useState<string>('');
    const [history, setHistory] = useState<string[]>([]);

    // Hydrate search history from SQLite database on mount
    useEffect(() => {
      let isMounted = true;
      (async () => {
        try {
          await ensureDefaultSearchHistoryCleaned();
          const recent = await getRecentSearches(5);
          if (isMounted) {
            setHistory(recent);
          }
        } catch (err) {
          console.error('[SearchScreen] Failed to load search history from DB:', err);
        }
      })();
      return () => {
        isMounted = false;
      };
    }, []);
    const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);
    const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle');
    const [voiceText, setVoiceText] = useState<string>('Listening…');
    const [voiceErrorTitle, setVoiceErrorTitle] = useState<string>('');
    const [voiceErrorSubtitle, setVoiceErrorSubtitle] = useState<string>('');

    // Blinking cursor state
    const [caretVisible, setCaretVisible] = useState<boolean>(true);
    useEffect(() => {
      const t = setInterval(() => setCaretVisible((v) => !v), 600);
      return () => clearInterval(t);
    }, []);

    // Pulsing sound wave animation for voice overlay
    const waveAnim1 = useRef(new Animated.Value(12)).current;
    const waveAnim2 = useRef(new Animated.Value(24)).current;
    const waveAnim3 = useRef(new Animated.Value(36)).current;
    const waveAnim4 = useRef(new Animated.Value(20)).current;
    const waveAnim5 = useRef(new Animated.Value(42)).current;
    const waveAnim6 = useRef(new Animated.Value(28)).current;
    const waveAnim7 = useRef(new Animated.Value(16)).current;

    useEffect(() => {
      if (!isVoiceOpen) return;
      const createLoop = (anim: Animated.Value, minVal: number, maxVal: number, dur: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: maxVal,
              duration: dur,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: minVal,
              duration: dur,
              useNativeDriver: false,
            }),
          ])
        );
      };

      const l1 = createLoop(waveAnim1, 10, 46, 320);
      const l2 = createLoop(waveAnim2, 14, 50, 420);
      const l3 = createLoop(waveAnim3, 10, 48, 280);
      const l4 = createLoop(waveAnim4, 16, 52, 380);
      const l5 = createLoop(waveAnim5, 12, 46, 450);
      const l6 = createLoop(waveAnim6, 14, 48, 310);
      const l7 = createLoop(waveAnim7, 10, 44, 390);

      l1.start();
      l2.start();
      l3.start();
      l4.start();
      l5.start();
      l6.start();
      l7.start();

      return () => {
        l1.stop();
        l2.stop();
        l3.stop();
        l4.stop();
        l5.stop();
        l6.stop();
        l7.stop();
      };
    }, [isVoiceOpen]);

    // Ranked results computation
    const rankedResults = useMemo<SearchResultItem[]>(() => {
      if (!query.trim()) return [];
      return searchRankedTracks(query);
    }, [query]);

    // Suggestions for right pane (top 4 matches)
    const suggestions = useMemo<SearchResultItem[]>(() => {
      return rankedResults.slice(0, 4);
    }, [rankedResults]);

    // Active state refs for imperative D-pad navigation handlers (prevents stale closures)
    const subScreenRef = useRef(subScreen);
    subScreenRef.current = subScreen;
    const queryRef = useRef(query);
    queryRef.current = query;
    const historyRef = useRef(history);
    historyRef.current = history;
    const isVoiceOpenRef = useRef(isVoiceOpen);
    isVoiceOpenRef.current = isVoiceOpen;
    const voiceStatusRef = useRef(voiceStatus);
    voiceStatusRef.current = voiceStatus;
    const rankedResultsRef = useRef(rankedResults);
    rankedResultsRef.current = rankedResults;
    const suggestionsRef = useRef(suggestions);
    suggestionsRef.current = suggestions;
    const onTogglePlayPauseRef = useRef(onTogglePlayPause);
    onTogglePlayPauseRef.current = onTogglePlayPause;
    const onPlayTrackRef = useRef(onPlayTrack);
    onPlayTrackRef.current = onPlayTrack;
    const currentPlayingTrackIdRef = useRef(currentPlayingTrackId);
    currentPlayingTrackIdRef.current = currentPlayingTrackId;
    const isPlayingRef = useRef(isPlaying);
    isPlayingRef.current = isPlaying;
    const songFavoriteMapRef = useRef(songFavoriteMap);
    songFavoriteMapRef.current = songFavoriteMap;
    const onToggleSongFavoriteRef = useRef(onToggleSongFavorite);
    onToggleSongFavoriteRef.current = onToggleSongFavorite;

    // Results list scroll ref
    const resultsScrollRef = useRef<ScrollView>(null);

    // Card geometry constants for exact TV list scroll alignment
    const RESULT_CARD_HEIGHT = 82;
    const RESULT_CARD_GAP = 10;
    const RESULT_ITEM_PITCH = RESULT_CARD_HEIGHT + RESULT_CARD_GAP; // 92px exactly

    // Auto-scroll results list when card or like focus changes
    useEffect(() => {
      if (subScreen === 'results') {
        if (
          focusedId.startsWith(SEARCH_FOCUS_IDS.RES_CARD_PREFIX) ||
          focusedId.startsWith(SEARCH_FOCUS_IDS.RES_LIKE_PREFIX)
        ) {
          const idx = parseInt(
            focusedId
              .replace(SEARCH_FOCUS_IDS.RES_CARD_PREFIX, '')
              .replace(SEARCH_FOCUS_IDS.RES_LIKE_PREFIX, ''),
            10
          );
          if (!isNaN(idx) && resultsScrollRef.current) {
            // Keep 1 card visible above the focused card for context; cards 0 and 1 stay at top (y = 0)
            const targetY = Math.max(0, (idx - 1) * RESULT_ITEM_PITCH);
            resultsScrollRef.current.scrollTo({ y: targetY, animated: true });
          }
        } else if (
          focusedId === SEARCH_FOCUS_IDS.RES_BACK ||
          focusedId === SEARCH_FOCUS_IDS.RES_VOICE ||
          focusedId === SEARCH_FOCUS_IDS.RES_EDIT
        ) {
          resultsScrollRef.current?.scrollTo({ y: 0, animated: true });
        }
      }
    }, [focusedId, subScreen]);

    // Save query to history (most recent 5, deduplicated and bubbled to top)
    const saveToHistory = (term: string) => {
      const clean = term.trim().toLowerCase();
      if (!clean) return;
      setHistory((prev) => {
        const filtered = prev.filter((h) => h.toLowerCase() !== clean);
        return [clean, ...filtered].slice(0, 5);
      });
      // Persist to SQLite in background
      recordSearch(clean).catch((err) => {
        console.error('[SearchScreen] Failed to save search history to SQLite:', err);
      });
    };

    // Perform search submission
    const executeSearch = (targetQuery?: string) => {
      const q = (targetQuery !== undefined ? targetQuery : queryRef.current).trim();
      if (!q) return;
      setQuery(q);
      saveToHistory(q);
      setSubScreen('results');
      setFocusedId('RES_CARD_0');
    };

    // Typing actions
    const handleKeyType = (char: string) => {
      setQuery((prev) => prev + char.toLowerCase());
    };

    const handleKeyDelete = () => {
      setQuery((prev) => prev.slice(0, -1));
    };

    const handleKeySpace = () => {
      setQuery((prev) => prev + ' ');
    };

    const handleClearHistory = () => {
      setHistory([]);
      clearSearchHistory().catch((err) => {
        console.error('[SearchScreen] Failed to clear search history from SQLite:', err);
      });
      setFocusedId(SEARCH_FOCUS_IDS.KEY_A);
    };

    // Voice search state & timer refs
    const speechTimeoutTimerRef = useRef<any>(null);
    const transitionTimerRef = useRef<any>(null);
    const isListeningVoiceRef = useRef(false);

    // Permission check for Android audio recording
    const ensureMicrophonePermission = async (): Promise<boolean> => {
      if (Platform.OS !== 'android') return true;
      try {
        const has = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        if (has) return true;
        const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
          title: 'Microphone Permission',
          message: 'Fire TV Music needs microphone access to search songs by voice.',
          buttonPositive: 'Allow',
        });
        return res === PermissionsAndroid.RESULTS.GRANTED;
      } catch (e) {
        console.warn('Microphone permission request failed:', e);
        return false;
      }
    };

    const handleVoiceFailure = (
      reason: 'no_speech' | 'not_recognized' | 'empty' | 'mic_permission' | 'mic_error'
    ) => {
      if (speechTimeoutTimerRef.current) {
        clearTimeout(speechTimeoutTimerRef.current);
        speechTimeoutTimerRef.current = null;
      }
      isListeningVoiceRef.current = false;
      onVoiceStateChange?.(false);
      try {
        SpeechRecognition?.stopListening?.();
      } catch (_e) {}

      setVoiceStatus('error');
      if (reason === 'no_speech') {
        setVoiceErrorTitle("We couldn't hear you");
        setVoiceErrorSubtitle('Please try speaking again, or type your search.');
      } else if (reason === 'not_recognized' || reason === 'empty') {
        setVoiceErrorTitle("Couldn't recognize speech");
        setVoiceErrorSubtitle('Try again and say a song title, artist, or lyric.');
      } else if (reason === 'mic_permission') {
        setVoiceErrorTitle('Microphone permission required');
        setVoiceErrorSubtitle('Allow microphone access in settings to search by voice.');
      } else {
        setVoiceErrorTitle('Voice search unavailable');
        setVoiceErrorSubtitle('Something went wrong with voice input. Please try again.');
      }
      setFocusedId(SEARCH_FOCUS_IDS.VOICE_TRY_AGAIN);
    };

    const cancelVoiceSearch = () => {
      if (speechTimeoutTimerRef.current) {
        clearTimeout(speechTimeoutTimerRef.current);
        speechTimeoutTimerRef.current = null;
      }
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      isListeningVoiceRef.current = false;
      onVoiceStateChange?.(false);
      try {
        SpeechRecognition?.stopListening?.();
      } catch (_e) {}

      setIsVoiceOpen(false);
      setVoiceStatus('idle');
      if (subScreenRef.current === 'results') {
        setFocusedId(SEARCH_FOCUS_IDS.RES_VOICE);
      } else {
        setFocusedId(SEARCH_FOCUS_IDS.VOICE);
      }
    };

    const startVoiceSearch = async () => {
      if (speechTimeoutTimerRef.current) {
        clearTimeout(speechTimeoutTimerRef.current);
        speechTimeoutTimerRef.current = null;
      }
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      try {
        SpeechRecognition?.stopListening?.();
      } catch (_e) {}

      setIsVoiceOpen(true);
      setVoiceStatus('listening');
      setVoiceText('Listening…');
      setVoiceErrorTitle('');
      setVoiceErrorSubtitle('');
      setFocusedId(SEARCH_FOCUS_IDS.VOICE_CANCEL);
      isListeningVoiceRef.current = true;
      onVoiceStateChange?.(true);

      // 8s safety timeout in case no speech detected or speech engine times out silently
      speechTimeoutTimerRef.current = setTimeout(() => {
        if (isListeningVoiceRef.current) {
          handleVoiceFailure('no_speech');
        }
      }, 8000);

      const hasPerm = await ensureMicrophonePermission();
      if (!hasPerm) {
        console.warn('Microphone permission not granted for search');
        handleVoiceFailure('mic_permission');
        return;
      }

      try {
        await SpeechRecognition?.startListening?.();
      } catch (err) {
        console.warn('SpeechRecognition startListening error in search:', err);
        handleVoiceFailure('mic_error');
      }
    };

    const retryVoiceSearch = () => {
      startVoiceSearch();
    };

    const handleVoiceStart = () => {
      if (!isListeningVoiceRef.current) return;
      setVoiceStatus('listening');
      setVoiceText('Listening…');
    };

    const handleVoicePartialResult = (partialText: string) => {
      if (!isListeningVoiceRef.current) return;
      if (partialText && partialText.trim().length > 0) {
        // Reset timeout while user is actively speaking
        if (speechTimeoutTimerRef.current) {
          clearTimeout(speechTimeoutTimerRef.current);
        }
        speechTimeoutTimerRef.current = setTimeout(() => {
          if (isListeningVoiceRef.current) {
            handleVoiceFailure('not_recognized');
          }
        }, 6000);
        setVoiceText(`“${partialText.trim()}”`);
      }
    };

    const handleVoiceResult = (text: string) => {
      if (!isListeningVoiceRef.current) return;
      if (speechTimeoutTimerRef.current) {
        clearTimeout(speechTimeoutTimerRef.current);
        speechTimeoutTimerRef.current = null;
      }

      const cleanText = (text || '').trim();
      if (cleanText.length > 0) {
        isListeningVoiceRef.current = false;
        onVoiceStateChange?.(false);
        try {
          SpeechRecognition?.stopListening?.();
        } catch (_e) {}

        setVoiceStatus('success');
        setVoiceText(`“${cleanText}”`);

        if (transitionTimerRef.current) {
          clearTimeout(transitionTimerRef.current);
        }
        transitionTimerRef.current = setTimeout(() => {
          setIsVoiceOpen(false);
          setVoiceStatus('idle');
          setQuery(cleanText);
          saveToHistory(cleanText);
          setSubScreen('results');
          setFocusedId('RES_CARD_0');
        }, 500);
      } else {
        handleVoiceFailure('empty');
      }
    };

    const handleVoiceError = (err?: any) => {
      if (!isListeningVoiceRef.current) return;
      const code = err?.errorCode;
      if (code === 6) {
        handleVoiceFailure('no_speech');
      } else if (code === 7) {
        handleVoiceFailure('not_recognized');
      } else if (code === 9) {
        handleVoiceFailure('mic_permission');
      } else {
        handleVoiceFailure('mic_error');
      }
    };

    // Clean up timers & speech listener on unmount
    useEffect(() => {
      return () => {
        if (speechTimeoutTimerRef.current) {
          clearTimeout(speechTimeoutTimerRef.current);
        }
        if (transitionTimerRef.current) {
          clearTimeout(transitionTimerRef.current);
        }
        try {
          SpeechRecognition?.stopListening?.();
        } catch (_e) {}
        onVoiceStateChange?.(false);
      };
    }, []);

    // Imperative ref implementation for external D-pad router & voice coordination
    useImperativeHandle(ref, () => ({
      startVoiceSearch,
      handleVoiceStart,
      handleVoicePartialResult,
      handleVoiceResult,
      handleVoiceError,
      handleSelect: (focusId: string) => {
        // 1. Voice overlay buttons
        if (isVoiceOpenRef.current) {
          if (focusId === SEARCH_FOCUS_IDS.VOICE_BACK || focusId === SEARCH_FOCUS_IDS.VOICE_CANCEL) {
            cancelVoiceSearch();
          } else if (focusId === SEARCH_FOCUS_IDS.VOICE_TRY_AGAIN) {
            retryVoiceSearch();
          }
          return;
        }

        // 2. Results Screen
        if (subScreenRef.current === 'results') {
          if (focusId === SEARCH_FOCUS_IDS.RES_BACK) {
            setSubScreen('landing');
            setFocusedId(SEARCH_FOCUS_IDS.KEY_SEARCH);
            return;
          }
          if (focusId === SEARCH_FOCUS_IDS.RES_VOICE) {
            startVoiceSearch();
            return;
          }
          if (focusId === SEARCH_FOCUS_IDS.RES_EDIT) {
            setSubScreen('landing');
            setFocusedId(SEARCH_FOCUS_IDS.KEY_A);
            return;
          }
          if (focusId.startsWith(SEARCH_FOCUS_IDS.RES_CARD_PREFIX)) {
            const idx = parseInt(focusId.replace(SEARCH_FOCUS_IDS.RES_CARD_PREFIX, ''), 10);
            const activeResults = rankedResultsRef.current;
            if (!isNaN(idx) && activeResults[idx]) {
              const targetTrack = activeResults[idx].track;
              if (currentPlayingTrackIdRef.current === targetTrack.id) {
                onTogglePlayPauseRef.current?.();
              } else {
                onPlayTrackRef.current?.(targetTrack);
              }
            }
            return;
          }
          if (focusId.startsWith(SEARCH_FOCUS_IDS.RES_LIKE_PREFIX)) {
            const idx = parseInt(focusId.replace(SEARCH_FOCUS_IDS.RES_LIKE_PREFIX, ''), 10);
            const activeResults = rankedResultsRef.current;
            if (!isNaN(idx) && activeResults[idx]) {
              onToggleSongFavoriteRef.current?.(activeResults[idx].track.id);
            }
            return;
          }
          return;
        }

        // 3. Landing Screen
        if (focusId === SEARCH_FOCUS_IDS.BACK) {
          if (queryRef.current) {
            setQuery('');
            setFocusedId(SEARCH_FOCUS_IDS.KEY_A);
          } else {
            onBackToHome();
          }
          return;
        }
        if (focusId === SEARCH_FOCUS_IDS.VOICE) {
          startVoiceSearch();
          return;
        }
        if (focusId.startsWith('KEY_')) {
          if (focusId === SEARCH_FOCUS_IDS.KEY_SPACE) {
            handleKeySpace();
          } else if (focusId === SEARCH_FOCUS_IDS.KEY_DEL) {
            handleKeyDelete();
          } else if (focusId === SEARCH_FOCUS_IDS.KEY_SEARCH) {
            executeSearch();
          } else {
            const char = focusId.replace('KEY_', '');
            handleKeyType(char);
          }
          return;
        }


        // Right panel: History
        if (focusId.startsWith('SRC_HIST_') && focusId !== SEARCH_FOCUS_IDS.HIST_CLEAR) {
          const idx = parseInt(focusId.replace('SRC_HIST_', ''), 10);
          const activeHist = historyRef.current;
          if (!isNaN(idx) && activeHist[idx]) {
            executeSearch(activeHist[idx]);
          }
          return;
        }
        if (focusId === SEARCH_FOCUS_IDS.HIST_CLEAR) {
          handleClearHistory();
          return;
        }

        // Right panel: Suggestions
        if (focusId.startsWith('SRC_SUG_') && focusId !== SEARCH_FOCUS_IDS.SUG_ALL) {
          const idx = parseInt(focusId.replace('SRC_SUG_', ''), 10);
          const activeSugs = suggestionsRef.current;
          if (!isNaN(idx) && activeSugs[idx]) {
            executeSearch(activeSugs[idx].track.title);
          }
          return;
        }
        if (focusId === SEARCH_FOCUS_IDS.SUG_ALL) {
          executeSearch();
          return;
        }
      },

      handleBack: () => {
        if (isVoiceOpenRef.current) {
          cancelVoiceSearch();
          return true;
        }
        if (subScreenRef.current === 'results') {
          setSubScreen('landing');
          setFocusedId(SEARCH_FOCUS_IDS.KEY_SEARCH);
          return true;
        }
        if (queryRef.current) {
          setQuery('');
          setFocusedId(SEARCH_FOCUS_IDS.KEY_A);
          return true;
        }
        // Landing with empty query: allow bubble to exit to Home
        return false;
      },

      handleDirection: (dir: DPadDirection, currentFocus: string) => {
        return getSearchNextFocus(currentFocus, dir, {
          subScreen: subScreenRef.current,
          isVoiceOpen: isVoiceOpenRef.current,
          voiceStatus: voiceStatusRef.current,
          hasQuery: !!queryRef.current.trim(),
          historyCount: historyRef.current.length,
          suggestionsCount: suggestionsRef.current.length,
          resultsCount: rankedResultsRef.current.length,
        });
      },
    }));

    // Highlight matching letters in suggestions
    const renderHighlightedTitle = (title: string, q: string) => {
      if (!q.trim()) return <Text style={styles.suggestionTitleText} numberOfLines={1}>{title}</Text>;
      const lowerTitle = title.toLowerCase();
      const lowerQ = q.toLowerCase();
      const idx = lowerTitle.indexOf(lowerQ);

      if (idx < 0) {
        return <Text style={styles.suggestionTitleText} numberOfLines={1}>{title}</Text>;
      }

      const before = title.slice(0, idx);
      const match = title.slice(idx, idx + q.length);
      const after = title.slice(idx + q.length);

      return (
        <Text style={styles.suggestionTitleText} numberOfLines={1}>
          {before}
          <Text style={styles.highlightedMatchText}>{match}</Text>
          {after}
        </Text>
      );
    };

    return (
      <View style={styles.container}>
        {/* =========================================================================
            SCREEN 1: SEARCH LANDING
            ========================================================================= */}
        {subScreen === 'landing' && (
          <View style={styles.screenInner}>
            {/* Top Bar */}
            <View style={styles.topBar}>
              <Pressable
                focusable={false}
                onPress={onBackToHome}
                style={[
                  styles.backBtn,
                  focusedId === SEARCH_FOCUS_IDS.BACK && styles.btnFocused,
                ]}
              >
                <Text style={styles.backBtnText}>◀ Back</Text>
              </Pressable>
              <View style={styles.headerTitleCol}>
                <Text style={styles.screenTitle}>
                  SEARCH{' '}
                  {SONGS_GRADIENT_LETTERS.map((item, idx) => (
                    <Text key={idx} style={{ color: item.color }}>
                      {item.char}
                    </Text>
                  ))}
                </Text>
                <Text style={styles.screenSubtitle}>
                  Find your favorite songs, artists, albums and more.
                </Text>
              </View>
            </View>

            {/* 2-Column Split Content */}
            <View style={styles.colsContainer}>
              {/* LEFT COLUMN: Input Bar + Voice Button + 7-Column Keyboard */}
              <View style={styles.leftCol}>
                {/* Search Input Field with Embedded Voice Button */}
                <View style={styles.inputBox}>
                  <MaterialCommunityIcons
                    name="magnify"
                    size={24}
                    color="#6366F1"
                    style={styles.searchIcon}
                  />
                  <View style={styles.inputContentArea}>
                    {query ? (
                      <Text style={styles.inputText}>
                        {query}
                        {caretVisible ? <Text style={styles.caret}>|</Text> : <Text style={[styles.caret, { opacity: 0 }]}>|</Text>}
                      </Text>
                    ) : (
                      <Text style={styles.placeholderText}>
                        {caretVisible ? <Text style={styles.caret}>|</Text> : <Text style={[styles.caret, { opacity: 0 }]}>|</Text>}
                        Type or speak a song, artist…
                      </Text>
                    )}
                  </View>

                  {/* Round Voice Button embedded inside the search field */}
                  <Pressable
                    focusable={false}
                    onPress={startVoiceSearch}
                    style={[
                      styles.voiceEmbeddedBtn,
                      focusedId === SEARCH_FOCUS_IDS.VOICE && styles.voiceEmbeddedBtnFocused,
                    ]}
                  >
                    <Image
                      source={require('../../assets/ui/icon_mic_custom.png')}
                      style={styles.voiceCustomMicIcon}
                      resizeMode="contain"
                    />
                    <Text
                      style={[
                        styles.voiceEmbeddedLabel,
                        focusedId === SEARCH_FOCUS_IDS.VOICE && styles.voiceEmbeddedLabelFocused,
                      ]}
                    >
                      Voice
                    </Text>
                  </Pressable>
                </View>

                {/* 7-Column On-Screen TV Keyboard Card */}
                <View style={styles.keyboardCard}>
                  {/* Rows 1–5: A-Z and 1-9 */}
                  {KEYBOARD_ROWS.map((row, rIdx) => (
                    <View key={`row_${rIdx}`} style={styles.keyboardRow}>
                      {row.map((keyId) => {
                        const char = keyId.replace('KEY_', '');
                        const isKeyFocused = focusedId === keyId;
                        return (
                          <Pressable
                            key={keyId}
                            focusable={false}
                            onPress={() => handleKeyType(char)}
                            style={[
                              styles.keyBtn,
                              isKeyFocused && styles.keyBtnFocused,
                            ]}
                          >
                            <Text
                              style={[
                                styles.keyBtnText,
                                isKeyFocused && styles.keyBtnTextFocused,
                              ]}
                            >
                              {char}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ))}

                  {/* Row 6: 0 (1 col), SPACE (span 2), DEL (span 2), SEARCH (span 2) */}
                  <View style={styles.keyboardRow}>
                    {/* KEY_0 */}
                    <Pressable
                      focusable={false}
                      onPress={() => handleKeyType('0')}
                      style={[
                        styles.keyBtn,
                        focusedId === SEARCH_FOCUS_IDS.KEY_0 && styles.keyBtnFocused,
                      ]}
                    >
                      <Text
                        style={[
                          styles.keyBtnText,
                          focusedId === SEARCH_FOCUS_IDS.KEY_0 && styles.keyBtnTextFocused,
                        ]}
                      >
                        0
                      </Text>
                    </Pressable>

                    {/* SPACE (span 2 cols width) */}
                    <Pressable
                      focusable={false}
                      onPress={handleKeySpace}
                      style={[
                        styles.keyBtnWide,
                        { flex: 2 },
                        focusedId === SEARCH_FOCUS_IDS.KEY_SPACE && styles.keyBtnFocused,
                      ]}
                    >
                      <Text
                        style={[
                          styles.keyBtnWideText,
                          focusedId === SEARCH_FOCUS_IDS.KEY_SPACE && styles.keyBtnTextFocused,
                        ]}
                      >
                        SPACE
                      </Text>
                    </Pressable>

                    {/* DEL (span 2 cols width) */}
                    <Pressable
                      focusable={false}
                      onPress={handleKeyDelete}
                      style={[
                        styles.keyBtnWide,
                        { flex: 2 },
                        focusedId === SEARCH_FOCUS_IDS.KEY_DEL && styles.keyBtnFocused,
                      ]}
                    >
                      <Text
                        style={[
                          styles.keyBtnWideText,
                          focusedId === SEARCH_FOCUS_IDS.KEY_DEL && styles.keyBtnTextFocused,
                        ]}
                      >
                        ⌫ DEL
                      </Text>
                    </Pressable>

                    {/* SEARCH ▶ (span 2 cols width) */}
                    <Pressable
                      focusable={false}
                      onPress={() => executeSearch()}
                      style={[
                        styles.keyBtnSearch,
                        { flex: 2 },
                        focusedId === SEARCH_FOCUS_IDS.KEY_SEARCH && styles.keyBtnSearchFocused,
                      ]}
                    >
                      <Text style={styles.keyBtnSearchText}>SEARCH ▶</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* RIGHT COLUMN: Dynamic Pane in Translucent Card */}
              <View style={styles.rightCol}>
                {!query ? (
                  /* STATE 1: Empty Query -> Recent Searches */
                  <View style={styles.recentSearchesCard}>
                    <View style={styles.recentHeaderRow}>
                      <View style={styles.recentHeaderIconBox}>
                        <MaterialCommunityIcons name="history" size={20} color="#6366F1" />
                      </View>
                      <Text style={styles.recentHeaderTitle}>
                        RECENT{' '}
                        {SEARCHES_GRADIENT_LETTERS.map((item, idx) => (
                          <Text key={idx} style={{ color: item.color }}>
                            {item.char}
                          </Text>
                        ))}
                      </Text>
                    </View>
                    {history.length > 0 ? (
                      <View style={styles.historyList}>
                        {history.map((term, hIdx) => {
                          const histId = `SRC_HIST_${hIdx}`;
                          const isHistFocused = focusedId === histId;
                          return (
                            <Pressable
                              key={`hist_${hIdx}`}
                              focusable={false}
                              onPress={() => executeSearch(term)}
                              style={[
                                styles.historyRow,
                                isHistFocused && styles.rowFocused,
                              ]}
                            >
                              <View style={[styles.historyIconCircle, isHistFocused && styles.historyIconCircleFocused]}>
                                <MaterialCommunityIcons
                                  name="clock-outline"
                                  size={15}
                                  color={isHistFocused ? '#7C3AED' : '#6366F1'}
                                />
                              </View>
                              <Text
                                style={[
                                  styles.historyRowText,
                                  isHistFocused && styles.historyRowTextFocused,
                                ]}
                                numberOfLines={1}
                              >
                                {term}
                              </Text>
                              <Text style={[styles.jumpArrowText, isHistFocused && styles.jumpArrowTextFocused]}>
                                ↗
                              </Text>
                            </Pressable>
                          );
                        })}

                        {/* Clear History Button */}
                        <Pressable
                          focusable={false}
                          onPress={handleClearHistory}
                          style={[
                            styles.clearHistoryRow,
                            focusedId === SEARCH_FOCUS_IDS.HIST_CLEAR && styles.rowFocused,
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="trash-can-outline"
                            size={15}
                            color={focusedId === SEARCH_FOCUS_IDS.HIST_CLEAR ? '#7C3AED' : '#64748B'}
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            style={[
                              styles.clearHistoryText,
                              focusedId === SEARCH_FOCUS_IDS.HIST_CLEAR && styles.clearHistoryTextFocused,
                            ]}
                          >
                            Clear history
                          </Text>
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.emptyHistoryBox}>
                        <View style={styles.emptyHistoryIconCircle}>
                          <MaterialCommunityIcons name="history" size={24} color="#6366F1" />
                        </View>
                        <Text style={styles.emptyHistoryTitle}>No Recent Searches</Text>
                        <Text style={styles.emptyHistorySubtitle}>
                          Searches you perform will appear here for quick access.
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  /* STATE 2: Typing -> Live Suggestions */
                  <View style={styles.recentSearchesCard}>
                    <Text style={styles.sectionHeaderTitle}>
                      SUGGESTIONS FOR “{query.toUpperCase()}”
                    </Text>
                    <View style={styles.suggestionsList}>
                      {suggestions.length > 0 ? (
                        suggestions.map((item, sIdx) => {
                          const sugId = `SRC_SUG_${sIdx}`;
                          const isSugFocused = focusedId === sugId;
                          return (
                            <Pressable
                              key={item.track.id}
                              focusable={false}
                              onPress={() => executeSearch(item.track.title)}
                              style={[
                                styles.suggestionRow,
                                isSugFocused && styles.rowFocused,
                              ]}
                            >
                              <Image
                                source={item.track.artwork}
                                style={styles.suggestionThumb}
                              />
                              <View style={styles.suggestionTextContainer}>
                                {renderHighlightedTitle(item.track.title, query)}
                                <Text style={styles.suggestionArtistText} numberOfLines={1}>
                                  {item.track.artist}
                                </Text>
                              </View>
                              <Text style={styles.jumpArrowText}>↗</Text>
                            </Pressable>
                          );
                        })
                      ) : (
                        <View style={styles.emptyStateBox}>
                          <Text style={styles.emptyStateText}>
                            No guesses yet – keep typing
                          </Text>
                        </View>
                      )}

                      {/* See all results button */}
                      <Pressable
                        focusable={false}
                        onPress={() => executeSearch()}
                        style={[
                          styles.seeAllRow,
                          focusedId === SEARCH_FOCUS_IDS.SUG_ALL && styles.rowFocused,
                        ]}
                      >
                        <Text style={styles.seeAllText}>
                          See all results for “{query}” ▶
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            </View>

          </View>
        )}

        {/* =========================================================================
            SCREEN 2: RESULTS SCREEN
            ========================================================================= */}
        {subScreen === 'results' && (
          <View style={styles.screenInner}>
            {/* Pinned Header Container (Solid background, zIndex to clip scroll under it) */}
            <View style={styles.resultsHeaderContainer}>
              {/* Top Bar */}
              <View style={styles.topBar}>
                <Pressable
                  focusable={false}
                  onPress={() => {
                    setSubScreen('landing');
                    setFocusedId(SEARCH_FOCUS_IDS.KEY_SEARCH);
                  }}
                  style={[
                    styles.backBtn,
                    focusedId === SEARCH_FOCUS_IDS.RES_BACK && styles.btnFocused,
                  ]}
                >
                  <Text style={styles.backBtnText}>◀ Back</Text>
                </Pressable>
                <Text style={styles.screenTitle}>
                  RES
                  {RESULTS_GRADIENT_LETTERS.map((item, idx) => (
                    <Text key={idx} style={{ color: item.color }}>
                      {item.char}
                    </Text>
                  ))}
                </Text>

                {/* Header Right Utility Buttons */}
                <View style={styles.headerRightActions}>
                  <Pressable
                    focusable={false}
                    onPress={startVoiceSearch}
                    style={[
                      styles.headerActionBtn,
                      focusedId === SEARCH_FOCUS_IDS.RES_VOICE && styles.btnFocused,
                    ]}
                  >
                    <View style={styles.headerActionBtnRow}>
                      <Image
                        source={require('../../assets/ui/icon_mic_custom.png')}
                        style={styles.headerActionMicIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.headerActionBtnText}>Voice</Text>
                    </View>
                  </Pressable>

                  <Pressable
                    focusable={false}
                    onPress={() => {
                      setSubScreen('landing');
                      setFocusedId(SEARCH_FOCUS_IDS.KEY_A);
                    }}
                    style={[
                      styles.headerActionBtn,
                      focusedId === SEARCH_FOCUS_IDS.RES_EDIT && styles.btnFocused,
                    ]}
                  >
                    <View style={styles.headerActionBtnRow}>
                      <MaterialCommunityIcons
                        name="keyboard-outline"
                        size={17}
                        color="#0F172A"
                      />
                      <Text style={styles.headerActionBtnText}>Edit</Text>
                    </View>
                  </Pressable>
                </View>
              </View>

              {/* Results Subheader Banner */}
              <Text style={styles.resultsSubheader}>
                {rankedResults.length} songs • best match first • “{query}”
              </Text>
            </View>

            {/* Ranked Song Cards List */}
            <ScrollView
              ref={resultsScrollRef}
              focusable={false}
              showsVerticalScrollIndicator={false}
              style={styles.resultsListScroll}
              contentContainerStyle={styles.resultsListContent}
            >
              {rankedResults.length > 0 ? (
                rankedResults.map((item, idx) => {
                  const cardId = `${SEARCH_FOCUS_IDS.RES_CARD_PREFIX}${idx}`;
                  const likeId = `${SEARCH_FOCUS_IDS.RES_LIKE_PREFIX}${idx}`;
                  const isCardFocused = focusedId === cardId;
                  const isLikeFocused = focusedId === likeId;
                  const isRowActive = isCardFocused || isLikeFocused;
                  const isCurrentPlaying =
                    currentPlayingTrackId === item.track.id && isPlaying;
                  const isLiked = !!(songFavoriteMap && songFavoriteMap[item.track.id]);

                  return (
                    <Pressable
                      key={item.track.id}
                      focusable={false}
                      onPress={() => {
                        if (currentPlayingTrackId === item.track.id) {
                          onTogglePlayPause?.();
                        } else {
                          onPlayTrack(item.track);
                        }
                      }}
                      style={[
                        styles.resultCard,
                        isRowActive && styles.resultCardActive,
                        isCardFocused && styles.resultCardFocused,
                      ]}
                    >
                      {/* Rank Badge */}
                      <View style={[styles.rankBadge, isRowActive && styles.rankBadgeActive]}>
                        <Text
                          style={[
                            styles.rankNumber,
                            isRowActive && styles.rankNumberFocused,
                          ]}
                        >
                          {idx + 1}
                        </Text>
                      </View>

                      {/* Artwork Thumbnail */}
                      <Image
                        source={item.track.artwork}
                        style={styles.resultArtwork}
                        resizeMode="cover"
                      />

                      {/* Track Info */}
                      <View style={styles.resultInfo}>
                        <Text
                          style={[
                            styles.resultTitle,
                            isRowActive && styles.resultTitleFocused,
                          ]}
                          numberOfLines={1}
                        >
                          {item.track.title}
                        </Text>
                        <Text style={styles.resultArtist} numberOfLines={1}>
                          {item.track.artist}
                        </Text>
                      </View>

                      {/* Right Action Cluster: [Play/Pause Button] [Like Button] */}
                      <View style={styles.cardActionCluster}>
                        {/* Play Button Indicator */}
                        <View
                          style={[
                            styles.resultPlayBtn,
                            isCardFocused && styles.resultPlayBtnCardFocused,
                            isCurrentPlaying && styles.resultPlayBtnActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.resultPlayIcon,
                              (isCardFocused || isCurrentPlaying) && styles.resultPlayIconWhite,
                            ]}
                          >
                            {isCurrentPlaying ? '❚❚' : '▶'}
                          </Text>
                        </View>

                        {/* Like Button */}
                        <Pressable
                          focusable={false}
                          onPress={(e: any) => {
                            e?.stopPropagation?.();
                            onToggleSongFavorite?.(item.track.id);
                          }}
                          style={[
                            styles.resultLikeBtn,
                            isLiked && styles.resultLikeBtnActive,
                            isLikeFocused && styles.resultLikeBtnFocused,
                          ]}
                        >
                          <Image
                            source={
                              isLiked
                                ? require('../../assets/ui/icon_heart_filled.png')
                                : require('../../assets/ui/icon_heart_outline.png')
                            }
                            style={[
                              styles.resultLikeIcon,
                              isLiked && styles.resultLikeIconActive,
                              isLikeFocused && styles.resultLikeIconFocused,
                            ]}
                            resizeMode="contain"
                          />
                        </Pressable>
                      </View>
                    </Pressable>
                  );
                })
              ) : (
                <View style={styles.emptyResultsBox}>
                  <Text style={styles.emptyResultsText}>
                    No results found for “{query}”. Press Back to try another search.
                  </Text>
                </View>
              )}
            </ScrollView>

          </View>
        )}

        {/* =========================================================================
            VOICE TO TEXT OVERLAY
            ========================================================================= */}
        {isVoiceOpen && (
          <View style={styles.voiceOverlayBackdrop}>
            <View style={styles.voiceModalCard}>
              {/* Top-left Back Button */}
              <Pressable
                focusable={false}
                onPress={cancelVoiceSearch}
                style={[
                  styles.voiceBackBtn,
                  focusedId === SEARCH_FOCUS_IDS.VOICE_BACK && styles.btnFocused,
                ]}
              >
                <Text style={styles.backBtnText}>◀ Back</Text>
              </Pressable>

              {voiceStatus === 'error' ? (
                <>
                  {/* Big Error / Warning Icon */}
                  <View style={styles.voiceBigErrorCircle}>
                    <MaterialCommunityIcons
                      name="microphone-off"
                      size={40}
                      color="#E11D48"
                    />
                  </View>

                  {/* Error Title & Subtitle */}
                  <Text style={styles.voiceErrorTitle}>{voiceErrorTitle}</Text>
                  <Text style={styles.voiceErrorSubtitle}>{voiceErrorSubtitle}</Text>

                  {/* Actions Row: [Try Again] [Cancel] */}
                  <View style={styles.voiceActionsRow}>
                    <Pressable
                      focusable={false}
                      onPress={retryVoiceSearch}
                      style={[
                        styles.voicePrimaryBtn,
                        focusedId === SEARCH_FOCUS_IDS.VOICE_TRY_AGAIN && styles.voicePrimaryBtnFocused,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="refresh"
                        size={18}
                        color="#FFFFFF"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.voicePrimaryBtnText}>Try Again</Text>
                    </Pressable>

                    <Pressable
                      focusable={false}
                      onPress={cancelVoiceSearch}
                      style={[
                        styles.voiceSecondaryBtn,
                        focusedId === SEARCH_FOCUS_IDS.VOICE_CANCEL && styles.btnFocused,
                      ]}
                    >
                      <Text style={styles.voiceSecondaryBtnText}>Cancel</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  {/* Big Mic Icon */}
                  <View style={styles.voiceBigMicCircle}>
                    <Image
                      source={require('../../assets/ui/icon_mic_custom.png')}
                      style={styles.voiceBigCustomMicIcon}
                      resizeMode="contain"
                    />
                  </View>

                  {/* Waveform Animation */}
                  {voiceStatus === 'listening' ? (
                    <View style={styles.waveformContainer}>
                      <Animated.View style={[styles.waveBar, { height: waveAnim1 }]} />
                      <Animated.View style={[styles.waveBar, { height: waveAnim2 }]} />
                      <Animated.View style={[styles.waveBar, { height: waveAnim3 }]} />
                      <Animated.View style={[styles.waveBar, { height: waveAnim4 }]} />
                      <Animated.View style={[styles.waveBar, { height: waveAnim5 }]} />
                      <Animated.View style={[styles.waveBar, { height: waveAnim6 }]} />
                      <Animated.View style={[styles.waveBar, { height: waveAnim7 }]} />
                    </View>
                  ) : (
                    <View style={styles.waveformPlaceholder} />
                  )}

                  {/* Status Text & Subtitle */}
                  <Text style={styles.voiceListeningStatus}>{voiceText}</Text>
                  <Text style={styles.voiceInstructionSubtitle}>
                    {voiceStatus === 'success' ? 'Searching songs…' : 'Say a song, artist or lyric'}
                  </Text>

                  {/* Cancel Button */}
                  <Pressable
                    focusable={false}
                    onPress={cancelVoiceSearch}
                    style={[
                      styles.voiceCancelBtn,
                      focusedId === SEARCH_FOCUS_IDS.VOICE_CANCEL && styles.btnFocused,
                    ]}
                  >
                    <Text style={styles.voiceCancelBtnText}>Cancel</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  screenInner: {
    flex: 1,
    paddingTop: 4,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    gap: 16,
    marginBottom: 2,
  },
  backBtn: {
    width: 94,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerTitleCol: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.6,
  },
  screenSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 'auto',
  },
  headerActionBtn: {
    paddingHorizontal: 18,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerActionBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerActionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionMicIcon: {
    width: 16,
    height: 16,
  },

  // Focus Styling (PANDIVO Signature Glow & Border)
  btnFocused: {
    borderColor: '#7C3AED',
    borderWidth: 2.5,
    backgroundColor: '#FAF5FF',
    transform: [{ scale: 1.04 }],
    elevation: 6,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    zIndex: 10,
  },

  // 2-Column Layout
  colsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 20,
    marginTop: 4,
  },
  leftCol: {
    width: 485,
  },
  rightCol: {
    flex: 1,
    minWidth: 0,
  },

  // Search Input Field & Embedded Voice Button
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    paddingLeft: 14,
    paddingRight: 6,
    shadowColor: '#6366F1',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  inputContentArea: {
    flex: 1,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  placeholderText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  caret: {
    fontSize: 16,
    fontWeight: '800',
    color: '#6366F1',
  },
  voiceEmbeddedBtn: {
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  voiceEmbeddedBtnFocused: {
    borderColor: '#7C3AED',
    borderWidth: 2.5,
    backgroundColor: '#FAF5FF',
    transform: [{ scale: 1.05 }],
    shadowColor: '#7C3AED',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  voiceCustomMicIcon: {
    width: 16,
    height: 16,
  },
  voiceEmbeddedLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  voiceEmbeddedLabelFocused: {
    color: '#7C3AED',
    fontWeight: '800',
  },

  // TV Keyboard Card (7 Columns)
  keyboardCard: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    gap: 5,
    shadowColor: '#6366F1',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  keyboardRow: {
    flexDirection: 'row',
    gap: 6,
  },
  keyBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  keyBtnFocused: {
    borderColor: '#6366F1',
    borderWidth: 2,
    backgroundColor: '#6366F1',
    transform: [{ scale: 1.08 }],
    elevation: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    zIndex: 10,
  },
  keyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  keyBtnTextFocused: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  keyBtnWide: {
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  keyBtnWideText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  keyBtnSearch: {
    height: 36,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    borderWidth: 1.5,
    borderColor: '#4338CA',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  keyBtnSearchFocused: {
    backgroundColor: '#7C3AED',
    borderColor: '#C026D3',
    borderWidth: 2.5,
    transform: [{ scale: 1.08 }],
    elevation: 10,
    shadowColor: '#C026D3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    zIndex: 10,
  },
  keyBtnSearchText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Right Column Dynamic Content & Recent Searches Card
  recentSearchesCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#6366F1',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  recentHeaderIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 1.2,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  // Recent Searches List
  historyList: {
    gap: 5,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    gap: 10,
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  rowFocused: {
    borderColor: '#7C3AED',
    borderWidth: 2,
    backgroundColor: '#FAF5FF',
    transform: [{ scale: 1.02 }],
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 10,
  },
  historyIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyIconCircleFocused: {
    backgroundColor: '#FAF5FF',
  },
  historyRowText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  historyRowTextFocused: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  jumpArrowText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6366F1',
  },
  jumpArrowTextFocused: {
    color: '#7C3AED',
  },
  clearHistoryRow: {
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  clearHistoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  clearHistoryTextFocused: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  emptyHistoryBox: {
    paddingVertical: 36,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHistoryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyHistoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  emptyHistorySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },

  // Live Suggestions List
  suggestionsList: {
    gap: 5,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    gap: 8,
  },
  suggestionThumb: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  suggestionTextContainer: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  suggestionTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  highlightedMatchText: {
    fontWeight: '800',
    color: '#4F46E5',
    textDecorationLine: 'underline',
  },
  suggestionArtistText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyStateBox: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  seeAllRow: {
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
  },

  // Results Screen Styles
  resultsHeaderContainer: {
    backgroundColor: 'transparent',
    zIndex: 20,
    paddingBottom: 6,
  },
  resultsSubheader: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 8,
    marginBottom: 4,
  },
  resultsListScroll: {
    flex: 1,
    overflow: 'hidden',
    marginTop: 4,
  },
  resultsListContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 28,
    gap: 10,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 82,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 18,
    gap: 16,
    shadowColor: '#64748B',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  resultCardActive: {
    borderColor: '#C7D2FE',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  resultCardFocused: {
    borderColor: '#7C3AED',
    borderWidth: 2,
    backgroundColor: 'rgba(250, 245, 255, 0.96)',
    transform: [{ scale: 1.012 }],
    elevation: 6,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    zIndex: 10,
  },
  rankBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeActive: {
    backgroundColor: '#F3E8FF',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#64748B',
    textAlign: 'center',
  },
  rankNumberFocused: {
    color: '#7C3AED',
  },
  resultArtwork: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  resultInfo: {
    flex: 1,
    minWidth: 0,
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  resultTitleFocused: {
    color: '#7C3AED',
    fontWeight: '800',
  },
  resultArtist: {
    fontSize: 13.5,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  cardActionCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultLikeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultLikeBtnActive: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  resultLikeBtnFocused: {
    borderColor: '#F43F5E',
    borderWidth: 2.5,
    backgroundColor: '#FFE4E6',
    transform: [{ scale: 1.12 }],
    elevation: 8,
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  resultLikeIcon: {
    width: 22,
    height: 22,
    tintColor: '#94A3B8',
  },
  resultLikeIconActive: {
    tintColor: '#E11D48',
  },
  resultLikeIconFocused: {
    tintColor: '#E11D48',
  },
  resultPlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultPlayBtnCardFocused: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
    elevation: 6,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  resultPlayBtnActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  resultPlayIcon: {
    fontSize: 14,
    color: '#0F172A',
    marginLeft: 2,
  },
  resultPlayIconWhite: {
    color: '#FFFFFF',
  },
  resultPlayIconActive: {
    color: '#FFFFFF',
    marginLeft: 0,
  },
  emptyResultsBox: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: 16,
  },
  emptyResultsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94A3B8',
  },

  // Bottom Hint Bar
  hintsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: 30,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 6,
    marginTop: 8,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  hintDot: {
    fontSize: 11,
    color: '#CBD5E1',
  },

  // Voice Overlay Modal
  voiceOverlayBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  voiceModalCard: {
    width: 540,
    height: 360,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  voiceBackBtn: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 86,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceBigMicCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    borderWidth: 2.5,
    borderColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceBigCustomMicIcon: {
    width: 44,
    height: 44,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    gap: 6,
  },
  waveBar: {
    width: 5,
    borderRadius: 2.5,
    backgroundColor: '#6366F1',
  },
  voiceListeningStatus: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  voiceInstructionSubtitle: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#64748B',
  },
  voiceCancelBtn: {
    width: 160,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  voiceCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  voiceBigErrorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF1F2',
    borderWidth: 2.5,
    borderColor: '#F43F5E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceErrorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  voiceErrorSubtitle: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  voiceActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  voicePrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 150,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    elevation: 3,
  },
  voicePrimaryBtnFocused: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 150,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    borderWidth: 2.5,
    borderColor: '#7C3AED',
    transform: [{ scale: 1.05 }],
    elevation: 6,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  voicePrimaryBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  voiceSecondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  voiceSecondaryBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#475569',
  },
  waveformPlaceholder: {
    height: 44,
  },
});
