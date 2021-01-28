//
//  GhostTypes.h
//  liblove-ios
//
//  Created by Jesse Ruder on 1/27/21.
//

#ifndef GhostTypes_h
#define GhostTypes_h

#include "common/runtime.h"

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

struct NullablePoint {
	float x;
	float y;
	bool initialized;
	
	NullablePoint() {
		initialized = false;
	}
	
	NullablePoint(float x, float y): x(x), y(y) {
		initialized = true;
	}
	
	void read(lua_State *L, int index) {
		GHOST_READ_NUMBER(x, 0)
		GHOST_READ_NUMBER(y, 0)
		initialized = true;
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
		
		GHOST_READ_STRUCT(p1)
		GHOST_READ_STRUCT(p2)
		GHOST_READ_STRUCT(center)
		GHOST_READ_NUMBER(radius, 0)
		GHOST_READ_NUMBER(startAngle, 0)
		GHOST_READ_NUMBER(endAngle, 0)
	}
};

struct Color {
	float color[4];
	
	void read(lua_State *L, int index) {
		lua_pushnumber(L, 1);
		lua_gettable(L, index);
		color[0] = lua_tonumber(L, -1);
		
		lua_pushnumber(L, 2);
		lua_gettable(L, index);
		color[1] = lua_tonumber(L, -1);
	
		lua_pushnumber(L, 3);
		lua_gettable(L, index);
		color[2] = lua_tonumber(L, -1);
		
		lua_pushnumber(L, 4);
		lua_gettable(L, index);
		if (lua_isnumber(L, -1)) {
			color[3] = lua_tonumber(L, -1);
		} else {
			color[3] = 1.0;
		}
	}
};

struct PathData {
	std::vector<Point> points;
	int style;
	NullablePoint bendPoint;
	bool isFreehand;
	Color color;
	bool isTransparent;
	
	void read(lua_State *L, int index) {
		GHOST_READ_VECTOR(points, Point)
		GHOST_READ_INT(style, 1)
		GHOST_READ_STRUCT(bendPoint)
		GHOST_READ_BOOL(isFreehand, false)
		GHOST_READ_STRUCT(color)
		GHOST_READ_BOOL(isTransparent, false)
	}
};

struct FillImageBounds {
	float minX, maxX, minY, maxY;
	
	void read(lua_State *L, int index) {
		GHOST_READ_NUMBER(minX, 0)
		GHOST_READ_NUMBER(maxX, 0)
		GHOST_READ_NUMBER(minY, 0)
		GHOST_READ_NUMBER(maxY, 0)
	}
};

struct DrawDataFrame {
	bool isLinked;
	std::vector<PathData> pathDataList;
	FillImageBounds fillImageBounds;
	
	void read(lua_State *L, int index) {
		GHOST_READ_BOOL(isLinked, false)
		GHOST_READ_VECTOR(pathDataList, PathData)
		GHOST_READ_STRUCT(fillImageBounds)
	}
};

struct DrawDataLayer {
	std::string title;
	std::string id;
	bool isVisible;
	std::vector<DrawDataFrame> frames;
	
	void read(lua_State *L, int index) {
		GHOST_READ_STRING(title)
		GHOST_READ_STRING(id)
		GHOST_READ_BOOL(isVisible, true)
		GHOST_READ_VECTOR(frames, DrawDataFrame)
	}
};

struct DrawData {
	/*
	 local newObj = {
		 _graphics = nil,
		 _graphicsNeedsReset = true,
		 pathDataList = obj.pathDataList or {},
		 color = obj.color or obj.fillColor or {hexStringToRgb("f9a31b")},
		 lineColor = obj.lineColor or {hexStringToRgb("f9a31b")},
		 gridSize = obj.gridSize or 0.71428571428571,
		 scale = obj.scale or DRAW_DATA_SCALE,
		 pathsCanvas = nil,
		 fillImageData = nil,
		 fillImage = nil,
		 fillImageBounds = obj.fillImageBounds or {
			 maxX = 0,
			 maxY = 0,
			 minX = 0,
			 minY = 0
		 },
		 fillCanvasSize = obj.fillCanvasSize or FILL_CANVAS_SIZE,
		 fillPng = obj.fillPng or nil,
		 version = obj.version or nil,
		 fillPixelsPerUnit = obj.fillPixelsPerUnit or 25.6,
		 bounds = obj.bounds or nil,
		 framesBounds = obj.framesBounds or {},
		 layers = obj.layers or {},
		 numTotalLayers = obj.numTotalLayers or 1,
		 selectedLayerId = obj.selectedLayerId or nil,
		 selectedFrame = obj.selectedFrame or 1,
		 _layerDataChanged = true,
		 _layerData = nil,
	 }
	 
	 */
	
	Color color;
	Color lineColor;
	float gridSize;
	float scale;
	int version;
	float fillPixelsPerUnit;
	int numTotalLayers;
	std::vector<DrawDataLayer> layers;
	
	DrawData(lua_State *L, int index) {
		read(L, index);
	}
	
	void read(lua_State *L, int index) {
		GHOST_READ_STRUCT(color)
		GHOST_READ_STRUCT(lineColor)
		GHOST_READ_NUMBER(gridSize, 1234)
		GHOST_READ_NUMBER(scale, 12345)
		GHOST_READ_INT(version, 3)
		GHOST_READ_NUMBER(fillPixelsPerUnit, 25.6)
		GHOST_READ_INT(numTotalLayers, 1)
		
		//framesBounds
		//selectedLayerId
		//selectedFrame
		
		GHOST_READ_VECTOR(layers, DrawDataLayer)
	}
	
};

}
}

#endif /* GhostTypes_h */
