#!/bin/sh

set -e

if [ ! -d "fastlane" ]
then
   echo "Can't find fastlane directory, make sure to run this script from 'mobile'"
   exit 1
fi

# bundle update fastlane
bundle exec fastlane beta
