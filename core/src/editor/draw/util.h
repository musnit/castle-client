#pragma once
#include "lv.h"
#include "love/GhostTypes.hpp"
#include "love/DrawData.hpp"

namespace DrawUtil {
const std::array<int, size_t(60)> &getCastlePalette();
love::Colorf getRandomCastlePaletteColor();

void makePathsFromPoints(std::shared_ptr<love::PathData> *paths, float *points, int numPoints);
bool isPointInBounds(float x, float y);
bool floatEquals(float a, float b);
float unit(float f);
bool areAnglesEqual(float a1, float a2);

bool getRectangleShape(
    std::shared_ptr<love::PathData> *paths, float x1, float y1, float x2, float y2);
bool getRightTriangleShape(
    std::shared_ptr<love::PathData> *paths, float x1, float y1, float x2, float y2);
bool getCircleShapeRoundToGrid(love::DrawData &drawData, std::shared_ptr<love::PathData> *paths,
    float x1, float y1, float x2, float y2, float roundUnitX, float roundUnitY);

bool getRGBAFloat(love::image::Pixel &p, love::PixelFormat format, float *out);
float distanceSquared(float *rgba1, float *rgba2); // ignores alpha
void hexToRGBFloat(int hexColor, float *out);

bool pathIntersectsCircle(love::PathData &path, float x, float y, float radius);
bool pickColor(love::DrawDataFrame &frame, float x, float y, float radius, love::Colorf &outColor);

float luminance(float *rgb);
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

inline float DrawUtil::luminance(float *rgb) {
  return 0.2126f * rgb[0] + 0.7152f * rgb[1] + 0.0722f * rgb[2];
};
