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

if(LIB)
  add_library(castle-core STATIC)
else()
  add_executable(castle-core)
endif()

# Sources
file(GLOB MY_SOURCES CONFIGURE_DEPENDS src/*.cpp)
if(LIB)
  list(REMOVE_ITEM MY_SOURCES "${CMAKE_SOURCE_DIR}/src/main.cpp")
endif()
target_sources(castle-core PRIVATE ${MY_SOURCES})
target_include_directories(castle-core PRIVATE src)

# Standard
target_compile_features(castle-core PRIVATE cxx_std_17)
set_target_properties(castle-core PROPERTIES CXX_EXTENSIONS OFF)

# clang-tidy (need to define this before the target (?))
#if(TIDY)
#  set(CMAKE_CXX_CLANG_TIDY "/usr/local/opt/llvm/bin/clang-tidy" "--header-filter=../../src")
#endif()

# Warnings
if(NOT MSVC)
  target_compile_options(castle-core PRIVATE -fcolor-diagnostics -pedantic-errors -Wall -Wextra -Wno-missing-braces -Wno-gnu-zero-variadic-macro-arguments -Wno-nested-anon-types)
  target_link_options(castle-core PRIVATE -fcolor-diagnostics -pedantic-errors -Wall -Wextra -Wno-missing-braces)
  if(WIN32)
    target_compile_options(castle-core PRIVATE -Wno-language-extension-token)
    target_link_options(castle-core PRIVATE -Wno-language-extension-token)
  endif()
endif()

# Precompiled header
if(NOT CMAKE_EXPORT_COMPILE_COMMANDS)
  target_precompile_headers(castle-core PRIVATE src/precomp.h)
endif()

# Web flags
if(WEB)
  target_link_options(castle-core PRIVATE "SHELL:--bind")
  target_link_options(castle-core PRIVATE "SHELL:-s WASM=1")
  target_link_options(castle-core PRIVATE "SHELL:-s MAX_WEBGL_VERSION=2")
  target_link_options(castle-core PRIVATE "SHELL:-s TOTAL_MEMORY=256MB")
  if ("${CMAKE_BUILD_TYPE}" STREQUAL "Debug")
    target_compile_options(castle-core PRIVATE "SHELL:-g4 --source-map-base file://${CMAKE_BINARY_DIR}/ -fsanitize=leak")
    target_link_options(castle-core PRIVATE "SHELL:-g4 --source-map-base file://${CMAKE_BINARY_DIR}/ -fsanitize=leak")
  else()
    target_link_options(castle-core PRIVATE -O0) # Makes link step much faster
    target_compile_options(castle-core PRIVATE "SHELL:--profiling")
    target_link_options(castle-core PRIVATE "SHELL:--profiling")
  endif()
endif()


#
# Dependencies
#

# SDL2
if(WEB)
  target_compile_options(castle-core PRIVATE "SHELL:-s USE_SDL=2")
  target_link_options(castle-core PRIVATE "SHELL:-s USE_SDL=2")
else()
#  set(SDL_STATIC ON CACHE BOOL "" FORCE)
#  set(SDL_SHARED OFF CACHE BOOL "" FORCE)
#  add_subdirectory(vendor/SDL2 EXCLUDE_FROM_ALL)
#  target_link_libraries(castle-core PRIVATE SDL2-static)
  target_include_directories(castle-core PRIVATE ../ghost-extensions/SDL2-2.0.8/include) # To make 'compile_commands.json' work
endif()

# fmt
add_subdirectory(vendor/fmt EXCLUDE_FROM_ALL)
target_link_libraries(castle-core PRIVATE fmt::fmt)

# love
if(YES)
  add_library(castle-love STATIC)
  set(LOVE_SRC ../love/src)
  target_include_directories(castle-love PUBLIC ${LOVE_SRC} ${LOVE_SRC}/libraries ${LOVE_SRC}/modules)

  # Lua dependency
  add_subdirectory(vendor/megasource/libs/lua-5.1.5 EXCLUDE_FROM_ALL)
  target_link_libraries(castle-love PUBLIC lua51)

  # SDL2 dependency
  target_include_directories(castle-love PRIVATE ../ghost-extensions/SDL2-2.0.8/include) # To make 'compile_commands.json' work
  if(WEB)
    target_compile_options(castle-love PRIVATE "SHELL:-s USE_SDL=2")
    target_link_options(castle-love PRIVATE "SHELL:-s USE_SDL=2")
  endif()

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

    # system
    ${LOVE_SRC}/modules/system/System.cpp ${LOVE_SRC}/modules/system/System.h
    ${LOVE_SRC}/modules/system/sdl/System.cpp
    ${LOVE_SRC}/modules/system/sdl/System.h

    # window
    ${LOVE_SRC}/modules/window/Window.cpp ${LOVE_SRC}/modules/window/Window.h
    ${LOVE_SRC}/modules/window/sdl/Window.cpp
    ${LOVE_SRC}/modules/window/sdl/Window.h

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
    )
  target_link_libraries(castle-core PRIVATE castle-love)
endif()

# rapidjson
#target_include_directories(castle-core PRIVATE vendor/rapidjson/include)


#
# Assets
#

# Bundle 'assets/'
if(WEB)
  target_link_options(castle-core PRIVATE "SHELL:--preload-file ${PROJECT_SOURCE_DIR}/assets@assets")
elseif("${CMAKE_SYSTEM_NAME}" STREQUAL "iOS")
  target_sources(castle-core PRIVATE "assets")
  set_target_properties(castle-core PROPERTIES RESOURCE "assets")
endif()

# Static web files
if(WEB)
  configure_file(web/index.html index.html COPYONLY)
endif()
