# Host Development Environment Setup 💻⚙️

## Overview

This guide walks through configuring a workstation (Windows, macOS, or Linux) to build, run, and debug **Pandivo TV**. Because Pandivo TV combines React Native TVOS with custom C++ JNI speech libraries, both the web/JavaScript toolchain and native Android C/C++ build tools are required.

---

## 1. Node.js & Package Manager

Pandivo TV requires **Node.js LTS (v20.x or v22.x)**.

### Windows (winget):
```powershell
winget install OpenJS.NodeJS.LTS
```

### macOS (Homebrew):
```bash
brew install node@20
brew link node@20
```

### Linux (Ubuntu / Debian):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Verification:
```bash
node -v   # Should output >= v20.12.0
npm -v    # Should output >= 10.5.0
```

---

## 2. Java Development Kit (JDK 17)

React Native 0.86 and Gradle 8+ require **OpenJDK 17**. Do not use JDK 21 or JDK 8.

### Recommended Distributions:
- **Eclipse Temurin JDK 17**: [Adoptium Downloads](https://adoptium.net/temurin/releases/?version=17)
- **Amazon Corretto 17**: [Amazon Corretto Downloads](https://aws.amazon.com/corretto/)

### Windows Installation:
```powershell
winget install EclipseAdoptium.Temurin.17.JDK
```

### macOS Installation:
```bash
brew install openjdk@17
sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
```

### Environment Variable (`JAVA_HOME`):
- **Windows**: Set System Variable `JAVA_HOME` to `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot\`
- **macOS / Linux**: Add to `~/.zshrc` or `~/.bashrc`:
  ```bash
  export JAVA_HOME=$(/usr/libexec/java_home -v 17)
  export PATH=$JAVA_HOME/bin:$PATH
  ```

### Verification:
```bash
javac -version   # Should output: javac 17.0.x
java -version    # Should output: openjdk version "17.0.x"
```

---

## 3. Android Studio & Android SDK

1. Download and install **Android Studio** (Iguana, Jellyfish, or newer) from [developer.android.com/studio](https://developer.android.com/studio).
2. During setup, choose **Standard Installation**.
3. Open Android Studio -> **More Actions** -> **SDK Manager**.

### Required SDK Components:
Under the **SDK Platforms** tab:
- [x] **Android 14.0 ("UpsideDownCake") - API Level 34**
- [x] **Android 11.0 ("Red Velvet Cake") - API Level 30** (standard for Fire OS 8 compatibility)

Under the **SDK Tools** tab (check *Show Package Details*):
- [x] **Android SDK Build-Tools 34.0.0**
- [x] **NDK (Side by side) -> `26.1.10909125` (r26b)** *(Mandatory for Whistle C++ compilation)*
- [x] **CMake -> `3.22.1`** *(Mandatory for native build)*
- [x] **Android SDK Command-line Tools (latest)**
- [x] **Android SDK Platform-Tools** (includes `adb`)

---

## 4. Environment Variables Configuration

### Windows:
Add the following System Variables via *System Properties -> Environment Variables*:

| Variable | Value |
|---|---|
| `ANDROID_HOME` | `%LOCALAPPDATA%\Android\Sdk` |
| `ANDROID_NDK_HOME` | `%LOCALAPPDATA%\Android\Sdk\ndk\26.1.10909125` |

Add to System `PATH`:
- `%ANDROID_HOME%\platform-tools`
- `%ANDROID_HOME%\cmdline-tools\latest\bin`
- `%JAVA_HOME%\bin`

### macOS / Linux:
Append the following to your `~/.zshrc` or `~/.bashrc`:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export ANDROID_NDK_HOME=$ANDROID_HOME/ndk/26.1.10909125
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/emulator
```

Reload shell configuration:
```bash
source ~/.zshrc   # or source ~/.bashrc
```

---

## 5. Verification Checklist

Run this quick audit in your terminal to ensure your environment is fully primed:

```bash
# 1. Verify ADB tool is found
adb --version
# Expected: Android Debug Bridge version 1.0.41+

# 2. Verify Android SDK directory exists
echo $ANDROID_HOME # or echo %ANDROID_HOME% in cmd

# 3. Verify NDK directory
ls "$ANDROID_HOME/ndk/26.1.10909125" # or dir in PowerShell

# 4. Verify CMake
cmake --version
# Expected: cmake version 3.22.1 or newer
```

---

## 6. Project Setup & Dependency Installation

Clone and install dependencies:

```bash
# Clone the repository
git clone https://github.com/MAHAVEER-IT/pandivo-tv.git
cd pandivo-tv/FireTVMusicPOC

# Install JavaScript and TV-specific packages
npm install
```

> [!TIP]
> Pandivo TV overrides `react-native` with `react-native-tvos@0.86-stable` in `package.json`. Always run `npm install` directly; do not run `expo install react-native` as that would overwrite the television focus engine.
