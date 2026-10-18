# Settings Screen (`SettingsScreen.tsx`) ⚙️🛡️

## Overview

The **Settings Screen** handles user companion personalization and establishes complete consumer trust via the **Privacy & Data Policy Card**. It enables users to view their active 3D companion character, launch avatar switching, and inspect Pandivo TV's privacy-first architecture (Zero Passive Listening, 100% local speech processing, SQLite WAL, and Amazon DynamoDB sync) along with a living-room scannable QR code.

- **Component Path:** [`FireTVMusicPOC/src/components/SettingsScreen.tsx`](../../../src/components/SettingsScreen.tsx)
- **Navigation Graph:** [`FireTVMusicPOC/src/navigation/settingsNavGraph.ts`](../../../src/navigation/settingsNavGraph.ts)
- **Navigation Key:** `SETTINGS`
- **Associated Nav Rail Item:** `NAV_SETTINGS`

---

## 🖼️ UI Layout & Visual Elements

```text
+-----------------------------------------------------------------------------------------+
| [TopHeaderBar: Pandivo Logo, Clock, Companion Avatar]                                   |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  SETTINGS (Letter-by-Letter Gradient: Electric Blue -> Royal Iris -> Vibrant Purple)    |
|  "Companion Profile, Local Storage & Privacy Transparency"                              |
|                                                                                         |
|  LEFT: MUSIC COMPANION PROFILE             RIGHT: PRIVACY & DATA TRANSPARENCY CARD      |
|  +--------------------------------------+  +-----------------------------------------+  |
|  | [Account-Star] Music Companion       |  | [Shield-Check] Privacy & Data Policy    |  |
|  |                                      |  | [Badge: Privacy-First Architecture]     |  |
|  |         .-""""""""-.                 |  |                                         |  |
|  |       .'  Avatar    '.               |  |  🎙️ Zero Passive Listening               |  |
|  |      /   Glow Ring    \              |  |     Processed locally via C++ Whistle.  |  |
|  |     ;    Artwork       ;             |  |                                         |  |
|  |      \   (160x160)    /              |  |  🤖 Amazon Bedrock & Gemini AI          |  |
|  |       '.            .'               |  |     Nova Lite natural language intents. |  |
|  |         '-........-'                 |  |                                         |  |
|  |                                      |  |  ☁️ Hybrid SQLite & DynamoDB            |  |
|  |  BAMBOO THE PANDA                    |  |     Fast 60 FPS WAL + cloud restore.    |  |
|  |  Giant Panda • DJ Persona            |  |                                         |  |
|  |  (🟢 Active Companion)               |  |  +-- [QR CARD] -----------------------+ |  |
|  |                                      |  |  | [Scannable QR Code Image]          | |  |
|  |  [🔄 SETTINGS_CHANGE_AVATAR:         |  |  | "Scan with phone to read policy"   | |  |
|  |      Change Companion Avatar ]       |  |  +------------------------------------+ |  |
|  +--------------------------------------+  +-----------------------------------------+  |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
| [GlobalMiniPlayer: Current Track | Scrubber | Play/Pause | Fullscreen Button]           |
+-----------------------------------------------------------------------------------------+
```

---

## 🎮 Focus ID Mapping & D-Pad Navigation

| Element Focus ID | Type | D-Pad Left | D-Pad Right | D-Pad Up | D-Pad Down | Action on Select (OK/Enter) |
|---|---|---|---|---|---|---|
| `SETTINGS_CHANGE_AVATAR` | Action Button | `NAV_SETTINGS` (Nav Rail) | `SETTINGS_QR_CARD` | *Boundary* | `MINI_PLAY` (MiniPlayer) | Opens the full Avatar Selection Screen modal. |
| `SETTINGS_QR_CARD` | Interactive Card| `SETTINGS_CHANGE_AVATAR`| *Boundary* | *Boundary* | `MINI_PLAY` (MiniPlayer) | Focus highlights QR card for optimal scanning. |

---

## 🧩 Key Features & Technical Details

1. **Avatar Customization Trigger**:
   - Selecting `SETTINGS_CHANGE_AVATAR` triggers `onChangeAvatar()`, invoking `AvatarSelectionScreen.tsx` with full focus retention.
   - When returning from avatar selection, a self-healing fallback ensures focus lands back on `SETTINGS_CHANGE_AVATAR` with its purple glowing border intact.
2. **Privacy Transparency Pillars**:
   - **Zero Passive Listening**: Explicitly explains that the TV remote microphone opens only upon active button press and closes immediately upon speech cessation.
   - **Amazon Bedrock & Gemini**: Clarifies that only synthesized music keywords (e.g., mood, genre, tempo) are transmitted to cloud foundation models—zero voice audio or PII is ever sent.
   - **Hybrid SQLite & DynamoDB**: Discloses local SQLite write-ahead logging (WAL) and anonymous device token synchronization.
3. **Scannable TV QR Code**:
   - Prominently displays a high-contrast QR code (`privacy_qr.png`) pointing directly to Pandivo TV's public privacy policy page (`privacy.html`), allowing living room viewers to review terms comfortably on their mobile devices.
