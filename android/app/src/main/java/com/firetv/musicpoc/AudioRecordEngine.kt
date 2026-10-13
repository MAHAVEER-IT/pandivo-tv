package com.firetv.musicpoc

import android.annotation.SuppressLint
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.util.Log
import java.util.concurrent.atomic.AtomicBoolean

class AudioRecordEngine {
    companion object {
        private const val TAG = "AudioRecordEngine"
        const val SAMPLE_RATE = 16000
        private const val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
        private const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
        private const val MAX_DURATION_MS = 6000L // 6 seconds max for TV voice commands
    }

    private var audioRecord: AudioRecord? = null
    private var recordingThread: Thread? = null
    private val isRecording = AtomicBoolean(false)

    @SuppressLint("MissingPermission")
    fun startRecording(
        onAudioReady: (FloatArray) -> Unit,
        onError: (String) -> Unit
    ) {
        if (isRecording.get()) {
            Log.w(TAG, "Recording already in progress")
            return
        }

        val minBufferSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT)
        if (minBufferSize == AudioRecord.ERROR || minBufferSize == AudioRecord.ERROR_BAD_VALUE) {
            onError("Invalid audio buffer size")
            return
        }

        val bufferSize = (minBufferSize * 2).coerceAtLeast(SAMPLE_RATE / 2)

        try {
            // First try VOICE_RECOGNITION source (ideal for TV remotes), fallback to MIC
            var record: AudioRecord? = null
            val sources = intArrayOf(
                MediaRecorder.AudioSource.VOICE_RECOGNITION,
                MediaRecorder.AudioSource.MIC
            )

            for (src in sources) {
                try {
                    val candidate = AudioRecord(src, SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT, bufferSize)
                    if (candidate.state == AudioRecord.STATE_INITIALIZED) {
                        record = candidate
                        Log.d(TAG, "AudioRecord initialized with source: $src")
                        break
                    } else {
                        candidate.release()
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Failed to initialize AudioRecord with source $src: ${e.message}")
                }
            }

            if (record == null) {
                onError("Failed to initialize AudioRecord on any audio source")
                return
            }

            audioRecord = record
            record.startRecording()
            isRecording.set(true)

            recordingThread = Thread {
                val recordedSamples = mutableListOf<Short>()
                val readBuffer = ShortArray(bufferSize / 2)
                val startTime = System.currentTimeMillis()

                try {
                    while (isRecording.get() && (System.currentTimeMillis() - startTime) < MAX_DURATION_MS) {
                        val readCount = record.read(readBuffer, 0, readBuffer.size)
                        if (readCount > 0) {
                            for (i in 0 until readCount) {
                                recordedSamples.add(readBuffer[i])
                            }
                        } else if (readCount < 0) {
                            Log.e(TAG, "AudioRecord read error: $readCount")
                            break
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error in recording loop: ${e.message}", e)
                } finally {
                    try {
                        record.stop()
                        record.release()
                    } catch (e: Exception) {
                        Log.w(TAG, "Error stopping AudioRecord: ${e.message}")
                    }
                    audioRecord = null
                    isRecording.set(false)

                    // Convert short samples to normalized float [-1.0f, 1.0f]
                    val floatSamples = FloatArray(recordedSamples.size)
                    for (i in recordedSamples.indices) {
                        floatSamples[i] = (recordedSamples[i].toFloat() / 32768.0f).coerceIn(-1.0f, 1.0f)
                    }

                    Log.d(TAG, "Audio recording finished. Captured ${floatSamples.size} samples (${floatSamples.size / SAMPLE_RATE.toFloat()}s)")
                    onAudioReady(floatSamples)
                }
            }.apply {
                name = "WhistleAudioRecordThread"
                start()
            }
        } catch (e: Exception) {
            isRecording.set(false)
            Log.e(TAG, "Failed to start recording: ${e.message}", e)
            onError(e.message ?: "Failed to start audio recording")
        }
    }

    fun stopRecording() {
        if (isRecording.compareAndSet(true, false)) {
            Log.d(TAG, "Stop recording requested")
        }
    }

    fun isCurrentlyRecording(): Boolean = isRecording.get()
}
