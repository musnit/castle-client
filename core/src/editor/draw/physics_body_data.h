#pragma once

#include "precomp.h"
#include "props.h"
#include "lv.h"

struct FixtureProps {
  PROP(std::string, shapeType) = "polygon";
  PROP((SmallVector<float, 8>), points);
  PROP(float, x) = 0;
  PROP(float, y) = 0;
  PROP(float, radius) = 0;
};

enum class CollisionShapeType { Rectangle, Triangle, Circle };

struct PhysicsBodyDataHandle {
  float x;
  float y;
  float oppositeX;
  float oppositeY;
};

struct PhysicsBodyDataShape {
  love::Vector2 p1;
  love::Vector2 p2;
  love::Vector2 p3;
  float radius;
  float x;
  float y;
  CollisionShapeType type;


  void read(Archive::Reader &archive) {
    archive.obj("p1", [&]() {
      p1.x = archive.num("x", 0.0);
      p1.y = archive.num("y", 0.0);
    });
    archive.obj("p2", [&]() {
      p2.x = archive.num("x", 0.0);
      p2.y = archive.num("y", 0.0);
    });
    archive.obj("p3", [&]() {
      p3.x = archive.num("x", 0.0);
      p3.y = archive.num("y", 0.0);
    });
    radius = archive.num("radius", 0.0);
    x = archive.num("x", 0.0);
    y = archive.num("y", 0.0);

    std::string stringType = archive.str("type", "");
    if (stringType == "rectangle") {
      type = CollisionShapeType::Rectangle;
    } else if (stringType == "triangle") {
      type = CollisionShapeType::Triangle;
    } else {
      type = CollisionShapeType::Circle;
    }
  }

  void write(Archive::Writer &archive) {
    archive.obj("p1", [&]() {
      archive.num("x", p1.x);
      archive.num("y", p1.y);
    });
    archive.obj("p2", [&]() {
      archive.num("x", p2.x);
      archive.num("y", p2.y);
    });
    archive.obj("p3", [&]() {
      archive.num("x", p3.x);
      archive.num("y", p3.y);
    });
    archive.num("radius", radius);
    archive.num("x", x);
    archive.num("y", y);

    switch (type) {
    case CollisionShapeType::Rectangle:
      archive.str("type", "rectangle");
      break;
    case CollisionShapeType::Triangle:
      archive.str("type", "triangle");
      break;
    default:
      archive.str("type", "circle");
    }
  }
};

class PhysicsBodyData {
private:
  Lv &lv { Lv::getInstance() };

  void addPointToBounds(love::Bounds &bounds, love::Vector2 p) {
    if (p.x < bounds.minX) {
      bounds.minX = p.x;
    }
    if (p.y < bounds.minY) {
      bounds.minY = p.y;
    }
    if (p.x > bounds.maxX) {
      bounds.maxX = p.x;
    }
    if (p.y > bounds.maxY) {
      bounds.maxY = p.y;
    }
  }
  
  void drawShape(PhysicsBodyDataShape &shape, love::Graphics::DrawMode mode);

  template<unsigned N>
  void _pointsForShape(const PhysicsBodyDataShape &shape, SmallVector<love::Vector2, N> &points) {
    if (shape.type == CollisionShapeType::Circle) {
      size_t numPoints = 30;
      float angle = 0.0;
      for (size_t i = 0; i < numPoints; i++) {
        float diffX = shape.radius * cos(angle);
        float diffY = shape.radius * sin(angle);
        points.push_back({ shape.x + diffX, shape.y + diffY });

        angle = angle - M_PI * 2.0 / (float)numPoints;
      }

      return;
    }

    love::Vector2 p1 = shape.p1;
    love::Vector2 p2 = shape.p2;

    if (p1.x > p2.x) {
      love::Vector2 t = p2;
      p2 = p1;
      p1 = t;
    }

    if (shape.type == CollisionShapeType::Rectangle) {
      points.push_back({ p1.x, p1.y });
      points.push_back({ p1.x, p2.y });
      points.push_back({ p2.x, p2.y });
      points.push_back({ p2.x, p1.y });
    } else if (shape.type == CollisionShapeType::Triangle) {
      love::Vector2 p3 = shape.p3;
      bool isCounterclockwise = (p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y) > 0;
      if (isCounterclockwise) {
        points.push_back({ p1.x, p1.y });
        points.push_back({ p2.x, p2.y });
        points.push_back({ p3.x, p3.y });
      } else {
        points.push_back({ p3.x, p3.y });
        points.push_back({ p2.x, p2.y });
        points.push_back({ p1.x, p1.y });
      }
    }
  }

