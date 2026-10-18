# TV Remote Simulation & Testing Guide 🎮📡

Because TV applications have no touchscreens or mice, developers must test all interactions using Fire TV remote control events. This guide explains how to control and test **Pandivo TV** on your computer using ADB key events and simulated speech broadcasts.

---

## 🕹️ Fire TV Remote Keycode Reference

Android TV and Fire OS translate physical remote button presses into standard Android **KeyCodes**:

| Button on Remote | Android KeyCode | ADB Command | Action in Pandivo TV |
|---|---|---|---|
| **D-Pad UP** | `19` | `adb shell input keyevent 19` | Move focus upward |
| **D-Pad DOWN** | `20` | `adb shell input keyevent 20` | Move focus downward |
| **D-Pad LEFT** | `21` | `adb shell input keyevent 21` | Move focus left / Open drawer rail |
| **D-Pad RIGHT** | `22` | `adb shell input keyevent 22` | Move focus right / Enter content area |
| **D-Pad CENTER** | `23` | `adb shell input keyevent 23` | Select item / Play track / Toggle |
| **BACK** | `4` | `adb shell input keyevent 4` | Exit fullscreen / Dismiss modal / Go Home |
| **PLAY / PAUSE** | `85` | `adb shell input keyevent 85` | Toggle audio playback |
| **NEXT TRACK** | `87` | `adb shell input keyevent 87` | Skip to next track (or shuffle next) |
| **PREV TRACK** | `88` | `adb shell input keyevent 88` | Skip to previous track |
| **FAST FORWARD** | `90` | `adb shell input keyevent 90` | Scrubber seek +10s |
| **REWIND** | `89` | `adb shell input keyevent 89` | Scrubber seek -10s |

---

## ⌨️ PC Keyboard Shortcuts in Android TV Emulator

When running inside the **Android Studio Television 1080p Emulator**, your computer keyboard maps directly:

| Computer Keyboard | Fire TV Action |
|---|---|
| **Arrow Keys (↑, ↓, ←, →)** | D-Pad Navigation |
| **Enter / Return** | Center Select Button |
| **Escape (Esc)** | Back Button |
| **Spacebar** | Play / Pause |
| **Home key** | TV Home Dashboard |

---

## 🎙️ Testing Voice Commands & AI DJ via ADB Broadcast

If you are developing on an emulator without a physical microphone or want to write automated tests, you can simulate spoken voice queries using Android **Broadcast Intents**.

The native `SpeechRecognitionModule` listens for the `com.firetv.musicpoc.VOICE_INPUT` intent:

```bash
# 1. Simulate asking for an upbeat workout mix
adb shell am broadcast -a com.firetv.musicpoc.VOICE_INPUT --es query "Play upbeat 90s rock for a workout"

# 2. Simulate asking for calm bedtime music
adb shell am broadcast -a com.firetv.musicpoc.VOICE_INPUT --es query "Play relaxing lofi for sleep"

# 3. Simulate mid-session DJ steering
adb shell am broadcast -a com.firetv.musicpoc.VOICE_INPUT --es query "Make it higher energy"

# 4. Simulate negative steering
adb shell am broadcast -a com.firetv.musicpoc.VOICE_INPUT --es query "No sad songs"
```

The application will handle the broadcast exactly as if spoken into the Fire TV Voice remote:
1. Converts the speech string into structured parameters via **Amazon Bedrock / Google Gemini**.
2. Dynamically recalibrates the session queue.
3. Generates and announces transition DJ commentary!

---

## 📸 Capturing Television Screenshots over ADB

To capture a pixel-perfect 1080p screenshot of the running TV app for bug reports or review:

```bash
# Capture screenshot to TV device storage
adb shell screencap -p /sdcard/tv_screenshot.png

# Download the screenshot to your computer
adb pull /sdcard/tv_screenshot.png ./tv_screenshot.png

# (Optional) Delete temporary file on device
adb shell rm /sdcard/tv_screenshot.png
```

---

## Next Step

Encountering any build issues or port conflicts? See [**`09_TROUBLESHOOTING_AND_FAQ.md`**](./09_TROUBLESHOOTING_AND_FAQ.md) for solutions!
