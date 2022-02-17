#pragma once

#include "precomp.h"

#include "lv.h"


class Grid {
public:
  enum class Style {
    Dot,
    Cross,
  };

  Grid(const Grid &) = delete; // Prevent accidental copies
  const Grid &operator=(const Grid &) = delete;

  explicit Grid(Style style);
  Style style = Style::Dot;

  static float quantize(float value, float divisor, float start = 0);


  void draw(float gridCellSize, love::Vector2 gridMin, love::Vector2 gridMax, float viewScale,
      love::Vector2 view, love::Vector2 offset, float dotRadius, bool onlyAxes) const;

private:
  Lv &lv { Lv::getInstance() };

  std::unique_ptr<love::Shader> shader;
  void makeDotShader();
  void makeCrossShader();
};


// Inlined implementations

inline float Grid::quantize(float value, float divisor, float start) {
  if (divisor == 0) {
    return value;
  }
  return divisor * std::floor(0.5f + (value - start) / divisor) + start;
}
