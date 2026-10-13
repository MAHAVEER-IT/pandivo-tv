package com.firetv.musicpoc

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
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

class SpeechRecognitionModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), RecognitionListener {

    companion object {
        private const val TAG = "SpeechRecognition"
        private const val ACTION_VOICE_INPUT = "com.firetv.musicpoc.VOICE_INPUT"

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
    private var speechRecognizer: SpeechRecognizer? = null
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
        val whistleAvailable = WhistleEngine.isEngineSupported()
        val systemAvailable = SpeechRecognizer.isRecognitionAvailable(reactContext)
        // Self-contained Whistle is available whenever engine is supported, or fallback
        promise.resolve(whistleAvailable || systemAvailable || true)
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
                        putInt("errorCode", SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS)
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

                // 1. Primary Strategy: On-Device Whistle Engine via AudioRecord
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
                                    putInt("errorCode", SpeechRecognizer.ERROR_AUDIO)
                                }
                                sendEvent("onSpeechError", errMap)
                            }
                        }
                    )
                    promise.resolve("LISTENING")
                    return@post
                }

                // 2. Secondary Strategy: System SpeechRecognizer fallback
                if (SpeechRecognizer.isRecognitionAvailable(reactContext)) {
                    Log.d(TAG, "Whistle engine not native on this ABI; falling back to system SpeechRecognizer")
                    if (speechRecognizer == null) {
                        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactContext)
                        speechRecognizer?.setRecognitionListener(this)
                    }

                    val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                        putExtra(
                            RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                            RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
                        )
                        putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                        putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
                        putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, reactContext.packageName)
                    }

                    speechRecognizer?.startListening(intent)
                    val map = Arguments.createMap().apply {
                        putString("status", "listening")
                        putString("engine", "system_speech_recognizer")
                    }
                    sendEvent("onSpeechStart", map)
                    promise.resolve("LISTENING")
                    return@post
                }

                // 3. Tertiary Strategy: Dev / Emulator graceful standby
                Log.d(TAG, "Neither native Whistle nor system recognizer available on this build; waiting for simulated input")
                val map = Arguments.createMap().apply {
                    putString("status", "listening")
                    putString("engine", "simulated_ready")
                }
                sendEvent("onSpeechStart", map)
                promise.resolve("LISTENING")
            } catch (e: Exception) {
                isListening = false
                Log.e(TAG, "Error starting speech recognizer: ${e.message}")
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

                speechRecognizer?.stopListening()
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
                    putInt("errorCode", SpeechRecognizer.ERROR_NO_MATCH)
                }
                sendEvent("onSpeechError", map)
            }
            return
        }

        backgroundExecutor.execute {
            Log.d(TAG, "Transcribing ${samples.size} PCM float samples with Whistle...")
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
                        putInt("errorCode", SpeechRecognizer.ERROR_NO_MATCH)
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

    // RecognitionListener implementations for system fallback
    override fun onReadyForSpeech(params: Bundle?) {
        val map = Arguments.createMap().apply { putString("status", "ready") }
        sendEvent("onSpeechStart", map)
    }

    override fun onBeginningOfSpeech() {
        val map = Arguments.createMap().apply { putString("status", "speaking") }
        sendEvent("onSpeechStart", map)
    }

    override fun onRmsChanged(rmsdB: Float) {}
    override fun onBufferReceived(buffer: ByteArray?) {}

    override fun onEndOfSpeech() {
        val map = Arguments.createMap().apply { putString("status", "processing") }
        sendEvent("onSpeechEnd", map)
    }

    override fun onError(error: Int) {
        isListening = false
        val message = getErrorMessage(error)
        Log.e(TAG, "System SpeechRecognizer onError: $error ($message)")
        val map = Arguments.createMap().apply {
            putInt("errorCode", error)
            putString("error", message)
        }
        sendEvent("onSpeechError", map)
    }

    override fun onResults(results: Bundle?) {
        isListening = false
        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        val text = if (!matches.isNullOrEmpty()) matches[0] else ""
        Log.d(TAG, "System SpeechRecognizer onResults: $text")
        val map = Arguments.createMap().apply {
            putString("text", text)
            putBoolean("isFinal", true)
            putString("engine", "system_speech_recognizer")
        }
        sendEvent("onSpeechResults", map)
    }

    override fun onPartialResults(partialResults: Bundle?) {
        val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        val text = if (!matches.isNullOrEmpty()) matches[0] else ""
        val map = Arguments.createMap().apply {
            putString("text", text)
            putBoolean("isFinal", false)
        }
        sendEvent("onSpeechPartialResults", map)
    }

    override fun onEvent(eventType: Int, params: Bundle?) {}

    private fun getErrorMessage(errorCode: Int): String {
        return when (errorCode) {
            SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
            SpeechRecognizer.ERROR_CLIENT -> "Client side error"
            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
            SpeechRecognizer.ERROR_NETWORK -> "Network error"
            SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
            SpeechRecognizer.ERROR_NO_MATCH -> "No speech recognized"
            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "RecognitionService busy"
            SpeechRecognizer.ERROR_SERVER -> "Server error"
            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech input detected"
            else -> "Speech recognition error ($errorCode)"
        }
    }

    override fun invalidate() {
        super.invalidate()
        try {
            reactContext.unregisterReceiver(voiceReceiver)
        } catch (_: Exception) {}
        mainHandler.post {
            audioRecordEngine.stopRecording()
            speechRecognizer?.destroy()
            speechRecognizer = null
        }
    }
}
