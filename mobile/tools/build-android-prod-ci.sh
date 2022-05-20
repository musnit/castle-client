#!/bin/sh
set -e

DIRNAME=`dirname "$0"`
pushd $DIRNAME > /dev/null

rm -rf build
mkdir build

pushd ../../.. > /dev/null
git clone https://$GHOST_SECRET_GITHUB_TOKEN@github.com/castle-xyz/ghost-secret.git
popd > /dev/null

pushd .. > /dev/null

cp ../../ghost-secret/mobile/.env .env
cp ../../ghost-secret/android-release/my-upload-key.keystore android/app/my-upload-key.keystore
cp ../../ghost-secret/android-release/gradle.properties android/gradle.properties

popd > /dev/null

pushd ../android > /dev/null

echo ""
echo "Building..."

./gradlew --no-daemon --max-workers=2 :app:bundleRelease
cp app/build/outputs/bundle/release/app-release.aab ../tools/build

echo ""
echo "Done building"

popd > /dev/null
