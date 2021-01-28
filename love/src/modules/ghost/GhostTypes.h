//
//  GhostTypes.h
//  liblove-ios
//
//  Created by Jesse Ruder on 1/27/21.
//

#ifndef GhostTypes_h
#define GhostTypes_h

#include "common/runtime.h"

#define GHOST_READ_NUMBER(arg) \
	lua_pushstring(L, #arg);\
	lua_gettable(L, index);\
	arg = lua_tonumber(L, -1);
	
#define GHOST_WRITE_NUMBER(arg) \
	lua_pushstring(L, #arg);\
	lua_pushnumber(L, arg);\
	lua_settable(L, -3);

#define GHOST_READ_POINT(arg) \
	lua_pushstring(L, #arg);\
	lua_gettable(L, index);\
	if (lua_istable(L, -1)) {\
		arg.read(L, lua_gettop(L));\
	}

struct Point {
	float x;
	float y;
	
	Point() {
		
	}
	
	Point(float x, float y): x(x), y(y) {
	}
	
	void read(lua_State *L, int index) {
		GHOST_READ_NUMBER(x)
		GHOST_READ_NUMBER(y)
	}
	
	void write(lua_State *L) {
		lua_createtable(L, 0, 2);
		
		GHOST_WRITE_NUMBER(x)
		GHOST_WRITE_NUMBER(y)
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
		read(L, index);
	}
	
	void read(lua_State *L, int index) {
		lua_pushstring(L, "type");
		lua_gettable(L, index);
		std::string t = lua_tostring(L, -1);
		if (t == "line") {
			type = line;
		} else {
			type = arc;
		}
		
		GHOST_READ_POINT(p1)
		GHOST_READ_POINT(p2)
		GHOST_READ_POINT(center)
		GHOST_READ_NUMBER(radius)
		GHOST_READ_NUMBER(startAngle)
		GHOST_READ_NUMBER(endAngle)
	}
};

#endif /* GhostTypes_h */
