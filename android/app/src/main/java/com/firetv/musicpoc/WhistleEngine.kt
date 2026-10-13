package com.firetv.musicpoc

import android.content.Context
import android.util.Log
import org.json.JSONObject
import java.io.InputStream
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

data class WhistleResult(
    val text: String,
    val language: String = "en",
    val isSuccess: Boolean = true,
    val error: String? = null,
    val ttftMs: Float = 0f,
    val decodeTps: Float = 0f
)

object WhistleEngine {
    private const val TAG = "WhistleEngine"
    private const val MODEL_ASSET_NAME = "whistle.cact"

    private val isLoaded = AtomicBoolean(false)
    private val isLoading = AtomicBoolean(false)
    private var isSupported = false
    private val executor = Executors.newSingleThreadExecutor()

    init {
        try {
            System.loadLibrary("whistle_native")
            isSupported = nativeIsEngineSupported()
            Log.d(TAG, "whistle_native loaded successfully. Engine supported on this ABI: $isSupported")
        } catch (e: Throwable) {
            Log.e(TAG, "Failed to load whistle_native library: ${e.message}")
            isSupported = false
        }
    }

    external fun nativeIsEngineSupported(): Boolean
    external fun nativeLoadModel(modelBytes: ByteArray): Boolean
    external fun nativeTranscribe(
        pcmSamples: FloatArray,
        sampleCount: Int,
        language: String?,
        keywords: String?
    ): String
    external fun nativeGetLastError(): String

    fun isEngineReady(): Boolean = isLoaded.get()

    fun isEngineSupported(): Boolean = isSupported

    fun initialize(context: Context, onComplete: ((Boolean) -> Unit)? = null) {
        if (isLoaded.get()) {
            onComplete?.invoke(true)
            return
        }

        if (!isSupported) {
            Log.w(TAG, "Whistle engine not supported natively on this architecture (using graceful fallback)")
            onComplete?.invoke(false)
            return
        }

        if (isLoading.compareAndSet(false, true)) {
            executor.execute {
                try {
                    Log.d(TAG, "Loading Whistle model asset: $MODEL_ASSET_NAME...")
                    val startTime = System.currentTimeMillis()
                    val inputStream: InputStream = context.assets.open(MODEL_ASSET_NAME)
                    val modelBytes = inputStream.readBytes()
                    inputStream.close()
                    Log.d(TAG, "Read ${modelBytes.size} bytes in ${System.currentTimeMillis() - startTime}ms. Calling nativeLoadModel...")

                    val success = nativeLoadModel(modelBytes)
                    isLoaded.set(success)
                    isLoading.set(false)

                    if (success) {
                        Log.i(TAG, "Whistle 16.9 MB model initialized successfully!")
                    } else {
                        val err = nativeGetLastError()
                        Log.e(TAG, "Failed to initialize Whistle model: $err")
                    }
                    onComplete?.invoke(success)
                } catch (e: Exception) {
                    isLoading.set(false)
                    Log.e(TAG, "Exception loading Whistle model asset: ${e.message}", e)
                    onComplete?.invoke(false)
                }
            }
        }
    }

    fun transcribe(
        pcmSamples: FloatArray,
        language: String? = "en",
        keywords: String? = null
    ): WhistleResult {
        if (!isSupported) {
            return WhistleResult(
                text = "",
                isSuccess = false,
                error = "unsupported_architecture"
            )
        }

        if (!isLoaded.get()) {
            return WhistleResult(
                text = "",
                isSuccess = false,
                error = "model_not_loaded"
            )
        }

        try {
            val jsonStr = nativeTranscribe(pcmSamples, pcmSamples.size, language, keywords)
            val json = JSONObject(jsonStr)

            if (json.has("error")) {
                val err = json.optString("error", "unknown_error")
                return WhistleResult(text = "", isSuccess = false, error = err)
            }

            val text = json.optString("text", "").trim()
            val detectedLang = json.optString("language", language ?: "en")
            val ttft = json.optDouble("ttft_ms", 0.0).toFloat()
            val tps = json.optDouble("decode_tps", 0.0).toFloat()

            return WhistleResult(
                text = text,
                language = detectedLang,
                isSuccess = true,
                ttftMs = ttft,
                decodeTps = tps
            )
        } catch (e: Exception) {
            Log.e(TAG, "Error in transcribe: ${e.message}", e)
            return WhistleResult(
                text = "",
                isSuccess = false,
                error = e.message
            )
        }
    }
}
