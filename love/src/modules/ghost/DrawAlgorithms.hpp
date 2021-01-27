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
#include "common/runtime.h"

struct Point {
	float x;
	float y;
	
	Point() {
		
	}
	
	Point(float x, float y): x(x), y(y) {
	}
	
	void load(lua_State *L, int index) {
		lua_pushstring(L, "x");
		lua_gettable(L, index);
		x = lua_tonumber(L, -1);
		
		lua_pushstring(L, "y");
		lua_gettable(L, index);
		y = lua_tonumber(L, -1);
	}
	
	void push(lua_State *L) {
		lua_createtable(L, 0, 2);
		
		lua_pushstring(L, "x");
		lua_pushnumber(L, x);
		lua_settable(L, -3);
		
		lua_pushstring(L, "y");
		lua_pushnumber(L, y);
		lua_settable(L, -3);
	}
};

enum SubpathType {
	line,
	arc
};

struct Subpath {
	SubpathType type;
	Point p1;
	Point p2;
	Point center;
	float radius;
	float startAngle;
	float endAngle;
	
	Subpath(lua_State *L, int index) {
		load(L, index);
	}
	
	void load(lua_State *L, int index) {
		lua_pushstring(L, "type");
		lua_gettable(L, index);
		std::string t = lua_tostring(L, -1);
		if (t == "line") {
			type = line;
		} else {
			type = arc;
		}
		
		lua_pushstring(L, "p1");
		lua_gettable(L, index);
		if (lua_istable(L, -1)) {
			p1.load(L, lua_gettop(L));
		}
		
		lua_pushstring(L, "p2");
		lua_gettable(L, index);
		if (lua_istable(L, -1)) {
			p2.load(L, lua_gettop(L));
		}
		
		lua_pushstring(L, "center");
		lua_gettable(L, index);
		if (lua_istable(L, -1)) {
			center.load(L, lua_gettop(L));
		}
		
		lua_pushstring(L, "radius");
		lua_gettable(L, index);
		if (lua_isnumber(L, -1)) {
			radius = lua_tonumber(L, -1);
		}
		
		lua_pushstring(L, "startAngle");
		lua_gettable(L, index);
		if (lua_isnumber(L, -1)) {
			startAngle = lua_tonumber(L, -1);
		}
		
		lua_pushstring(L, "endAngle");
		lua_gettable(L, index);
		if (lua_isnumber(L, -1)) {
			endAngle = lua_tonumber(L, -1);
		}
	}
};

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

#endif /* DrawAlgorithms_hpp */
