//
//  GhostTypes.h
//  liblove-ios
//
//  Created by Jesse Ruder on 1/27/21.
//

#ifndef GhostTypes_h
#define GhostTypes_h

#include "common/runtime.h"
#include "tove2d/src/cpp/interface.h"
#include <optional>

#define GHOST_READ_NUMBER(arg, default) \
	lua_pushstring(L, #arg);\
	lua_gettable(L, index);\
	if (lua_isnumber(L, -1)) {\
		arg = lua_tonumber(L, -1);\
	} else {\
		arg = default;\
	}

#define GHOST_READ_INT(arg, default) \
	lua_pushstring(L, #arg);\
	lua_gettable(L, index);\
	if (lua_isnumber(L, -1)) {\
		arg = lua_tointeger(L, -1);\
	} else {\
		arg = default;\
	}

#define GHOST_WRITE_NUMBER(arg) \
	lua_pushstring(L, #arg);\
	lua_pushnumber(L, arg);\
	lua_settable(L, -3);

#define GHOST_READ_STRUCT(arg) \
	lua_pushstring(L, #arg);\
	lua_gettable(L, index);\
	if (lua_istable(L, -1)) {\
		arg.read(L, lua_gettop(L));\
	}

#define GHOST_READ_OPTIONAL_STRUCT(arg, type) \
	lua_pushstring(L, #arg);\
	lua_gettable(L, index);\
	if (lua_istable(L, -1)) {\
		type item;\
		item.read(L, lua_gettop(L));\
		arg = item;\
	}

#define GHOST_READ_VECTOR(arg, type) \
	lua_pushstring(L, #arg);\
	lua_gettable(L, index);\
	if (lua_istable(L, -1)) {\
		int tableIndex = lua_gettop(L);\
		int arrayIndex = 1;\
		while (true) {\
			lua_pushnumber(L, arrayIndex);\
			lua_gettable(L, tableIndex);\
			if (lua_istable(L, -1)) {\
				type item;\
				item.read(L, lua_gettop(L));\
				arg.push_back(item);\
			} else {\
				break;\
			}\
			arrayIndex++;\
		}\
	}

#define GHOST_READ_STRING(arg) \
	lua_pushstring(L, #arg);\
	lua_gettable(L, index);\
	if (lua_isstring(L, -1)) {\
		arg = lua_tostring(L, -1);\
	}

#define GHOST_READ_BOOL(arg, default) \
	lua_pushstring(L, #arg);\
	lua_gettable(L, index);\
	if (lua_isboolean(L, -1)) {\
		arg = lua_toboolean(L, -1);\
	} else {\
		arg = default;\
	}

namespace love
{
namespace ghost
{

struct Point {
	float x;
	float y;
	
	Point() {
	}
	
	Point(float x, float y): x(x), y(y) {
	}
	
	void read(lua_State *L, int index) {
		GHOST_READ_NUMBER(x, 0)
		GHOST_READ_NUMBER(y, 0)
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
	
	Subpath() {}
	
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
		
		GHOST_READ_STRUCT(p1)
		GHOST_READ_STRUCT(p2)
		GHOST_READ_STRUCT(center)
		GHOST_READ_NUMBER(radius, 0)
		GHOST_READ_NUMBER(startAngle, 0)
		GHOST_READ_NUMBER(endAngle, 0)
	}
};

struct Color {
	float data[4];
	
	void read(lua_State *L, int index) {
		lua_pushnumber(L, 1);
		lua_gettable(L, index);
		data[0] = lua_tonumber(L, -1);
		
		lua_pushnumber(L, 2);
		lua_gettable(L, index);
		data[1] = lua_tonumber(L, -1);
	
		lua_pushnumber(L, 3);
		lua_gettable(L, index);
		data[2] = lua_tonumber(L, -1);
		
		lua_pushnumber(L, 4);
		lua_gettable(L, index);
		if (lua_isnumber(L, -1)) {
			data[3] = lua_tonumber(L, -1);
		} else {
			data[3] = 1.0;
		}
	}
};

struct PathData {
	std::vector<Point> points;
	int style;
	std::optional<Point> bendPoint;
	bool isFreehand;
	std::optional<Color> color;
	bool isTransparent;
	
	std::vector<Subpath> subpathDataList;
	TovePathRef tovePath;
	
	PathData() {
		tovePath.ptr = NULL;
	}
	
	void read(lua_State *L, int index) {
		GHOST_READ_VECTOR(points, Point)
		GHOST_READ_INT(style, 1)
		GHOST_READ_OPTIONAL_STRUCT(bendPoint, Point)
		GHOST_READ_BOOL(isFreehand, false)
		GHOST_READ_OPTIONAL_STRUCT(color, Color)
		GHOST_READ_BOOL(isTransparent, false)
	}
};

struct Bounds {
	float minX, maxX, minY, maxY;
	
	void read(lua_State *L, int index) {
		GHOST_READ_NUMBER(minX, 0)
		GHOST_READ_NUMBER(maxX, 0)
		GHOST_READ_NUMBER(minY, 0)
		GHOST_READ_NUMBER(maxY, 0)
	}
};

typedef std::vector<PathData> PathDataList;

struct AnimationState {
	float animationFrameTime;
};

struct AnimationComponentProperties {
	bool playing;
	float framesPerSecond;
	int loopStartFrame;
	int loopEndFrame;
	int currentFrame;
	bool loop;
};

}
}

#endif /* GhostTypes_h */
