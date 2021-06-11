cmake_minimum_required(VERSION 3.16)

# Make CMake a little quieter...
function(message)
  list(GET ARGV 0 MessageType)
  if(MessageType STREQUAL FATAL_ERROR OR
     MessageType STREQUAL SEND_ERROR OR
     MessageType STREQUAL WARNING OR
     MessageType STREQUAL AUTHOR_WARNING)
    list(REMOVE_AT ARGV 0)
    _message(${MessageType} "${ARGV}")
  endif()
endfunction()


#
# Toolchain
#

if(WEB)
  # Emscripten
  set(CMAKE_TOOLCHAIN_FILE vendor/emsdk/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake)
elseif(WIN32)
  set(CMAKE_C_COMPILER "C:/Program Files/LLVM/bin/clang.exe")
  set(CMAKE_CXX_COMPILER "C:/Program Files/LLVM/bin/clang++.exe")
elseif(APPLE AND (NOT "${CMAKE_SYSTEM_NAME}" STREQUAL "iOS"))
  # Homebrew LLVM for compatibility with Homebrew 'clang-tidy'
  set(CMAKE_C_COMPILER /usr/local/opt/llvm/bin/clang)
  set(CMAKE_CXX_COMPILER /usr/local/opt/llvm/bin/clang++)
else()
  set(CMAKE_C_COMPILER clang)
  set(CMAKE_CXX_COMPILER clang++)
endif()


#
# Project
#

project(castle-core)
if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Release) # Release build by default
endif()


#
# Target
#

if(ANDROID)
  add_library(castle-core SHARED)
elseif(IOS)
  add_library(castle-core STATIC)
else()
  add_executable(castle-core)
endif()

