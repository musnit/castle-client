#!/usr/bin/env bash

if [ -n "$ONLY_DEVICE" ]; then
  if adb devices | grep -q '	device'; then
    echo "Found connected device"
  else
    echo "No connected device"
    exit 1
  fi
fi

npx react-native run-android --appIdSuffix "debug"
