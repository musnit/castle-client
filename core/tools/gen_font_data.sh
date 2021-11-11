#!/bin/bash

# Converts '*.ttf' under './tools' into header files under './src/data'

pushd ./tools > /dev/null
rm -f ../src/data/fonts.h
for f in *.ttf; do
  xxd -i $f >> ../src/data/fonts.h
done
popd > /dev/null
