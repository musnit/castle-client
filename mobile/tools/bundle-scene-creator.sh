#!/bin/sh
# downloads scene_creator from the castle server and writes it to a particular destination path.
# used by the iOS build to bundle scene creator for the app's first boot.
# usage: bundle-scene-creator.sh <api version> <path to write>

set -e

cd "$(dirname "$0")"

API_VERSION=$1
DESTINATION_PATH=$2

DOWNLOAD_URL='https://api.castle.xyz/api/scene-creator'

TMP_DOWNLOAD_DIR=/tmp/castle-scene-creator-download
mkdir -p $TMP_DOWNLOAD_DIR
pushd $TMP_DOWNLOAD_DIR

echo "Downloading scene creator version $API_VERSION..."

curl -L -o scene_creator "$DOWNLOAD_URL?apiVersion=$API_VERSION"

echo "Writing zipped scene creator to $DESTINATION_PATH..."

mv scene_creator $DESTINATION_PATH

popd
