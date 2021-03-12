#!/bin/sh


DIRNAME=`dirname "$0"`
pushd $DIRNAME > /dev/null

VERSION_NAME=`node -e "console.log(require('fs').readFileSync('../android/app/build.gradle', 'utf8').split('versionCode ')[1].split('\n')[0])"`
echo "Version $VERSION_NAME"

./set-app-version.sh android $VERSION_NAME

popd > /dev/null
