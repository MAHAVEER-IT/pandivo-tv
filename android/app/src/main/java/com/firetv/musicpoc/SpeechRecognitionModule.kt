package com.firetv.musicpoc

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.concurrent.Executors

/**
 * 100% On-Device Offline Speech Recognition Module for Android TV & Fire OS.
 *
 * PRIVACY GUARANTEE:
 * - Completely free of Google Play Services, Google Cloud Speech, or any remote STT.
 * - Captures raw PCM audio locally via AudioRecordEngine directly into transient RAM.
 * - Transcribes on-device using the embedded C++ Whistle model (whistle.cact / libwhistle_native.so).
 * - Zero voice audio is ever written to disk or transmitted over the internet.
 */
class SpeechRecognitionModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "SpeechRecognition"
        private const val ACTION_VOICE_INPUT = "com.firetv.musicpoc.VOICE_INPUT"

        // Error code constants matching standard TV error specifications
        const val ERROR_AUDIO = 3
        const val ERROR_CLIENT = 5
        const val ERROR_SPEECH_TIMEOUT = 6
        const val ERROR_NO_MATCH = 7
        const val ERROR_INSUFFICIENT_PERMISSIONS = 9
        const val ERROR_WHISTLE_UNSUPPORTED = 10

        // Aho-Corasick Keyword & Phrase Biasing List for Whistle Engine
        private val MUSIC_KEYWORDS = listOf(
            // TV Voice Commands & Conversational Triggers
            "play", "pause", "resume", "stop", "skip", "next", "previous", "shuffle",
            "play music", "play songs", "play some", "put on some", "put on",
            "start ai dj", "ai dj", "dj", "create a playlist", "make a playlist",
            "build a mix", "curate a playlist", "find music", "search for",

            // Moods & Emotional Vibes
            "lofi", "lo-fi", "chill", "chillout", "relaxing", "relax", "calm",
            "peaceful", "energetic", "high energy", "upbeat", "workout", "gym",
            "fitness", "running", "study", "studying", "focus", "deep focus",
            "coding", "programming", "work", "gaming", "sleep", "sleeping",
            "bedtime", "ambient", "happy", "feel good", "sad", "melancholy",
            "romantic", "dreamy", "mellow", "hype", "intense", "dark",
            "nostalgic", "atmospheric", "groove", "groovy", "vibe", "mood",

            // Musical Genres & Styles
            "acoustic", "acoustic guitar", "piano", "synthwave", "electronic",
            "edm", "rock", "pop", "hip hop", "rap", "r&b", "jazz", "smooth jazz",
            "classical", "techno", "house", "deep house", "party", "dance",
            "indie", "alternative", "folk", "reggae", "blues", "country",
            "soul", "funk", "disco", "trap", "instrumental", "vocals",

            // Contexts & Occasions
            "morning", "morning coffee", "evening", "late night", "night",
            "dinner", "cooking", "meditation", "road trip", "driving",
            "clean", "fast", "slow", "heavy", "soft",

            // Top Catalog Artists & Songs for High Search Parity
            "rose", "rose noir", "beauty", "chillhop", "chillhop music",
            "mora", "de la rose", "aurora", "gabo", "shape of you", "ed sheeran",
            "shallow", "lady gaga", "bradley cooper", "boukas", "breeze",
            "coldplay", "eminem", "billie eilish", "the weeknd", "audius"
        ).joinToString("\n")

        // Known Whisper neural network silence hallucinations
        private val KNOWN_SILENCE_HALLUCINATIONS = setOf(
            "thank you", "thank you.", "thank you!", "thank you very much", "thank you very much.",
            "happy birthday", "happy birthday!", "happy birthday.",
            "thanks for watching", "thanks for watching.", "thanks for watching!",
            "please subscribe", "subscribe", "subtitles by", "you", ".", "..."
        )
    }

    private val mainHandler = Handler(Looper.getMainLooper())
    private val backgroundExecutor = Executors.newSingleThreadExecutor()
    private val audioRecordEngine = AudioRecordEngine()
    private var isListening = false
    private var activePromise: Promise? = null

    private val voiceReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == ACTION_VOICE_INPUT) {
                val query = intent.getStringExtra("query")
                if (!query.isNullOrBlank()) {
                    Log.d(TAG, "Voice intent received via broadcast: $query")
                    val map = Arguments.createMap().apply {
                        putString("text", query.trim())
                        putBoolean("isFinal", true)
                        putString("engine", "adb_voice_command")
                    }
                    sendEvent("onSpeechResults", map)
                } else {
                    Log.w(TAG, "Voice broadcast received without query extra")
                }
            }
        }
    }

    init {
        try {
            val filter = IntentFilter(ACTION_VOICE_INPUT)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                reactContext.registerReceiver(voiceReceiver, filter, Context.RECEIVER_EXPORTED)
            } else {
                reactContext.registerReceiver(voiceReceiver, filter)
            }
            Log.d(TAG, "Registered broadcast receiver for $ACTION_VOICE_INPUT")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to register broadcast receiver: ${e.message}")
        }

        // Initialize Whistle 16.9 MB engine in background
        WhistleEngine.initialize(reactContext) { success ->
            Log.i(TAG, "Whistle Engine initialization complete: success=$success (supported=${WhistleEngine.isEngineSupported()})")
        }
    }

    override fun getName(): String = "SpeechRecognition"

    private fun sendEvent(eventName: String, params: WritableMap?) {
        if (reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        }
    }

    @ReactMethod
    fun isAvailable(promise: Promise) {
        // 100% On-Device Whistle Engine availability
        val whistleAvailable = WhistleEngine.isEngineSupported()
        promise.resolve(whistleAvailable)
    }

    @ReactMethod
    fun startListening(promise: Promise) {
        mainHandler.post {
            try {
                val hasPermission = ContextCompat.checkSelfPermission(
                    reactContext,
                    Manifest.permission.RECORD_AUDIO
                ) == PackageManager.PERMISSION_GRANTED

                if (!hasPermission) {
                    val map = Arguments.createMap().apply {
                        putString("error", "Microphone permission not granted")
                        putInt("errorCode", ERROR_INSUFFICIENT_PERMISSIONS)
                    }
                    sendEvent("onSpeechError", map)
                    promise.reject("PERMISSION_DENIED", "Microphone permission not granted")
                    return@post
                }

                if (isListening) {
                    promise.resolve("ALREADY_LISTENING")
                    return@post
                }

                isListening = true
                activePromise = promise

                // 100% On-Device Voice Engine via AudioRecord (Zero Remote Cloud STT)
                Log.d(TAG, "Starting on-device voice recognition using AudioRecordEngine...")

                val map = Arguments.createMap().apply {
                    putString("status", "listening")
                    putString("engine", if (WhistleEngine.isEngineSupported()) "whistle_on_device" else "audio_record_vocal")
                }
                sendEvent("onSpeechStart", map)

                audioRecordEngine.startRecording(
                    onAudioReady = { pcmFloatSamples ->
                        handleWhistleAudioRecorded(pcmFloatSamples)
                    },
                    onError = { errorMsg ->
                        mainHandler.post {
                            isListening = false
                            val errMap = Arguments.createMap().apply {
                                putString("error", errorMsg)
                                putInt("errorCode", ERROR_AUDIO)
                            }
                            sendEvent("onSpeechError", errMap)
                        }
                    }
                )
                promise.resolve("LISTENING")
            } catch (e: Exception) {
                isListening = false
                Log.e(TAG, "Error starting speech recognition: ${e.message}")
                promise.reject("ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun stopListening(promise: Promise) {
        mainHandler.post {
            try {
                if (audioRecordEngine.isCurrentlyRecording()) {
                    val endMap = Arguments.createMap().apply { putString("status", "processing") }
                    sendEvent("onSpeechEnd", endMap)
                    audioRecordEngine.stopRecording()
                }

                isListening = false
                promise.resolve("STOPPED")
            } catch (e: Exception) {
                promise.reject("ERROR", e.message)
            }
        }
    }

    private fun handleWhistleAudioRecorded(rawSamples: FloatArray) {
        if (rawSamples.isEmpty()) {
            mainHandler.post {
                isListening = false
                val map = Arguments.createMap().apply {
                    putString("error", "No speech recorded")
                    putInt("errorCode", ERROR_NO_MATCH)
                }
                sendEvent("onSpeechError", map)
            }
            return
        }

        // Apply high-pass filtering (~80Hz), VAD silence trimming, and peak AGC normalization
        val samples = AudioPreprocessor.process(rawSamples)

        // Calculate audio RMS and peak to verify speech presence
        var sumSquares = 0.0
        var peak = 0.0f
        for (sample in samples) {
            sumSquares += (sample * sample).toDouble()
            val absVal = kotlin.math.abs(sample)
            if (absVal > peak) peak = absVal
        }
        val rms = kotlin.math.sqrt(sumSquares / samples.size).toFloat()
        val hasSpeechEnergy = rms > 0.010f || peak > 0.05f
        Log.d(TAG, "Microphone audio captured & preprocessed: ${samples.size} samples, RMS: $rms, Peak: $peak, speechEnergy=$hasSpeechEnergy")

        // CRITICAL FIX: If audio energy is below speech threshold (silence), do NOT pass to Whistle.
        // Whisper neural networks hallucinate training phrases ("Thank you", "Happy birthday") on silence.
        if (!hasSpeechEnergy) {
            Log.w(TAG, "Audio energy below speech threshold (RMS: $rms, Peak: $peak). Emitting no-speech timeout error.")
            mainHandler.post {
                isListening = false
                val map = Arguments.createMap().apply {
                    putString("error", "No speech detected")
                    putInt("errorCode", ERROR_SPEECH_TIMEOUT)
                }
                sendEvent("onSpeechError", map)
            }
            return
        }

        backgroundExecutor.execute {
            var recognizedText = ""
            var ttft = 0f

            if (WhistleEngine.isEngineSupported()) {
                Log.d(TAG, "Transcribing ${samples.size} PCM float samples with on-device Whistle...")
                val result = WhistleEngine.transcribe(
                    pcmSamples = samples,
                    language = "en",
                    keywords = MUSIC_KEYWORDS
                )
                if (result.isSuccess && result.text.isNotBlank()) {
                    val rawText = result.text.trim()
                    ttft = result.ttftMs
                    val normalized = rawText.lowercase().trim()

                    // Guard against Whisper silence hallucination phrases if audio was faint
                    val isHallucination = KNOWN_SILENCE_HALLUCINATIONS.contains(normalized) && rms < 0.020f
                    if (isHallucination) {
                        Log.w(TAG, "Discarded Whisper silence hallucination: \"$rawText\" (RMS: $rms, Peak: $peak)")
                        recognizedText = ""
                    } else {
                        recognizedText = rawText
                        Log.i(TAG, "Whistle transcription result: \"$recognizedText\" (TTFT: ${ttft}ms)")
                    }
                } else {
                    Log.w(TAG, "Whistle returned empty or error: ${result.error}")
                }
            }

            mainHandler.post {
                isListening = false
                if (recognizedText.isNotBlank()) {
                    val map = Arguments.createMap().apply {
                        putString("text", recognizedText)
                        putBoolean("isFinal", true)
                        putDouble("ttftMs", ttft.toDouble())
                        putString("engine", if (WhistleEngine.isEngineSupported()) "whistle_on_device" else "audio_record")
                    }
                    sendEvent("onSpeechResults", map)
                } else {
                    Log.w(TAG, "No speech recognized or speech was unintelligible (hasEnergy=$hasSpeechEnergy, RMS=$rms, Peak=$peak)")
                    val map = Arguments.createMap().apply {
                        putString("error", if (hasSpeechEnergy) "Could not recognize speech, please try speaking again" else "No speech detected")
                        putInt("errorCode", if (hasSpeechEnergy) ERROR_NO_MATCH else ERROR_SPEECH_TIMEOUT)
                    }
                    sendEvent("onSpeechError", map)
                }
            }
        }
    }

    @ReactMethod
    fun simulateVoiceInput(text: String, promise: Promise) {
        mainHandler.post {
            Log.d(TAG, "Simulating voice input: $text")
            val map = Arguments.createMap().apply {
                putString("text", text)
                putBoolean("isFinal", true)
                putString("engine", "simulated")
            }
            sendEvent("onSpeechResults", map)
            promise.resolve(text)
        }
    }

    override fun invalidate() {
        super.invalidate()
        try {
            reactContext.unregisterReceiver(voiceReceiver)
        } catch (_: Exception) {}
        mainHandler.post {
            audioRecordEngine.stopRecording()
        }
    }
}

/**
 * Audio preprocessor designed specifically for Whistle / Whisper neural speech recognition:
 * 1. 1-pole High-Pass Filter (cutoff ~80 Hz): Removes DC offset and sub-80Hz low rumble.
 * 2. Voice Activity Detection (VAD) Silence Trimming: Removes leading and trailing dead silence
 *    with a 160ms safety padding window.
 * 3. Peak Normalization / AGC (Automatic Gain Control): Scales low-volume TV remote mic audio
 *    so maximum peak reaches nominal 0.85 dynamic range for optimal 80-channel log-mel extraction.
 */
object AudioPreprocessor {
    private const val TAG = "AudioPreprocessor"
    private const val FRAME_SIZE = 320 // 20ms at 16kHz
    private const val VAD_PADDING_SAMPLES = 2560 // 160ms safety margin

    fun process(rawSamples: FloatArray): FloatArray {
        if (rawSamples.isEmpty()) return rawSamples

        // Step 1: 1-pole High-Pass Filter (cutoff ~80Hz at 16kHz)
        val alpha = 0.97f
        val filtered = FloatArray(rawSamples.size)
        var prevIn = 0f
        var prevOut = 0f
        for (i in rawSamples.indices) {
            val currIn = rawSamples[i]
            val currOut = alpha * (prevOut + currIn - prevIn)
            filtered[i] = currOut
            prevIn = currIn
            prevOut = currOut
        }

        // Step 2: Voice Activity Detection (VAD) Trimming
        val numFrames = filtered.size / FRAME_SIZE
        var firstSpeechFrame = -1
        var lastSpeechFrame = -1
        val frameRmsThreshold = 0.006f

        for (f in 0 until numFrames) {
            val startIdx = f * FRAME_SIZE
            var sumSquares = 0.0
            for (i in 0 until FRAME_SIZE) {
                val s = filtered[startIdx + i]
                sumSquares += (s * s).toDouble()
            }
            val frameRms = kotlin.math.sqrt(sumSquares / FRAME_SIZE).toFloat()
            if (frameRms > frameRmsThreshold) {
                if (firstSpeechFrame == -1) {
                    firstSpeechFrame = f
                }
                lastSpeechFrame = f
            }
        }

        val trimmedSamples = if (firstSpeechFrame != -1 && lastSpeechFrame != -1) {
            val startSample = (firstSpeechFrame * FRAME_SIZE - VAD_PADDING_SAMPLES).coerceAtLeast(0)
            val endSample = ((lastSpeechFrame + 1) * FRAME_SIZE + VAD_PADDING_SAMPLES).coerceAtMost(filtered.size)
            if (endSample > startSample) {
                filtered.copyOfRange(startSample, endSample)
            } else {
                filtered
            }
        } else {
            filtered
        }

        // Step 3: Peak AGC Normalization (Target peak: 0.85)
        var peak = 0f
        for (s in trimmedSamples) {
            val absVal = kotlin.math.abs(s)
            if (absVal > peak) peak = absVal
        }

        if (peak >= 0.015f) {
            val targetPeak = 0.85f
            val gain = (targetPeak / peak).coerceIn(1.0f, 6.0f)
            Log.d(TAG, "Audio preprocessed: rawPeak=$peak, appliedGain=${gain}x, finalSamples=${trimmedSamples.size} (${trimmedSamples.size / 16000f}s)")
            for (i in trimmedSamples.indices) {
                trimmedSamples[i] = (trimmedSamples[i] * gain).coerceIn(-1.0f, 1.0f)
            }
        }

        return trimmedSamples
    }
}
