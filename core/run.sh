#!/bin/bash

set -e

PLATFORM="macOS"
CMAKE="cmake"
CLANG_FORMAT="clang-format"
TIME="time"
TIME_TOTAL="time"

if [[ -f /proc/version ]]; then
  if grep -q Linux /proc/version; then
    PLATFORM="lin"
    TIME="time --format=%es\n"
    TIME_TOTAL="time --format=total\t%es\n"
  fi
  if grep -q Microsoft /proc/version; then
    PLATFORM="win"
    CMAKE="cmake.exe"
    CLANG_FORMAT="clang-format.exe"
  fi
fi

case "$1" in
  # Compile commands DB (used by editor plugins)
  db)
    $CMAKE -DCMAKE_EXPORT_COMPILE_COMMANDS=ON -DCMAKE_BUILD_TYPE=Debug -H. -Bbuild/db -GNinja
    cp ./build/db/compile_commands.json ../
    ;;

  # Format
  format)
    $CLANG_FORMAT -i -style=file src/*
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
  web-init)
    case $PLATFORM in
      lin|macOS)
        cd vendor/emsdk
        ./emsdk install latest
        ./emsdk activate latest
        ;;
      win)
        cd vendor/emsdk
        cmd.exe /c emsdk install latest
        cmd.exe /c emsdk activate latest
        ;;
    esac
    ;;

  web-release)
    $TIME $CMAKE -DWEB=ON -H. -Bbuild/web-release -GNinja
    $TIME $CMAKE --build build/web-release
    ;;
  web-debug)
    $TIME $CMAKE -DCMAKE_BUILD_TYPE=Debug -DWEB=ON -H. -Bbuild/web-debug -GNinja
    $TIME $CMAKE --build build/web-debug
    ;;
  web-watch-release)
    find CMakeLists.txt src web -type f | entr $TIME_TOTAL ./run.sh web-release
    ;;
  web-watch-debug)
    find CMakeLists.txt src web -type f | entr $TIME_TOTAL ./run.sh web-debug
    ;;
  web-serve-release)
    npx http-server -p 9001 -c-1 build/web-release
    ;;
  web-serve-debug)
    npx http-server -p 9001 -c-1 build/web-debug
    ;;
  web-publish)
    ./run.sh web-release
    rm -rf web-publish/*
    mkdir -p web-publish
    cp build/web-release/{index.*,castle-core.*} web-publish/
esac
