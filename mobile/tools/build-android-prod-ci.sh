#!/bin/sh
set -e

DIRNAME=`dirname "$0"`
pushd $DIRNAME > /dev/null

rm -rf build
mkdir build

pushd .. > /dev/null

echo ""
echo "Writing .env file"
if [ ! -f .env ]
then
printf "AMPLITUDE_KEY=\"$AMPLITUDE_KEY\"\nSENTRY_DSN=\"$SENTRY_DSN\"\nADJUST_APP_TOKEN=\"$ADJUST_APP_TOKEN\"" > .env
fi

echo ""
echo "Writing CastleSecret.java file"

mkdir -p android/app/src/main/java/xyz/castle/generated/
if [ ! -f android/app/src/main/java/xyz/castle/generated/CastleSecret.java ]
then
printf "package xyz.castle.generated;\n\npublic final class CastleSecret {\n  public static final String ADJUST_APP_TOKEN = \"$ADJUST_APP_TOKEN\";\n}\n" > android/app/src/main/java/xyz/castle/generated/CastleSecret.java
fi

popd > /dev/null

pushd ../android > /dev/null

echo ""
echo "Building..."

./gradlew --no-daemon --max-workers=2 :app:bundleRelease
cp app/build/outputs/bundle/release/app-release.aab ../tools/build

echo ""
echo "Done building"

popd > /dev/null
