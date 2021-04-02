//
//  DrawAlgorithms.hpp
//  liblove-ios
//
//  Created by Jesse Ruder on 1/25/21.
//

#ifndef DrawAlgorithms_hpp
#define DrawAlgorithms_hpp

#define _USE_MATH_DEFINES
#include <stdio.h>
#include <vector>
#include "GhostTypes.hpp"
#include <optional>

namespace love
{
namespace ghost
{

class DrawAlgorithms {
public:
	static bool colorsEqual(std::optional<Color> a1, std::optional<Color> a2);
	static bool coordinatesEqual(Point c1, Point c2);
	static bool optionalCoordinatesEqual(std::optional<Point> c1, std::optional<Point> c2);
	static bool floatEquals(float f1, float f2);
	static int floatUnit(float f);
	static bool arePointsEqual(Point p1, Point p2);
	static float pointsDistance(Point p1, Point p2);
	static float distance(Point p1, Point p2);
	static bool areAnglesEqual(float a1, float a2);
	static std::optional<std::tuple<int, int>> rayRayIntersection(float x1, float y1, float x2, float y2, float x3, float y3, float x4, float y4);
	static float normalizeRadianAngle(float angle);
	static bool isAngleBetween(float N, float a, float b);
	static std::vector<Point> subpathDataIntersection(Subpath s1, Subpath s2);
};

}
}

#endif /* DrawAlgorithms_hpp */
