#pragma once

namespace DrawUtil {
struct PathsList {
  love::PathData *paths;
  int length;
};

PathsList pointsToPaths(float *points, int length) {
  auto numPaths = length / 2;
  int pathIndex = 0;
  PathsList result { new love::PathData[numPaths], numPaths };

  for (int i = 0; i < length; i += 2) {
    auto nextI = i + 2;
    if (nextI >= length) {
      nextI = nextI - length;
    }
    result.paths[pathIndex].style = 1;
    result.paths[pathIndex].points.push_back({ points[i], points[i + 1] });
    result.paths[pathIndex].points.push_back({ points[nextI], points[nextI + 1] });
    pathIndex++;
  }
  return result;
}

bool isPointInBounds(float x, float y) {
  return x >= -DRAW_MAX_SIZE && x <= DRAW_MAX_SIZE && y >= -DRAW_MAX_SIZE && y <= DRAW_MAX_SIZE;
}

bool floatEquals(float a, float b) {
  return std::fabs(a - b) <= std::numeric_limits<float>::epsilon();
}

float unit(float f) {
  if (floatEquals(f, 0))
    return 0;
  if (f < 1)
    return -1;
  return 1;
}

std::optional<PathsList> getRectangleShape(float x1, float y1, float x2, float y2) {
  if (isPointInBounds(x1, y1) && isPointInBounds(x2, y2) && !floatEquals(x1, x2)
      && !floatEquals(y1, y2)) {
    float points[] = { x1, y1, x1, y2, x2, y2, x2, y1 };
    return pointsToPaths(points, 8);
  }
  return std::nullopt;
}

std::optional<PathsList> getRightTriangleShape(float x1, float y1, float x2, float y2) {
  float x3 = x1, y3 = y2;
  auto isColinear = floatEquals((x2 - x1) * (y3 - y1), (x3 - x1) * (y2 - y1));
  if (!isColinear && isPointInBounds(x1, y1) && isPointInBounds(x2, y2)
      && isPointInBounds(x3, y3)) {
    float points[] = { x1, y1, x2, y2, x3, y3 };
    return pointsToPaths(points, 6);
  }
  return std::nullopt;
}

std::optional<PathsList> getCircleShapeRoundToGrid(love::DrawData &drawData, float x1, float y1,
    float x2, float y2, float roundUnitX, float roundUnitY) {
  // circle between p1 and p2, not rounded to grid
  float centerX = (x1 + x2) / 2.0, centerY = (y1 + y2) / 2.0,
        radius = sqrt(pow(x2 - x1, 2.0) + pow(y2 - y1, 2.0)) / 2.0;

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
    auto paths = pointsToPaths(points, 8);
    paths.paths[0].style = 2;
    paths.paths[1].style = 3;
    paths.paths[2].style = 3;
    paths.paths[3].style = 2;
    return paths;
  }
  return std::nullopt;
}

bool pathIntersectsCircle(love::PathData &path, float x, float y, float radius) {
  for (auto &toveSubpath : path.toveSubpaths) {
    auto nearest = SubpathNearest(toveSubpath, x, y, 1e-4, radius);
    if (nearest.t >= 0) {
      return true;
    }
  }
  return false;
}
}
