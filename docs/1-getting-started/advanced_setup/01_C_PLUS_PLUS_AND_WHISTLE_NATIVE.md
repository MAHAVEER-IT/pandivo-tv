# Whistle C++ Native Speech Engine Setup 🎙️⚡

## Overview

Pandivo TV includes **Whistle**, an ultra-lightweight (16.9 MB), on-device speech-to-text engine compiled from C++ via the Android NDK. This enables Fire TV users to control playback and query the AI DJ with voice commands **completely offline**, without sending raw living-room microphone audio to external servers.

---

## 1. Native Architecture & File Locations

The C++ speech subsystem is organized across the following paths:

```text
FireTVMusicPOC/
├── android/
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── assets/
│   │   │   │   └── whistle.cact             # 16.9 MB quantized neural acoustic weights
│   │   │   ├── cpp/
│   │   │   │   ├── CMakeLists.txt           # Native build configuration & library linking
│   │   │   │   └── whistle_jni.cpp          # JNI bridge between Kotlin and C++
│   │   │   ├── java/com/firetv/musicpoc/
│   │   │   │   ├── AudioRecordEngine.kt     # Low-latency 16 kHz PCM microphone capture
│   │   │   │   ├── WhistleEngine.kt         # JNI bridge wrapper & asset loader
│   │   │   │   └── SpeechRecognitionModule.kt # React Native bridge module
│   │   │   └── jniLibs/
│   │   │       ├── arm64-v8a/
│   │   │       │   └── libwhistle_native.so # Compiled 64-bit ARM shared library
│   │   │       └── x86_64/
│   │   │           └── libwhistle_native.so # Compiled x86_64 emulator shared library
│   └── whistle_native/
│       ├── include/
│       │   └── needle.h                     # Core C++ speech engine headers
│       └── libs/
│           └── android-arm64/
│               └── libneedle.a              # Static precompiled C++ engine library
```

---

## 2. ABI Compatibility Matrix

| Architecture | Device Type | Whistle Native Engine | Fallback Strategy |
|---|---|---|---|
| **`arm64-v8a`** | Physical Fire TV Stick 4K / Cube, Modern Smart TVs | **YES (Fully Supported)** | High-speed C++ JNI inference (<400ms TTFT) |
| **`armeabi-v7a`** | Legacy 32-bit Fire TV Stick Lite | **YES (Compatible)** | 32-bit static library |
| **`x86_64`** | Android Studio Desktop Emulator | **STUB / System Recognizer** | Seamless fallback to Android `SpeechRecognizer` or simulated voice input |

---

## 3. CMake Configuration (`CMakeLists.txt`)

The native build script dynamically enables the real C++ engine on ARM architectures and compiles a graceful stub on emulators:

```cmake
cmake_minimum_required(VERSION 3.22.1)
project(whistle_native)

set(WHISTLE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../../../../whistle_native)
include_directories(${WHISTLE_DIR}/include)

if(${ANDROID_ABI} STREQUAL "arm64-v8a")
    add_library(whistle_native SHARED whistle_jni.cpp)
    target_link_libraries(
        whistle_native
        ${WHISTLE_DIR}/libs/android-arm64/libneedle.a
        android
        log
    )
    target_compile_definitions(whistle_native PRIVATE HAVE_WHISTLE_ENGINE=1)
else()
    # Graceful stub on x86_64 emulator and other ABIs
    add_library(whistle_native SHARED whistle_jni.cpp)
    target_link_libraries(
        whistle_native
        android
        log
    )
    target_compile_definitions(whistle_native PRIVATE HAVE_WHISTLE_ENGINE=0)
endif()
```

---

## 4. Model Asset Verification

The neural network model file `whistle.cact` (16.9 MB) must reside in `android/app/src/main/assets/`. 

To verify the asset is present and uncorrupted:

```bash
# Check file size (should be ~17,738,000 bytes)
ls -lh android/app/src/main/assets/whistle.cact
```

At runtime, `WhistleEngine.kt` streams this asset into memory using Android's `AssetManager` and passes the byte buffer to `nativeLoadModel()`:

```kotlin
val inputStream = context.assets.open("whistle.cact")
val modelBytes = inputStream.readBytes()
val isLoaded = nativeLoadModel(modelBytes)
```

---

## 5. Compiling and Verifying the Native Binary

To trigger a clean recompilation of the native C++ libraries without a full JavaScript rebuild:

### On Windows (PowerShell):
```powershell
cd android
.\gradlew buildCMakeDebug
```

### On macOS / Linux:
```bash
cd android
./gradlew buildCMakeDebug
```

### Verifying Exported JNI Symbols:
You can verify that the shared library exports the expected JNI methods using the NDK's `llvm-nm`:

```bash
$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/*/bin/llvm-nm -D android/app/build/intermediates/merged_native_libs/debug/mergeDebugNativeLibs/out/lib/arm64-v8a/libwhistle_native.so | grep Java_com_firetv_musicpoc
```

Expected output:
```text
00000000000021b0 T Java_com_firetv_musicpoc_WhistleEngine_nativeIsEngineSupported
00000000000021e0 T Java_com_firetv_musicpoc_WhistleEngine_nativeLoadModel
0000000000002280 T Java_com_firetv_musicpoc_WhistleEngine_nativeTranscribe
0000000000002340 T Java_com_firetv_musicpoc_WhistleEngine_nativeGetLastError
```

---

## 6. Android Permissions Configuration

Native audio recording requires specific permissions declared in [`android/app/src/main/AndroidManifest.xml`](../../../android/app/src/main/AndroidManifest.xml):

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Mandatory for AudioRecordEngine -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    
    <!-- TV Hardware Feature: Microphone is optional (app works with D-pad if no mic) -->
    <uses-feature
        android:name="android.hardware.microphone"
        android:required="false" />
</manifest>
```
