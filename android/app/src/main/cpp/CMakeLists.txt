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
elseif(${ANDROID_ABI} STREQUAL "x86_64")
    add_library(whistle_native SHARED whistle_jni.cpp)
    target_link_libraries(
        whistle_native
        ${WHISTLE_DIR}/libs/linux-x86_64/libneedle.a
        android
        log
    )
    target_compile_definitions(whistle_native PRIVATE HAVE_WHISTLE_ENGINE=1)
else()
    # Graceful stub on other ABIs
    add_library(whistle_native SHARED whistle_jni.cpp)
    target_link_libraries(
        whistle_native
        android
        log
    )
    target_compile_definitions(whistle_native PRIVATE HAVE_WHISTLE_ENGINE=0)
endif()
