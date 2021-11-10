#!/bin/bash

# Converts '*.ttf' under './tools' into header files under './src/data'

pushd ./tools > /dev/null
for f in *.ttf; do
  xxd -i $f > ../src/data/$f.h
done
popd > /dev/null
