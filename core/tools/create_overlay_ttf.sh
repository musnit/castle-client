#!/bin/bash

fontforge -script tools/create_overlay_ttf.fontforge $1 $2 assets/Overlay.ttf
rm 1.ttf
rm 2.ttf
