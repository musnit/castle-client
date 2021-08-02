#pragma once

#include "precomp.h"
#include "props.h"
#include "lv.h"

enum class CollisionShapeType { Rectangle, Triangle, Circle };

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

  void _drawShape(PhysicsBodyDataShape &shape) {
    lv.graphics.setLineWidth(0.06);

    SmallVector<love::Vector2, 30> points;
    _pointsForShape(shape, points);
    _drawDashedPoints(points);
  }

  template<unsigned N>
  void _pointsForShape(PhysicsBodyDataShape &shape, SmallVector<love::Vector2, N> &points) {
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

  template<unsigned N>
  void _drawDashedPoints(SmallVector<love::Vector2, N> &points) {
    bool startsWithDash = true;
    float leftoverAmount = 0.0;

    for (size_t i = 0; i < points.size(); i++) {
      size_t next = i + 1;
      if (next >= points.size()) {
        next = next - points.size();
      }

      _drawDashedLine(points[i], points[next], &startsWithDash, &leftoverAmount);
    }
  }

  void _drawDashedLine(
      love::Vector2 p1, love::Vector2 p2, bool *startsWithDash, float *leftoverAmount) {
    const float DASH_LENGTH = 0.3;
    const float BLANK_LENGTH = 0.3;

    float totalLength = sqrt(pow(p2.x - p1.x, 2.0) + pow(p2.y - p1.y, 2.0));
    love::Vector2 unitVec = { p2.x - p1.x, p2.y - p1.y };
    float l = sqrt(unitVec.x * unitVec.x + unitVec.y * unitVec.y);
    unitVec.x /= l;
    unitVec.y /= l;

    float currentDist = 0.0;
    bool isDash = *startsWithDash;

    while (currentDist < totalLength) {
      float currentSegmentLength;

      if (*leftoverAmount > 0) {
        currentSegmentLength = *leftoverAmount;
        *leftoverAmount = 0.0;
      } else {
        if (isDash) {
          currentSegmentLength = DASH_LENGTH;
        } else {
          currentSegmentLength = BLANK_LENGTH;
        }
      }

      float drawCurrentSegmentLength = currentSegmentLength;
      bool cutOffSegment = false;
      if (drawCurrentSegmentLength + currentDist > totalLength) {
        drawCurrentSegmentLength = totalLength - currentDist;
        cutOffSegment = true;
      }

      if (isDash) {
        love::Vector2 points[2]
            = { { p1.x + unitVec.x * currentDist, p1.y + unitVec.y * currentDist },
                { p1.x + unitVec.x * (currentDist + drawCurrentSegmentLength),
                    p1.y + unitVec.y * (currentDist + drawCurrentSegmentLength) } };
        lv.graphics.polyline(points, 2);
      }

      if (!cutOffSegment) {
        isDash = !isDash;
      }
      currentDist = currentDist + currentSegmentLength;
    }

    *startsWithDash = isDash;
    *leftoverAmount = currentDist - totalLength;
  }

public:
  std::vector<PhysicsBodyDataShape> shapes;
  std::optional<PhysicsBodyDataShape> tempShape;
  float scale;
  int version;
  bool zeroShapesInV1;
  float tempTranslateX;
  float tempTranslateY;

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

  void render() {
    lv.graphics.push(love::Graphics::STACK_ALL);
    lv.graphics.translate(tempTranslateX, tempTranslateY);

    for (size_t i = 0; i < shapes.size(); i++) {
      _drawShape(shapes[i]);
    }

    if (tempShape) {
      _drawShape(*tempShape);
    }

    lv.graphics.pop();
  }
};
