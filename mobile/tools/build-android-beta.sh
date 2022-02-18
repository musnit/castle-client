#!/bin/sh
set -e

DIRNAME=`dirname "$0"`
pushd $DIRNAME > /dev/null

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

echo ""
echo "Bundling react native..."
mkdir -p android/app/build/intermediates/res/merged/beta
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/build/intermediates/res/merged/beta

popd > /dev/null

pushd ../android > /dev/null

echo ""
echo "Building..."

# https://github.com/invertase/react-native-notifee/issues/151#issuecomment-696910951
# must use :app: prefix because of this android bug...
#--no-daemon
#
#    environment:
#      GRADLE_OPTS: '-Dkotlin.compiler.execution.strategy=in-process -Dorg.gradle.jvmargs="-Xmx2048m -XX:+HeapDumpOnOutOfMemoryError"'
#      _JAVA_OPTIONS: "-Xms512m -Xmx1024m -XX:-UseGCOverheadLimit"
./gradlew --no-daemon --max-workers=2 :app:assembleBeta :app:appDistributionUploadBeta

echo ""
echo "Done building"

popd > /dev/null
