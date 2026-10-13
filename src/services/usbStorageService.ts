import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { UsbStorageModule } = NativeModules;
const usbEventEmitter = UsbStorageModule ? new NativeEventEmitter(UsbStorageModule) : null;

export interface UsbStatus {
  isConnected: boolean;
  volumePath: string | null;
  driveName: string | null;
  totalSpaceBytes: number;
  freeSpaceBytes: number;
  songCount?: number;
}

export interface UsbTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  audioUrl: string; // file:// URI
  filePath: string;
  fileSize: number;
  artworkUrl: string | null;
}

/**
 * Checks the current connection status of any mounted USB drive.
 */
export async function getUsbStatus(): Promise<UsbStatus> {
  if (!UsbStorageModule || Platform.OS !== 'android') {
    return {
      isConnected: false,
      volumePath: null,
      driveName: null,
      totalSpaceBytes: 0,
      freeSpaceBytes: 0,
    };
  }

  try {
    const status: UsbStatus = await UsbStorageModule.getUsbStatus();
    return status;
  } catch (error) {
    console.warn('[UsbStorageService] getUsbStatus failed:', error);
    return {
      isConnected: false,
      volumePath: null,
      driveName: null,
      totalSpaceBytes: 0,
      freeSpaceBytes: 0,
    };
  }
}

/**
 * Recursively scans the mounted USB drive for audio tracks and extracts ID3 tags.
 */
export async function scanUsbTracks(): Promise<UsbTrack[]> {
  if (!UsbStorageModule || Platform.OS !== 'android') {
    return [];
  }

  try {
    const tracks: UsbTrack[] = await UsbStorageModule.scanUsbTracks();
    return tracks;
  } catch (error) {
    console.warn('[UsbStorageService] scanUsbTracks failed:', error);
    return [];
  }
}

/**
 * Subscribes to real-time USB plug and unplug broadcast events.
 */
export function subscribeToUsbStatus(callback: (status: UsbStatus) => void): () => void {
  if (!usbEventEmitter) {
    return () => {};
  }

  const subscription = usbEventEmitter.addListener('onUsbStatusChanged', (status: UsbStatus) => {
    callback(status);
  });

  return () => {
    subscription.remove();
  };
}
