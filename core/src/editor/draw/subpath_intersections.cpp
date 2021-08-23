#include "subpath_intersections.h"
#include "util.h"

std::vector<love::Point> DrawSubpathIntersections::lineLine(love::Subpath s1, love::Subpath s2) {
  std::vector<love::Point> results;
  if (s1.p1 == s2.p1 || s1.p1 == s2.p2) {
    results.emplace_back(s1.p1.x, s1.p1.y);
    return results;
  } else if (s1.p2 == s2.p1 || s1.p2 == s2.p2) {
    results.emplace_back(s1.p2.x, s1.p2.y);
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
  results.emplace_back(love::Point(x1 + (t * (x2 - x1)), y1 + (t * (y2 - y1))));
  return results;
}

std::vector<love::Point> DrawSubpathIntersections::arcArc(love::Subpath s1, love::Subpath s2) {
  // https://stackoverflow.com/questions/3349125/circle-circle-intersection-points
  std::vector<love::Point> results;
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
    if (DrawUtil::areAnglesEqual(s1.startAngle, s2.endAngle)
        || DrawUtil::areAnglesEqual(s1.startAngle, s2.startAngle)) {
      tempResults.emplace_back(love::Point(s1.center.x + (cos(s1.startAngle) * s1.radius),
          s1.center.y + (sin(s1.startAngle) * s1.radius)));
    } else if (DrawUtil::areAnglesEqual(s1.endAngle, s2.endAngle)
        || DrawUtil::areAnglesEqual(s1.endAngle, s2.startAngle)) {
      tempResults.emplace_back(love::Point(s1.center.x + (cos(s1.endAngle) * s1.radius),
          s1.center.y + (sin(s1.endAngle) * s1.radius)));
    } else {
      return results;
    }
  } else {
    auto a = float(((pow(s1.radius, 2) - pow(s2.radius, 2)) + pow(d, 2)) / (2 * d));
    // h will be 0 if they intersect at only one point
    auto h = float(sqrt(pow(s1.radius, 2) - pow(a, 2)));
    auto p2 = love::Point(s1.center.x + ((a * (s2.center.x - s1.center.x)) / d),
        s1.center.y + ((a * (s2.center.y - s1.center.y)) / d));
    if (h > -0.0001 && h < 0.0001) {
      tempResults.push_back(p2);
    } else {
      tempResults.emplace_back(love::Point(p2.x + ((h * (s2.center.y - s1.center.y)) / d),
          p2.y - ((h * (s2.center.x - s1.center.x)) / d)));
      tempResults.emplace_back(love::Point(p2.x - ((h * (s2.center.y - s1.center.y)) / d),
          p2.y + ((h * (s2.center.x - s1.center.x)) / d)));
    }
  }
  for (auto &tempResult : tempResults) {
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
      results.emplace_back(love::Point(tempResult.x, tempResult.y));
    }
  }
  return results;
}

std::vector<love::Point> DrawSubpathIntersections::lineArc(love::Subpath s1, love::Subpath s2) {
  std::vector<love::Point> results;
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
    tempResults.emplace_back(love::Point(resultX, resultY));
  } else {
    float sgnDy = 1;
    if (dy < 0) {
      sgnDy = -1;
    }
    auto resultX1 = ((D * dy) + ((sgnDy * dx) * sqrt(discriminant))) / (dr * dr);
    auto resultY1 = ((-D * dx) + (abs(dy) * sqrt(discriminant))) / (dr * dr);
    auto resultX2 = ((D * dy) - ((sgnDy * dx) * sqrt(discriminant))) / (dr * dr);
    auto resultY2 = ((-D * dx) - (abs(dy) * sqrt(discriminant))) / (dr * dr);
    tempResults.emplace_back(love::Point(resultX1, resultY1));
    tempResults.emplace_back(love::Point(resultX2, resultY2));
  }
  // make sure the points are inside the line segment
  std::vector<love::Point> tempResults2;
  auto delta = 0.00001;
  for (auto &tempResult : tempResults) {
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
  for (auto &tempResult : tempResults2) {
    // atan2 has a different range in c++ vs lua, so this angle check was breaking
    // we only use this for the eraser which is just a circle for now, so don't nee to fix
    // auto angle = atan2(tempResult.y, tempResult.x);


    // print('intersection angle: ' .. angle)
    // print('start angle: ' .. s2.startAngle .. '   end Angle' .. s2.endAngle)

    // for (int j = -1; j < 1; j++) {
    // auto add = (2 * M_PI) * j;
    // if ((angle + add) >= s2.startAngle && (angle + add) <= s2.endAngle) {
    results.emplace_back(love::Point(tempResult.x + s2.center.x, tempResult.y + s2.center.y));
    // break;
    //}
    //}
  }
  return results;
}

std::vector<love::Point> DrawSubpathIntersections::getIntersections(
    love::Subpath s1, love::Subpath s2) {
  if (s1.type == love::SubpathType::line && s2.type == love::SubpathType::line) {
    return lineLine(s1, s2);
  } else if (s1.type == love::SubpathType::arc && s2.type == love::SubpathType::arc) {
    return arcArc(s1, s2);
  } else {
    return lineArc(s1, s2);
  }
}