  bool isPointInBounds(love::Vector2 point) {
    return point.x >= -DRAW_MAX_SIZE and point.x <= DRAW_MAX_SIZE and point.y >= -DRAW_MAX_SIZE
        and point.y <= DRAW_MAX_SIZE;
  }

  bool isShapeInBounds(const PhysicsBodyDataShape &shape) {
    switch (shape.type) {
    case CollisionShapeType::Rectangle:
      return isPointInBounds(shape.p1) && isPointInBounds(shape.p2);
    case CollisionShapeType::Triangle:
      return isPointInBounds(shape.p1) && isPointInBounds(shape.p2) && isPointInBounds(shape.p3);
    case CollisionShapeType::Circle:
      return isPointInBounds(love::Vector2(shape.x + shape.radius, shape.y))
          && isPointInBounds(love::Vector2(shape.x, shape.y + shape.radius))
          && isPointInBounds(love::Vector2(shape.x, shape.y - shape.radius))
          && isPointInBounds(love::Vector2(shape.x - shape.radius, shape.y));
    }

    return false;
  }

  bool isBetweenNumbers(float x, float n1, float n2) {
    float low = fminf(n1, n2);
    float high = fmaxf(n1, n2);
    return x >= low && x <= high;
  }

  float signForTriangleTest(love::Vector2 &p1, love::Vector2 &p2, love::Vector2 &p3) {
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
  }

  bool isPointInShape(love::Vector2 &point, const PhysicsBodyDataShape &shape) {
    switch (shape.type) {
    case CollisionShapeType::Rectangle: {
      return isBetweenNumbers(point.x, shape.p1.x, shape.p2.x)
          && isBetweenNumbers(point.y, shape.p1.y, shape.p2.y);
    }
    case CollisionShapeType::Circle: {
      float dist = sqrtf(powf(point.x - shape.x, 2.0) + powf(point.y - shape.y, 2.0));
      return dist <= shape.radius;
    }
    case CollisionShapeType::Triangle: {
      SmallVector<love::Vector2, 3> points;
      _pointsForShape(shape, points);

      float d1 = signForTriangleTest(point, points[0], points[1]);
      float d2 = signForTriangleTest(point, points[1], points[2]);
      float d3 = signForTriangleTest(point, points[2], points[0]);

      bool hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
      bool hasPos = d1 > 0 || d2 > 0 || d3 > 0;

      return !(hasNeg && hasPos);
    }
    }
  }

  int numberSign(float n) {
    if (n < 0) {
      return -1;
    } else if (n > 0) {
      return 1;
    } else {
      return 0;
    }
  }

  love::Vector2 centerOfShape(PhysicsBodyDataShape &shape) {
    switch (shape.type) {
    case CollisionShapeType::Circle:
      return love::Vector2(shape.x, shape.y);
    case CollisionShapeType::Rectangle:
      return love::Vector2((shape.p1.x + shape.p2.x) / 2.0, (shape.p1.y + shape.p2.y) / 2.0);
    case CollisionShapeType::Triangle: {
      return love::Vector2((shape.p1.x + shape.p2.x + shape.p3.x) / 3.0,
          (shape.p1.y + shape.p2.y + shape.p3.y) / 3.0);
    }
    }
  }

public:
  std::vector<PhysicsBodyDataShape> shapes;
  std::optional<PhysicsBodyDataShape> tempShape;
  float scale;
  int version;
  bool zeroShapesInV1;
  float tempTranslateX;
  float tempTranslateY;
  std::optional<std::string> base64Png;
  std::unique_ptr<love::Shader> shader;

  PhysicsBodyData() {
    scale = 10;
    version = 2;
    zeroShapesInV1 = false;

    tempTranslateX = 0.0;
    tempTranslateY = 0.0;
  }

  PhysicsBodyData(Archive::Reader &archive) {
    read(archive);
  }


  PhysicsBodyData(const std::string &json) {
    auto archive = Archive::fromJson(json.c_str());

    archive.read([&](Archive::Reader &r) {
      read(r);
    });
  }

  PhysicsBodyData(std::shared_ptr<PhysicsBodyData> other) {
    Archive archive;
    archive.write([&](Archive::Writer &w) {
      other->write(w);
    });

    archive.read([&](Archive::Reader &r) {
      read(r);
    });
  }

