# Global Chassis & Navigation Architecture 🧭🎛️

## Overview

The **Global Chassis** represents the persistent chrome framing every screen in Pandivo TV. It consists of the **Collapsible Navigation Rail** (left axis), the **Top Header Bar** (top axis), the **Global MiniPlayer** (bottom axis), and dedicated living room modal overlays (USB and Background switchers).

- **Navigation Rail:** [`FireTVMusicPOC/src/components/layout/CollapsibleNavRail.tsx`](../../../src/components/layout/CollapsibleNavRail.tsx)
- **Top Header Bar:** [`FireTVMusicPOC/src/components/layout/TopHeaderBar.tsx`](../../../src/components/layout/TopHeaderBar.tsx)
- **Global MiniPlayer:** [`FireTVMusicPOC/src/components/GlobalMiniPlayer.tsx`](../../../src/components/GlobalMiniPlayer.tsx)
- **Screen Switcher Orchestrator:** [`FireTVMusicPOC/src/components/layout/ScreenSwitcher.tsx`](../../../src/components/layout/ScreenSwitcher.tsx)

---

## 🖼️ Chassis Visual Layout

```text
+-----------------------------------------------------------------------------------------+
| [TOP HEADER BAR: 🎵 Pandivo TV Logo | "Good Evening" | 10:45 PM | 🦊 Companion Avatar]  |
+-----------------------------------------------------------------------------------------+
| [NAV RAIL]  |                                                                           |
|             |                                                                           |
| [🏠 HOME]   |                                                                           |
| [🔍 SEARCH] |                           ACTIVE CONTENT CANVAS                           |
| [🎙️ AI DJ]  |                                                                           |
| [📚 LIBRARY]|                   (HomeScreen / SearchScreen / AiDjScreen /               |
| [💖 FAVS]   |                    LibraryScreen / FavoritesScreen / SettingsScreen)      |
| [⚙️ SETTINGS|                                                                           |
|             |                                                                           |
+-----------------------------------------------------------------------------------------+
| [GLOBAL MINIPLAYER: Album Art | Daydreams • Lofi Girl | 01:24/03:45 | [▶] | [⤢ Fullscreen]|
+-----------------------------------------------------------------------------------------+
```

---

## 1. Collapsible Navigation Rail (`CollapsibleNavRail.tsx`)

The navigation rail docks on the left side of the screen (`width: 88px` collapsed, `width: 240px` when focused/expanded):

| Tab ID | Nav Focus ID | Label | Destination Screen |
|---|---|---|---|
| `home` | `NAV_HOME` | Home | `HomeScreen.tsx` |
| `search` | `NAV_SEARCH` | Search | `SearchScreen.tsx` |
| `ai_dj` | `NAV_DJ` | AI DJ | `AiDjScreen.tsx` |
| `library` | `NAV_LIBRARY` | Library | `LibraryScreen.tsx` |
| `favorites` | `NAV_FAV` | Favorites | `FavoritesScreen.tsx` |
| `settings` | `NAV_SETTINGS` | Settings | `SettingsScreen.tsx` |

### D-Pad Rules:
- **D-Pad Up/Down**: Steps between navigation items.
- **D-Pad Right**: Transitions focus into the first focusable element of the active screen canvas.
- **Select (OK)**: Switches active screen tab without interrupting playing audio.

---

## 2. Top Header Bar (`TopHeaderBar.tsx`)

Renders across the top 64px of the viewport:
- **Pandivo Brand Mark**: Gradient-styled living room logo.
- **Time Context Greeting**: Adapts to Dawn, Noon, Sunset, or Midnight.
- **Digital TV Clock**: Live system clock updated each minute.
- **Companion Portrait**: Displays the user's active 3D avatar character. Pressing it directly launches the avatar switcher.

---

## 3. Global MiniPlayer (`GlobalMiniPlayer.tsx`)

The persistent bottom audio player remains active across all tabs:
- **Focus IDs:**
  - `MINI_PLAY`: Toggles play / pause state.
  - `MINI_EXPAND`: Expands playback into the 1080p `FullscreenPlayerScreen`.
  - `MINI_PROGRESS`: Focusable scrub preview.
- **Audio Continuity**: Powered by a single `expo-audio` player instance in `App.tsx`. Switching tabs never resets audio buffer or introduces playback stutter.

---

## 4. Modal Overlays & Focus Traps

When a modal opens, D-pad navigation traps focus within the modal boundaries until the user selects an option or presses the Back remote key:
- **`BackgroundSelectionOverlay.tsx`**: Visualizer theme chooser in Fullscreen Player.
- **`UsbMessageOverlay.tsx`**: Alerts user when a USB flash drive is connected, indexed, or removed.
- **`AIDJProcessingOverlay.tsx`**: Live mic and progress bar during voice AI generation.
