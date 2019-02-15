#!/bin/sh

GIT_HASH=$(git rev-parse HEAD)
MACOS_BASE_VERSION=1
MACOS_VERSION=$MACOS_BASE_VERSION.$(git rev-list release-root..HEAD --count)

/usr/libexec/PlistBuddy -c "Set GHGitHash $GIT_HASH" Supporting/ghost-macosx.plist
/usr/libexec/PlistBuddy -c "Set CFBundleVersion $MACOS_VERSION" Supporting/ghost-macosx.plist
/usr/libexec/PlistBuddy -c "Set CFBundleShortVersionString $MACOS_VERSION" Supporting/ghost-macosx.plist

rm -rf archive.xcarchive
xcodebuild -project ghost.xcodeproj -config Release -scheme ghost-macosx -archivePath ./archive archive
ditto -c -k --sequesterRsrc --keepParent archive.xcarchive/Products/Applications/Castle.app Castle-$MACOS_VERSION.zip
rm -rf archive.xcarchive

/usr/libexec/PlistBuddy -c "Set GHGitHash GIT_HASH_UNSET" Supporting/ghost-macosx.plist
/usr/libexec/PlistBuddy -c "Set CFBundleVersion VERSION_UNSET" Supporting/ghost-macosx.plist
/usr/libexec/PlistBuddy -c "Set CFBundleShortVersionString VERSION_UNSET" Supporting/ghost-macosx.plist
