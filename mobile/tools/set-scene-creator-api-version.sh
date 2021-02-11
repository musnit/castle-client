#!/bin/sh

cd "$(dirname "$0")"

VERSION=$1

echo "Setting version to '$VERSION'"

# iOS
IOS_PLIST_PATH="../ios/Castle/Info.plist"
echo "Modifying $IOS_PLIST_PATH..."
/usr/libexec/PlistBuddy -c "Set :SceneCreatorApiVersion $VERSION" $IOS_PLIST_PATH

# Android
MAIN_ACTIVITY_PATH="../android/app/src/main/java/xyz/castle/MainActivity.java"
echo "Modifying $MAIN_ACTIVITY_PATH..."
# public static final String SCENE_CREATOR_API_VERSION = "dev";
/usr/bin/sed -i '' "s/\(SCENE_CREATOR_API_VERSION = \)\(\"dev\"\)/\1\"$VERSION\"/" $MAIN_ACTIVITY_PATH
