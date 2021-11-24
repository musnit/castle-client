#pragma once
#include "lv.h"

namespace DrawUtil {

void makePathsFromPoints(love::PathData *paths, float *points, int numPoints);
bool isPointInBounds(float x, float y);
bool floatEquals(float a, float b);
float unit(float f);
bool areAnglesEqual(float a1, float a2);

bool getRectangleShape(love::PathData *paths, float x1, float y1, float x2, float y2);
bool getRightTriangleShape(love::PathData *paths, float x1, float y1, float x2, float y2);
bool getCircleShapeRoundToGrid(love::DrawData &drawData, love::PathData *paths, float x1, float y1,
    float x2, float y2, float roundUnitX, float roundUnitY);

bool getRGBAFloat(love::image::Pixel &p, love::PixelFormat format, float *out);
float distanceSquared(float *rgba1, float *rgba2); // ignores alpha
void hexToRGBFloat(int hexColor, float *out);

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