# Sources
file(GLOB_RECURSE MY_SOURCES CONFIGURE_DEPENDS src/*.cpp)
if (IOS)
  list(APPEND MY_SOURCES "${CMAKE_SOURCE_DIR}/src/api_ios.mm")
else()
  list(APPEND MY_SOURCES "${CMAKE_SOURCE_DIR}/src/api_default.cpp")
end()
if(LIB)
  list(REMOVE_ITEM MY_SOURCES "${CMAKE_SOURCE_DIR}/src/main.cpp")
endif()
target_sources(castle-core PRIVATE ${MY_SOURCES})
target_include_directories(castle-core PRIVATE src)

# Standard
target_compile_features(castle-core PRIVATE cxx_std_17)
set_target_properties(castle-core PROPERTIES CXX_EXTENSIONS OFF)

# Warnings
if(NOT MSVC)
  target_compile_options(castle-core PRIVATE -fcolor-diagnostics -fdiagnostics-absolute-paths
    -pedantic-errors -Wall -Wextra -Wno-missing-braces
    -Wno-gnu-zero-variadic-macro-arguments -Wno-nested-anon-types -Wno-unused-parameter -Wno-pragma-pack
    -Wno-gnu-anonymous-struct -Wno-deprecated-copy)
  target_link_options(castle-core PRIVATE -fcolor-diagnostics -fdiagnostics-absolute-paths
    -pedantic-errors -Wall -Wextra)
  if(WIN32)
    target_compile_options(castle-core PRIVATE -Wno-language-extension-token)
    target_link_options(castle-core PRIVATE -Wno-language-extension-token)
  endif()
endif()

# Disable exceptions
if(WEB)
  target_compile_options(castle-core PRIVATE -fno-exceptions)
endif()

# Precompiled header
if(NOT CMAKE_EXPORT_COMPILE_COMMANDS)
  target_precompile_headers(castle-core PRIVATE src/precomp.h)
endif()

# Web flags
if(WEB)
  target_compile_definitions(castle-core PRIVATE EMSCRIPTEN_HAS_UNBOUND_TYPE_NAMES=0)
  target_link_options(castle-core PRIVATE "SHELL:--bind")
  target_link_options(castle-core PRIVATE "SHELL:-s WASM=1")
  target_link_options(castle-core PRIVATE "SHELL:-s MAX_WEBGL_VERSION=2")
  target_link_options(castle-core PRIVATE "SHELL:-s INITIAL_MEMORY=256MB")
  if ("${CMAKE_BUILD_TYPE}" STREQUAL "Debug")
    target_compile_options(castle-core PRIVATE "SHELL:-g4 --source-map-base file://${CMAKE_BINARY_DIR}/ -fsanitize=leak")
    target_link_options(castle-core PRIVATE "SHELL:-g4 --source-map-base file://${CMAKE_BINARY_DIR}/ -fsanitize=leak")
  else()
    target_link_options(castle-core PRIVATE -O0) # Makes link step much faster
    target_compile_options(castle-core PRIVATE "SHELL:--profiling")
    target_link_options(castle-core PRIVATE "SHELL:--profiling")
  endif()
endif()

# Add debug info in non-MSVC desktop release builds
if((NOT IOS) AND (NOT ANDROID) AND (NOT WEB) AND (NOT MSVC))
  target_compile_options(castle-core PRIVATE -g)
  target_link_options(castle-core PRIVATE -g)
  add_compile_options(-g)
  add_link_options(-g)
endif()

# Working directory for debugging with MSVC
if(MSVC)
  set_target_properties(castle-core PROPERTIES
    VS_DEBUGGER_WORKING_DIRECTORY "${PROJECT_SOURCE_DIR}"
    VS_STARTUP_PROJECT castle-core)
endif()

if(ANDROID)
  target_compile_definitions(castle-core PRIVATE __ANDROID__)
endif()


#
# Dependencies
#

if (ANDROID)
  set(ANDROID_JNI_SRC ../mobile/android/love/src/jni)
  set_target_properties(castle-core PROPERTIES DEBUG_POSTFIX "")
  target_link_libraries(castle-core PRIVATE android log OpenSLES dl)
endif()

# SDL2
if(WEB)
  target_compile_options(castle-core PRIVATE "SHELL:-s USE_SDL=2")
  #target_compile_options(castle-core PRIVATE "SHELL:-s FULL_ES2=1")
  target_link_options(castle-core PRIVATE "SHELL:-s USE_SDL=2")
  #target_link_options(castle-core PRIVATE "SHELL:-s FULL_ES2=1")
elseif(APPLE AND (NOT IOS))
  set(SDL_STATIC ON CACHE BOOL "" FORCE)
  set(SDL_SHARED OFF CACHE BOOL "" FORCE)
  set(VIDEO_WAYLAND OFF CACHE BOOL "" FORCE)
  add_subdirectory(vendor/SDL2 SDL2 EXCLUDE_FROM_ALL)
  target_link_libraries(castle-core PRIVATE SDL2-static)
  target_include_directories(castle-core PRIVATE vendor/SDL2/include) # To make 'compile_commands.json' work
  set(THREADS_PREFER_PTHREAD_FLAG ON)
  find_package(Threads REQUIRED)
  target_link_libraries(castle-core PRIVATE Threads::Threads)
elseif(ANDROID)
  #set(CMAKE_POSITION_INDEPENDENT_CODE ON)
  set(SDL_STATIC ON CACHE BOOL "" FORCE)
  set(SDL_SHARED OFF CACHE BOOL "" FORCE)
  set(VIDEO_WAYLAND OFF CACHE BOOL "" FORCE)
  add_subdirectory(${ANDROID_JNI_SRC}/SDL2-2.0.7 SDL2-2.0.7 EXCLUDE_FROM_ALL)
  target_link_libraries(castle-core PRIVATE SDL2-static)
  set_property(TARGET SDL2-static PROPERTY POSITION_INDEPENDENT_CODE ON)
  target_include_directories(castle-core PRIVATE ${ANDROID_JNI_SRC}/SDL2-2.0.7/include) # To make 'compile_commands.json' work
  set(THREADS_PREFER_PTHREAD_FLAG ON)
  find_package(Threads REQUIRED)
  target_link_libraries(castle-core PRIVATE Threads::Threads)
elseif(NOT IOS)
  set(SDL_STATIC ON CACHE BOOL "" FORCE)
  set(SDL_SHARED OFF CACHE BOOL "" FORCE)
  set(VIDEO_WAYLAND OFF CACHE BOOL "" FORCE)
  add_subdirectory(../ghost-extensions/SDL2-2.0.8 SDL2-2.0.8 EXCLUDE_FROM_ALL)
  target_link_libraries(castle-core PRIVATE SDL2-static)
  target_include_directories(castle-core PRIVATE ../ghost-extensions/SDL2-2.0.8/include) # To make 'compile_commands.json' work
  set(THREADS_PREFER_PTHREAD_FLAG ON)
  find_package(Threads REQUIRED)
  target_link_libraries(castle-core PRIVATE Threads::Threads)
endif()

# fmt
add_subdirectory(vendor/fmt EXCLUDE_FROM_ALL)
target_link_libraries(castle-core PRIVATE fmt::fmt)

# love
set(LOVE_SRC ../love/src)
if(IOS)
  # Just add include dirs on iOS, actual building / linking is part of mobile project
  target_include_directories(castle-core PUBLIC
    ${LOVE_SRC} ${LOVE_SRC}/libraries ${LOVE_SRC}/modules
    vendor/lua-5.1.5/src
    vendor/zlib-1.2.11
    vendor/freetype-2.10.0/include
    vendor/SDL2/include
    vendor vendor/tove2d/src/thirdparty/fp16/include
    )
else()
  # Love as a CMake sub-project
  add_library(castle-love STATIC)
  target_compile_features(castle-love PRIVATE cxx_std_17)
  set_target_properties(castle-love PROPERTIES CXX_EXTENSIONS OFF)
  if (ANDROID)
    set(LOVE_SRC ${ANDROID_JNI_SRC}/love/src)
  endif()
  target_include_directories(castle-love PUBLIC ${LOVE_SRC} ${LOVE_SRC}/libraries ${LOVE_SRC}/modules)

  # archive.h
  target_include_directories(castle-love PUBLIC src vendor/magic_get/include vendor/entt/src)

  # lua
  #if (ANDROID)
  #  target_include_directories(castle-core PUBLIC ${ANDROID_JNI_SRC}/LuaJIT-2.1/src)
  #  target_link_libraries(castle-love PUBLIC ${ANDROID_JNI_SRC}/LuaJIT-2.1/android/${ANDROID_ABI}/libluajit.a)
  #else()
    set(LUA_BUILD_STATIC ON CACHE BOOL "" FORCE)
    set(LUA_BUILD_SHARED OFF CACHE BOOL "" FORCE)
    add_subdirectory(vendor/lua-5.1.5 EXCLUDE_FROM_ALL)
    target_link_libraries(castle-love PUBLIC lua51-static)
  #endif()

  # zlib
  add_subdirectory(vendor/zlib-1.2.11 EXCLUDE_FROM_ALL)
  target_link_libraries(castle-love PUBLIC zlibstatic)

  # freetype
  add_subdirectory(vendor/freetype-2.10.0 EXCLUDE_FROM_ALL)
  target_link_libraries(castle-love PUBLIC freetype)

  # SDL2
  if (ANDROID)
    target_include_directories(castle-love PRIVATE ${ANDROID_JNI_SRC}/SDL2-2.0.7/include) # To make 'compile_commands.json' work
  elseif(APPLE AND (NOT "${CMAKE_SYSTEM_NAME}" STREQUAL "iOS"))
    target_include_directories(castle-love PRIVATE vendor/SDL2/include) # To make 'compile_commands.json' work
  else()
    target_include_directories(castle-love PRIVATE ../ghost-extensions/SDL2-2.0.8/include) # To make 'compile_commands.json' work
  endif()

  if(WEB)
    target_compile_options(castle-love PRIVATE "SHELL:-s USE_SDL=2")
    #target_compile_options(castle-love PRIVATE "SHELL:-s FULL_ES2=1")
    target_link_options(castle-love PRIVATE "SHELL:-s USE_SDL=2")
    #target_link_options(castle-love PRIVATE "SHELL:-s FULL_ES2=1")
  endif()

  # tove
  if (ANDROID)
    set(TOVE_SRC ${ANDROID_JNI_SRC}/ghost-extensions/tove2d)
    target_include_directories(castle-love PUBLIC ${ANDROID_JNI_SRC}/ghost-extensions ${ANDROID_JNI_SRC}/ghost-extensions/tove2d/src/thirdparty/fp16/include)
  else()
    set(TOVE_SRC vendor/tove2d)
    target_include_directories(castle-love PUBLIC vendor vendor/tove2d/src/thirdparty/fp16/include)
  endif()

  # rapidjson
  target_include_directories(castle-love PRIVATE vendor/rapidjson/include)

  target_sources(castle-love PRIVATE
    # common
    ${LOVE_SRC}/common/b64.cpp ${LOVE_SRC}/common/b64.h
    ${LOVE_SRC}/common/Color.h ${LOVE_SRC}/common/config.h
    ${LOVE_SRC}/common/Data.cpp ${LOVE_SRC}/common/Data.h
    ${LOVE_SRC}/common/delay.cpp ${LOVE_SRC}/common/delay.h
    ${LOVE_SRC}/common/deprecation.cpp ${LOVE_SRC}/common/deprecation.h
    ${LOVE_SRC}/common/EnumMap.h ${LOVE_SRC}/common/Exception.cpp
    ${LOVE_SRC}/common/Exception.h ${LOVE_SRC}/common/halffloat.cpp
    ${LOVE_SRC}/common/halffloat.h ${LOVE_SRC}/common/int.h
    ${LOVE_SRC}/common/math.h ${LOVE_SRC}/common/Matrix.cpp
    ${LOVE_SRC}/common/Matrix.h ${LOVE_SRC}/common/Memoizer.cpp
    ${LOVE_SRC}/common/Memoizer.h ${LOVE_SRC}/common/memory.cpp
    ${LOVE_SRC}/common/memory.h ${LOVE_SRC}/common/Module.cpp
    ${LOVE_SRC}/common/Module.h ${LOVE_SRC}/common/Object.cpp
    ${LOVE_SRC}/common/Object.h ${LOVE_SRC}/common/Optional.h
    ${LOVE_SRC}/common/pixelformat.cpp ${LOVE_SRC}/common/pixelformat.h
    ${LOVE_SRC}/common/Reference.cpp ${LOVE_SRC}/common/Reference.h
    ${LOVE_SRC}/common/runtime.cpp ${LOVE_SRC}/common/runtime.h
    ${LOVE_SRC}/common/Stream.cpp ${LOVE_SRC}/common/Stream.h
    ${LOVE_SRC}/common/StringMap.cpp ${LOVE_SRC}/common/StringMap.h
    ${LOVE_SRC}/common/types.cpp ${LOVE_SRC}/common/types.h
    ${LOVE_SRC}/common/utf8.cpp ${LOVE_SRC}/common/utf8.h
    ${LOVE_SRC}/common/Variant.cpp ${LOVE_SRC}/common/Variant.h
    ${LOVE_SRC}/common/Vector.h ${LOVE_SRC}/common/version.h

    # data
    ${LOVE_SRC}/modules/data/ByteData.cpp ${LOVE_SRC}/modules/data/ByteData.h
    ${LOVE_SRC}/modules/data/CompressedData.cpp
    ${LOVE_SRC}/modules/data/CompressedData.h
    ${LOVE_SRC}/modules/data/Compressor.cpp
    ${LOVE_SRC}/modules/data/Compressor.h
    ${LOVE_SRC}/modules/data/DataModule.cpp
    ${LOVE_SRC}/modules/data/DataModule.h ${LOVE_SRC}/modules/data/DataView.cpp
    ${LOVE_SRC}/modules/data/DataView.h
    ${LOVE_SRC}/modules/data/HashFunction.cpp
    ${LOVE_SRC}/modules/data/HashFunction.h

    # lz4
    ${LOVE_SRC}/libraries/lz4/lz4.c
    ${LOVE_SRC}/libraries/lz4/lz4.h
    ${LOVE_SRC}/libraries/lz4/lz4hc.c
    ${LOVE_SRC}/libraries/lz4/lz4hc.h
    ${LOVE_SRC}/libraries/lz4/lz4opt.h

    # math
    ${LOVE_SRC}/modules/math/BezierCurve.cpp
    ${LOVE_SRC}/modules/math/BezierCurve.h
    ${LOVE_SRC}/modules/math/MathModule.cpp
    ${LOVE_SRC}/modules/math/MathModule.h
    ${LOVE_SRC}/modules/math/RandomGenerator.cpp
    ${LOVE_SRC}/modules/math/RandomGenerator.h
    ${LOVE_SRC}/modules/math/Transform.cpp ${LOVE_SRC}/modules/math/Transform.h

    # noise1234
    ${LOVE_SRC}/libraries/noise1234/noise1234.cpp
	  ${LOVE_SRC}/libraries/noise1234/noise1234.h
	  ${LOVE_SRC}/libraries/noise1234/simplexnoise1234.cpp
	  ${LOVE_SRC}/libraries/noise1234/simplexnoise1234.h

    # thread
    ${LOVE_SRC}/modules/thread/Channel.cpp ${LOVE_SRC}/modules/thread/Channel.h
    ${LOVE_SRC}/modules/thread/LuaThread.cpp
    ${LOVE_SRC}/modules/thread/LuaThread.h ${LOVE_SRC}/modules/thread/Thread.h
    ${LOVE_SRC}/modules/thread/ThreadModule.cpp
    ${LOVE_SRC}/modules/thread/ThreadModule.h
    ${LOVE_SRC}/modules/thread/threads.cpp ${LOVE_SRC}/modules/thread/threads.h
    ${LOVE_SRC}/modules/thread/sdl/Thread.cpp
    ${LOVE_SRC}/modules/thread/sdl/Thread.h
    ${LOVE_SRC}/modules/thread/sdl/threads.cpp
    ${LOVE_SRC}/modules/thread/sdl/threads.h

    # filesystem
    ${LOVE_SRC}/modules/filesystem/DroppedFile.cpp
    ${LOVE_SRC}/modules/filesystem/DroppedFile.h
    ${LOVE_SRC}/modules/filesystem/File.cpp
    ${LOVE_SRC}/modules/filesystem/File.h
    ${LOVE_SRC}/modules/filesystem/FileData.cpp
    ${LOVE_SRC}/modules/filesystem/FileData.h
    ${LOVE_SRC}/modules/filesystem/Filesystem.cpp
    ${LOVE_SRC}/modules/filesystem/Filesystem.h
    ${LOVE_SRC}/modules/filesystem/physfs/File.cpp
    ${LOVE_SRC}/modules/filesystem/physfs/File.h
    ${LOVE_SRC}/modules/filesystem/physfs/Filesystem.cpp
    ${LOVE_SRC}/modules/filesystem/physfs/Filesystem.h
    ${LOVE_SRC}/libraries/physfs/physfs_archiver_7z.c
    ${LOVE_SRC}/libraries/physfs/physfs_archiver_dir.c
    ${LOVE_SRC}/libraries/physfs/physfs_archiver_grp.c
    ${LOVE_SRC}/libraries/physfs/physfs_archiver_hog.c
    ${LOVE_SRC}/libraries/physfs/physfs_archiver_iso9660.c
    ${LOVE_SRC}/libraries/physfs/physfs_archiver_mvl.c
    ${LOVE_SRC}/libraries/physfs/physfs_archiver_qpak.c
    ${LOVE_SRC}/libraries/physfs/physfs_archiver_slb.c
    ${LOVE_SRC}/libraries/physfs/physfs_archiver_unpacked.c
    ${LOVE_SRC}/libraries/physfs/physfs_archiver_vdf.c
    ${LOVE_SRC}/libraries/physfs/physfs_archiver_wad.c
    ${LOVE_SRC}/libraries/physfs/physfs_archiver_zip.c
    ${LOVE_SRC}/libraries/physfs/physfs_byteorder.c
    ${LOVE_SRC}/libraries/physfs/physfs_casefolding.h
    ${LOVE_SRC}/libraries/physfs/physfs_internal.h
    ${LOVE_SRC}/libraries/physfs/physfs_lzmasdk.h
    ${LOVE_SRC}/libraries/physfs/physfs_miniz.h
    ${LOVE_SRC}/libraries/physfs/physfs_platform_haiku.cpp
    ${LOVE_SRC}/libraries/physfs/physfs_platform_os2.c
    ${LOVE_SRC}/libraries/physfs/physfs_platform_posix.c
    ${LOVE_SRC}/libraries/physfs/physfs_platform_qnx.c
    ${LOVE_SRC}/libraries/physfs/physfs_platform_unix.c
    ${LOVE_SRC}/libraries/physfs/physfs_platform_windows.c
    ${LOVE_SRC}/libraries/physfs/physfs_platform_winrt.cpp
    ${LOVE_SRC}/libraries/physfs/physfs_platforms.h
    ${LOVE_SRC}/libraries/physfs/physfs_unicode.c
    ${LOVE_SRC}/libraries/physfs/physfs.c
    ${LOVE_SRC}/libraries/physfs/physfs.h

    # timer
    ${LOVE_SRC}/modules/timer/Timer.cpp ${LOVE_SRC}/modules/timer/Timer.h

    # event
    ${LOVE_SRC}/modules/event/Event.cpp ${LOVE_SRC}/modules/event/Event.h
    ${LOVE_SRC}/modules/event/sdl/Event.cpp ${LOVE_SRC}/modules/event/sdl/Event.h

    # touch
    ${LOVE_SRC}/modules/touch/Touch.h ${LOVE_SRC}/modules/touch/sdl/Touch.cpp
    ${LOVE_SRC}/modules/touch/sdl/Touch.h

    # mouse
    ${LOVE_SRC}/modules/mouse/Cursor.cpp
    ${LOVE_SRC}/modules/mouse/Cursor.h
    ${LOVE_SRC}/modules/mouse/Mouse.h
    ${LOVE_SRC}/modules/mouse/sdl/Cursor.cpp
    ${LOVE_SRC}/modules/mouse/sdl/Cursor.h
    ${LOVE_SRC}/modules/mouse/sdl/Mouse.cpp
    ${LOVE_SRC}/modules/mouse/sdl/Mouse.h

    # joystick (needed by event)
    ${LOVE_SRC}/modules/joystick/Joystick.cpp
    ${LOVE_SRC}/modules/joystick/Joystick.h
    ${LOVE_SRC}/modules/joystick/JoystickModule.h
    ${LOVE_SRC}/modules/joystick/sdl/Joystick.cpp
    ${LOVE_SRC}/modules/joystick/sdl/Joystick.h
    ${LOVE_SRC}/modules/joystick/sdl/JoystickModule.cpp
    ${LOVE_SRC}/modules/joystick/sdl/JoystickModule.h

    # keyboard (needed by event)
    ${LOVE_SRC}/modules/keyboard/Keyboard.cpp
    ${LOVE_SRC}/modules/keyboard/Keyboard.h
    ${LOVE_SRC}/modules/keyboard/sdl/Keyboard.cpp
    ${LOVE_SRC}/modules/keyboard/sdl/Keyboard.h

    # system
    ${LOVE_SRC}/modules/system/System.cpp ${LOVE_SRC}/modules/system/System.h
    ${LOVE_SRC}/modules/system/sdl/System.cpp
    ${LOVE_SRC}/modules/system/sdl/System.h

    # window
    ${LOVE_SRC}/modules/window/Window.cpp ${LOVE_SRC}/modules/window/Window.h
    ${LOVE_SRC}/modules/window/sdl/Window.cpp
    ${LOVE_SRC}/modules/window/sdl/Window.h

    # font
    ${LOVE_SRC}/modules/font/BMFontRasterizer.cpp
    ${LOVE_SRC}/modules/font/BMFontRasterizer.h
    ${LOVE_SRC}/modules/font/Font.cpp
    ${LOVE_SRC}/modules/font/Font.h
    ${LOVE_SRC}/modules/font/GlyphData.cpp
    ${LOVE_SRC}/modules/font/GlyphData.h
    ${LOVE_SRC}/modules/font/ImageRasterizer.cpp
    ${LOVE_SRC}/modules/font/ImageRasterizer.h
    ${LOVE_SRC}/modules/font/Rasterizer.cpp
    ${LOVE_SRC}/modules/font/Rasterizer.h
    ${LOVE_SRC}/modules/font/TrueTypeRasterizer.cpp
    ${LOVE_SRC}/modules/font/TrueTypeRasterizer.h
    ${LOVE_SRC}/modules/font/freetype/Font.cpp
    ${LOVE_SRC}/modules/font/freetype/Font.h
    ${LOVE_SRC}/modules/font/freetype/TrueTypeRasterizer.cpp
    ${LOVE_SRC}/modules/font/freetype/TrueTypeRasterizer.h

    # graphics
    ${LOVE_SRC}/modules/graphics/Buffer.cpp
    ${LOVE_SRC}/modules/graphics/Buffer.h
    ${LOVE_SRC}/modules/graphics/Canvas.cpp
    ${LOVE_SRC}/modules/graphics/Canvas.h
    ${LOVE_SRC}/modules/graphics/depthstencil.cpp
    ${LOVE_SRC}/modules/graphics/depthstencil.h
    ${LOVE_SRC}/modules/graphics/Deprecations.cpp
    ${LOVE_SRC}/modules/graphics/Deprecations.h
    ${LOVE_SRC}/modules/graphics/Drawable.cpp
    ${LOVE_SRC}/modules/graphics/Drawable.h
    ${LOVE_SRC}/modules/graphics/Font.cpp
    ${LOVE_SRC}/modules/graphics/Font.h
    ${LOVE_SRC}/modules/graphics/Graphics.cpp
    ${LOVE_SRC}/modules/graphics/Graphics.h
    ${LOVE_SRC}/modules/graphics/Image.cpp
    ${LOVE_SRC}/modules/graphics/Image.h
    ${LOVE_SRC}/modules/graphics/Mesh.cpp
    ${LOVE_SRC}/modules/graphics/Mesh.h
    ${LOVE_SRC}/modules/graphics/ParticleSystem.cpp
    ${LOVE_SRC}/modules/graphics/ParticleSystem.h
    ${LOVE_SRC}/modules/graphics/Polyline.cpp
    ${LOVE_SRC}/modules/graphics/Polyline.h
    ${LOVE_SRC}/modules/graphics/Quad.cpp
    ${LOVE_SRC}/modules/graphics/Quad.h
    ${LOVE_SRC}/modules/graphics/Resource.h
    ${LOVE_SRC}/modules/graphics/Shader.cpp
    ${LOVE_SRC}/modules/graphics/Shader.h
    ${LOVE_SRC}/modules/graphics/ShaderStage.cpp
    ${LOVE_SRC}/modules/graphics/ShaderStage.h
    ${LOVE_SRC}/modules/graphics/SpriteBatch.cpp
    ${LOVE_SRC}/modules/graphics/SpriteBatch.h
    ${LOVE_SRC}/modules/graphics/StreamBuffer.cpp
    ${LOVE_SRC}/modules/graphics/StreamBuffer.h
    ${LOVE_SRC}/modules/graphics/Text.cpp
    ${LOVE_SRC}/modules/graphics/Text.h
    ${LOVE_SRC}/modules/graphics/Texture.cpp
    ${LOVE_SRC}/modules/graphics/Texture.h
    ${LOVE_SRC}/modules/graphics/vertex.cpp
    ${LOVE_SRC}/modules/graphics/vertex.h
    ${LOVE_SRC}/modules/graphics/Video.cpp
    ${LOVE_SRC}/modules/graphics/Video.h
    ${LOVE_SRC}/modules/graphics/Volatile.cpp
    ${LOVE_SRC}/modules/graphics/Volatile.h
    ${LOVE_SRC}/modules/graphics/opengl/Buffer.cpp
    ${LOVE_SRC}/modules/graphics/opengl/Buffer.h
    ${LOVE_SRC}/modules/graphics/opengl/Canvas.cpp
    ${LOVE_SRC}/modules/graphics/opengl/Canvas.h
    ${LOVE_SRC}/modules/graphics/opengl/FenceSync.cpp
    ${LOVE_SRC}/modules/graphics/opengl/FenceSync.h
    ${LOVE_SRC}/modules/graphics/opengl/Graphics.cpp
    ${LOVE_SRC}/modules/graphics/opengl/Graphics.h
    ${LOVE_SRC}/modules/graphics/opengl/Image.cpp
    ${LOVE_SRC}/modules/graphics/opengl/Image.h
    ${LOVE_SRC}/modules/graphics/opengl/OpenGL.cpp
    ${LOVE_SRC}/modules/graphics/opengl/OpenGL.h
    ${LOVE_SRC}/modules/graphics/opengl/Shader.cpp
    ${LOVE_SRC}/modules/graphics/opengl/Shader.h
    ${LOVE_SRC}/modules/graphics/opengl/ShaderStage.cpp
    ${LOVE_SRC}/modules/graphics/opengl/ShaderStage.h
    ${LOVE_SRC}/modules/graphics/opengl/StreamBuffer.cpp
    ${LOVE_SRC}/modules/graphics/opengl/StreamBuffer.h
    ${LOVE_SRC}/libraries/xxHash/xxhash.c ${LOVE_SRC}/libraries/xxHash/xxhash.h
    ${LOVE_SRC}/libraries/glad/glad.cpp ${LOVE_SRC}/libraries/glad/glad.hpp
    ${LOVE_SRC}/libraries/glad/gladfuncs.hpp

    # glslang
    ${LOVE_SRC}/libraries/glslang/glslang/GenericCodeGen/CodeGen.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/GenericCodeGen/Link.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/Include/arrays.h
    ${LOVE_SRC}/libraries/glslang/glslang/Include/BaseTypes.h
    ${LOVE_SRC}/libraries/glslang/glslang/Include/Common.h
    ${LOVE_SRC}/libraries/glslang/glslang/Include/ConstantUnion.h
    ${LOVE_SRC}/libraries/glslang/glslang/Include/InfoSink.h
    ${LOVE_SRC}/libraries/glslang/glslang/Include/InitializeGlobals.h
    ${LOVE_SRC}/libraries/glslang/glslang/Include/intermediate.h
    ${LOVE_SRC}/libraries/glslang/glslang/Include/PoolAlloc.h
    ${LOVE_SRC}/libraries/glslang/glslang/Include/ResourceLimits.h
    ${LOVE_SRC}/libraries/glslang/glslang/Include/revision.h
    ${LOVE_SRC}/libraries/glslang/glslang/Include/ShHandle.h
    ${LOVE_SRC}/libraries/glslang/glslang/Include/Types.h
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/preprocessor/Pp.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/preprocessor/PpAtom.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/preprocessor/PpContext.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/preprocessor/PpContext.h
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/preprocessor/PpScanner.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/preprocessor/PpTokens.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/preprocessor/PpTokens.h
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/Constant.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/gl_types.h
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/glslang_tab.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/glslang_tab.cpp.h
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/InfoSink.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/Initialize.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/Initialize.h
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/Intermediate.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/intermOut.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/IntermTraverse.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/iomapper.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/iomapper.h
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/limits.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/linkValidate.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/LiveTraverser.h
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/localintermediate.h
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/parseConst.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/ParseContextBase.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/ParseHelper.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/ParseHelper.h
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/parseVersions.h
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/PoolAlloc.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/propagateNoContraction.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/propagateNoContraction.h
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/reflection.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/reflection.h
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/RemoveTree.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/RemoveTree.h
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/Scan.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/Scan.h
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/ScanContext.h
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/ShaderLang.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/SymbolTable.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/SymbolTable.h
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/Versions.cpp
    ${LOVE_SRC}/libraries/glslang/glslang/MachineIndependent/Versions.h
    ${LOVE_SRC}/libraries/glslang/glslang/OSDependent/osinclude.h
    ${LOVE_SRC}/libraries/glslang/glslang/Public/ShaderLang.h
    ${LOVE_SRC}/libraries/glslang/OGLCompilersDLL/InitializeDll.cpp
    ${LOVE_SRC}/libraries/glslang/OGLCompilersDLL/InitializeDll.h

    # image
    ${LOVE_SRC}/modules/image/CompressedImageData.cpp
    ${LOVE_SRC}/modules/image/CompressedImageData.h
    ${LOVE_SRC}/modules/image/CompressedSlice.cpp
    ${LOVE_SRC}/modules/image/CompressedSlice.h
    ${LOVE_SRC}/modules/image/FormatHandler.cpp
    ${LOVE_SRC}/modules/image/FormatHandler.h
    ${LOVE_SRC}/modules/image/Image.cpp ${LOVE_SRC}/modules/image/Image.h
    ${LOVE_SRC}/modules/image/ImageData.cpp
    ${LOVE_SRC}/modules/image/ImageData.h
    ${LOVE_SRC}/modules/image/ImageDataBase.cpp
    ${LOVE_SRC}/modules/image/ImageDataBase.h
    ${LOVE_SRC}/modules/image/magpie/ASTCHandler.cpp
    ${LOVE_SRC}/modules/image/magpie/ASTCHandler.h
    ${LOVE_SRC}/modules/image/magpie/ddsHandler.cpp
    ${LOVE_SRC}/modules/image/magpie/ddsHandler.h
    ${LOVE_SRC}/modules/image/magpie/EXRHandler.cpp
    ${LOVE_SRC}/modules/image/magpie/EXRHandler.h
    ${LOVE_SRC}/modules/image/magpie/KTXHandler.cpp
    ${LOVE_SRC}/modules/image/magpie/KTXHandler.h
    ${LOVE_SRC}/modules/image/magpie/PKMHandler.cpp
    ${LOVE_SRC}/modules/image/magpie/PKMHandler.h
    ${LOVE_SRC}/modules/image/magpie/PNGHandler.cpp
    ${LOVE_SRC}/modules/image/magpie/PNGHandler.h
    ${LOVE_SRC}/modules/image/magpie/PVRHandler.cpp
    ${LOVE_SRC}/modules/image/magpie/PVRHandler.h
    ${LOVE_SRC}/modules/image/magpie/STBHandler.cpp
    ${LOVE_SRC}/modules/image/magpie/STBHandler.h
    ${LOVE_SRC}/libraries/lodepng/lodepng.cpp
    ${LOVE_SRC}/libraries/lodepng/lodepng.h
    ${LOVE_SRC}/libraries/ddsparse/ddsinfo.h
    ${LOVE_SRC}/libraries/ddsparse/ddsparse.cpp
    ${LOVE_SRC}/libraries/ddsparse/ddsparse.h

    # ghost
    ${LOVE_SRC}/modules/ghost/DrawAlgorithms.cpp
    ${LOVE_SRC}/modules/ghost/DrawAlgorithms.hpp
    ${LOVE_SRC}/modules/ghost/DrawData.cpp
    ${LOVE_SRC}/modules/ghost/DrawData.hpp
    ${LOVE_SRC}/modules/ghost/DrawDataFrame.cpp
    ${LOVE_SRC}/modules/ghost/DrawDataFrame.hpp
    ${LOVE_SRC}/modules/ghost/Ghost.cpp
    ${LOVE_SRC}/modules/ghost/Ghost.hpp
    ${LOVE_SRC}/modules/ghost/GhostTypes.hpp
    ${LOVE_SRC}/modules/ghost/wrap_Ghost.cpp
    ${LOVE_SRC}/modules/ghost/wrap_Ghost.hpp

    # tove
    ${TOVE_SRC}/src/cpp/version.cpp
    ${TOVE_SRC}/src/cpp/interface/api.cpp
    ${TOVE_SRC}/src/cpp/graphics.cpp
    ${TOVE_SRC}/src/cpp/nsvg.cpp
    ${TOVE_SRC}/src/cpp/paint.cpp
    ${TOVE_SRC}/src/cpp/path.cpp
    ${TOVE_SRC}/src/cpp/references.cpp
    ${TOVE_SRC}/src/cpp/subpath.cpp
    ${TOVE_SRC}/src/cpp/mesh/flatten.cpp
    ${TOVE_SRC}/src/cpp/mesh/mesh.cpp
    ${TOVE_SRC}/src/cpp/mesh/meshifier.cpp
    ${TOVE_SRC}/src/cpp/mesh/partition.cpp
    ${TOVE_SRC}/src/cpp/mesh/triangles.cpp
    ${TOVE_SRC}/src/cpp/gpux/curve_data.cpp
    ${TOVE_SRC}/src/cpp/gpux/geometry_data.cpp
    ${TOVE_SRC}/src/cpp/gpux/geometry_feed.cpp
    ${TOVE_SRC}/src/cpp/shader/gen.cpp
    ${TOVE_SRC}/src/thirdparty/clipper.cpp
    ${TOVE_SRC}/src/thirdparty/polypartition/src/polypartition.cpp
    ${TOVE_SRC}/src/thirdparty/tinyxml2/tinyxml2.cpp
    ${TOVE_SRC}/src/cpp/warn.cpp
    )
  target_link_libraries(castle-core PRIVATE castle-love)
  if(MSVC)
    target_sources(castle-love PRIVATE
      ${LOVE_SRC}/libraries/glslang/glslang/OSDependent/Windows/main.cpp
      ${LOVE_SRC}/libraries/glslang/glslang/OSDependent/Windows/ossource.cpp
      )
  elseif(APPLE AND (NOT "${CMAKE_SYSTEM_NAME}" STREQUAL "iOS"))
    target_sources(castle-love PRIVATE
      ${LOVE_SRC}/libraries/glslang/glslang/OSDependent/Unix/ossource.cpp
      ${LOVE_SRC}/common/macosx.mm ${LOVE_SRC}/common/macosx.h
      ${LOVE_SRC}/libraries/physfs/physfs_platform_apple.m
    )
  elseif(ANDROID)
    target_sources(castle-love PRIVATE
      ${LOVE_SRC}/libraries/glslang/glslang/OSDependent/Unix/ossource.cpp
      ${LOVE_SRC}/common/android.cpp ${LOVE_SRC}/common/android.h
    )
  else()
    target_sources(castle-love PRIVATE
      ${LOVE_SRC}/libraries/glslang/glslang/OSDependent/Unix/ossource.cpp
    )
  endif()
endif()

# Box2D
set(BOX2D_BUILD_UNIT_TESTS OFF CACHE BOOL "" FORCE)
set(BOX2D_BUILD_TESTBED OFF CACHE BOOL "" FORCE)
add_subdirectory(vendor/box2d EXCLUDE_FROM_ALL)
target_link_libraries(castle-core PRIVATE box2d)

# entt
target_include_directories(castle-core PRIVATE vendor/entt/src)

# rapidjson
target_include_directories(castle-core PRIVATE vendor/rapidjson/include)

# soloud
add_library(soloud STATIC)
target_include_directories(soloud PUBLIC vendor/soloud20200207/include vendor/soloud20200207/src/backend/miniaudio)
target_compile_definitions(soloud PRIVATE WITH_MINIAUDIO)
if(NOT MSVC)
  target_compile_options(soloud PRIVATE -fdiagnostics-absolute-paths)
endif()
set(SOLOUD_SRC vendor/soloud20200207/src)
target_sources(soloud PRIVATE
  ${SOLOUD_SRC}/audiosource/noise/soloud_noise.cpp
  ${SOLOUD_SRC}/audiosource/sfxr/soloud_sfxr.cpp
  ${SOLOUD_SRC}/c_api/soloud_c.cpp
  ${SOLOUD_SRC}/core/soloud_audiosource.cpp
  ${SOLOUD_SRC}/core/soloud_bus.cpp
  ${SOLOUD_SRC}/core/soloud_core_3d.cpp
  ${SOLOUD_SRC}/core/soloud_core_basicops.cpp
  ${SOLOUD_SRC}/core/soloud_core_faderops.cpp
  ${SOLOUD_SRC}/core/soloud_core_filterops.cpp
  ${SOLOUD_SRC}/core/soloud_core_getters.cpp
  ${SOLOUD_SRC}/core/soloud_core_setters.cpp
  ${SOLOUD_SRC}/core/soloud_core_voicegroup.cpp
  ${SOLOUD_SRC}/core/soloud_core_voiceops.cpp
  ${SOLOUD_SRC}/core/soloud_fader.cpp
  ${SOLOUD_SRC}/core/soloud_fft_lut.cpp
  ${SOLOUD_SRC}/core/soloud_fft.cpp
  ${SOLOUD_SRC}/core/soloud_file.cpp
  ${SOLOUD_SRC}/core/soloud_filter.cpp
  ${SOLOUD_SRC}/core/soloud_misc.cpp
  ${SOLOUD_SRC}/core/soloud_queue.cpp
  ${SOLOUD_SRC}/core/soloud_thread.cpp
  ${SOLOUD_SRC}/core/soloud.cpp
  ${SOLOUD_SRC}/filter/soloud_bassboostfilter.cpp
  ${SOLOUD_SRC}/filter/soloud_biquadresonantfilter.cpp
  ${SOLOUD_SRC}/filter/soloud_dcremovalfilter.cpp
  ${SOLOUD_SRC}/filter/soloud_echofilter.cpp
  ${SOLOUD_SRC}/filter/soloud_fftfilter.cpp
  ${SOLOUD_SRC}/filter/soloud_flangerfilter.cpp
  ${SOLOUD_SRC}/filter/soloud_freeverbfilter.cpp
  ${SOLOUD_SRC}/filter/soloud_lofifilter.cpp
  ${SOLOUD_SRC}/filter/soloud_robotizefilter.cpp
  ${SOLOUD_SRC}/filter/soloud_waveshaperfilter.cpp
)
if(APPLE)
  target_sources(soloud PRIVATE ${SOLOUD_SRC}/backend/miniaudio/soloud_miniaudio.mm)
else()
  target_sources(soloud PRIVATE ${SOLOUD_SRC}/backend/miniaudio/soloud_miniaudio.cpp)
endif()
target_link_libraries(castle-core PRIVATE soloud)
