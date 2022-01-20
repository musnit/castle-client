#include "palette_provider.h"
#include "util.h"

void PaletteProvider::reset() {
}

void PaletteProvider::init() {
}

//
// RandomPaletteProvider: shuffle castle palette and cycle through it
//

RandomPaletteProvider::RandomPaletteProvider() {
  palette = DrawUtil::getCastlePalette();
  init();
}

void RandomPaletteProvider::init() {
  unsigned seed = std::chrono::system_clock::now().time_since_epoch().count();
  std::shuffle(palette.begin(), palette.end(), std::default_random_engine(seed));
}

int RandomPaletteProvider::nextColor(love::image::Pixel &inPixel, love::PixelFormat format) {
  int result = palette[nextPaletteIndex];
  nextPaletteIndex++;
  nextPaletteIndex = nextPaletteIndex % palette.size();
  return result;
}

//
// NearestGreedyPaletteProvider: return nearest color from castle palette, mark that as used and
// don't repeat
//

NearestGreedyPaletteProvider::NearestGreedyPaletteProvider() {
  palette = DrawUtil::getCastlePalette();
  reset();
}

void NearestGreedyPaletteProvider::reset() {
  colorUsed.clear();
}

int NearestGreedyPaletteProvider::nextColor(love::image::Pixel &inPixel, love::PixelFormat format) {
  if (colorUsed.size() == palette.size()) {
    // all colors were used, start over
    reset();
  }

  float inRgba[4];
  float colorRgba[4];
  int closestColor = 0;
  float minDist = std::numeric_limits<float>::max();
  DrawUtil::getRGBAFloat(inPixel, format, inRgba);

  for (auto color : palette) {
    if (colorUsed.find(color) == colorUsed.end()) {
      DrawUtil::hexToRGBFloat(color, colorRgba);
      auto distance = DrawUtil::distanceSquared(inRgba, colorRgba);
      if (distance < minDist) {
        minDist = distance;
        closestColor = color;
      }
    }
  }

  colorUsed.emplace(closestColor);
  return closestColor;
}

//
// SimilarLuminancePaletteProvider: return semi-random colors from castle palette by similar
// brightness, mark as used, don't repeat
//

SimilarLuminancePaletteProvider::SimilarLuminancePaletteProvider() {
  palette = DrawUtil::getCastlePalette();
  float colorRgba[4];
  for (auto color : palette) {
    DrawUtil::hexToRGBFloat(color, colorRgba);

    // deliberately reduce luminance accuracy so that we can get some wiggle by shuffling
    float approxLuminance = std::floor(DrawUtil::luminance(colorRgba) / 20.0f) * 20.0f;

    luminances.emplace(color, approxLuminance);
  }

  init();
  reset();
}

void SimilarLuminancePaletteProvider::init() {
  unsigned seed = std::chrono::system_clock::now().time_since_epoch().count();
  std::shuffle(palette.begin(), palette.end(), std::default_random_engine(seed));
}

void SimilarLuminancePaletteProvider::reset() {
  colorUsed.clear();
}

int SimilarLuminancePaletteProvider::nextColor(
    love::image::Pixel &inPixel, love::PixelFormat format) {
  if (colorUsed.size() == palette.size()) {
    // all colors were used, start over
    reset();
  }

  float inRgba[4];
  int closestColor = 0;
  float minDist = std::numeric_limits<float>::max();
  DrawUtil::getRGBAFloat(inPixel, format, inRgba);

  for (auto color : palette) {
    if (colorUsed.find(color) == colorUsed.end()) {
      auto inLum = DrawUtil::luminance(inRgba);
      auto compareLum = luminances[color];
      auto distance = std::fabs(inLum - compareLum);
      if (distance < minDist) {
        minDist = distance;
        closestColor = color;
      }
    }
  }

  colorUsed.emplace(closestColor);
  return closestColor;
}
