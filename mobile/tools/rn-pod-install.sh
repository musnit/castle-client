#!/bin/bash
# we want to use a forked version of react-native just to get a bugfix for writing cocoapods specs.
# we can't use an actual forked github dependency in node_modules because it breaks our android
# installation for some reason.
# for now, manually fetch the forked files before running pod install.
# we can delete this script whenever we upgrade to RN 0.65 or newer, which already has the patch.
# https://github.com/castle-xyz/react-native/commit/f1acdb3fde70742103550a82ba29abd6f639c265

set -e

cd "$(dirname "${BASH_SOURCE[0]}")"

DESTINATION_DIR="../node_modules/react-native"
SOURCE_URL="https://raw.githubusercontent.com/castle-xyz/react-native/f1acdb3fde70742103550a82ba29abd6f639c265/"

# fetch forked version of react-native specs scripts
# in order to get 
curl -L -o "${DESTINATION_DIR}/scripts/generate-specs.sh" "${SOURCE_URL}/scripts/generate-specs.sh"
curl -L -o "${DESTINATION_DIR}/scripts/react_native_pods.rb" "${SOURCE_URL}/scripts/react_native_pods.rb"

# now run pod install
# (assumes cocoapods from homebrew on M1)
pushd "../ios"
/opt/homebrew/bin/pod install
popd
