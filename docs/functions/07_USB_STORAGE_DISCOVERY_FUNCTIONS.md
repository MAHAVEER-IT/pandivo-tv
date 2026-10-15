# USB Storage Discovery & Offline Audio Functions 💾🔌

## Overview

The USB Storage subsystem enables local offline music playback from physical USB thumb drives or external hard drives connected to the Fire TV's USB OTG port. It features real-time broadcast monitoring for hot-plug/unplug events, asynchronous ID3 metadata extraction (title, artist, album, duration, album art), and auto-generation of an offline TV playlist.

- **Storage Service:** [`FireTVMusicPOC/src/services/usbStorageService.ts`](../../src/services/usbStorageService.ts)
- **USB Controller Hook:** [`FireTVMusicPOC/src/hooks/useUsbStorage.ts`](../../src/hooks/useUsbStorage.ts)
- **Modal Component:** [`FireTVMusicPOC/src/components/UsbMessageOverlay.tsx`](../../src/components/UsbMessageOverlay.tsx)
- **Android Native Module:** `UsbStorageModule.kt` (Android Storage Volume API)

---

## 1. `getUsbStatus()`

### Purpose:
Queries the Android system `StorageManager` to verify if an external mass storage volume is currently mounted. Returns device mount details, file system path, drive label, and total/free storage capacity.

### Function Signature:
```typescript
export async function getUsbStatus(): Promise<UsbStatus>
```

### Return Data Structure:
```typescript
export interface UsbStatus {
  isConnected: boolean;
  volumePath: string | null;
  driveName: string | null;
  totalSpaceBytes: number;
  freeSpaceBytes: number;
  songCount?: number;
}
```

### Simple Example:
```typescript
import { getUsbStatus } from 'FireTVMusicPOC/src/services/usbStorageService';

async function checkUsbDrive() {
  const status = await getUsbStatus();
  
  if (status.isConnected) {
    console.log('✅ USB Drive detected:', status.driveName);
    console.log('Mount Path:', status.volumePath);
    console.log('Free Space (MB):', Math.round(status.freeSpaceBytes / (1024 * 1024)));
  } else {
    console.log('❌ No external USB storage mounted.');
  }
}
```

---

## 2. `scanUsbTracks()`

### Purpose:
Performs a recursive background filesystem traversal across the mounted USB volume, locating audio files (`.mp3`, `.m4a`, `.wav`, `.flac`). Parses embedded ID3 tags using Android's `MediaMetadataRetriever` and returns clean track objects formatted for playback.

### Function Signature:
```typescript
export async function scanUsbTracks(): Promise<UsbTrack[]>
```

### Simple Example:
```typescript
import { scanUsbTracks } from 'FireTVMusicPOC/src/services/usbStorageService';

async function indexUsbAudio() {
  console.log('Scanning USB drive for songs...');
  const tracks = await scanUsbTracks();

  console.log(`Discovered ${tracks.length} offline audio files.`);
  tracks.slice(0, 3).forEach((track, i) => {
    console.log(`${i + 1}. "${track.title}" by ${track.artist} (${track.duration}s)`);
    console.log(`   Local URI: ${track.audioUrl}`);
  });
}
```

---

## 3. `subscribeToUsbStatus(callback)`

### Purpose:
Registers a native event listener with `DeviceEventEmitter` listening for system `ACTION_MEDIA_MOUNTED` and `ACTION_MEDIA_UNMOUNTED` broadcasts. Fires the callback immediately whenever a thumb drive is inserted or removed, returning an unsubscribe cleanup function.

### Function Signature:
```typescript
export function subscribeToUsbStatus(
  callback: (status: UsbStatus) => void
): () => void
```

### Simple Example:
```typescript
import { useEffect } from 'react';
import { subscribeToUsbStatus } from 'FireTVMusicPOC/src/services/usbStorageService';

function useUsbDriveWatcher() {
  useEffect(() => {
    const unsubscribe = subscribeToUsbStatus((status) => {
      if (status.isConnected) {
        console.log('🔌 USB Drive plugged in:', status.driveName);
      } else {
        console.log('⚠️ USB Drive safely disconnected.');
      }
    });

    return () => unsubscribe();
  }, []);
}
```

---

## 4. `handleSelectUsbCard()`

### Purpose:
Called when the user selects the `LIB_CARD_USB` card in the Library screen. Checks if a drive is mounted:
- If **not connected**: Opens the `NOT_CONNECTED` TV dialog prompting the user to plug in a drive.
- If **connected with 0 songs**: Opens the `NO_SONGS` modal prompting the user to add audio files.
- If **connected with songs**: Dynamically builds the USB playlist (`id: 'usb_storage'`) and navigates to the Playlist Detail screen.

### Function Signature:
```typescript
export async function handleSelectUsbCard(): Promise<void>
```

### Simple Example:
```typescript
import { useUsbStorage } from 'FireTVMusicPOC/src/hooks/useUsbStorage';

function UsbLibraryCard(props: any) {
  const { handleSelectUsbCard, usbStatus } = useUsbStorage(props);

  return (
    <div onClick={handleSelectUsbCard} className="library-card">
      <h3>USB Storage</h3>
      <p>{usbStatus.isConnected ? `${usbStatus.songCount} songs` : 'Not Connected'}</p>
    </div>
  );
}
```

---

## 5. Unmount Protection & Focus Healing

### Purpose:
If a user pulls out the USB drive while currently listening to a USB song or viewing the USB playlist screen:
1. Playback immediately pauses to prevent audio buffer errors.
2. The UI automatically exits the Playlist screen and returns to the Library screen.
3. Spatial D-pad focus is automatically restored to `LIB_CARD_USB`.

### Simple Example:
```typescript
// Auto-exit guard in useUsbStorage hook
if (!status.isConnected && selectedPlaylistRef.current?.id === 'usb_storage') {
  console.warn('Active USB playlist unmounted! Exiting to Library...');
  selectedPlaylistRef.current = null;
  setSelectedPlaylist(null);
  setFocusedId(LIBRARY_CARD_IDS.USB); // Heal focus
}
```
