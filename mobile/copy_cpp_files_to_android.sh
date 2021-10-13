#!/usr/bin/env bash

cd ..
cp -r love/src/modules mobile/android/love/src/jni/love/src
git checkout -- mobile/android/love/src/jni/love/src/modules/window/sdl/Window.cpp
