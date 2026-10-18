# System Requirements & Prerequisites ⚙️💻

Before downloading and running **Pandivo TV**, ensure your development machine has the required development toolchains installed.

---

## 📋 Required Software & Versions

| Component | Minimum Version | Recommended Version | Purpose |
|---|---|---|---|
| **Node.js** | `v18.18.0` | `v20.x LTS` | JavaScript runtime & Metro bundler |
| **npm** | `v9.x` | `v10.x` | Package manager (uses npm overrides) |
| **Java Development Kit (JDK)** | `JDK 17` | `JDK 17 (Azul Zulu / Microsoft)` | Android Gradle build engine |
| **Android SDK** | `API 34 (Android 14)` | `API 34` | Android TV target platform |
| **Android NDK** | `26.1.10909125` | `26.1.x` | Native C++ compilation for Whistle STT engine |
| **CMake** | `3.22.1` | `3.22.1+` | C++ JNI build pipeline (`whistle_jni.cpp`) |
| **Git** | `2.x` | Latest | Repository cloning & version control |

---

## 1. Install Node.js & npm

1. Download **Node.js LTS** from the official site: [https://nodejs.org](https://nodejs.org)
2. Verify installation in your terminal:
   ```bash
   node -v
   # Should output: v20.x.x (or v18.x.x)
   
   npm -v
   # Should output: 10.x.x (or 9.x.x)
   ```

---

## 2. Install Java Development Kit (JDK 17)

React Native 0.76+ and Expo 52+ require **JDK 17**. Newer versions (JDK 21+) or older versions (JDK 8/11) can cause Gradle build errors.

- **Recommended**: [Azul Zulu JDK 17](https://www.azul.com/downloads/?version=java-17-lts) or [Microsoft Build of OpenJDK 17](https://learn.microsoft.com/en-us/java/openjdk/download).
- Verify in your terminal:
  ```bash
  java -version
  # Should show: openjdk version "17.0.x"
  ```

---

## 3. Install Android Studio & Android TV SDK

1. Download and install **Android Studio** (Koala / Ladybug or newer) from [developer.android.com](https://developer.android.com/studio).
2. Open Android Studio -> **Settings / Preferences** -> **Languages & Frameworks** -> **Android SDK**.
3. Under **SDK Platforms**:
   - Check **Android 14.0 ("UpsideDownCake") - API Level 34**
   - Check **Android TV Intel x86 Atom System Image** or **Android TV ARM 64 v8a System Image**
4. Under **SDK Tools**:
   - Check **Android SDK Build-Tools 34.0.0**
   - Check **NDK (Side by side)** -> `26.1.10909125` (Required for building C++ audio engine)
   - Check **CMake** -> `3.22.1`
   - Check **Android SDK Command-line Tools (latest)**
   - Check **Android SDK Platform-Tools** (contains `adb`)

---

## 4. Configure Environment Variables

### Windows Configuration

Set the following User or System environment variables:

| Variable | Typical Path |
|---|---|
| `JAVA_HOME` | `C:\Program Files\Eclipse Adoptium\jdk-17.0.x` *(or your JDK 17 path)* |
| `ANDROID_HOME` | `%LOCALAPPDATA%\Android\Sdk` |
| `ANDROID_NDK_HOME` | `%LOCALAPPDATA%\Android\Sdk\ndk\26.1.10909125` |

Add these entries to your system `PATH`:
- `%LOCALAPPDATA%\Android\Sdk\platform-tools` *(provides `adb`)*
- `%LOCALAPPDATA%\Android\Sdk\emulator` *(provides `emulator`)*
- `%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest\bin`
- `%JAVA_HOME%\bin`

### macOS / Linux Configuration (`~/.zshrc` or `~/.bashrc`)

Add the following lines to your profile:

```bash
# Java 17
export JAVA_HOME=$(/usr/libexec/java_home -v 17)

# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export ANDROID_NDK_HOME=$ANDROID_HOME/ndk/26.1.10909125

# PATH additions
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$JAVA_HOME/bin
```

---

## 5. Environment Verification Checklist

Run these commands in a fresh terminal window to confirm everything is ready:

```bash
# Check Node.js
node -v

# Check Java 17
java -version

# Check ADB
adb version

# Check connected Android devices or emulators
adb devices
```

If all commands execute without error, proceed to [**`03_INSTALLATION.md`**](./03_INSTALLATION.md)!
