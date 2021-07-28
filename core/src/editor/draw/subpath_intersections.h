#pragma once

#include "precomp.h"
#include "lv.h"

class DrawSubpathIntersections {
public:
  static std::vector<love::Point> getIntersections(love::Subpath s1, love::Subpath s2);

  static std::vector<love::Point> lineLine(love::Subpath s1, love::Subpath s2);
  static std::vector<love::Point> arcArc(love::Subpath s1, love::Subpath s2);
  static std::vector<love::Point> lineArc(love::Subpath s1, love::Subpath s2);
};