  void read(Archive::Reader &archive) {
    archive.arr("shapes", [&]() {
      for (auto i = 0; i < archive.size(); i++) {
        PhysicsBodyDataShape shape;
        archive.obj(i, shape);
        shapes.push_back(shape);
      }
    });
    scale = archive.num("scale", 10);
    version = archive.num("version", 2);
    zeroShapesInV1 = archive.boolean("zeroShapesInV1", false);

    tempTranslateX = 0.0;
    tempTranslateY = 0.0;
  }

  void write(Archive::Writer &archive) {
    archive.arr("shapes", [&]() {
      for (size_t i = 0; i < shapes.size(); i++) {
        archive.obj(shapes[i]);
      }
    });
    archive.num("scale", scale);
    archive.num("version", version);
    archive.boolean("zeroShapesInV1", zeroShapesInV1);
  }

  std::string serialize() {
    Archive archive;
    archive.write([&](Archive::Writer &w) {
      write(w);
    });

    return archive.toJson();
  }

  std::string renderPreviewPng();
  void updatePreview();
  void makeShader();
  void render();

  bool commitTempShape() {
    if (tempShape) {
      shapes.push_back(*tempShape);
      tempShape = std::nullopt;
      return true;
    }

    return false;
  }

  std::optional<PhysicsBodyDataShape> getRectangleShape(
      love::Vector2 p1, love::Vector2 p2) {
    PhysicsBodyDataShape shape;
    shape.type = CollisionShapeType::Rectangle;
    shape.p1 = p1;
    shape.p2 = p2;

    if (isShapeInBounds(shape)) {
      return shape;
    } else {
      return std::nullopt;
    }
  }

  std::optional<PhysicsBodyDataShape> getTriangleShape(love::Vector2 p1,
      love::Vector2 p2, const std::optional<love::Vector2> &optionalP3) {
    love::Vector2 p3(p1.x, p2.y);
    if (optionalP3) {
      p3.x = optionalP3->x;
      p3.y = optionalP3->y;
    }

    PhysicsBodyDataShape shape;
    shape.type = CollisionShapeType::Triangle;
    shape.p1 = p1;
    shape.p2 = p2;
    shape.p3 = p3;

    bool isColinear = fabs((p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y)) < 0.01;

    if (isShapeInBounds(shape) && !isColinear) {
      return shape;
    } else {
      return std::nullopt;
    }
  }

  std::optional<PhysicsBodyDataShape> getCircleShape(love::Vector2 p1,
      love::Vector2 p2, love::DrawData *drawData, int roundDx, int roundDy) {
    PhysicsBodyDataShape shape;
    shape.type = CollisionShapeType::Circle;
    shape.x = (p1.x + p2.x) / 2.0;
    shape.y = (p1.y + p2.y) / 2.0;
    shape.radius = sqrtf(powf(p2.x - p1.x, 2.0) + powf(p2.y - p1.y, 2.0)) / 2.0;

    float leftX = shape.x + roundDx * shape.radius;
    float leftY = shape.y + roundDy * shape.radius;

    auto [leftXRounded, leftYRounded] = drawData->roundGlobalCoordinatesToGrid(leftX, leftY);

    shape.radius = drawData->roundGlobalDistanceToGrid(shape.radius);
    shape.x = leftXRounded - roundDx * shape.radius;
    shape.y = leftYRounded - roundDy * shape.radius;

    if (isShapeInBounds(shape) && shape.radius > 0.0) {
      return shape;
    } else {
      return std::nullopt;
    }
  }

  int getShapeIdxAtPoint(love::Vector2 &point) {
    for (int i = shapes.size() - 1; i >= 0; i--) {
      if (isPointInShape(point, shapes[i])) {
        return i;
      }
    }

    return -1;
  }

  std::optional<PhysicsBodyDataShape> getShapeAtIndex(int index) {
    if (index < 0 || index >= (int)shapes.size()) {
      return std::nullopt;
    }

    return shapes[index];
  }

  std::optional<PhysicsBodyDataShape> removeShapeAtIndex(int index) {
    if (index >= 0) {
      PhysicsBodyDataShape result = shapes[index];
      shapes.erase(shapes.begin() + index);
      return result;
    }

    return std::nullopt;
  }

