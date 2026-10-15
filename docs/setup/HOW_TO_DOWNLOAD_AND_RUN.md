# How to Download from GitHub & Run Pandivo TV 🚀📺

> **Quick Start Guide**: If you just downloaded or cloned Pandivo TV from GitHub, follow this step-by-step guide to get the app running on your Fire TV or Android TV emulator in 5 minutes.

---

## 📋 What You Need Before Starting

Make sure you have these 3 tools installed on your computer:
1. **Node.js** (Version 20 LTS or newer) - [Download Node.js](https://nodejs.org/)
2. **Java JDK 17** (OpenJDK 17 or Eclipse Temurin 17) - [Download Temurin JDK 17](https://adoptium.net/temurin/releases/?version=17)
3. **Android Studio** (with Android SDK Platform 34 and Platform Tools `adb`) - [Download Android Studio](https://developer.android.com/studio)

---

## ⚡ Step-by-Step: Clone to Run in 5 Minutes

### Step 1: Clone the Repository from GitHub

Open your terminal or command prompt:

```bash
# Clone the repository
git clone https://github.com/MAHAVEER-IT/pandivo-tv.git

# Enter the project directory
cd pandivo-tv
```

---

### Step 2: Install Dependencies

Install the project packages:

```bash
npm install
```

> [!NOTE]
> Pandivo TV uses `react-native-tvos` for TV remote D-pad focus handling. Standard `npm install` will automatically resolve all television dependencies.

---

### Step 3: Setup Environment Variables (Optional)

The app comes with an `.env.example` file:

```bash
# Copy the example environment file
cp .env.example .env
```

Open `.env` in any text editor:
```env
# Google Gemini API Key (Get a free key at https://aistudio.google.com/)
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# AWS Lambda URL (Optional - leave empty for offline/local mode)
EXPO_PUBLIC_AWS_LAMBDA_URL=
```

> [!TIP]
> **Can I run without API keys?**
> **YES!** Pandivo TV has a built-in offline engine and bundled music catalog. Even if you leave the `.env` blank or don't have an API key, all UI screens, local SQLite database, audio playback, USB player, and offline voice keywords work 100% out-of-the-box.

---

### Step 4: Choose Where to Run the App

You can run Pandivo TV on a **Physical Fire TV Stick / TV** OR on an **Android TV Emulator**.

#### Option A: Running on a Physical Fire TV (Recommended)
1. Turn on your Fire TV.
2. Go to **Settings** ⚙️ -> **My Fire TV** -> **About**.
3. Highlight the Fire TV device name and **click the remote's Center button 7 times** to unlock Developer Options.
4. Press Back, open **Developer Options**, and turn **ADB Debugging** to **ON**.
5. Check your TV's IP address in **Settings -> My Fire TV -> About -> Network** (e.g., `192.168.1.50`).
6. In your computer's terminal, connect via Wi-Fi:
   ```bash
   adb connect 192.168.1.50:5555
   ```
7. Look at your TV screen and click **"Always allow from this computer" -> OK**.
8. Verify it is connected:
   ```bash
   adb devices
   # You should see: 192.168.1.50:5555    device
   ```

#### Option B: Running on an Android TV Emulator (Desktop)
1. Open **Android Studio** -> **Device Manager**.
2. Click **Create Device** -> select **TV** -> choose **Television (1080p)**.
3. Select System Image **Android 14 (API 34)** or **Android 11 (API 30)** and click **Finish**.
4. Click the **Play (▶)** button to start the TV emulator.

---

### Step 5: Start and Run the App

Run this command in the project folder:

```bash
npm run android
```

**What happens next?**
1. Metro bundler compiles the React Native JavaScript code.
2. Gradle builds the native Android application and C++ Whistle audio libraries.
3. The APK is automatically installed onto your Fire TV or emulator.
4. The app launches on your TV screen!

---

## 🎮 How to Control the App

### Using a Physical Fire TV Remote:
- **D-Pad (Up / Down / Left / Right)**: Move highlight focus between songs, menu items, and playlists.
- **Center / Select Button**: Play selected song, open playlist, toggle buttons.
- **Back Button**: Return to previous screen or collapse the left sidebar.
- **Play/Pause Button**: Toggle music playback.
- **Fast-Forward / Rewind**: Scrub forward or backward by 10 seconds.
- **Mic / Voice Button**: Speak your mood or music request (e.g. *"Play relaxing lofi music"*).

### Using Computer Keyboard (If using Android TV Emulator):
- **Arrow Keys** (`↑` `↓` `←` `→`): D-Pad directional navigation.
- **Enter / Return**: Center select / Click.
- **Escape / Backspace**: TV Back button.
- **Spacebar**: Play / Pause.

### Simulating Remote Presses via Terminal:
You can also send remote commands from your terminal:
```bash
# Press Play / Pause
adb shell input keyevent 85

# Press D-Pad Center
adb shell input keyevent 23

# Send a simulated voice command
adb shell am broadcast -a com.firetv.musicpoc.VOICE_INPUT --es query "Play energetic workout beats"
```

---

## 🛠️ Common Questions & Troubleshooting

### Q: `adb connect` says `Connection refused` or `Device offline`
- Make sure your computer and your Fire TV are connected to the **same Wi-Fi network**.
- Turn ADB Debugging OFF and back ON in Fire TV Settings.
- Run `adb kill-server` and try connecting again.

### Q: Metro Bundler shows a red error screen or cache error
Run:
```bash
npx expo start -c
```
Then press `a` in the terminal to re-open on Android.

### Q: Does this work completely offline?
**Yes!** Pandivo TV has:
- A bundled offline music catalog.
- An on-device SQLite database that stores favorites and history locally.
- A local C++ speech engine (`whistle.cact`) for offline voice recognition.
- A USB drive reader to play offline MP3s directly from a thumb drive.

---

## 📁 Project Structure Quick Reference

- `App.tsx` - Main TV application entry point and screen switcher.
- `src/components/` - 10-foot TV UI components (Home, AI DJ, Search, Library, Favorites, Fullscreen Player).
- `src/navigation/` - D-pad directional navigation graphs for TV remotes.
- `src/services/` - Audio player, Gemini AI, Bedrock, and USB storage managers.
- `android/` - Native Android TV project with C++ JNI speech libraries.
- `docs/` - Full technical documentation, page wireframes, and test plans.
