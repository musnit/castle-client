#!/bin/sh

set -e

# go to `mobile` directory
cd "$(dirname "${BASH_SOURCE[0]}")"
pushd ..

if [ -z "$1" ]; then
    echo "Usage: upload-ios-build.sh [username]"
    echo "Please specify Apple id (fastlane username) to use when signing and uploading, e.g. ben@castle.xyz"
    exit 1
fi

USERNAME=$1

bundle update fastlane
bundle exec fastlane beta username:$USERNAME

# TODO: maybe clean up plist changes
# TODO: maybe clean up provisioning files
