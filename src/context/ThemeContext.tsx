import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { TimeOfDay, TimeTheme, TIME_THEMES, getAutoTimeOfDay } from '../constants/timeThemes';
import {
  saveSelectedBackgroundId,
  loadSelectedBackgroundId,
} from '../services/backgroundPersistenceService';
import { AvatarId, isValidAvatarId, getSavedAvatarSelection } from '../database';
import { subscribeToCloudRestore } from '../services/awsCloudSyncManager';

export interface ThemeContextType {
  currentTime: string;
  currentDate: string;
  selectedTimeOfDay: TimeOfDay;
  selectedTimeOfDayRef: React.MutableRefObject<TimeOfDay>;
  currentTheme: TimeTheme;
  handleCycleTheme: () => void;
  selectedBackgroundId: string | null;
  selectedBackgroundIdRef: React.MutableRefObject<string | null>;
  handleSelectBackground: (bgId: string) => Promise<void>;
  savedAvatarId: AvatarId | null;
  savedAvatarIdRef: React.MutableRefObject<AvatarId | null>;
  isPreferenceHydrated: boolean;
  setIsPreferenceHydrated: React.Dispatch<React.SetStateAction<boolean>>;
  showAvatarSelection: boolean;
  setShowAvatarSelection: React.Dispatch<React.SetStateAction<boolean>>;
  showAvatarSelectionRef: React.MutableRefObject<boolean>;
  setSavedAvatarId: (avatarId: AvatarId | null) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const formatClockTime = (now: Date): string => {
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const formattedMins = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${formattedHours}:${formattedMins} ${ampm}`;
};

const formatClockDate = (now: Date): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clock state initialized directly to real system time instead of hardcoded strings
  const [currentTime, setCurrentTime] = useState<string>(() => formatClockTime(new Date()));
  const [currentDate, setCurrentDate] = useState<string>(() => formatClockDate(new Date()));

  // Dynamic Time of Day Theme
  const isManualThemeRef = useRef<boolean>(false);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<TimeOfDay>(() =>
    getAutoTimeOfDay(new Date().getHours())
  );
  const selectedTimeOfDayRef = useRef<TimeOfDay>(selectedTimeOfDay);
  selectedTimeOfDayRef.current = selectedTimeOfDay;
  const currentTheme = TIME_THEMES[selectedTimeOfDay];

  const handleCycleTheme = useCallback(() => {
    isManualThemeRef.current = true;
    const order: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];
    setSelectedTimeOfDay((prev) => {
      const nextIdx = (order.indexOf(prev) + 1) % order.length;
      const nextTheme = order[nextIdx];
      selectedTimeOfDayRef.current = nextTheme;
      return nextTheme;
    });
  }, []);

  // Motion background selection state
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | null>(null);
  const selectedBackgroundIdRef = useRef<string | null>(null);

  const handleSelectBackground = useCallback(async (bgId: string) => {
    selectedBackgroundIdRef.current = bgId;
    setSelectedBackgroundId(bgId);
    try {
      await saveSelectedBackgroundId(bgId);
    } catch (e) {
      console.log('[ThemeContext] Failed to persist background ID:', e);
    }
  }, []);

  // Avatar Companion Selection & Persistence State
  const [isPreferenceHydrated, setIsPreferenceHydrated] = useState<boolean>(false);
  const [savedAvatarId, setSavedAvatarIdState] = useState<AvatarId | null>(null);
  const savedAvatarIdRef = useRef<AvatarId | null>(null);
  savedAvatarIdRef.current = savedAvatarId;

  const setSavedAvatarId = useCallback((avatarId: AvatarId | null) => {
    savedAvatarIdRef.current = avatarId;
    setSavedAvatarIdState(avatarId);
  }, []);

  const [showAvatarSelection, setShowAvatarSelection] = useState<boolean>(false);
  const showAvatarSelectionRef = useRef<boolean>(false);
  showAvatarSelectionRef.current = showAvatarSelection;

  // Load persisted background selection on startup
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const savedBg = await loadSelectedBackgroundId();
        if (isMounted && savedBg) {
          selectedBackgroundIdRef.current = savedBg;
          setSelectedBackgroundId(savedBg);
        }
      } catch (e) {
        console.log('[ThemeContext] Failed to load saved background ID:', e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Hydrate Avatar Companion Selection Preference on startup
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const dbAvatarId = await getSavedAvatarSelection();
        if (isMounted) {
          if (dbAvatarId && isValidAvatarId(dbAvatarId)) {
            setSavedAvatarId(dbAvatarId);
            savedAvatarIdRef.current = dbAvatarId;
          } else {
            setSavedAvatarId(null);
            savedAvatarIdRef.current = null;
          }
          setIsPreferenceHydrated(true);
        }
      } catch (err) {
        console.error('[ThemeContext] Failed to load avatar selection preference:', err);
        if (isMounted) {
          setIsPreferenceHydrated(true);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [setSavedAvatarId]);

  // Listen for background DynamoDB cloud restore on cold boot
  useEffect(() => {
    const unsubscribe = subscribeToCloudRestore((restored) => {
      if (restored.avatarId && isValidAvatarId(restored.avatarId)) {
        console.log('[ThemeContext] Applying cloud-restored avatar:', restored.avatarId);
        setSavedAvatarId(restored.avatarId);
      }
    });
    return unsubscribe;
  }, [setSavedAvatarId]);

  // Live Clock Interval & Auto Time-of-Day Sync
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(formatClockTime(now));
      setCurrentDate(formatClockDate(now));

      // Auto update time-of-day theme if user hasn't manually overridden it
      if (!isManualThemeRef.current) {
        const autoTheme = getAutoTimeOfDay(now.getHours());
        setSelectedTimeOfDay((prev) => {
          if (prev !== autoTheme) {
            selectedTimeOfDayRef.current = autoTheme;
            return autoTheme;
          }
          return prev;
        });
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const value: ThemeContextType = {
    currentTime,
    currentDate,
    selectedTimeOfDay,
    selectedTimeOfDayRef,
    currentTheme,
    handleCycleTheme,
    selectedBackgroundId,
    selectedBackgroundIdRef,
    handleSelectBackground,
    savedAvatarId,
    savedAvatarIdRef,
    isPreferenceHydrated,
    setIsPreferenceHydrated,
    showAvatarSelection,
    setShowAvatarSelection,
    showAvatarSelectionRef,
    setSavedAvatarId,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
