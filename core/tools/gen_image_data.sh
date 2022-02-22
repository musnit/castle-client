#!/bin/bash

# Converts '*.png' under './asssets' into header files under './src/data'

pushd ./assets > /dev/null
rm -f ../src/data/images.h
for f in *.png; do
  xxd -i $f >> ../src/data/images.h
done
for f in **/*.png; do
  xxd -i $f >> ../src/data/images.h
done
popd > /dev/null
