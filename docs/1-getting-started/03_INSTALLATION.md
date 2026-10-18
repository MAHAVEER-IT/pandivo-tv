# Cloning & Dependency Installation 📥📦

This document guides you through downloading the **Pandivo TV** codebase from GitHub, installing all required packages, and setting up your environment configuration.

---

## 1. Clone the GitHub Repository

Open a terminal or command prompt and clone the repository:

```bash
# Clone the repository
git clone https://github.com/MAHAVEER-IT/pandivo-tv.git

# Navigate into the project root folder
cd pandivo-tv
```

---

## 2. Project Directory Anatomy

Once cloned, you will see the following key directory structure:

```
pandivo-tv/
├── android/               # Native Android project, Gradle build scripts, C++ JNI source
│   ├── app/src/main/cpp/  # C++ native Whistle JNI wrapper (whistle_jni.cpp)
│   └── app/src/main/assets/ # Bundled 16.9 MB offline AI speech model (whistle.cact)
├── assets/                # Visual themes, banners, companion avatars, audio icons
├── docs/                  # Architecture, test plans, screen specs, function references
├── launchers/             # Windows automation scripts (.bat) for Metro, TV emulator & ADB
├── src/                   # React Native TypeScript application source
│   ├── components/        # 10-foot UI widgets (Carousels, Mini-player, Fullscreen visualizer)
│   ├── context/           # Global state providers (PlaybackContext, ThemeContext, FavoritesContext)
│   ├── database/          # SQLite WAL schema and data repositories
│   ├── hooks/             # Custom controllers (useTvRemoteRouter, useUsbStorage, useSpeechRecognition)
│   ├── navigation/        # D-pad spatial navigation graphs
│   └── services/          # Gemini AI DJ, Bedrock backend, USB storage scanner, fuzzy search
├── .env.example           # Template for required environment keys
├── App.tsx                # Master TV application chassis
├── package.json           # Dependencies and npm script definitions
├── START_METRO.bat        # 1-Click launcher for Metro Development Bundler
└── RUN_ANDROID_TV.bat     # 1-Click launcher to compile and run on Android TV
```

---

## 3. Install Node.js Dependencies

Run the standard `npm install` command from the root directory:

```bash
npm install
```

> [!NOTE]
> **Why `react-native-tvos` is used:**
> Standard `react-native` is built for touchscreens (smartphones and tablets). Pandivo TV uses **`react-native-tvos`** via npm overrides:
> ```json
> "overrides": {
>   "react-native": "npm:react-native-tvos@0.86-stable"
> }
> ```
> This special distribution includes the native Android TV focus engine, D-pad directional navigation events, and remote controller media key routing. Always use `npm install` so the override is correctly applied.

---

## 4. Configure Environment Variables (`.env`)

Pandivo TV uses **Expo Public Environment Variables** to configure cloud AI capabilities.

1. Duplicate the `.env.example` template into a new `.env` file:

   **Windows (PowerShell):**
   ```powershell
   Copy-Item .env.example .env
   ```

   **macOS / Linux:**
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in your text editor and fill in your keys:

   ```env
   # Google Gemini API Key - Replace with your key from https://aistudio.google.com
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

   # AWS Bedrock & DynamoDB Cloud Sync Lambda Endpoint
   # (Leave as-is or set your endpoint; falls back gracefully to offline mode if unreachable)
   EXPO_PUBLIC_AWS_LAMBDA_URL=https://your-lambda-id.lambda-url.your-region.on.aws/
   ```

### Obtaining a Free Google Gemini API Key:
1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **"Get API key"** and create a key in a new project.
4. Paste the key into `EXPO_PUBLIC_GEMINI_API_KEY`.

> [!TIP]
> **Offline Resilience:** If you do not have an API key or are developing without internet access, Pandivo TV automatically engages its **deterministic on-device music intent engine** and **offline Whistle voice engine** without crashing.

---

## Next Step

With dependencies installed and your `.env` configured, proceed to [**`05_RUNNING_METRO_AND_SCRIPTS.md`**](./05_RUNNING_METRO_AND_SCRIPTS.md) to launch the Metro development server!
