#include <jni.h>
#include <android/log.h>
#include <string>
#include <vector>
#include <cstring>
#include <cctype>
#include <cstdarg>
#include <cstdio>
#include <cstdint>

#define TAG "WhistleJNI"
#define LOGD(...) __android_log_print(ANDROID_LOG_DEBUG, TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, TAG, __VA_ARGS__)

#if HAVE_WHISTLE_ENGINE
#include "needle.h"
#endif

// Bionic compatibility shims for precompiled linux-x86_64 library
#if !defined(__GLIBC__) && defined(__x86_64__)
static unsigned short ctype_b_table[384];
static int32_t ctype_tolower_table[384];
static int32_t ctype_toupper_table[384];
static bool ctype_initialized = false;

static void init_ctype_tables() {
    if (ctype_initialized) return;
    for (int i = 0; i < 256; i++) {
        unsigned short mask = 0;
        if (isupper(i)) mask |= 0x0100;
        if (islower(i)) mask |= 0x0200;
        if (isalpha(i)) mask |= 0x0400;
        if (isdigit(i)) mask |= 0x0800;
        if (isxdigit(i)) mask |= 0x1000;
        if (isspace(i)) mask |= 0x2000;
        if (isprint(i)) mask |= 0x4000;
        if (isgraph(i)) mask |= 0x8000;
        if (iscntrl(i)) mask |= 0x0002;
        if (ispunct(i)) mask |= 0x0004;
        if (isalnum(i)) mask |= 0x0008;
        ctype_b_table[128 + i] = mask;
        ctype_tolower_table[128 + i] = tolower(i);
        ctype_toupper_table[128 + i] = toupper(i);
    }
    ctype_initialized = true;
}

extern "C" const unsigned short **__ctype_b_loc(void) {
    init_ctype_tables();
    static const unsigned short *p = &ctype_b_table[128];
    return &p;
}

extern "C" const int32_t **__ctype_tolower_loc(void) {
    init_ctype_tables();
    static const int32_t *p = &ctype_tolower_table[128];
    return &p;
}

extern "C" const int32_t **__ctype_toupper_loc(void) {
    init_ctype_tables();
    static const int32_t *p = &ctype_toupper_table[128];
    return &p;
}

extern "C" int __isoc99_fscanf(FILE *stream, const char *format, ...) {
    va_list args;
    va_start(args, format);
    int ret = vfscanf(stream, format, args);
    va_end(args);
    return ret;
}
#endif

extern "C" {

JNIEXPORT jboolean JNICALL
Java_com_firetv_musicpoc_WhistleEngine_nativeIsEngineSupported(JNIEnv *env, jclass clazz) {
#if HAVE_WHISTLE_ENGINE
    return JNI_TRUE;
#else
    return JNI_FALSE;
#endif
}

JNIEXPORT jboolean JNICALL
Java_com_firetv_musicpoc_WhistleEngine_nativeLoadModel(JNIEnv *env, jclass clazz, jbyteArray modelBytes) {
#if HAVE_WHISTLE_ENGINE
    if (!modelBytes) {
        LOGE("modelBytes is null");
        return JNI_FALSE;
    }
    jsize len = env->GetArrayLength(modelBytes);
    jbyte *bytes = env->GetByteArrayElements(modelBytes, nullptr);
    if (!bytes) {
        LOGE("Failed to get byte array elements");
        return JNI_FALSE;
    }
    
    int res = needle_load(reinterpret_cast<const unsigned char*>(bytes), static_cast<unsigned long long>(len));
    env->ReleaseByteArrayElements(modelBytes, bytes, JNI_ABORT);
    
    if (res < 0) {
        const char *err = needle_last_error();
        LOGE("needle_load failed: %s", err ? err : "unknown error");
        return JNI_FALSE;
    }
    LOGD("needle_load succeeded! Models loaded: %d", needle_models());
    return JNI_TRUE;
#else
    LOGD("Whistle engine stubbed on this ABI");
    return JNI_FALSE;
#endif
}

JNIEXPORT jstring JNICALL
Java_com_firetv_musicpoc_WhistleEngine_nativeTranscribe(
    JNIEnv *env, jclass clazz,
    jfloatArray pcmSamples,
    jint sampleCount,
    jstring language,
    jstring keywords
) {
#if HAVE_WHISTLE_ENGINE
    if (!pcmSamples || sampleCount <= 0) {
        return env->NewStringUTF("{\"error\":\"empty_pcm\"}");
    }
    
    jfloat *samples = env->GetFloatArrayElements(pcmSamples, nullptr);
    if (!samples) {
        return env->NewStringUTF("{\"error\":\"failed_to_read_pcm\"}");
    }
    
    const char *langStr = language ? env->GetStringUTFChars(language, nullptr) : nullptr;
    const char *kwStr = keywords ? env->GetStringUTFChars(keywords, nullptr) : nullptr;
    
    char outBuffer[8192];
    std::memset(outBuffer, 0, sizeof(outBuffer));
    
    int tokens = needle_transcribe(
        samples,
        sampleCount,
        langStr,
        kwStr,
        0, // word timestamps flag: 0
        outBuffer,
        sizeof(outBuffer)
    );
    
    env->ReleaseFloatArrayElements(pcmSamples, samples, JNI_ABORT);
    if (langStr) env->ReleaseStringUTFChars(language, langStr);
    if (kwStr) env->ReleaseStringUTFChars(keywords, kwStr);
    
    if (tokens < 0) {
        const char *err = needle_last_error();
        LOGE("needle_transcribe failed: %s", err ? err : "unknown error");
        std::string errJson = std::string("{\"error\":\"") + (err ? err : "inference_error") + "\"}";
        return env->NewStringUTF(errJson.c_str());
    }
    
    LOGD("Transcription result: %s", outBuffer);
    return env->NewStringUTF(outBuffer);
#else
    return env->NewStringUTF("{\"error\":\"unsupported_abi\"}");
#endif
}

JNIEXPORT jstring JNICALL
Java_com_firetv_musicpoc_WhistleEngine_nativeGetLastError(JNIEnv *env, jclass clazz) {
#if HAVE_WHISTLE_ENGINE
    const char *err = needle_last_error();
    return env->NewStringUTF(err ? err : "");
#else
    return env->NewStringUTF("Engine not supported on this architecture");
#endif
}

}
