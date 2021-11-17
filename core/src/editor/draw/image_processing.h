#pragma once
#include "precomp.h"
#include "lv.h"

namespace ImageProcessing {

love::image::ImageData *fitToMaxSize(love::image::ImageData *data, int maxSize);
void testOnlyRedChannel(love::image::ImageData *data);
void kMeans(love::image::ImageData *data, uint8 k, int numIterations);

void paletteSwap(love::image::ImageData *data, std::array<int, 60> &palette);

void gaussianBlur(love::image::ImageData *data);
}
