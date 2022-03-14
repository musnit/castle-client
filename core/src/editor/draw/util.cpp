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

const std::array<int, size_t(60)> &DrawUtil::getCastlePalette() {
  return CASTLE_PALETTE;
}

love::Colorf DrawUtil::getRandomCastlePaletteColor() {
  static love::RandomGenerator rng;
  int hexColor = CASTLE_PALETTE[rng.rand() % 60];
  float rgb[3];
  hexToRGBFloat(hexColor, rgb);
  return { rgb[0] / 255.0f, rgb[1] / 255.0f, rgb[2] / 255.0f, 1.0f };
}

void DrawUtil::makePathsFromPoints(
    std::shared_ptr<love::PathData> *paths, float *points, int numPoints) {
  int pathIndex = 0;
  for (int i = 0; i < numPoints; i += 2) {
    auto nextI = i + 2;
    if (nextI >= numPoints) {
      nextI = nextI - numPoints;
    }
    paths[pathIndex]->clearTovePath();
    paths[pathIndex]->style = 1;
    paths[pathIndex]->points.clear();
    paths[pathIndex]->points.emplace_back(points[i], points[i + 1]);
    paths[pathIndex]->points.emplace_back(points[nextI], points[nextI + 1]);
    pathIndex++;
  }
}

bool DrawUtil::getRectangleShape(
    std::shared_ptr<love::PathData> *paths, float x1, float y1, float x2, float y2) {
  if (isPointInBounds(x1, y1) && isPointInBounds(x2, y2) && !floatEquals(x1, x2)
      && !floatEquals(y1, y2)) {
    float points[] = { x1, y1, x1, y2, x2, y2, x2, y1 };
    makePathsFromPoints(paths, points, 8);
    return true;
  }
  return false;
}

bool DrawUtil::getRightTriangleShape(
    std::shared_ptr<love::PathData> *paths, float x1, float y1, float x2, float y2) {
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

bool DrawUtil::getCircleShapeRoundToGrid(love::DrawData &drawData,
    std::shared_ptr<love::PathData> *paths, float x1, float y1, float x2, float y2,
    float roundUnitX, float roundUnitY) {
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
    paths[0]->style = 2;
    paths[1]->style = 3;
    paths[2]->style = 3;
    paths[3]->style = 2;
    return true;
  }
  return false;
}

bool DrawUtil::pathIntersectsCircle(love::PathData &path, float x, float y, float radius) {
  for (auto &toveSubpath : path.getToveSubpaths()) {
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

bool DrawUtil::pickColor(
    love::DrawDataFrame &frame, float x, float y, float radius, love::Colorf &outColor) {
  // test paths first
  if (!frame.parentLayer()->isBitmap) {
    for (auto &pathData : frame.pathDataList) {
      if (pathIntersectsCircle(*pathData, x, y, radius)) {
        outColor.set(
            pathData->color->r, pathData->color->g, pathData->color->b, pathData->color->a);
        return true;
      }
    }
  }
  // test fill
  auto fillPixelsPerUnit = frame.parentLayer()->parent()->fillPixelsPerUnit;
  int fillX = floor((x * fillPixelsPerUnit) - frame.fillImageBounds.minX),
      fillY = floor((y * fillPixelsPerUnit) - frame.fillImageBounds.minY);
  if (frame.fillImageData && frame.fillImageData->inside(fillX, fillY)) {
    love::image::Pixel pixel {};
    float rgba[4];
    frame.fillImageData->getPixel(fillX, fillY, pixel);
    getRGBAFloat(pixel, frame.fillImageData->getFormat(), rgba);
    if (rgba[3] == 255.0f) { // don't pick transparency
      outColor.set(rgba[0] / 255.0f, rgba[1] / 255.0f, rgba[2] / 255.0f, rgba[3] / 255.0f);
      return true;
    }
  }
  return false;
}
