#pragma once

#include "precomp.h"
#include <unordered_set>

class PaletteProvider {
public:
  PaletteProvider() = default;
  virtual ~PaletteProvider() {
  }
  virtual int nextColor(love::image::Pixel &inColor, love::PixelFormat format) = 0;
  virtual void reset();
  virtual void init();
};

class RandomPaletteProvider : public PaletteProvider {
public:
  RandomPaletteProvider();
  int nextColor(love::image::Pixel &inColor, love::PixelFormat format) override;

  void init() override;

private:
  std::array<int, 60> palette;
  int nextPaletteIndex = 0;
};

class NearestGreedyPaletteProvider : public PaletteProvider {
public:
  NearestGreedyPaletteProvider();
  int nextColor(love::image::Pixel &inColor, love::PixelFormat format) override;
  void reset() override;

private:
  std::unordered_set<int> colorUsed;
};

class SimilarLuminancePaletteProvider : public PaletteProvider {
public:
  SimilarLuminancePaletteProvider();
  int nextColor(love::image::Pixel &inColor, love::PixelFormat format) override;
  void init() override;
  void reset() override;

private:
  std::array<int, 60> palette;
  std::unordered_set<int> colorUsed;
  std::unordered_map<int, float> luminances;
};
