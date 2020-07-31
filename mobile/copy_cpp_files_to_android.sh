#!/usr/bin/env bash

##../love/src/modules/image/ImageData.cpp android/love/src/jni/love/src/modules/image/ImageData.cpp

filePaths=("src/modules/image/ImageData.cpp" "src/modules/image/ImageData.h" "src/modules/image/wrap_ImageData.cpp")
gitResult=$(git status)


for filePath in ${filePaths[@]}; do
    iosPath="../love/${filePath}"
    androidPath="android/love/src/jni/love/${filePath}"

    if [[ $gitResult == *"${androidPath}"* ]]; then
        echo "Error: ${androidPath} has changes"
    else
        cp $iosPath $androidPath
    fi
done
