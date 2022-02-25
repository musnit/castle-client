#!/bin/sh


DIRNAME=`dirname "$0"`
pushd $DIRNAME > /dev/null

rm -rf build
mkdir build

pushd ../android > /dev/null

echo "Building..."

# https://github.com/invertase/react-native-notifee/issues/151#issuecomment-696910951
# must use :app: prefix because of this android bug...
./gradlew :app:bundleRelease
cp app/build/outputs/bundle/release/app-release.aab ../tools/build

echo "Done building"

popd > /dev/null

echo "Running build-apks..."
java -jar bundletool-all-1.5.0.jar build-apks --connected-device --bundle=build/app-release.aab --output=build/aab-apk.apks --ks ../android/app/debug.keystore --ks-key-alias androiddebugkey --ks-pass pass:android

echo "Uninstalling old app..."
adb uninstall xyz.castle
adb uninstall xyz.castle.debug
adb uninstall xyz.castle.beta

echo "Installing new app..."
java -jar bundletool-all-1.5.0.jar install-apks --apks=build/aab-apk.apks

echo ""
echo "After testing, upload build/app-release.aab to Google Play"

popd > /dev/null
