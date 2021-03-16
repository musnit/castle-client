#!/bin/bash

set -e

PLATFORM="macOS"
CMAKE="cmake"

if [[ -f /proc/version ]]; then
  if grep -q Linux /proc/version; then
    PLATFORM="lin"
  fi
  if grep -q Microsoft /proc/version; then
    PLATFORM="win"
    CMAKE="cmake.exe"
  fi
fi

case "$1" in
  # Compile commands DB (used by editor plugins)
  db)
    $CMAKE -DCMAKE_EXPORT_COMPILE_COMMANDS=ON -DCMAKE_BUILD_TYPE=Debug -H. -Bbuild/db -GNinja
    cp ./build/db/compile_commands.json .
    ;;

  # Format
  format)
    clang-format -i -style=file src/*
    ;;

  # Desktop
  release)
    case $PLATFORM in
      lin|macOS)
        $CMAKE -H. -Bbuild/release -GNinja
        $CMAKE --build build/release
        if [[ -z "$VALGRIND" ]]; then
          ./build/release/castle-core
        else
          SUPPRESSIONS="
          {
            ignore_versioned_system_libs
            Memcheck:Leak
            ...
            obj:*/lib*/lib*.so.*
          }
          {
            ignore_iris_dri
            Memcheck:Addr1
            ...
            obj:*/dri/iris_dri.so
          }
          {
            ignore_iris_dri
            Memcheck:Addr2
            ...
            obj:*/dri/iris_dri.so
          }
          {
            ignore_iris_dri
            Memcheck:Addr4
            ...
            obj:*/dri/iris_dri.so
          }
          {
            ignore_iris_dri
            Memcheck:Addr8
            ...
            obj:*/dri/iris_dri.so
          }
          "
          valgrind \
            --suppressions=<(echo "$SUPPRESSIONS") \
            --gen-suppressions=all \
            --leak-check=full \
            -s \
            ./build/release/castle-core
        fi
        ;;
      win)
        $CMAKE -H. -Bbuild/msvc -G"Visual Studio 16"
        $CMAKE --build build/msvc --config Release
        ./build/msvc/Release/castle-core.exe 
        ;;
    esac
    ;;
  debug)
    case $PLATFORM in
      lin|macOS)
        $CMAKE -DCMAKE_BUILD_TYPE=Debug -H. -Bbuild/debug -GNinja
        $CMAKE --build build/debug
        ./build/debug/castle-core
        ;;
      win)
        $CMAKE -H. -Bbuild/msvc -G"Visual Studio 16"
        $CMAKE --build build/msvc --config Debug
        ./build/msvc/Debug/castle-core.exe 
        ;;
    esac
    ;;
  lib-release)
    case $PLATFORM in
      lin|macOS)
        $CMAKE -DLIB=ON -H. -Bbuild/lib-release -GNinja
        $CMAKE --build build/lib-release
        ;;
      win)
        $CMAKE -DLIB=ON -H. -Bbuild/lib-msvc -G"Visual Studio 16"
        $CMAKE --build build/lib-msvc --config Release
        ;;
    esac
    ;;

  # Web
  web-release)
    $CMAKE -DWEB=ON -H. -Bbuild/web-release -GNinja
    $CMAKE --build build/web-release
    ;;
  web-debug)
    $CMAKE -DCMAKE_BUILD_TYPE=Debug -DWEB=ON -H. -Bbuild/web-debug -GNinja
    $CMAKE --build build/web-debug
    ;;
  web-watch-release)
    find CMakeLists.txt src web -type f | entr ./run.sh web-release
    ;;
  web-watch-debug)
    find CMakeLists.txt src web -type f | entr ./run.sh web-debug
    ;;
  web-serve-release)
    npx http-server -c-1 build/web-release
    ;;
  web-serve-debug)
    npx http-server -c-1 build/web-debug
    ;;
esac
