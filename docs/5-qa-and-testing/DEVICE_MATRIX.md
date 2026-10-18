# Target Device & Environment Matrix 📺

> **Project**: Pandivo TV (Hackathon 2026)  
> **Package**: `com.firetv.musicpoc`

---

## 1. Device Test Matrix

| Device Name | Form Factor | OS & API Level | RAM / Storage | Resolution | Input Method | Target Role |
|---|---|---|---|---|---|---|
| **Android TV Emulator (`Television_1080p`)** | Virtual AVD | Android 13 TV (API 33) | 2 GB / 8 GB | 1920x1080 @ 320dpi | Virtual D-Pad / ADB | Primary Dev & Smoke Testing |
| **Fire TV Stick (3rd Gen)** | HDMI Stick | Fire OS 7 (Android 9, API 28) | 1 GB / 8 GB | 1080p Full HD | Alexa Voice Remote (Gen 3) | Low-Memory Baseline Validation |
| **Fire TV Stick 4K Max (2nd Gen)** | HDMI Stick | Fire OS 8 (Android 11, API 30) | 2 GB / 16 GB | 4K UHD (scaled 1080p UI) | Alexa Voice Remote Enhanced | High-End Performance & Smoothness |
| **Fire TV Cube (3rd Gen)** | Set-top Box | Fire OS 7 (Android 9, API 28) | 2 GB / 16 GB | 4K UHD (scaled 1080p UI) | Alexa Voice Remote Pro | Hands-free Far-Field Voice |
| **Nvidia Shield / Google TV** | Set-top Box | Android 11 / 12 TV (API 30-31) | 3 GB / 16 GB | 4K UHD | Standard Android TV Remote | Cross-Platform Parity Testing |

---

## 2. Key Remote Controller Keycodes Reference

| Action | Android Key Name | Keycode (Decimal) | ADB Input Command |
|---|---|---|---|
| **D-Pad Up** | `KEYCODE_DPAD_UP` | `19` | `adb shell input keyevent 19` |
| **D-Pad Down** | `KEYCODE_DPAD_DOWN` | `20` | `adb shell input keyevent 20` |
| **D-Pad Left** | `KEYCODE_DPAD_LEFT` | `21` | `adb shell input keyevent 21` |
| **D-Pad Right** | `KEYCODE_DPAD_RIGHT` | `22` | `adb shell input keyevent 22` |
| **D-Pad Center (Select)** | `KEYCODE_DPAD_CENTER` | `23` | `adb shell input keyevent 23` |
| **Enter (Alternative Select)** | `KEYCODE_ENTER` | `66` | `adb shell input keyevent 66` |
| **Back Button** | `KEYCODE_BACK` | `4` | `adb shell input keyevent 4` |
| **Escape (Keyboard Back)** | `KEYCODE_ESCAPE` | `111` | `adb shell input keyevent 111` |
| **Menu Button** | `KEYCODE_MENU` | `82` | `adb shell input keyevent 82` |
| **Play / Pause Toggle** | `KEYCODE_MEDIA_PLAY_PAUSE`| `85` | `adb shell input keyevent 85` |
| **Media Play** | `KEYCODE_MEDIA_PLAY` | `126` | `adb shell input keyevent 126` |
| **Media Pause** | `KEYCODE_MEDIA_PAUSE` | `127` | `adb shell input keyevent 127` |
| **Next Track** | `KEYCODE_MEDIA_NEXT` | `87` | `adb shell input keyevent 87` |
| **Previous Track** | `KEYCODE_MEDIA_PREVIOUS` | `88` | `adb shell input keyevent 88` |
| **Fast Forward** | `KEYCODE_MEDIA_FAST_FORWARD`| `90` | `adb shell input keyevent 90` |
| **Rewind** | `KEYCODE_MEDIA_REWIND` | `89` | `adb shell input keyevent 89` |
| **Wakeup Device** | `KEYCODE_WAKEUP` | `224` | `adb shell input keyevent 224` |
