# Search Screen (`SearchScreen.tsx`) 🔍⌨️

## Overview

The **Search Screen** is engineered specifically for living room text discovery. Because standard mobile soft-keyboards are clunky on televisions, Pandivo TV implements a native **7x5 TV QWERTY On-Screen Grid Keyboard**, an instantaneous **Whistle Offline Voice Search** button, and an auto-completing search history powered by SQLite.

- **Component Path:** [`FireTVMusicPOC/src/components/SearchScreen.tsx`](../../src/components/SearchScreen.tsx)
- **Navigation Graph:** [`FireTVMusicPOC/src/navigation/searchNavGraph.ts`](../../src/navigation/searchNavGraph.ts)
- **Navigation Key:** `SEARCH`
- **Associated Nav Rail Item:** `NAV_SEARCH`

---

## 🖼️ UI Layout & Visual Elements

```text
+-----------------------------------------------------------------------------------------+
| [TopHeaderBar: Pandivo Logo, Clock, Companion Avatar]                                   |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  +-- SEARCH INPUT BAR ---------------------------------------------------------------+  |
|  |  🔍  "Lo-fi study beats|"                         [🎤 SEARCH_VOICE_BTN: Voice]   |  |
|  +-----------------------------------------------------------------------------------+  |
|                                                                                         |
|  LEFT: 7x5 TV KEYBOARD GRID                 RIGHT: RESULTS OR RECENT SEARCHES           |
|  +---------------------------------------+  +----------------------------------------+  |
|  | [A] [B] [C] [D] [E] [F] [G]           |  | RECENT SEARCHES           Clear All    |  |
|  | [H] [I] [J] [K] [L] [M] [N]           |  | +------------------------------------+ |  |
|  | [O] [P] [Q] [R] [S] [T] [U]           |  | | [HIST_0] "Synthwave Sunset"   (x)  | |  |
|  | [V] [W] [X] [Y] [Z] [1] [2]           |  | | [HIST_1] "Acoustic Morning"   (x)  | |  |
|  | [3] [4] [5] [6] [7] [8] [9]           |  | +------------------------------------+ |  |
|  | [0] [SPACE]  [⌫ BACKSPACE]  [CLEAR]   |  |                                        |  |
|  +---------------------------------------+  | SEARCH RESULTS (14 Found)              |  |
|                                             | +------------------------------------+ |  |
|                                             | | [RES_0] Song Title 1   Artist  ▶ ♡ | |  |
|                                             | | [RES_1] Song Title 2   Artist    ♡ | |  |
|                                             | | [RES_2] Song Title 3   Artist    ♡ | |  |
|                                             | +------------------------------------+ |  |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
| [GlobalMiniPlayer: Current Track | Scrubber | Play/Pause | Fullscreen Button]           |
+-----------------------------------------------------------------------------------------+
```

---

## 🎮 Focus ID Mapping & D-Pad Navigation

| Element Focus ID | Type | D-Pad Left | D-Pad Right | D-Pad Up | D-Pad Down | Action on Select (OK/Enter) |
|---|---|---|---|---|---|---|
| `SEARCH_VOICE_BTN`| Action Button | `SEARCH_INPUT` | `SEARCH_CLEAR_ALL` | *Boundary* | `SEARCH_KEY_A` | Activates Whistle voice input immediately. |
| `SEARCH_KEY_{A..Z}`| TV Keyboard Key | `NAV_SEARCH` (Col 0) or Key Left | Key Right or `SEARCH_RESULT_0` | Key Up or Input Bar | Key Down | Appends letter to active query string. |
| `SEARCH_KEY_SPACE`| Action Key | `SEARCH_KEY_0` | `SEARCH_KEY_BACKSPACE`| `SEARCH_KEY_4` | `MINI_PLAY` | Appends space character. |
| `SEARCH_KEY_BACKSPACE`| Action Key | `SEARCH_KEY_SPACE`| `SEARCH_KEY_CLEAR` | `SEARCH_KEY_6` | `MINI_PLAY` | Deletes trailing character. |
| `SEARCH_KEY_CLEAR`| Action Key | `SEARCH_KEY_BACKSPACE`| `SEARCH_RESULT_0` | `SEARCH_KEY_8` | `MINI_PLAY` | Clears entire search buffer. |
| `SEARCH_HIST_{N}` | History Pill | `SEARCH_KEY_G` (Grid Right) | *Boundary* | `SEARCH_VOICE_BTN` | `SEARCH_HIST_{N+1}` | Loads query string and triggers search. |
| `SEARCH_RES_{N}`  | Track Item | Keyboard Grid Right | *Boundary* | `SEARCH_RES_{N-1}` | `SEARCH_RES_{N+1}` | Plays track immediately and shifts queue. |

---

## 🧩 Key Features & Technical Details

1. **7x5 Living Room TV Keyboard**:
   - Keys are sized generously (`minWidth: 48, minHeight: 48`) with high-contrast active borders (`#8B5CF6`).
   - D-Pad wraps naturally across rows and columns.
2. **Whistle Speech-to-Text Integration**:
   - Activating `SEARCH_VOICE_BTN` listens for on-demand speech via the embedded C++ Whistle engine.
   - When voice completes, the transcript fills the query box and initiates ranked searching without remote typing.
3. **Ranked Fuzzy Search Engine (`searchCatalog.ts`)**:
   - Searches local SQLite tracks and Audius catalog indices using multi-tier relevance scoring (Title Match > Artist Match > Genre/Mood Match).
4. **SQLite Persistent Search History**:
   - Successful queries are saved to the `search_history` SQLite table.
   - Individual history items can be deleted or purged in bulk via `SEARCH_CLEAR_ALL`.
