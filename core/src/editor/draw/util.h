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

bool areAnglesEqual(float a1, float a2) {
  auto delta = 0.001f;
  for (int i = -1; i < 1; i++) {
    auto ta1 = a1 + ((i * M_PI) * 2);
    if (a2 > (ta1 - delta) && a2 < (ta1 + delta)) {
      return true;
    }
  }
  return false;
}

std::vector<love::Point> subpathDataIntersection(love::Subpath s1, love::Subpath s2) {
  std::vector<love::Point> results;
  if (s1.type == love::SubpathType::line && s2.type == love::SubpathType::line) {
    if (s1.p1 == s2.p1 || s1.p1 == s2.p2) {
      results.push_back(love::Point(s1.p1.x, s1.p1.y));
      return results;
    } else if (s1.p2 == s2.p1 || s1.p2 == s2.p2) {
      results.push_back(love::Point(s1.p2.x, s1.p2.y));
      return results;
    }
    auto x1 = s1.p1.x;
    auto y1 = s1.p1.y;
    auto x2 = s1.p2.x;
    auto y2 = s1.p2.y;
    auto x3 = s2.p1.x;
    auto y3 = s2.p1.y;
    auto x4 = s2.p2.x;
    auto y4 = s2.p2.y;
    auto denom = ((x1 - x2) * (y3 - y4)) - ((y1 - y2) * (x3 - x4));
    if (denom < 0.01 && denom > -0.01) {
      return results;
    }
    auto t = (((x1 - x3) * (y3 - y4)) - ((y1 - y3) * (x3 - x4))) / denom;
    if (t < 0 || t > 1) {
      return results;
    }
    auto u = -((x1 - x2) * (y1 - y3)) - ((y1 - y2) * (x1 - x3)) / denom;
    if (u < 0 || u > 1) {
      return results;
    }
    results.push_back(love::Point(x1 + (t * (x2 - x1)), y1 + (t * (y2 - y1))));
  } else if (s1.type == love::SubpathType::arc && s2.type == love::SubpathType::arc) {
    // https://stackoverflow.com/questions/3349125/circle-circle-intersection-points
    auto d = s1.center.distance(s2.center);
    if (d > (s1.radius + s2.radius)) {
      return results;
    }
    // one circle is completely inside the other
    if (d < abs(s1.radius - s2.radius)) {
      return results;
    }
    std::vector<love::Point> tempResults;
    if (d > -0.0001 && d < 0.0001) {
      // the circles are coincident. add all the end points of the arcs
      // TODO: should we handle if the lines completely overlap?
      if (areAnglesEqual(s1.startAngle, s2.endAngle)
          || areAnglesEqual(s1.startAngle, s2.startAngle)) {
        tempResults.push_back(love::Point(s1.center.x + (cos(s1.startAngle) * s1.radius),
            s1.center.y + (sin(s1.startAngle) * s1.radius)));
      } else if (areAnglesEqual(s1.endAngle, s2.endAngle)
          || areAnglesEqual(s1.endAngle, s2.startAngle)) {
        tempResults.push_back(love::Point(s1.center.x + (cos(s1.endAngle) * s1.radius),
            s1.center.y + (sin(s1.endAngle) * s1.radius)));
      } else {
        return results;
      }
    } else {
      auto a = ((pow(s1.radius, 2) - pow(s2.radius, 2)) + pow(d, 2)) / (2 * d);
      // h will be 0 if they intersect at only one point
      auto h = sqrt(pow(s1.radius, 2) - pow(a, 2));
      auto p2 = love::Point(s1.center.x + ((a * (s2.center.x - s1.center.x)) / d),
          s1.center.y + ((a * (s2.center.y - s1.center.y)) / d));
      if (h > -0.0001 && h < 0.0001) {
        tempResults.push_back(p2);
      } else {
        tempResults.push_back(love::Point(p2.x + ((h * (s2.center.y - s1.center.y)) / d),
            p2.y - ((h * (s2.center.x - s1.center.x)) / d)));
        tempResults.push_back(love::Point(p2.x - ((h * (s2.center.y - s1.center.y)) / d),
            p2.y + ((h * (s2.center.x - s1.center.x)) / d)));
      }
    }
    for (size_t i = 0; i < tempResults.size(); i++) {
      auto tempResult = tempResults[i];
      auto angle1 = atan2(tempResult.y - s1.center.y, tempResult.x - s1.center.x);
      auto angle2 = atan2(tempResult.y - s2.center.y, tempResult.x - s2.center.x);
      auto angle1Passed = false;
      auto angle2Passed = false;
      for (int j = -1; j < 1; j++) {
        auto add = (2 * M_PI) * j;
        if ((angle1 + add) >= (s1.startAngle - 0.001) && (angle1 + add) <= (s1.endAngle + 0.001)) {
          angle1Passed = true;
        }
        if ((angle2 + add) >= (s2.startAngle - 0.001) && (angle2 + add) <= (s2.endAngle + 0.001)) {
          angle2Passed = true;
        }
      }
      if (angle1Passed && angle2Passed) {
        results.push_back(love::Point(tempResult.x, tempResult.y));
      }
    }
  } else {
    if (s1.type == love::SubpathType::arc) {
      auto t = s1;
      s1 = s2;
      s2 = t;
    }
    // imagine the circle is centered at (0, 0)
    auto x1 = s1.p1.x - s2.center.x;
    auto y1 = s1.p1.y - s2.center.y;
    auto x2 = s1.p2.x - s2.center.x;
    auto y2 = s1.p2.y - s2.center.y;
    auto dx = x2 - x1;
    auto dy = y2 - y1;
    auto dr = sqrt((dx * dx) + (dy * dy));
    auto D = (x1 * y2) - (x2 * y1);
    auto r = s2.radius;
    auto discriminant = (((r * r) * dr) * dr) - (D * D);
    std::vector<love::Point> tempResults;
    auto angleDelta = 0.0001;
    if (discriminant <= -angleDelta) {
      return results;
    } else if (discriminant < angleDelta && discriminant > -angleDelta) {
      auto resultX = (D * dy) / (dr * dr);
      auto resultY = (-D * dx) / (dr * dr);
      tempResults.push_back(love::Point(resultX, resultY));
    } else {
      auto sgnDy = 1;
      if (dy < 0) {
        sgnDy = -1;
      }
      auto resultX1 = ((D * dy) + ((sgnDy * dx) * sqrt(discriminant))) / (dr * dr);
      auto resultY1 = ((-D * dx) + (abs(dy) * sqrt(discriminant))) / (dr * dr);
      auto resultX2 = ((D * dy) - ((sgnDy * dx) * sqrt(discriminant))) / (dr * dr);
      auto resultY2 = ((-D * dx) - (abs(dy) * sqrt(discriminant))) / (dr * dr);
      tempResults.push_back(love::Point(resultX1, resultY1));
      tempResults.push_back(love::Point(resultX2, resultY2));
    }
    // make sure the points are inside the line segment
    std::vector<love::Point> tempResults2;
    auto delta = 0.00001;
    for (size_t i = 0; i < tempResults.size(); i++) {
      auto tempResult = tempResults[i];
      auto minx = fmin(x1, x2) - delta;
      auto maxx = fmax(x1, x2) + delta;
      auto miny = fmin(y1, y2) - delta;
      auto maxy = fmax(y1, y2) + delta;
      if (tempResult.x >= minx && tempResult.x <= maxx && tempResult.y >= miny
          && tempResult.y <= maxy) {
        tempResults2.push_back(tempResult);
      }
    }
    // check to make sure the points are actually in this part of the arc
    for (size_t i = 0; i < tempResults2.size(); i++) {
      auto tempResult = tempResults2[i];

      // atan2 has a different range in c++ vs lua, so this angle check was breaking
      // we only use this for the eraser which is just a circle for now, so don't nee to fix
      // auto angle = atan2(tempResult.y, tempResult.x);


      // print('intersection angle: ' .. angle)
      // print('start angle: ' .. s2.startAngle .. '   end Angle' .. s2.endAngle)

      // for (int j = -1; j < 1; j++) {
      // auto add = (2 * M_PI) * j;
      // if ((angle + add) >= s2.startAngle && (angle + add) <= s2.endAngle) {
      results.push_back(love::Point(tempResult.x + s2.center.x, tempResult.y + s2.center.y));
      // break;
      //}
      //}
    }
  }
  return results;
}
}
