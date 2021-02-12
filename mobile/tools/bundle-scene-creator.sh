#!/bin/sh
# downloads scene_creator from the castle server and writes it to a particular destination path.
# used by the iOS build to bundle scene creator for the app's first boot.

set -e

if [ $# -ne 3 ]
then
    echo "Usages:"
    echo "\t$(basename $0) --remote <api version> <path to write>"
    echo "\t$(basename $0) --local <path to scene-creator> <path to write>"
    exit 1
fi

DESTINATION_PATH=$3

cd "$(dirname "$0")"

if [ "$1" = "--remote" ]; then
    API_VERSION=$2

    DOWNLOAD_URL='https://api.castle.xyz/api/scene-creator'

    TMP_DOWNLOAD_DIR=/tmp/castle-scene-creator-download
    mkdir -p $TMP_DOWNLOAD_DIR
    pushd $TMP_DOWNLOAD_DIR

    echo "Downloading scene creator version $API_VERSION..."
    curl -L -o scene_creator "$DOWNLOAD_URL?apiVersion=$API_VERSION"

    echo "Writing zipped scene creator to $DESTINATION_PATH..."
    mv scene_creator "$DESTINATION_PATH"

    popd
fi

if [ "$1" = "--local" ]; then
    SCENE_CREATOR_PATH=$2

    echo "Generating zip from local scene creator at $SCENE_CREATOR_PATH..."
    pushd "$SCENE_CREATOR_PATH/scripts"
    ./generate_zip.sh
    popd

    echo "Writing zipped scene creator to $DESTINATION_PATH..."
    cp "$SCENE_CREATOR_PATH/scene_creator.love" "$DESTINATION_PATH"
fi
