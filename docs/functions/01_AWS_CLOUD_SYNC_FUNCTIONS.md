# AWS Cloud Sync & DynamoDB Functions ☁️⚡

## Overview

The AWS Cloud Sync subsystem bridges high-speed local **SQLite WAL storage** with remote **Amazon DynamoDB** persistence. It operates non-blockingly so the 60 FPS television interface is never stalled by network roundtrips.

- **Primary Source:** [`FireTVMusicPOC/src/services/awsCloudSyncManager.ts`](../../src/services/awsCloudSyncManager.ts)
- **Backend API Layer:** [`FireTVMusicPOC/src/services/awsBackendService.ts`](../../src/services/awsBackendService.ts)

---

## 1. `initializeCloudSyncOnBoot(userId?)`

### Purpose:
Called during the TV application launch sequence (`App.tsx`). Checks if local SQLite storage has user data. If local storage is populated, it schedules a background cloud sync. If local storage is completely blank (e.g. freshly installed app on a new Fire TV device), it pulls the user's profile and favorites from DynamoDB and populates SQLite.

### Function Signature:
```typescript
export async function initializeCloudSyncOnBoot(
  userId: string = getSyncUserId()
): Promise<void>
```

### Simple Example:
```typescript
import { initializeCloudSyncOnBoot } from 'FireTVMusicPOC/src/services/awsCloudSyncManager';

// Execute on app startup inside an asynchronous boot effect
async function bootApp() {
  console.log('Starting TV App...');
  
  // Checks SQLite, pulls from DynamoDB if fresh install, restores avatar & favorites
  await initializeCloudSyncOnBoot('user_living_room_tv');
  
  console.log('Cloud sync initialization complete.');
}
```

---

## 2. `performCloudSyncPush(userId?)`

### Purpose:
Reads the current avatar selection and liked song IDs from SQLite and makes an HTTP PUT call to Amazon DynamoDB to update the user's remote single-table backup record.

### Function Signature:
```typescript
export async function performCloudSyncPush(
  userId: string = DEFAULT_USER_ID
): Promise<boolean>
```

### Simple Example:
```typescript
import { performCloudSyncPush } from 'FireTVMusicPOC/src/services/awsCloudSyncManager';

async function handleManualBackup() {
  const success = await performCloudSyncPush('default_firetv_user');
  if (success) {
    console.log('✅ Local state successfully mirrored to DynamoDB.');
  } else {
    console.warn('⚠️ Cloud sync unreachable; local SQLite WAL continues safely.');
  }
}
```

---

## 3. `queueCloudSyncPush(delayMs?, userId?)`

### Purpose:
Debounces cloud sync requests. When a user rapidly likes or unlikes multiple songs in a row with their remote control, this function ensures only one consolidated update is dispatched to DynamoDB after the user finishes.

### Function Signature:
```typescript
export function queueCloudSyncPush(
  delayMs: number = 1200, 
  userId: string = DEFAULT_USER_ID
): void
```

### Simple Example:
```typescript
import { queueCloudSyncPush } from 'FireTVMusicPOC/src/services/awsCloudSyncManager';

// Called every time the heart button is clicked on the TV remote
function onSongLiked(songId: string) {
  // 1. Instantly write to local SQLite for 0ms lag
  saveLikedSongToSQLite(songId);

  // 2. Queue a debounced cloud sync (waits 1.2s for further user clicks)
  queueCloudSyncPush(1200);
}
```

---

## 4. `subscribeToCloudRestore(callback)`

### Purpose:
A pub/sub listener enabling React Contexts (`ThemeContext`, `FavoritesContext`) to receive real-time notifications when a DynamoDB restore finishes. This updates in-memory UI state instantly without needing to restart the TV app.

### Function Signature:
```typescript
export function subscribeToCloudRestore(
  callback: (restored: { avatarId?: AvatarId; favorites?: string[] }) => void
): () => void
```

### Simple Example:
```typescript
import React, { useEffect, useState } from 'react';
import { subscribeToCloudRestore } from 'FireTVMusicPOC/src/services/awsCloudSyncManager';

export function FavoritesCounterBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Subscribe to cloud restore events
    const unsubscribe = subscribeToCloudRestore(({ favorites }) => {
      if (favorites) {
        console.log('Restored favorites received from DynamoDB:', favorites.length);
        setCount(favorites.length);
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  return <Text>Liked Songs: {count}</Text>;
}
```
