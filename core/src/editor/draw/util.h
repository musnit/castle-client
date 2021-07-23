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

std::optional<PathsList> getRectangleShape(float x1, float y1, float x2, float y2) {
  if (isPointInBounds(x1, y1) && isPointInBounds(x2, y2) && !floatEquals(x1, x2)
      && !floatEquals(y1, y2)) {
    float points[] = { x1, y1, x1, y2, x2, y2, x2, y1 };
    return pointsToPaths(points, 8);
  }
  return std::nullopt;
}
}
