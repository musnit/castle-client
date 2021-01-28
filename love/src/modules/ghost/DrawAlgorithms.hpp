//
//  DrawAlgorithms.hpp
//  liblove-ios
//
//  Created by Jesse Ruder on 1/25/21.
//

#ifndef DrawAlgorithms_hpp
#define DrawAlgorithms_hpp

#include <stdio.h>
#include <vector>
#include "GhostTypes.h"

namespace love
{
namespace ghost
{

class DrawAlgorithms {
public:
	static bool floatEquals(float f1, float f2);
	static int floatUnit(float f);
	static bool arePointsEqual(Point p1, Point p2);
	static float pointsDistance(Point p1, Point p2);
	static float distance(Point p1, Point p2);
	static bool areAnglesEqual(float a1, float a2);
	static float normalizeRadianAngle(float angle);
	static bool isAngleBetween(float N, float a, float b);
	static std::vector<Point> subpathDataIntersection(Subpath s1, Subpath s2);
};

}
}

#endif /* DrawAlgorithms_hpp */
