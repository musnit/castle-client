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
CMAKE="$TIME $CMAKE"

case "$1" in
  # Compile commands DB (used by editor plugins)
  db)
    $CMAKE -DCMAKE_EXPORT_COMPILE_COMMANDS=ON -DCMAKE_BUILD_TYPE=Debug -H. -Bbuild/db -GNinja
    cp ./build/db/compile_commands.json ../
    ;;

  # Format
  format)
    $CLANG_FORMAT -i -style=file $(find src/ -type f)
    $CLANG_FORMAT -i -style=file $(find ../love/src/modules/ghost/ -type f)
    ;;

  # Format changed
  format-changed)
    if [[ $(git diff --cached --name-only --diff-filter=ACM --relative src) ]]; then
      $CLANG_FORMAT -i -style=file $(git diff --cached --name-only --diff-filter=ACM --relative src)
    fi

    if [[ $(git diff --cached --name-only --diff-filter=ACM --relative ../love/src/modules/ghost/) ]]; then
      $CLANG_FORMAT -i -style=file $(git diff --cached --name-only --diff-filter=ACM --relative ../love/src/modules/ghost/)
    fi
    ;;

  # Count lines of code
  cloc)
    cloc src ../love/src/modules/ghost --by-file --exclude_list_file=.cloc_exclude_list
    ;;

  # Desktop
  release)
    case $PLATFORM in
      lin|macOS)
        $CMAKE -H. -Bbuild/release -GNinja
        $CMAKE --build build/release
        if [[ -z "$VALGRIND" ]]; then
          ./build/release/castle-core $2
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
            --log-file="./build/valgrind.log" \
            --suppressions=<(echo "$SUPPRESSIONS") \
            --gen-suppressions=all \
            --leak-check=full \
            -s \
            ./build/release/castle-core $2
          cat build/valgrind.log
        fi
        ;;
      win)
        $CMAKE -H. -Bbuild/msvc -G"Visual Studio 16"
        $CMAKE --build build/msvc --config Release
        ./build/msvc/Release/castle-core.exe $2
        ;;
    esac
    ;;
  debug)
    case $PLATFORM in
      lin|macOS)
        $CMAKE -DCMAKE_BUILD_TYPE=Debug -H. -Bbuild/debug -GNinja
        $CMAKE --build build/debug
        ./build/debug/castle-core $2
        ;;
      win)
        $CMAKE -H. -Bbuild/msvc -G"Visual Studio 16"
        $CMAKE --build build/msvc --config Debug
        ./build/msvc/Debug/castle-core.exe $2
        ;;
    esac
    ;;
  xcode)
    $CMAKE -DCMAKE_BUILD_TYPE=Debug -H. -Bbuild/xcode -GXcode
    $CMAKE --build build/xcode
    ;;

  # Mobile
  ios-release)
    $CMAKE -DIOS=ON -DCMAKE_SYSTEM_NAME=iOS -H. -Bbuild/ios -GXcode
    $CMAKE --build build/ios --config Release
    cp \
      build/ios/Release-iphoneos/libsoloud.a \
      build/ios/Release-iphoneos/libcastle-core.a \
      build/ios/vendor/fmt/Release-iphoneos/libfmt.a \
      build/ios/vendor/box2d/bin/Release/libbox2d.a \
      binaries/ios
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
    if [ ! -d build/web-release ]; then
      $CMAKE -DWEB=ON -H. -Bbuild/web-release -GNinja
    fi
    $CMAKE --build build/web-release
    rm -rf ../../castle-www/public/player/*
    cp build/web-release/castle-core.* ../../castle-www/public/player/
    ;;
  web-watch-release)
    find CMakeLists.txt src assets web -type f | entr $TIME_TOTAL ./run.sh web-release
    ;;

  # Scenes
  load-card)
    node tools/main.js $2 $3
esac
