#include "palette_provider.h"
#include "util.h"

std::array<int, std::size_t(60)> CASTLE_PALETTE = {
  0x3b1725,
  0x73172d,
  0xb4202a,
  0xdf3e23,
  0xfa6a0a,
  0xf9a31b,
  0xffd541,
  0xfffc40,
  0xd6f264,
  0x9cdb43,
  0x59c135,
  0x14a02e,
  0x1a7a3e,
  0x24523b,
  0x122020,
  0x143464,
  0x285cc4,
  0x249fde,
  0x20d6c7,
  0xa6fcdb,
  0xfef3c0,
  0xfad6b8,
  0xf5a097,
  0xe86a73,
  0xbc4a9b,
  0x793a80,
  0x403353,
  0x242234,
  0x322b28,
  0x71413b,
  0xbb7547,
  0xdba463,
  0xf4d29c,
  0xdae0ea,
  0xb3b9d1,
  0x8b93af,
  0x6d758d,
  0x4a5462,
  0x333941,
  0x422433,
  0x5b3138,
  0x8e5252,
  0xba756a,
  0xe9b5a3,
  0xe3e6ff,
  0xb9bffb,
  0x849be4,
  0x588dbe,
  0x477d85,
  0x23674e,
  0x328464,
  0x5daf8d,
  0x92dcba,
  0xcdf7e2,
  0xe4d2aa,
  0xc7b08b,
  0xa08662,
  0x796755,
  0x5a4e44,
  0x423934,
};

void PaletteProvider::reset() {
}

void PaletteProvider::init() {
}

//
// RandomPaletteProvider: shuffle castle palette and cycle through it
//

RandomPaletteProvider::RandomPaletteProvider() {
  // copy so we can shuffle ours
  palette = CASTLE_PALETTE;
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
  reset();
}

void NearestGreedyPaletteProvider::reset() {
  colorUsed.clear();
}

int NearestGreedyPaletteProvider::nextColor(love::image::Pixel &inPixel, love::PixelFormat format) {
  if (colorUsed.size() == CASTLE_PALETTE.size()) {
    // all colors were used, start over
    reset();
  }

  float inRgba[4];
  float colorRgba[4];
  int closestColor = 0;
  float minDist = std::numeric_limits<float>::max();
  DrawUtil::getRGBAFloat(inPixel, format, inRgba);

  for (auto color : CASTLE_PALETTE) {
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

float luminance(float *rgb) {
  return 0.2126f * rgb[0] + 0.7152f * rgb[1] + 0.0722f * rgb[2];
}

SimilarLuminancePaletteProvider::SimilarLuminancePaletteProvider() {
  float colorRgba[4];
  for (auto color : CASTLE_PALETTE) {
    DrawUtil::hexToRGBFloat(color, colorRgba);

    // deliberately reduce luminance accuracy so that we can get some wiggle by shuffling
    float approxLuminance = std::floor(luminance(colorRgba) / 20.0f) * 20.0f;

    luminances.emplace(color, approxLuminance);
  }

  palette = CASTLE_PALETTE; // copy so we can shuffle
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
      auto inLum = luminance(inRgba);
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
