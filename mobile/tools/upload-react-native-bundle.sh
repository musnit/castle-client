#!/bin/sh

if [ -z "$1" ]; then
    echo "channel name arg is required"
    exit 1
fi

DIRNAME=`dirname "$0"`
pushd $DIRNAME > /dev/null

pushd ..
npx react-native bundle --entry-file js/Main.js --platform ios --bundle-output tools/tmp-ios.bundle
npx react-native bundle --entry-file js/Main.js --platform android --bundle-output tools/tmp-android.bundle
popd

CHANNEL_NAME=$1 PLATFORM=ios FILENAME=tmp-ios.bundle node upload-react-native-bundle-helper.js
CHANNEL_NAME=$1 PLATFORM=android FILENAME=tmp-android.bundle node upload-react-native-bundle-helper.js

rm tmp-ios.bundle
rm tmp-android.bundle

popd > /dev/null
