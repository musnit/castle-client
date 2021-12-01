#include "util.h"

void DrawUtil::makePathsFromPoints(love::PathData *paths, float *points, int numPoints) {
  int pathIndex = 0;
  for (int i = 0; i < numPoints; i += 2) {
    auto nextI = i + 2;
    if (nextI >= numPoints) {
      nextI = nextI - numPoints;
    }
    paths[pathIndex].style = 1;
    paths[pathIndex].points.clear();
    paths[pathIndex].points.emplace_back(points[i], points[i + 1]);
    paths[pathIndex].points.emplace_back(points[nextI], points[nextI + 1]);
    pathIndex++;
  }
}

bool DrawUtil::getRectangleShape(love::PathData *paths, float x1, float y1, float x2, float y2) {
  if (isPointInBounds(x1, y1) && isPointInBounds(x2, y2) && !floatEquals(x1, x2)
      && !floatEquals(y1, y2)) {
    float points[] = { x1, y1, x1, y2, x2, y2, x2, y1 };
    makePathsFromPoints(paths, points, 8);
    return true;
  }
  return false;
}

bool DrawUtil::getRightTriangleShape(
    love::PathData *paths, float x1, float y1, float x2, float y2) {
  float x3 = x1, y3 = y2;
  auto isColinear = floatEquals((x2 - x1) * (y3 - y1), (x3 - x1) * (y2 - y1));
  if (!isColinear && isPointInBounds(x1, y1) && isPointInBounds(x2, y2)
      && isPointInBounds(x3, y3)) {
    float points[] = { x1, y1, x2, y2, x3, y3 };
    makePathsFromPoints(paths, points, 6);
    return true;
  }
  return false;
}

bool DrawUtil::getCircleShapeRoundToGrid(love::DrawData &drawData, love::PathData *paths, float x1,
    float y1, float x2, float y2, float roundUnitX, float roundUnitY) {
  // circle between p1 and p2, not rounded to grid
  float centerX = (x1 + x2) / 2.0f, centerY = (y1 + y2) / 2.0f,
        radius = sqrt(pow(x2 - x1, 2.0f) + pow(y2 - y1, 2.0f)) / 2.0f;

  auto roundedStartPoint = drawData.roundGlobalCoordinatesToGrid(
      centerX - roundUnitX * radius, centerY - roundUnitY * radius);
  radius = drawData.roundGlobalDistanceToGrid(radius);

  centerX = std::get<0>(roundedStartPoint) + roundUnitX * radius;
  centerY = std::get<1>(roundedStartPoint) + roundUnitY * radius;

  float points[] = {
    centerX, centerY - radius, // top
    centerX + radius, centerY, // right
    centerX, centerY + radius, // bottom
    centerX - radius, centerY // left
  };

  if (radius > 0 && isPointInBounds(points[0], points[1]) && isPointInBounds(points[2], points[3])
      && isPointInBounds(points[4], points[5]) && isPointInBounds(points[6], points[7])) {
    makePathsFromPoints(paths, points, 8);
    paths[0].style = 2;
    paths[1].style = 3;
    paths[2].style = 3;
    paths[3].style = 2;
    return true;
  }
  return false;
}

bool DrawUtil::pathIntersectsCircle(love::PathData &path, float x, float y, float radius) {
  for (auto &toveSubpath : path.toveSubpaths) {
    auto nearest = SubpathNearest(toveSubpath, x, y, 1e-4, radius);
    if (nearest.t >= 0) {
      return true;
    }
  }
  return false;
}

bool DrawUtil::areAnglesEqual(float a1, float a2) {
  auto delta = 0.001f;
  for (int i = -1; i < 1; i++) {
    auto ta1 = a1 + ((i * M_PI) * 2);
    if (a2 > (ta1 - delta) && a2 < (ta1 + delta)) {
      return true;
    }
  }
  return false;
}

bool DrawUtil::getRGBAFloat(love::image::Pixel &p, love::PixelFormat format, float *out) {
  switch (format) {
  case love::PixelFormat::PIXELFORMAT_RGBA8:
    out[0] = float(p.rgba8[0]);
    out[1] = float(p.rgba8[1]);
    out[2] = float(p.rgba8[2]);
    out[3] = float(p.rgba8[3]);
    return true;
  case love::PixelFormat::PIXELFORMAT_RGBA16:
    out[0] = float(p.rgba16[0]);
    out[1] = float(p.rgba16[1]);
    out[2] = float(p.rgba16[2]);
    out[3] = float(p.rgba16[3]);
    return true;
  case love::PixelFormat::PIXELFORMAT_RGBA16F:
    out[0] = float(p.rgba16f[0]);
    out[1] = float(p.rgba16f[1]);
    out[2] = float(p.rgba16f[2]);
    out[3] = float(p.rgba16f[3]);
    return true;
  case love::PixelFormat::PIXELFORMAT_RGBA32F:
    out[0] = float(p.rgba32f[0]);
    out[1] = float(p.rgba32f[1]);
    out[2] = float(p.rgba32f[2]);
    out[3] = float(p.rgba32f[3]);
    return true;
  default:
    return false;
  }
}

float DrawUtil::distanceSquared(float *rgba1, float *rgba2) {
  float sum = 0.0f;
  for (auto ii = 0; ii < 3; ii++) { // ignore alpha
    sum += powf(rgba1[ii] - rgba2[ii], 2.0f);
  }
  return sum;
}

void DrawUtil::hexToRGBFloat(int hexValue, float *out) {
  out[0] = float((hexValue >> 16) & 0xFF);
  out[1] = float((hexValue >> 8) & 0xFF);
  out[2] = float((hexValue >> 0) & 0xFF);
}
