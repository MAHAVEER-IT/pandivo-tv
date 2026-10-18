# Offline Voice & Speech Recognition Functions 🎙️⚡

## Overview

The Offline Voice subsystem enables real-time, privacy-first speech-to-text without requiring external cloud STT services or network connectivity. It uses the bundled **Whistle C++ speech engine** (16.9 MB quantized acoustic model in assets) as the **100% exclusive on-device engine**—eliminating all dependency on Google Play Services or cloud SpeechRecognizer APIs.

- **React Native Hook:** [`FireTVMusicPOC/src/hooks/useSpeechRecognition.ts`](../../../src/hooks/useSpeechRecognition.ts)
- **Android Native Module:** [`FireTVMusicPOC/android/app/src/main/java/com/firetv/musicpoc/SpeechRecognitionModule.kt`](../../../android/app/src/main/java/com/firetv/musicpoc/SpeechRecognitionModule.kt)
- **Whistle Engine Bridge:** [`FireTVMusicPOC/android/app/src/main/java/com/firetv/musicpoc/WhistleEngine.kt`](../../../android/app/src/main/java/com/firetv/musicpoc/WhistleEngine.kt)
- **JNI C++ Wrapper:** [`FireTVMusicPOC/android/app/src/main/cpp/whistle_jni.cpp`](../../../android/app/src/main/cpp/whistle_jni.cpp)

---

## 1. `SpeechRecognition.startListening()`

### Purpose:
Invoked when the user presses the Voice / Mic button on the Fire TV remote or triggers Voice Search in the UI. Checks audio recording permissions, pauses background music playback, starts PCM audio capture via `AudioRecordEngine`, and routes live audio frames directly to the on-device Whistle engine.

### Kotlin Method Signature:
```kotlin
@ReactMethod
fun startListening(promise: Promise)
```

### Emitted Events:
- `onSpeechStart`: Emitted when microphone audio capture begins (`{ status: "listening", engine: "whistle_on_device" }`).
- `onSpeechResults`: Emitted when transcription finishes (`{ text: string, isFinal: boolean, ttftMs: number }`).
- `onSpeechError`: Emitted if mic access fails or speech is silent (`{ error: string, errorCode: number }`).

### Simple Example (React Native):
```typescript
import { NativeModules, NativeEventEmitter } from 'react-native';

const { SpeechRecognition } = NativeModules;
const speechEvents = new NativeEventEmitter(SpeechRecognition);

async function startVoiceInput() {
  // Listen for speech results
  const sub = speechEvents.addListener('onSpeechResults', (event) => {
    console.log('Recognized query:', event.text);
    console.log('Time to First Token:', event.ttftMs, 'ms');
  });

  // Start microphone capture
  await SpeechRecognition.startListening();
}
```

---

## 2. `SpeechRecognition.stopListening()`

### Purpose:
Stops active audio capture, halts the background recording thread, flushes the final audio frame buffer into the Whistle engine, and emits `onSpeechEnd`.

### Kotlin Method Signature:
```kotlin
@ReactMethod
fun stopListening(promise: Promise)
```

### Simple Example:
```typescript
import { NativeModules } from 'react-native';

const { SpeechRecognition } = NativeModules;

async function cancelListening() {
  await SpeechRecognition.stopListening();
  console.log('Microphone released.');
}
```

---

## 3. `SpeechRecognition.isAvailable()`

### Purpose:
Checks whether voice recognition can be executed on the current hardware. Resolves `true` if the native on-device Whistle library is supported and ready on the device ABI (`arm64-v8a`, `armeabi-v7a`, `x86_64`). Guarantees zero reliance on Google Play Services or cloud speech engines.

### Kotlin Method Signature:
```kotlin
@ReactMethod
fun isAvailable(promise: Promise)
```

### Simple Example:
```typescript
import { NativeModules } from 'react-native';

const { SpeechRecognition } = NativeModules;

async function checkVoiceSupport() {
  const available = await SpeechRecognition.isAvailable();
  if (!available) {
    console.warn('Voice recognition not supported on this TV device.');
  }
}
```

---

## 4. `WhistleEngine.transcribe(pcmSamples, language?, keywords?)`

### Purpose:
Performs synchronous on-device speech transcription directly in C++ through JNI. Accepts raw 16 kHz mono float PCM samples and an optional newline-separated keyword biasing list (e.g. music genres, moods, artist names) to maximize recognition accuracy on low-end TV processors.

### Kotlin Function Signature:
```kotlin
fun transcribe(
    pcmSamples: FloatArray,
    language: String? = "en",
    keywords: String? = null
): WhistleResult
```

### Return Data Structure:
```kotlin
data class WhistleResult(
    val text: String,
    val language: String = "en",
    val isSuccess: Boolean = true,
    val error: String? = null,
    val ttftMs: Float = 0f,
    val decodeTps: Float = 0f
)
```

### Simple Example (Native Android / Kotlin):
```kotlin
import com.firetv.musicpoc.WhistleEngine

fun processAudioClip(samples: FloatArray) {
    val musicKeywords = "lofi\nchill\nrock\npop\nworkout\nai dj"
    
    val result = WhistleEngine.transcribe(
        pcmSamples = samples,
        language = "en",
        keywords = musicKeywords
    )

    if (result.isSuccess) {
        println("Recognized text: ${result.text}")
        println("Inference latency: ${result.ttftMs} ms")
    } else {
        println("Transcription error: ${result.error}")
    }
}
```

---

## 5. `useSpeechRecognition(props)` Hook

### Purpose:
High-level React hook that wraps native permissions, playback ducking (pausing music while listening), timeout recovery for Android TV emulators, and routing recognized voice commands into search or the AI DJ session.

### Hook Signature:
```typescript
export function useSpeechRecognition(props: UseSpeechRecognitionProps): {
  isListening: boolean;
  voiceTranscript: string;
  voiceToast: string | null;
  handleToggleVoice: () => Promise<void>;
}
```

### Simple Example:
```typescript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSpeechRecognition } from 'FireTVMusicPOC/src/hooks/useSpeechRecognition';

export function TVMicWidget() {
  const { isListening, voiceTranscript, voiceToast, handleToggleVoice } = useSpeechRecognition({
    onVoiceCommand: (text) => console.log('User said:', text),
    onSpeechFailure: (reason) => console.log('Voice failed:', reason),
    isPlaylistActive: () => false,
    isSearchActive: () => false,
    isAiDjActive: () => true,
    pausePlayback: () => console.log('Ducking audio...'),
    resumePlayback: () => console.log('Resuming audio...'),
  });

  return (
    <TouchableOpacity onPress={handleToggleVoice} style={{ padding: 16 }}>
      <Text>{isListening ? '🔴 Listening...' : '🎤 Speak'}</Text>
      {voiceToast && <Text>{voiceToast}</Text>}
      {voiceTranscript ? <Text>"{voiceTranscript}"</Text> : null}
    </TouchableOpacity>
  );
}
```
