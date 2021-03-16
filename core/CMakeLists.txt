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
  set(CMAKE_TOOLCHAIN_FILE ../../../emsdk/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake)
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
  target_compile_options(castle-core PRIVATE -fcolor-diagnostics -pedantic-errors -Wall -Wextra -Wno-missing-braces -Wno-gnu-zero-variadic-macro-arguments)
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
#else()
#  set(SDL_STATIC ON CACHE BOOL "" FORCE)
#  set(SDL_SHARED OFF CACHE BOOL "" FORCE)
#  add_subdirectory(vendor/SDL2 EXCLUDE_FROM_ALL)
#  target_link_libraries(castle-core PRIVATE SDL2-static)
endif()

# fmt
add_subdirectory(vendor/fmt EXCLUDE_FROM_ALL)
target_link_libraries(castle-core PRIVATE fmt::fmt)

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