  love::Bounds getBounds() {
    love::Bounds bounds;
    bounds.minX = DRAW_MAX_SIZE;
    bounds.minY = DRAW_MAX_SIZE;
    bounds.maxX = -DRAW_MAX_SIZE;
    bounds.maxY = -DRAW_MAX_SIZE;

    for (size_t i = 0; i < shapes.size(); i++) {
      auto &shape = shapes[i];
      if (shape.type == CollisionShapeType::Circle) {
        addPointToBounds(bounds, love::Vector2(shape.x + shape.radius, shape.y));
        addPointToBounds(bounds, love::Vector2(shape.x, shape.y + shape.radius));
        addPointToBounds(bounds, love::Vector2(shape.x - shape.radius, shape.y));
        addPointToBounds(bounds, love::Vector2(shape.x, shape.y - shape.radius));
      } else {
        SmallVector<love::Vector2, 4> points;
        _pointsForShape(shape, points);
        for (size_t j = 0; j < points.size(); j++) {
          addPointToBounds(bounds, points[j]);
        }
      }
    }

    return bounds;
  }

  void setTempTranslation(float x, float y) {
    tempTranslateX = x;
    tempTranslateY = y;
  }

  PhysicsBodyDataShape moveShapeByIgnoreBounds(
      PhysicsBodyDataShape shape, float diffX, float diffY) {
    switch (shape.type) {
    case CollisionShapeType::Rectangle: {
      shape.p1.x += diffX;
      shape.p2.x += diffX;
      shape.p1.y += diffY;
      shape.p2.y += diffY;
      break;
    }
    case CollisionShapeType::Triangle: {
      shape.p1.x += diffX;
      shape.p2.x += diffX;
      shape.p3.x += diffX;
      shape.p1.y += diffY;
      shape.p2.y += diffY;
      shape.p3.y += diffY;
      break;
    }
    case CollisionShapeType::Circle: {
      shape.x += diffX;
      shape.y += diffY;
      break;
    }
    }

    return shape;
  }

  PhysicsBodyDataShape moveShapeBy(
      PhysicsBodyDataShape shape, float diffX, float diffY, float cellSize) {
    float currXDiff = 0.0;
    float currYDiff = 0.0;
    float incrementX = cellSize * numberSign(diffX);
    float incrementY = cellSize * numberSign(diffY);

    if (fabs(incrementX) > 0.0) {
      while (fabs(currXDiff) < fabs(diffX)) {
        currXDiff += incrementX;
        auto tempResult = moveShapeByIgnoreBounds(shape, currXDiff, currYDiff);

        if (!isShapeInBounds(tempResult)) {
          currXDiff -= incrementX;
          break;
        }
      }
    }

    if (fabs(incrementY) > 0.0) {
      while (fabs(currYDiff) < fabs(diffY)) {
        currYDiff += incrementY;
        auto tempResult = moveShapeByIgnoreBounds(shape, currXDiff, currYDiff);

        if (!isShapeInBounds(tempResult)) {
          currYDiff -= incrementY;
          break;
        }
      }
    }

    return moveShapeByIgnoreBounds(shape, currXDiff, currYDiff);
  }

  template<unsigned N>
  void getHandlesForShape(
      PhysicsBodyDataShape &shape, SmallVector<PhysicsBodyDataHandle, N> &handles) {
    SmallVector<love::Vector2, 4> points;

    if (shape.type == CollisionShapeType::Circle) {
      points.push_back(love::Vector2(shape.x + shape.radius, shape.y));
      points.push_back(love::Vector2(shape.x, shape.y + shape.radius));
      points.push_back(love::Vector2(shape.x - shape.radius, shape.y));
      points.push_back(love::Vector2(shape.x, shape.y - shape.radius));
    } else {
      _pointsForShape(shape, points);
    }

    love::Vector2 center = centerOfShape(shape);

    for (size_t i = 0; i < points.size(); i++) {
      PhysicsBodyDataHandle handle;
      handle.x = points[i].x;
      handle.y = points[i].y;
      handle.oppositeX = handle.x - (handle.x - center.x) * 2.0;
      handle.oppositeY = handle.y - (handle.y - center.y) * 2.0;
      handles.push_back(std::move(handle));
    }
  }

  void updateShapeAtIdx(int idx, PhysicsBodyDataShape &shape) {
    shapes[idx] = shape;
  }

  int getNumShapes() {
    return shapes.size();
  }

  std::vector<FixtureProps> getFixturesForBody();
};
