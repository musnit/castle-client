#!/bin/bash

if [ -z "$1" ]; then
    echo "channel name arg is required"
    exit 1
fi

DIRNAME=`dirname "$0"`
pushd $DIRNAME > /dev/null

if [ -z "$LUA_ONLY" ]; then
    pushd ..
    npx react-native bundle --entry-file index.js --platform ios --bundle-output tools/tmp-ios.bundle --dev=false
    npx react-native bundle --entry-file index.js --platform android --bundle-output tools/tmp-android.bundle --dev=false
    popd

    CHANNEL_NAME=$1 PLATFORM=ios FILENAME=tmp-ios.bundle node upload-react-native-bundle-helper.js
    echo "done uploading ios..."
    CHANNEL_NAME=$1 PLATFORM=android FILENAME=tmp-android.bundle node upload-react-native-bundle-helper.js
    echo "done uploading android..."

    rm tmp-ios.bundle
    rm tmp-android.bundle
fi

pushd ../../../scene-creator/scripts
./generate_zip.sh
popd
CHANNEL_NAME=$1 PLATFORM=lua FILENAME=../../../scene-creator/scene_creator.love node upload-react-native-bundle-helper.js
echo "done uploading lua..."

popd > /dev/null
