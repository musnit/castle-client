#pragma once

#include "precomp.h"

#include "lv.h"


class Grid {
public:
  Grid(const Grid &) = delete; // Prevent accidental copies
  const Grid &operator=(const Grid &) = delete;

  Grid();


  static float quantize(float value, float divisor, float start = 0);


  void draw(float gridCellSize, float gridSize, float viewScale, const love::Vector2 &view,
      const love::Vector2 &offset, float dotRadius, bool highlightAxes, float axesAlpha) const;


private:
  Lv &lv { Lv::getInstance() };

  std::unique_ptr<love::Shader> shader;
};


// Inlined implementations

inline float Grid::quantize(float value, float divisor, float start) {
  if (divisor == 0) {
    return value;
  }
  return divisor * std::floor(0.5f + (value - start) / divisor) + start;
}
