package com.firetv.musicpoc

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.hardware.usb.UsbManager
import android.media.MediaMetadataRetriever
import android.os.Build
import android.os.Environment
import android.os.storage.StorageManager
import android.os.storage.StorageVolume
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.io.FileOutputStream

data class UsbVolumeInfo(
    val path: String,
    val name: String,
    val totalSpace: Long,
    val freeSpace: Long
)

class UsbStorageModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "UsbStorageModule"
    }

    override fun getName(): String = "UsbStorageModule"

    private val usbReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val action = intent?.action ?: return
            Log.d(TAG, "USB Storage Broadcast received: $action")
            notifyUsbStatusChange()
        }
    }

    init {
        try {
            val filter = IntentFilter().apply {
                addAction(Intent.ACTION_MEDIA_MOUNTED)
                addAction(Intent.ACTION_MEDIA_UNMOUNTED)
                addAction(Intent.ACTION_MEDIA_EJECT)
                addAction(Intent.ACTION_MEDIA_REMOVED)
                addAction(Intent.ACTION_MEDIA_BAD_REMOVAL)
                addDataScheme("file")
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                reactContext.registerReceiver(usbReceiver, filter, Context.RECEIVER_EXPORTED)
            } else {
                reactContext.registerReceiver(usbReceiver, filter)
            }

            // Also register for UsbManager hardware plug/unplug events
            val hardwareFilter = IntentFilter().apply {
                addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED)
                addAction(UsbManager.ACTION_USB_DEVICE_DETACHED)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                reactContext.registerReceiver(usbReceiver, hardwareFilter, Context.RECEIVER_EXPORTED)
            } else {
                reactContext.registerReceiver(usbReceiver, hardwareFilter)
            }
            Log.d(TAG, "Registered USB Storage BroadcastReceivers successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to register USB BroadcastReceivers: ${e.message}")
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send event $eventName: ${e.message}")
        }
    }

    private fun notifyUsbStatusChange() {
        val volumes = findRemovableStoragePaths()
        val map = Arguments.createMap().apply {
            putBoolean("isConnected", volumes.isNotEmpty())
            if (volumes.isNotEmpty()) {
                val primary = volumes.first()
                putString("volumePath", primary.path)
                putString("driveName", primary.name)
                putDouble("totalSpaceBytes", primary.totalSpace.toDouble())
                putDouble("freeSpaceBytes", primary.freeSpace.toDouble())
            } else {
                putNull("volumePath")
                putNull("driveName")
                putDouble("totalSpaceBytes", 0.0)
                putDouble("freeSpaceBytes", 0.0)
            }
        }
        sendEvent("onUsbStatusChanged", map)
    }

    private fun findRemovableStoragePaths(): List<UsbVolumeInfo> {
        val volumes = mutableListOf<UsbVolumeInfo>()

        // 1. Check official Android StorageManager API
        try {
            val storageManager = reactContext.getSystemService(Context.STORAGE_SERVICE) as? StorageManager
            if (storageManager != null) {
                val storageVolumes = storageManager.storageVolumes
                for (volume in storageVolumes) {
                    if (volume.isRemovable) {
                        var path: String? = null
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                            path = volume.directory?.absolutePath
                        }
                        if (path == null) {
                            try {
                                val getPathMethod = volume.javaClass.getMethod("getPath")
                                path = getPathMethod.invoke(volume) as? String
                            } catch (e: Exception) {
                                // ignore reflection errors
                            }
                        }

                        val state = volume.state
                        val isMounted = state == Environment.MEDIA_MOUNTED ||
                                state == Environment.MEDIA_MOUNTED_READ_ONLY ||
                                (path != null && File(path).canRead())

                        if (path != null && isMounted) {
                            val f = File(path)
                            val desc = volume.getDescription(reactContext) ?: f.name
                            volumes.add(UsbVolumeInfo(path, desc, f.totalSpace, f.freeSpace))
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Error checking StorageManager: ${e.message}")
        }

        // 2. Auxiliary inspection of /storage directory
        try {
            val storageDir = File("/storage")
            if (storageDir.exists() && storageDir.isDirectory) {
                val list = storageDir.listFiles()
                if (list != null) {
                    for (sub in list) {
                        val name = sub.name
                        // Skip internal/emulated system directories
                        if (name != "emulated" && name != "self" && sub.isDirectory) {
                            if (volumes.none { it.path == sub.absolutePath }) {
                                volumes.add(UsbVolumeInfo(sub.absolutePath, "USB Drive ($name)", sub.totalSpace, sub.freeSpace))
                            }
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Error checking /storage directory: ${e.message}")
        }

        // 3. Fallback inspection of /mnt/media_rw or /mnt/usb
        try {
            val mntDirs = listOf(File("/mnt/media_rw"), File("/mnt/usb_storage"), File("/mnt/usb"))
            for (mnt in mntDirs) {
                if (mnt.exists() && mnt.isDirectory) {
                    val list = mnt.listFiles() ?: continue
                    for (sub in list) {
                        if (sub.isDirectory && volumes.none { it.path == sub.absolutePath }) {
                            volumes.add(UsbVolumeInfo(sub.absolutePath, "USB Drive (${sub.name})", sub.totalSpace, sub.freeSpace))
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Error checking /mnt directories: ${e.message}")
        }

        return volumes
    }

    private fun findAudioFilesRecursive(
        dir: File,
        supportedExts: Set<String>,
        result: MutableList<File>,
        depth: Int,
        maxDepth: Int
    ) {
        if (depth > maxDepth || !dir.exists() || !dir.isDirectory) return

        val files = dir.listFiles() ?: return
        for (f in files) {
            val name = f.name
            // Skip hidden directories, system volume information, and app data
            if (name.startsWith(".") ||
                name.equals("LOST.DIR", ignoreCase = true) ||
                name.equals("System Volume Information", ignoreCase = true) ||
                name.equals("\$RECYCLE.BIN", ignoreCase = true) ||
                name.equals("Android", ignoreCase = true)
            ) {
                continue
            }

            if (f.isDirectory) {
                findAudioFilesRecursive(f, supportedExts, result, depth + 1, maxDepth)
            } else if (f.isFile) {
                val ext = f.extension.lowercase()
                if (supportedExts.contains(ext)) {
                    result.add(f)
                }
            }
        }
    }

    @ReactMethod
    fun getUsbStatus(promise: Promise) {
        try {
            val volumes = findRemovableStoragePaths()
            val map = Arguments.createMap()
            if (volumes.isNotEmpty()) {
                val primary = volumes.first()
                map.putBoolean("isConnected", true)
                map.putString("volumePath", primary.path)
                map.putString("driveName", primary.name)
                map.putDouble("totalSpaceBytes", primary.totalSpace.toDouble())
                map.putDouble("freeSpaceBytes", primary.freeSpace.toDouble())
            } else {
                map.putBoolean("isConnected", false)
                map.putNull("volumePath")
                map.putNull("driveName")
                map.putDouble("totalSpaceBytes", 0.0)
                map.putDouble("freeSpaceBytes", 0.0)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            Log.e(TAG, "getUsbStatus error: ${e.message}", e)
            promise.reject("STATUS_ERROR", e.message)
        }
    }

    @ReactMethod
    fun scanUsbTracks(promise: Promise) {
        Thread {
            try {
                val volumes = findRemovableStoragePaths()
                val tracksArray = Arguments.createArray()
                if (volumes.isEmpty()) {
                    Log.d(TAG, "scanUsbTracks: no removable volumes found")
                    promise.resolve(tracksArray)
                    return@Thread
                }

                val supportedExtensions = setOf("mp3", "m4a", "aac", "flac", "wav", "ogg", "wma")
                val audioFiles = mutableListOf<File>()

                for (volume in volumes) {
                    val root = File(volume.path)
                    Log.d(TAG, "Scanning USB volume root: ${root.absolutePath}, exists=${root.exists()}, isDir=${root.isDirectory}")
                    findAudioFilesRecursive(root, supportedExtensions, audioFiles, depth = 0, maxDepth = 8)
                }
                Log.d(TAG, "scanUsbTracks: found ${audioFiles.size} audio files: ${audioFiles.map { it.name }}")

                val artworkCacheDir = File(reactContext.cacheDir, "usb_artworks")
                if (!artworkCacheDir.exists()) {
                    artworkCacheDir.mkdirs()
                }

                val retriever = MediaMetadataRetriever()
                for ((index, file) in audioFiles.withIndex()) {
                    var title = file.nameWithoutExtension
                    var artist = "Unknown Artist"
                    var album = "USB Drive"
                    var durationSec = 180
                    var artworkPath: String? = null

                    try {
                        retriever.setDataSource(file.absolutePath)

                        val metaTitle = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_TITLE)
                        if (!metaTitle.isNullOrBlank()) title = metaTitle.trim()

                        val metaArtist = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ARTIST)
                        if (!metaArtist.isNullOrBlank()) artist = metaArtist.trim()

                        val metaAlbum = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUM)
                        if (!metaAlbum.isNullOrBlank()) album = metaAlbum.trim()

                        val durStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
                        if (!durStr.isNullOrBlank()) {
                            val durMs = durStr.toLongOrNull() ?: 180000L
                            durationSec = (durMs / 1000).toInt().coerceAtLeast(1)
                        }

                        val embeddedPic = retriever.embeddedPicture
                        if (embeddedPic != null && embeddedPic.isNotEmpty()) {
                            val artFile = File(artworkCacheDir, "art_${file.nameWithoutExtension.hashCode()}.jpg")
                            if (!artFile.exists()) {
                                // Downsample to max 300x300 to conserve RAM on TV
                                val opts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                                BitmapFactory.decodeByteArray(embeddedPic, 0, embeddedPic.size, opts)
                                var sample = 1
                                while ((opts.outWidth / sample) > 300 || (opts.outHeight / sample) > 300) {
                                    sample *= 2
                                }
                                val decodeOpts = BitmapFactory.Options().apply { inSampleSize = sample }
                                val bitmap = BitmapFactory.decodeByteArray(embeddedPic, 0, embeddedPic.size, decodeOpts)
                                if (bitmap != null) {
                                    FileOutputStream(artFile).use { out ->
                                        bitmap.compress(Bitmap.CompressFormat.JPEG, 85, out)
                                    }
                                    bitmap.recycle()
                                }
                            }
                            if (artFile.exists()) {
                                artworkPath = "file://${artFile.absolutePath}"
                            }
                        }
                    } catch (e: Exception) {
                        Log.w(TAG, "Error extracting metadata for ${file.name}: ${e.message}")
                    }

                    val trackMap = Arguments.createMap().apply {
                        putString("id", "usb_${index}_${Math.abs(file.absolutePath.hashCode())}")
                        putString("title", title)
                        putString("artist", artist)
                        putString("album", album)
                        putInt("duration", durationSec)
                        putString("audioUrl", "file://${file.absolutePath}")
                        putString("filePath", file.absolutePath)
                        putDouble("fileSize", file.length().toDouble())
                        if (artworkPath != null) {
                            putString("artworkUrl", artworkPath)
                        } else {
                            putNull("artworkUrl")
                        }
                    }
                    tracksArray.pushMap(trackMap)
                }

                try {
                    retriever.release()
                } catch (e: Exception) {
                    // ignore release error
                }

                promise.resolve(tracksArray)
            } catch (e: Exception) {
                Log.e(TAG, "scanUsbTracks error: ${e.message}", e)
                promise.reject("SCAN_FAILED", e.message)
            }
        }.start()
    }

    @ReactMethod
    fun savePreference(key: String, value: String, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("FireTVMusicPrefs", Context.MODE_PRIVATE)
            prefs.edit().putString(key, value).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("PREF_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getPreference(key: String, defaultValue: String?, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("FireTVMusicPrefs", Context.MODE_PRIVATE)
            val value = prefs.getString(key, defaultValue)
            promise.resolve(value)
        } catch (e: Exception) {
            promise.reject("PREF_ERROR", e.message)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for React Native NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for React Native NativeEventEmitter
    }
}
