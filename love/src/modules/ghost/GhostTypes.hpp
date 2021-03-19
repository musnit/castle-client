//
//  GhostTypes.h
//  liblove-ios
//
//  Created by Jesse Ruder on 1/27/21.
//

#ifndef GhostTypes_h
#define GhostTypes_h

#include "common/runtime.h"
#include "common/config.h"
#include "common/Module.h"
#include "tove2d/src/cpp/interface.h"
#include <optional>
#include "graphics/Graphics.h"
#include "data/DataModule.h"
#include "Archive.h"

#define DRAW_MAX_SIZE 10.0
#define DRAW_LINE_WIDTH 0.2

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

#define GHOST_READ_FLOAT_VECTOR(arg) \
	lua_pushstring(L, #arg);\
	lua_gettable(L, index);\
	if (lua_istable(L, -1)) {\
		int tableIndex = lua_gettop(L);\
		int arrayIndex = 1;\
		while (true) {\
			lua_pushnumber(L, arrayIndex);\
			lua_gettable(L, tableIndex);\
			if (lua_isnumber(L, -1)) {\
				arg.push_back(lua_tonumber(L, -1));\
			} else {\
				break;\
			}\
			arrayIndex++;\
		}\
	}

#define GHOST_READ_POINTER_VECTOR(arg, type) \
	lua_pushstring(L, #arg);\
	lua_gettable(L, index);\
	if (lua_istable(L, -1)) {\
		int tableIndex = lua_gettop(L);\
		int arrayIndex = 1;\
		while (true) {\
			lua_pushnumber(L, arrayIndex);\
			lua_gettable(L, tableIndex);\
			if (lua_istable(L, -1)) {\
				type * item = new type();\
				item->read(L, lua_gettop(L));\
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
	
	void read(Archive::Reader &archive) {
		data[0] = archive.num((unsigned int) 0, 1.0);
		data[1] = archive.num(1, 1.0);
		data[2] = archive.num(2, 1.0);
		data[3] = archive.num(3, 1.0);
	}
	
	void write(Archive::Writer &archive) {
		archive.num(data[0]);
		archive.num(data[1]);
		archive.num(data[2]);
		archive.num(data[3]);
	}
	
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
		
		/*GHOST_READ_VECTOR(points, Point)
		GHOST_READ_INT(style, 1)
		GHOST_READ_OPTIONAL_STRUCT(bendPoint, Point)
		GHOST_READ_BOOL(isFreehand, false)
		GHOST_READ_OPTIONAL_STRUCT(color, Color)
		GHOST_READ_BOOL(isTransparent, false)*/
		
		std::vector<float> p;
		GHOST_READ_FLOAT_VECTOR(p)
		for (size_t i = 0; i < p.size(); i += 2) {
			points.push_back(Point(p[i], p[i + 1]));
		}
		
		int s;
		GHOST_READ_INT(s, 1)
		style = s;
		
		std::optional<Point> bp;
		GHOST_READ_OPTIONAL_STRUCT(bp, Point)
		bendPoint = bp;
		
		bool f;
		GHOST_READ_BOOL(f, false)
		isFreehand = f;
		
		std::optional<Color> c;
		GHOST_READ_OPTIONAL_STRUCT(c, Color)
		color = c;
		
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
	
	void set(Bounds other) {
		minX = other.minX;
		maxX = other.maxX;
		minY = other.minY;
		maxY = other.maxY;
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

class ToveMeshHolder {
	
};

class ToveGraphicsHolder {
public:
	ToveGraphicsRef toveGraphics;
	ToveNameRef toveName;
	ToveMeshRef toveMesh;
	graphics::Mesh *loveMesh;
	data::ByteData *vData;
	size_t iDataSize = 0;
	data::ByteData *iData;
	
	ToveGraphicsHolder() {
		toveGraphics = NewGraphics(NULL, "px", 72);
		//_graphics.setDisplay("mesh", 1024);
		
		toveMesh.ptr = NULL;
		loveMesh = NULL;
	}
	
	void addPath(TovePathRef path) {
		GraphicsAddPath(toveGraphics, path);
	}
	
	std::tuple<float, float, float, float> computeAABB() {
		ToveBounds toveBounds = GraphicsGetBounds(toveGraphics, false);
		return {toveBounds.x0, toveBounds.y0, toveBounds.x1, toveBounds.y1};
	}
	
	void updateVertices() {
		MeshSetVertexBuffer(toveMesh, vData->getData(), vData->getSize());
		// Mesh::setVertices
		memcpy(loveMesh->mapVertexData(), vData->getData(), vData->getSize());
		loveMesh->unmapVertexData(0, vData->getSize());
	}
	
	void updateTriangles() {
		int indexCount = MeshGetIndexCount(toveMesh);
		size_t size = indexCount * sizeof(ToveVertexIndex);
		
		if (size != iDataSize) {
			iData = data::DataModule::instance.newByteData(size);
			iDataSize = size;
		}
		
		MeshCopyIndexData(toveMesh, iData->getData(), iData->getSize());
		loveMesh->setVertexMap(graphics::INDEX_UINT16, iData->getData(), iData->getSize());
	}
	
	void getToveMesh() {
		std::vector<graphics::Mesh::AttribFormat> vertexFormat;
		graphics::Mesh::AttribFormat attribFormat;
		attribFormat.name = "VertexPosition";
		attribFormat.type = graphics::vertex::DATA_FLOAT;
		attribFormat.components = 2;
		
		
		graphics::Mesh::AttribFormat attribFormat2;
		attribFormat2.name = "VertexColor";
		attribFormat2.type = graphics::vertex::DATA_UNORM8;
		attribFormat2.components = 4;
		
		
		vertexFormat.push_back(attribFormat);
		vertexFormat.push_back(attribFormat2);
		
		int vertexCount = MeshGetVertexCount(toveMesh);
		graphics::PrimitiveType primitiveType = MeshGetIndexMode(toveMesh) == TRIANGLES_LIST ? graphics::PRIMITIVE_TRIANGLES : graphics::PRIMITIVE_TRIANGLE_STRIP;
		
		if (vertexCount < 1) {
			return;
		}
		
		if (MeshGetIndexCount(toveMesh) < 1) {
			return;
		}
		
		// love.graphics.mesh
		
		graphics::Graphics *instance = Module::getInstance<graphics::Graphics>(Module::M_GRAPHICS);
		
		// TODO: double check that USAGE_STATIC is correct
		loveMesh = instance->newMesh(vertexFormat, vertexCount, primitiveType, graphics::vertex::USAGE_STATIC);
		
		int vertexByteSize = 3 * sizeof(float);
		//love.data.newByteData(n * self._vertexByteSize)
		vData = data::DataModule::instance.newByteData((size_t) vertexCount * vertexByteSize);
		
		updateVertices();
		updateTriangles();
	}
	
	void draw() {
		if (toveMesh.ptr == NULL) {
			ConfigureShaderCode(TOVE_GLSL3, 2);
			
			toveName = NewName("unnamed");
			toveMesh = NewColorMesh(toveName);
			
			ToveTesselatorRef tess = NewAdaptiveTesselator(1024, 8);
			TesselatorTessGraphics(tess, toveGraphics, toveMesh, 15);
			
			getToveMesh();
		}
		
		if (loveMesh == NULL) {
			return;
		}
			
		graphics::Graphics *instance = Module::getInstance<graphics::Graphics>(Module::M_GRAPHICS);
		
		// love.graphics.setShader
		
	
		// love.graphics.draw mesh
		instance->draw(loveMesh, Matrix4());
		
		// love.graphics.setShader nil
		instance->setShader();
	}
	
};

}
}

#endif /* GhostTypes_h */
