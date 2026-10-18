# Avatar Selection Screen (`AvatarSelectionScreen.tsx`) 🦊🐺🐼

## Overview

The **Avatar Selection Screen** presents a 16:9 arc-based 3D carousel where users pick their personalized AI music companion. Selecting a companion changes the personality persona of the AI DJ, updates the header portrait across all screens, persists locally to SQLite, and synchronizes to the user's Amazon DynamoDB account in the cloud.

- **Component Path:** [`FireTVMusicPOC/src/components/AvatarSelectionScreen.tsx`](../../../src/components/AvatarSelectionScreen.tsx)
- **Repository Backend:** [`FireTVMusicPOC/src/database/repositories/avatarPreferenceRepository.ts`](../../../src/database/repositories/avatarPreferenceRepository.ts)
- **Navigation Type:** Modal / Dedicated Fullscreen Surface

---

## 🖼️ UI Layout & Visual Elements

```text
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|                        CHOOSE YOUR COMPANION VIBE                                       |
|                "Pick a music persona to guide your living room DJ"                      |
|                                                                                         |
|                                    [FROST (White Wolf)]                                 |
|                                    Focused Scale: 1.30x                                 |
|                                    Glowing Neon Ring                                    |
|                                                                                         |
|               [EMBER (Fox)]                                     [SUNNY (Dog)]           |
|               Unfocused: 0.95x                                  Unfocused: 0.95x        |
|                                                                                         |
|   [BAMBOO (Panda)]                                                         [SHADOW (Cat)]|
|   Unfocused: 0.95x                                                         Unfocused: 0.95x|
|                                                                                         |
|  +-----------------------------------------------------------------------------------+  |
|  | ACTIVE COMPANION SPOTLIGHT:                                                       |  |
|  | FROST • White Wolf • Focused & Instrumental Ambient Master                        |  |
|  | "Specializes in deep study beats, ambient drones, and zero-distraction playlists."|  |
|  +-----------------------------------------------------------------------------------+  |
|                                                                                         |
|             [ Press OK / Select to Confirm ]       [ Press BACK to Exit ]               |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

---

## 🎭 The 5 Audio Companion Personas

| Companion ID | Character Name | Species Persona | Audio Specialty & Mood Vibe | Coordinates (`xPercent`, `yPercent`) |
|---|---|---|---|---|
| `bamboo` | **Bamboo** | Giant Panda | Chillhop, relaxing acoustic, calm rain sounds. | `(0.114, 0.472)` (Arc Left Base) |
| `ember` | **Ember** | Orange Fox | High-energy synthwave, workout adrenaline, EDM. | `(0.295, 0.600)` (Arc Left Mid) |
| `frost` | **Frost** | White Wolf | Deep focus, instrumental lo-fi, coding sessions. | `(0.500, 0.655)` (Arc Center Apex) |
| `sunny` | **Sunny** | Golden Dog | Bright morning acoustic, happy vibes, summer pop. | `(0.705, 0.600)` (Arc Right Mid) |
| `shadow` | **Shadow** | Midnight Cat | Dark ambient, late-night techno, deep bass. | `(0.886, 0.472)` (Arc Right Base) |

---

## 🎮 D-Pad Navigation & Selection Mechanics

1. **Horizontal Carousel Traversal**:
   - D-Pad Left / Right steps through the 5 companions in order (`Bamboo <-> Ember <-> Frost <-> Sunny <-> Shadow`).
   - The focused companion scales up to **1.30x** (`transform: [{ scale }]`) with an active neon border (`#8B5CF6`).
2. **Selection Confirmation (OK / Select Key)**:
   - Persists the selection to SQLite table `avatar_preference` (`setSavedAvatarPreference(id)`).
   - Triggers `awsCloudSyncManager.syncAvatarPreference(id)` for cloud synchronization.
   - Updates `ThemeContext` and refreshes the portrait in `TopHeaderBar`.
   - Exits modal and returns focus to `SETTINGS_CHANGE_AVATAR`.
3. **Cancellation (Back Key)**:
   - Reverts any unconfirmed hover selection, exits modal, and restores previous focus without state corruption.
