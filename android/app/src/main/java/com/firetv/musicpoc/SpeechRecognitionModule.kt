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

        // Keyword biasing list tailored for AI DJ moods, genres, and TV controls
        private val MUSIC_KEYWORDS = listOf(
            "lofi", "chill", "relax", "relaxing", "workout", "gym", "energetic",
            "study", "focus", "acoustic", "synthwave", "electronic", "rock", "pop",
            "hip hop", "jazz", "ambient", "classical", "techno", "house", "party",
            "sleep", "vibe", "mood", "playlist", "fast", "slow", "happy", "sad",
            "coding", "deep focus", "play", "pause", "audius", "ai dj"
        ).joinToString("\n")
    }

    private val mainHandler = Handler(Looper.getMainLooper())
    private val backgroundExecutor = Executors.newSingleThreadExecutor()
    private val audioRecordEngine = AudioRecordEngine()
    private var isListening = false
    private var activePromise: Promise? = null

    private val voiceReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == ACTION_VOICE_INPUT) {
                val query = intent.getStringExtra("query") ?: "Play relaxing lofi music"
                Log.d(TAG, "Voice intent received via broadcast: $query")
                val map = Arguments.createMap().apply {
                    putString("text", query)
                    putBoolean("isFinal", true)
                    putString("engine", "simulated_broadcast")
                }
                sendEvent("onSpeechResults", map)
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

                // 100% On-Device Whistle Engine via AudioRecord (Zero Remote Cloud STT)
                if (WhistleEngine.isEngineSupported()) {
                    Log.d(TAG, "Starting on-device voice recognition using Whistle & AudioRecord...")

                    val map = Arguments.createMap().apply {
                        putString("status", "listening")
                        putString("engine", "whistle_on_device")
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
                    return@post
                }

                // Fallback for dev emulators without native C++ compilation: Standby for simulated ADB broadcast
                Log.d(TAG, "Whistle engine not supported on this architecture; standby for simulated broadcast")
                val map = Arguments.createMap().apply {
                    putString("status", "listening")
                    putString("engine", "simulated_ready")
                }
                sendEvent("onSpeechStart", map)
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

    private fun handleWhistleAudioRecorded(samples: FloatArray) {
        if (samples.isEmpty()) {
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

        backgroundExecutor.execute {
            Log.d(TAG, "Transcribing ${samples.size} PCM float samples with on-device Whistle...")
            val result = WhistleEngine.transcribe(
                pcmSamples = samples,
                language = "en",
                keywords = MUSIC_KEYWORDS
            )

            mainHandler.post {
                isListening = false
                if (result.isSuccess && result.text.isNotBlank()) {
                    Log.i(TAG, "Whistle transcription result: \"${result.text}\" (TTFT: ${result.ttftMs}ms)")
                    val map = Arguments.createMap().apply {
                        putString("text", result.text)
                        putBoolean("isFinal", true)
                        putDouble("ttftMs", result.ttftMs.toDouble())
                        putString("engine", "whistle_on_device")
                    }
                    sendEvent("onSpeechResults", map)
                } else {
                    Log.w(TAG, "Whistle returned empty or error: ${result.error}")
                    val map = Arguments.createMap().apply {
                        putString("error", result.error ?: "No speech recognized")
                        putInt("errorCode", ERROR_NO_MATCH)
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
