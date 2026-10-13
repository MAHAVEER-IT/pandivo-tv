import { NativeModules, Platform } from 'react-native';

const { UsbStorageModule } = NativeModules;

export const PREF_KEY_BACKGROUND_SELECTION = 'SELECTED_MOTION_BACKGROUND_ID';

export const VALID_BACKGROUND_IDS = [
  'classical_cello',
  'cyan_ribbon',
  'disco_ball',
  'emerald_nature',
  'starlight_helix',
  'warm_amber',
  'workout_tunnel',
] as const;

export type ValidBackgroundId = (typeof VALID_BACKGROUND_IDS)[number];

let memoryCachedBgId: string | null = null;

/**
 * Persists the user's selected background ID into Android SharedPreferences
 * via the native UsbStorageModule.
 */
export async function saveSelectedBackgroundId(bgId: string): Promise<boolean> {
  if (!VALID_BACKGROUND_IDS.includes(bgId as ValidBackgroundId)) {
    console.warn('[BackgroundPersistence] Invalid background ID:', bgId);
    return false;
  }

  memoryCachedBgId = bgId;

  if (Platform.OS === 'android' && UsbStorageModule?.savePreference) {
    try {
      await UsbStorageModule.savePreference(PREF_KEY_BACKGROUND_SELECTION, bgId);
      return true;
    } catch (err) {
      console.warn('[BackgroundPersistence] Error saving preference:', err);
    }
  }
  return true;
}

/**
 * Loads the user's selected background ID from Android SharedPreferences.
 * Returns null if no selection has been saved or if the saved asset is invalid.
 */
export async function loadSelectedBackgroundId(): Promise<string | null> {
  if (Platform.OS === 'android' && UsbStorageModule?.getPreference) {
    try {
      const saved = await UsbStorageModule.getPreference(
        PREF_KEY_BACKGROUND_SELECTION,
        null
      );
      if (saved && VALID_BACKGROUND_IDS.includes(saved as ValidBackgroundId)) {
        memoryCachedBgId = saved;
        return saved;
      }
    } catch (err) {
      console.warn('[BackgroundPersistence] Error loading preference:', err);
    }
  }

  if (memoryCachedBgId && VALID_BACKGROUND_IDS.includes(memoryCachedBgId as ValidBackgroundId)) {
    return memoryCachedBgId;
  }

  return null;
}

/**
 * Synchronous getter for the currently cached selection in memory.
 */
export function getCachedBackgroundId(): string | null {
  return memoryCachedBgId;
}
