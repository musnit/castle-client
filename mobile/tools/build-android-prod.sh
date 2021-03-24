#!/bin/sh


DIRNAME=`dirname "$0"`
pushd $DIRNAME > /dev/null

rm -rf build
mkdir build

pushd ../android > /dev/null

./gradlew bundleRelease
cp app/build/outputs/bundle/release/app-release.aab ../tools/build

popd > /dev/null

java -jar bundletool-all-1.5.0.jar build-apks --connected-device --bundle=build/app-release.aab --output=build/aab-apk.apks
adb uninstall xyz.castle
java -jar bundletool-all-1.5.0.jar install-apks --apks=build/aab-apk.apks

echo "Upload build/app-release.aab to Google Play"

popd > /dev/null
