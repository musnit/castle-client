#!/bin/sh

set -e

if [ ! -d "fastlane" ]
then
   echo "Can't find fastlane directory, make sure to run this script from 'mobile'"
   exit 1
fi

if [ -z "$1" ]; then
    echo "Please specify fastlane lane: `beta` or `appstore`"
    exit 1
fi

LANE=$1

# could update fastlane here: bundle update fastlane
bundle exec fastlane $LANE

# TODO: maybe clean up plist changes
# TODO: maybe clean up provisioning files
