//
//  DrawAlgorithms.cpp
//  liblove-ios
//
//  Created by Jesse Ruder on 1/25/21.
//

#include "DrawAlgorithms.hpp"
#include <math.h>

namespace love {
namespace ghost {

  bool DrawAlgorithms::colorsEqual(std::optional<Color> a1, std::optional<Color> a2) {
    if (!a1 && !a2) {
      return true;
    }
    if (!a1 || !a2) {
      return false;
    }

    auto c1 = *a1;
    auto c2 = *a2;

    for (size_t i = 0; i < 4; i++) {
      if (!DrawAlgorithms::floatEquals(c1.data[i], c2.data[i])) {
        return false;
      }
    }
    return true;
  }

  bool DrawAlgorithms::coordinatesEqual(Point c1, Point c2) {
    if (!floatEquals(c1.x, c2.x)) {
      return false;
    }
    if (!floatEquals(c1.y, c2.y)) {
      return false;
    }
    return true;
  }

  bool DrawAlgorithms::optionalCoordinatesEqual(std::optional<Point> c1, std::optional<Point> c2) {
    if (!c1 && !c2) {
      return true;
    }
    if (!c1 || !c2) {
      return false;
    }

    if (!floatEquals(c1->x, c2->x)) {
      return false;
    }
    if (!floatEquals(c1->y, c2->y)) {
      return false;
    }
    return true;
  }

  bool DrawAlgorithms::floatEquals(float f1, float f2) {
    return f1 > (f2 - 0.001) && f1 < (f2 + 0.001);
  }

  int DrawAlgorithms::floatUnit(float f) {
    if (floatEquals(f, 0)) {
      return 0;
    } else if (f > 0) {
      return 1;
    } else {
      return -1;
    }
  }

  float DrawAlgorithms::pointsDistance(Point p1, Point p2) {
    return sqrt(pow(p2.x - p1.x, 2) + pow(p2.y - p1.y, 2));
  }

  std::optional<std::pair<float, float>> DrawAlgorithms::rayRayIntersection(
      float x1, float y1, float x2, float y2, float x3, float y3, float x4, float y4) {
    auto denom = ((x1 - x2) * (y3 - y4)) - ((y1 - y2) * (x3 - x4));
    if (denom < 0.01 && denom > -0.01) {
      return std::nullopt;
    }
    auto t = (((x1 - x3) * (y3 - y4)) - ((y1 - y3) * (x3 - x4))) / denom;
    return std::pair<float, float>({ x1 + (t * (x2 - x1)), y1 + (t * (y2 - y1)) });
  }

  float DrawAlgorithms::normalizeRadianAngle(float angle) {
    auto pi2 = 2 * M_PI;
    if (angle < 0) {
      angle = angle + pi2;
    } else if (angle > pi2) {
      angle = angle - pi2;
    }
    return angle;
  }

  bool DrawAlgorithms::isAngleBetween(float N, float a, float b) {
    N = normalizeRadianAngle(N);
    a = normalizeRadianAngle(a);
    b = normalizeRadianAngle(b);
    if (a < b) {
      return a <= N && N <= b;
    } else {
      return a <= N || N <= b;
    }
  }
}
}
