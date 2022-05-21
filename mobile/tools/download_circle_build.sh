#!/bin/sh

DIRNAME=`dirname "$0"`
pushd $DIRNAME > /dev/null

rm -rf build
mkdir build

export CIRCLE_TOKEN=`node ../../../ghost-secret/get-secret.js circleci.apiToken`

echo "Downloading..."

cd build
curl -H "Circle-Token: $CIRCLE_TOKEN" https://circleci.com/api/v1.1/project/github/castle-xyz/castle-client/latest/artifacts \
  | grep -o 'https://[^"]*' \
  | wget --verbose --header "Circle-Token: $CIRCLE_TOKEN" --input-file -
cd ..

echo ""
echo "Running build-apks..."
java -jar bundletool-all-1.5.0.jar build-apks --connected-device --bundle=build/app-release.aab --output=build/aab-apk.apks --ks ../android/app/debug.keystore --ks-key-alias androiddebugkey --ks-pass pass:android

echo ""
echo "Uninstalling old app..."
adb uninstall xyz.castle
adb uninstall xyz.castle.debug
adb uninstall xyz.castle.beta

echo ""
echo "Installing new app..."
java -jar bundletool-all-1.5.0.jar install-apks --apks=build/aab-apk.apks

echo ""
echo "After testing, upload build/app-release.aab to Google Play"
