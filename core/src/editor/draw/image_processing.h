#pragma once
#include "precomp.h"
#include "lv.h"
#include "palette_provider.h"

namespace ImageProcessing {

love::image::ImageData *fitToMaxSize(love::image::ImageData *data, int maxSize);
love::image::ImageData *fitToSize(love::image::ImageData *data, int maxSize);
void testOnlyRedChannel(love::image::ImageData *data);
void kMeans(love::image::ImageData *data, uint8 k, int numIterations);
void paletteSwap(love::image::ImageData *data, PaletteProvider &paletteProvider,
    std::vector<int> &outColrsUsed, std::optional<std::unordered_map<int, int>> overrides);
int paletteSwap(
    love::image::ImageData *data, const love::Colorf &fromColor, const love::Colorf &toColor);
void gaussianBlur(love::image::ImageData *data);
void removeIslands(love::image::ImageData *data, uint8 minEqualNeighbors);
void normalizeRgb(love::image::ImageData *data);
}
