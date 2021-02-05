#!/bin/sh

cd "$(dirname "$0")"

CASTLE_OS=$1 CASTLE_VERSION=$2 node set-app-version.js
