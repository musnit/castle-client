//
//  GhostTypes.h
//  liblove-ios
//
//  Created by Jesse Ruder on 1/27/21.
//

#ifndef GhostTypes_h
#define GhostTypes_h

#include <optional>
#include <memory>

#include "common/runtime.h"
#include "common/config.h"
#include "common/Module.h"
#include "tove2d/src/cpp/interface.h"
#include "graphics/Graphics.h"
#include "data/DataModule.h"
#include "archive.h"

#define DRAW_MAX_SIZE 10.0
#define DRAW_LINE_WIDTH 0.2

#define GHOST_READ_NUMBER(arg, default)                                                            \
  lua_pushstring(L, #arg);                                                                         \
  lua_gettable(L, index);                                                                          \
  if (lua_isnumber(L, -1)) {                                                                       \
    arg = lua_tonumber(L, -1);                                                                     \
  } else {                                                                                         \
    arg = default;                                                                                 \
  }

#define GHOST_READ_INT(arg, default)                                                               \
  lua_pushstring(L, #arg);                                                                         \
  lua_gettable(L, index);                                                                          \
  if (lua_isnumber(L, -1)) {                                                                       \
    arg = lua_tointeger(L, -1);                                                                    \
  } else {                                                                                         \
    arg = default;                                                                                 \
  }

#define GHOST_READ_INT_2(var, arg, default)                                                        \
  lua_pushstring(L, #arg);                                                                         \
  lua_gettable(L, index);                                                                          \
  if (lua_isnumber(L, -1)) {                                                                       \
    var = lua_tointeger(L, -1);                                                                    \
  } else {                                                                                         \
    var = default;                                                                                 \
  }


#define GHOST_WRITE_NUMBER(arg)                                                                    \
  lua_pushstring(L, #arg);                                                                         \
  lua_pushnumber(L, arg);                                                                          \
  lua_settable(L, -3);

#define GHOST_READ_STRUCT(arg)                                                                     \
  lua_pushstring(L, #arg);                                                                         \
  lua_gettable(L, index);                                                                          \
  if (lua_istable(L, -1)) {                                                                        \
    arg.read(L, lua_gettop(L));                                                                    \
  }

#define GHOST_READ_OPTIONAL_STRUCT(arg, type)                                                      \
  lua_pushstring(L, #arg);                                                                         \
  lua_gettable(L, index);                                                                          \
  if (lua_istable(L, -1)) {                                                                        \
    type item;                                                                                     \
    item.read(L, lua_gettop(L));                                                                   \
    arg = item;                                                                                    \
  }

#define GHOST_READ_VECTOR(arg, type)                                                               \
  lua_pushstring(L, #arg);                                                                         \
  lua_gettable(L, index);                                                                          \
  if (lua_istable(L, -1)) {                                                                        \
    int tableIndex = lua_gettop(L);                                                                \
    int arrayIndex = 1;                                                                            \
    while (true) {                                                                                 \
      lua_pushnumber(L, arrayIndex);                                                               \
      lua_gettable(L, tableIndex);                                                                 \
      if (lua_istable(L, -1)) {                                                                    \
        type item;                                                                                 \
        item.read(L, lua_gettop(L));                                                               \
        arg.push_back(item);                                                                       \
      } else {                                                                                     \
        break;                                                                                     \
      }                                                                                            \
      arrayIndex++;                                                                                \
    }                                                                                              \
  }

#define GHOST_READ_FLOAT_VECTOR(arg)                                                               \
  lua_pushstring(L, #arg);                                                                         \
  lua_gettable(L, index);                                                                          \
  if (lua_istable(L, -1)) {                                                                        \
    int tableIndex = lua_gettop(L);                                                                \
    int arrayIndex = 1;                                                                            \
    while (true) {                                                                                 \
      lua_pushnumber(L, arrayIndex);                                                               \
      lua_gettable(L, tableIndex);                                                                 \
      if (lua_isnumber(L, -1)) {                                                                   \
        arg.push_back(lua_tonumber(L, -1));                                                        \
      } else {                                                                                     \
        break;                                                                                     \
      }                                                                                            \
      arrayIndex++;                                                                                \
    }                                                                                              \
  }

#define GHOST_READ_POINTER_VECTOR(arg, type)                                                       \
  lua_pushstring(L, #arg);                                                                         \
  lua_gettable(L, index);                                                                          \
  if (lua_istable(L, -1)) {                                                                        \
    int tableIndex = lua_gettop(L);                                                                \
    int arrayIndex = 1;                                                                            \
    while (true) {                                                                                 \
      lua_pushnumber(L, arrayIndex);                                                               \
      lua_gettable(L, tableIndex);                                                                 \
      if (lua_istable(L, -1)) {                                                                    \
        auto item = std::make_unique<type>();                                                      \
        item->read(L, lua_gettop(L));                                                              \
        arg.push_back(std::move(item));                                                            \
      } else {                                                                                     \
        break;                                                                                     \
      }                                                                                            \
      arrayIndex++;                                                                                \
    }                                                                                              \
  }

#define GHOST_READ_STRING(arg)                                                                     \
  lua_pushstring(L, #arg);                                                                         \
  lua_gettable(L, index);                                                                          \
  if (lua_isstring(L, -1)) {                                                                       \
    arg = lua_tostring(L, -1);                                                                     \
  }

#define GHOST_READ_BOOL(arg, default)                                                              \
  lua_pushstring(L, #arg);                                                                         \
  lua_gettable(L, index);                                                                          \
  if (lua_isboolean(L, -1)) {                                                                      \
    arg = lua_toboolean(L, -1);                                                                    \
  } else {                                                                                         \
    arg = default;                                                                                 \
  }

namespace love {
namespace ghost {

  struct Point {
    float x;
    float y;

    Point() {
    }

    Point(float x, float y)
        : x(x)
        , y(y) {
    }

    Point(const Point &p1) {
      x = p1.x;
      y = p1.y;
    }

    bool operator==(const Point &other) {
      return x == other.x && y == other.y;
    }

    float distance(const Point &other) {
      return sqrt(pow(other.x - x, 2) + pow(other.y - y, 2));
    }

    void read(lua_State *L, int index) {
      GHOST_READ_NUMBER(x, 0)
      GHOST_READ_NUMBER(y, 0)
    }

    void read(Archive::Reader &archive) {
      x = archive.num("x", 0);
      y = archive.num("y", 0);
    }

    void write(Archive::Writer &archive) {
      archive.num("x", x);
      archive.num("y", y);
    }

    void write(lua_State *L) {
      lua_createtable(L, 0, 2);

      GHOST_WRITE_NUMBER(x)
      GHOST_WRITE_NUMBER(y)
    }
  };

  enum SubpathType { line, arc };

  struct Subpath {
    SubpathType type;
    Point p1;
    Point p2;
    Point center;
    float radius;
    float startAngle;
    float endAngle;

    Subpath() {
    }

    static Subpath SubpathLine(Point &p1, Point &p2) {
      Subpath result;
      result.p1 = p1;
      result.p2 = p2;
      result.type = SubpathType::line;
      return result;
    }

    static Subpath SubpathArc(Point &center, float radius, float startAngle, float endAngle) {
      Subpath result;
      result.center = center;
      result.radius = radius;
      result.startAngle = startAngle;
      result.endAngle = endAngle;
      result.type = SubpathType::arc;
      return result;
    }

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

    Color() {
      data[0] = data[1] = data[2] = data[3] = 0.0;
    }

    Color(const Color &p1) {
      data[0] = p1.data[0];
      data[1] = p1.data[1];
      data[2] = p1.data[2];
      data[3] = p1.data[3];
    }

    void read(Archive::Reader &obj) {
      data[0] = obj.num((unsigned int)0, 1.0);
      data[1] = obj.num(1, 1.0);
      data[2] = obj.num(2, 1.0);
      data[3] = obj.num(3, 1.0);
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
    std::vector<ToveSubpathRef> toveSubpaths;

    PathData() {
      tovePath.ptr = NULL;
    }

    PathData(const PathData &p1) {
      points.clear();
      for (size_t i = 0; i < p1.points.size(); i++) {
        points.push_back(p1.points[i]);
      }

      style = p1.style;
      bendPoint = p1.bendPoint;
      isFreehand = p1.isFreehand;
      color = p1.color;
      isTransparent = p1.isTransparent;

      tovePath.ptr = NULL;
    }

    void copyAttributes(const PathData &other) {
      style = other.style;
      isFreehand = other.isFreehand;
      color = other.color;
      isTransparent = other.isTransparent;
      // don't copy geometry data such as points
    }

    ~PathData() {
      // TODO: saveDrawing->renderPreviewPng->getPathDataBounds calls this twice for some reason
      /*for (auto &subpath : toveSubpaths) {
        ReleaseSubpath(subpath);
      }
      ReleasePath(tovePath);*/
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

    void read(Archive::Reader &archive) {
      archive.arr("p", [&]() {
        points.resize(archive.size() / 2);
        for (auto i = 0; i < archive.size(); i += 2) {
          points[i / 2] = Point(archive.num(i), archive.num(i + 1));
        }
      });

      style = archive.num("s", 1);

      if (archive.has("bp")) {
        Point bp;
        archive.obj("bp", bp);
        bendPoint = bp;
      }

      isFreehand = archive.boolean("f", false);

      if (archive.has("c")) {
        Color c;
        archive.arr("c", c);
        color = c;
      }

      isTransparent = archive.boolean("isTransparent", false);
    }

    void write(Archive::Writer &archive) {
      archive.arr("p", [&]() {
        for (size_t i = 0; i < points.size(); i++) {
          archive.num(points[i].x);
          archive.num(points[i].y);
        }
      });

      archive.num("s", style);

      if (bendPoint) {
        archive.obj("bp", *bendPoint);
      }

      archive.boolean("f", isFreehand);

      if (color) {
        archive.arr("c", *color);
      }

      if (isTransparent) {
        archive.boolean("isTransparent", isTransparent);
      }
    }
  };

  struct Bounds {
    float minX = 0, maxX = 0, minY = 0, maxY = 0;

    void read(lua_State *L, int index) {
      GHOST_READ_NUMBER(minX, 0)
      GHOST_READ_NUMBER(maxX, 0)
      GHOST_READ_NUMBER(minY, 0)
      GHOST_READ_NUMBER(maxY, 0)
    }

    void read(Archive::Reader &archive) {
      minX = archive.num("minX", 0);
      maxX = archive.num("maxX", 0);
      minY = archive.num("minY", 0);
      maxY = archive.num("maxY", 0);
    }

    void write(Archive::Writer &archive) {
      archive.num("minX", minX);
      archive.num("maxX", maxX);
      archive.num("minY", minY);
      archive.num("maxY", maxY);
    }

    void set(Bounds other) {
      minX = other.minX;
      maxX = other.maxX;
      minY = other.minY;
      maxY = other.maxY;
    }
  };

  typedef std::vector<PathData> PathDataList;

  class AnimationState {
  public:
    float animationFrameTime;

    AnimationState()
        : animationFrameTime(0.0) {
    }
  };

  struct OneIndexFrame {
    int value = 1;

    OneIndexFrame() = default;
    OneIndexFrame(int &intValue)
        : value(intValue) {
    }

    void operator=(const int &intValue) {
      value = intValue;
    }

    int toZeroIndex() {
      return value - 1;
    }

    void setFromZeroIndex(int v) {
      value = v + 1;
    }
  };

  class AnimationComponentProperties {
  public:
    bool playing;
    float framesPerSecond;
    OneIndexFrame loopStartFrame;
    OneIndexFrame loopEndFrame;
    OneIndexFrame currentFrame;
    bool loop;

    void read(Archive::Reader &archive) {
      playing = archive.boolean("playing", false);
      framesPerSecond = archive.num("framesPerSecond", 4);
      currentFrame.value = archive.num("initialFrame", 1);
      loop = archive.boolean("loop", false);

      // these can only be set from "set property" responses
      loopStartFrame.value = -1;
      loopEndFrame.value = -1;
    }

    void write(Archive::Writer &writer) const {
      writer.boolean("playing", playing);
      writer.num("framesPerSecond", framesPerSecond);
      writer.num("initialFrame", currentFrame.value);
      writer.boolean("loop", loop);
    }
  };

  class ToveMeshHolder {};

  class ToveGraphicsHolder {
  public:
    ToveGraphicsRef toveGraphics { nullptr };
    ToveNameRef toveName { nullptr };
    ToveMeshRef toveMesh { nullptr };
    ToveTesselatorRef toveTess { nullptr };
    std::unique_ptr<graphics::Mesh> loveMesh;
    std::unique_ptr<data::ByteData> vData;
    size_t iDataSize = 0;
    std::unique_ptr<data::ByteData> iData;

    ToveGraphicsHolder() {
      toveGraphics = NewGraphics(NULL, "px", 72);
      //_graphics.setDisplay("mesh", 1024);

      toveMesh.ptr = NULL;
      loveMesh = NULL;
    }

    ~ToveGraphicsHolder() {
      ReleaseTesselator(toveTess);
      ReleaseMesh(toveMesh);
      ReleaseName(toveName);
      ReleaseGraphics(toveGraphics);
    }

    void addPath(TovePathRef path) {
      GraphicsAddPath(toveGraphics, path);
    }

    std::tuple<float, float, float, float> computeAABB() {
      ToveBounds toveBounds = GraphicsGetBounds(toveGraphics, false);
      return { toveBounds.x0, toveBounds.y0, toveBounds.x1, toveBounds.y1 };
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
        iData = std::unique_ptr<data::ByteData>(data::DataModule::instance.newByteData(size));
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
      graphics::PrimitiveType primitiveType = MeshGetIndexMode(toveMesh) == TRIANGLES_LIST
          ? graphics::PRIMITIVE_TRIANGLES
          : graphics::PRIMITIVE_TRIANGLE_STRIP;

      if (vertexCount < 1) {
        return;
      }

      if (MeshGetIndexCount(toveMesh) < 1) {
        return;
      }

      // love.graphics.mesh

      graphics::Graphics *instance = Module::getInstance<graphics::Graphics>(Module::M_GRAPHICS);

      // TODO: double check that USAGE_STATIC is correct
      loveMesh = std::unique_ptr<graphics::Mesh>(instance->newMesh(
          vertexFormat, vertexCount, primitiveType, graphics::vertex::USAGE_STATIC));

      int vertexByteSize = 3 * sizeof(float);
      // love.data.newByteData(n * self._vertexByteSize)
      vData = std::unique_ptr<data::ByteData>(
          data::DataModule::instance.newByteData((size_t)vertexCount * vertexByteSize));

      updateVertices();
      updateTriangles();
    }

    void update() {
      if (toveMesh.ptr) {
        TesselatorTessGraphics(toveTess, toveGraphics, toveMesh, 15);

        getToveMesh();
      }
    }

    void draw() {
      if (toveMesh.ptr == NULL) {
        ConfigureShaderCode(TOVE_GLSL3, 2);

        toveName = NewName("unnamed");
        toveMesh = NewColorMesh(toveName);

        toveTess = NewAdaptiveTesselator(1024, 8);
        TesselatorTessGraphics(toveTess, toveGraphics, toveMesh, 15);

        getToveMesh();
      }

      if (loveMesh == NULL) {
        return;
      }

      graphics::Graphics *instance = Module::getInstance<graphics::Graphics>(Module::M_GRAPHICS);

      // love.graphics.setShader


      // love.graphics.draw mesh
      instance->draw(loveMesh.get(), Matrix4());

      // love.graphics.setShader nil
      instance->setShader();
    }
  };

}
}

#endif /* GhostTypes_h */
