# USB Storage & Offline Media Hardware Setup 💾🔌

## Overview

Pandivo TV includes a zero-dependency **USB Storage Subsystem** allowing Fire TV users to plug in external USB thumb drives or hard drives and listen to their local personal music library. The engine handles hot-plug detection, recursive directory traversal, ID3 tag extraction, and automatic UI focus handling upon device disconnection.

---

## 1. Physical Hardware Setup (Fire TV Stick)

Amazon Fire TV Sticks feature a single micro-USB port used for power. To connect external USB drives:

### Required Hardware:
1. **Micro-USB OTG Y-Cable**: A standard 2-in-1 host OTG cable with one micro-USB male connector (to Fire TV), one micro-USB female connector (for power), and one USB 2.0 Type-A female port (for thumb drive).
2. **USB Flash Drive**: 8 GB to 128 GB thumb drive formatted as **FAT32** or **exFAT** with MBR partition table.
3. **Fire TV Cube**: Fire TV Cube has a dedicated USB Type-A port; an OTG adapter is not required.

### Connection Diagram:
```text
[Wall Power Adapter] ─────> [Micro-USB Female]
                                  │
                                  ▼
[USB Thumb Drive]    ─────> [OTG Y-Cable] ─────> [Fire TV Stick Micro-USB Port]
                             (USB Type-A)
```

---

## 2. Formatting the USB Thumb Drive

Fire OS requires external drives to be formatted in **FAT32** (standard) or **exFAT** (for Fire OS 8+):

### Windows (PowerShell / GUI):
1. Insert the USB drive.
2. Open *This PC*, right-click the drive, and select **Format**.
3. Set **File System** to **FAT32** (or `exFAT` for drives >32 GB).
4. Set **Allocation Unit Size** to **32 kilobytes**.
5. Click **Start**.

### macOS (Terminal):
```bash
# List disks to identify your USB volume (e.g. /dev/disk4)
diskutil list

# Format as FAT32 (MS-DOS) with MBR partition map
diskutil eraseDisk FAT32 PANDIVO MBR /dev/disk4
```

---

## 3. Recommended Audio Directory Layout

Copy your audio files to the USB thumb drive. Pandivo TV recursively scans directories while automatically ignoring hidden system folders (`LOST.DIR`, `.Trashes`, `System Volume Information`, `.android_secure`):

```text
USB_ROOT/
├── Music/
│   ├── Chillhop/
│   │   ├── Boukas - Breeze.mp3
│   │   └── Spacekid - Nightfall.mp3
│   └── Electronic/
│       ├── Neon - Horizon.m4a
│       └── Synth - Pulse.flac
└── Podcasts/
    └── Episode1.mp3
```

### Supported Audio Formats:
- **MP3** (`.mp3`): ID3v2.3, ID3v2.4
- **AAC / M4A** (`.m4a`, `.aac`)
- **FLAC** (`.flac`): Lossless audio
- **WAV** (`.wav`): PCM uncompressed audio
- **OGG** (`.ogg`): Vorbis container

---

## 4. Emulator Virtual USB / SD-Card Setup

You can fully test the USB subsystem inside an Android TV emulator without physical hardware:

### Step 1: Create a Virtual External Storage Image
```bash
# Create a 512 MB virtual SD-Card image
mksdcard -l PANDIVO_USB 512M sdcard.img
```

### Step 2: Start the Emulator with the External Image
```bash
emulator -avd Television_1080p -sdcard sdcard.img
```

### Step 3: Push Test MP3 Files to Emulated Storage
```bash
adb push ./assets/audio/sample_track.mp3 /sdcard/Music/
```

### Step 4: Simulate Media Mount & Unmount Broadcasts via ADB
Trigger native storage broadcast receivers on demand:

```bash
# Simulate USB Drive Insertion
adb shell am broadcast -a android.intent.action.MEDIA_MOUNTED -d file:///storage/emulated/0

# Simulate USB Drive Removal (Hot-unplug)
adb shell am broadcast -a android.intent.action.MEDIA_UNMOUNTED -d file:///storage/emulated/0
```

---

## 5. Automated USB Storage Test Suite

Run the automated verification suite to validate navigation graphs, duration calculations, extension filtering, and blacklist exclusion rules:

```bash
node scripts/run_usb_storage_tests.js
```

### Expected Output:
```text
=== Pandivo TV: USB Storage Automated Verification ===
[TEST 1] Navigation Graph: Directional focus to LIB_CARD_USB ... PASSED
[TEST 2] Format Total Playlist Duration ... PASSED
[TEST 3] Supported Audio Extensions Matcher ... PASSED
[TEST 4] System Directory Blacklist Filtering ... PASSED
[TEST 5] Empty Drive & Hot-Unmount Resilience ... PASSED
==================================================
RESULT: ALL USB TESTS PASSED (100% SUCCESS)
```
