#!/bin/bash

# Converts '*.ttf' under './tools/fonts' into header files under './src/data'

pushd ./assets > /dev/null
rm -f ../src/data/fonts.h
for f in *.ttf; do
  xxd -i $f >> ../src/data/fonts.h
done
popd > /dev/null
