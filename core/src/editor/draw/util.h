#pragma once
#include "lv.h"

namespace DrawUtil {
struct PathsList {
  love::PathData *paths;
  int length;
};

PathsList pointsToPaths(float *points, int length);
bool isPointInBounds(float x, float y);
bool floatEquals(float a, float b);
float unit(float f);
bool areAnglesEqual(float a1, float a2);

std::optional<PathsList> getRectangleShape(float x1, float y1, float x2, float y2);
std::optional<PathsList> getRightTriangleShape(float x1, float y1, float x2, float y2);
std::optional<PathsList> getCircleShapeRoundToGrid(love::DrawData &drawData, float x1, float y1,
    float x2, float y2, float roundUnitX, float roundUnitY);

bool pathIntersectsCircle(love::PathData &path, float x, float y, float radius);
}

inline bool DrawUtil::isPointInBounds(float x, float y) {
  return x >= -DRAW_MAX_SIZE && x <= DRAW_MAX_SIZE && y >= -DRAW_MAX_SIZE && y <= DRAW_MAX_SIZE;
}

inline bool DrawUtil::floatEquals(float a, float b) {
  return std::fabs(a - b) <= std::numeric_limits<float>::epsilon();
}

inline float DrawUtil::unit(float f) {
  if (floatEquals(f, 0))
    return 0;
  if (f < 1)
    return -1;
  return 1;
}
