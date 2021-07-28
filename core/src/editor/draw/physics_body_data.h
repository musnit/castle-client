#pragma once

#include "precomp.h"
#include "props.h"

enum class CollisionShapeType { Rectangle, Triangle, Circle };

struct PhysicsBodyDataShape {
  love::Vector2 p1;
  love::Vector2 p2;
  love::Vector2 p3;
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

  void render() {
  }
};
