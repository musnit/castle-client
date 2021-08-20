#pragma once

#include "precomp.h"
#include "draw_subtool_interface.h"
#include "editor/draw/util.h"
#include "editor/draw/physics_body_data.h"

class CollisionShapeSubtool : public DrawSubtool {
public:
  enum class Shape {
    Rectangle,
    Circle,
    Triangle,
  };

  explicit CollisionShapeSubtool(DrawTool &drawTool_, Shape shape_)
      : DrawSubtool(drawTool_) {
    shapeType = shape_;
  }

  ~CollisionShapeSubtool() {
  }

  std::string category() {
    return "collision_draw";
  }

  std::string name() {
    switch (shapeType) {
    case Shape::Rectangle:
      return "rectangle";
    case Shape::Circle:
      return "circle";
    case Shape::Triangle:
      return "triangle";
    }
  }

  void onReset() {
    isGestureStarted = false;
  }

  void onTouch(DrawSubtoolTouch &touch) {
    if (!isGestureStarted) {
      initialCoord.x = touch.roundedX;
      initialCoord.y = touch.roundedY;
      isGestureStarted = true;
    }

    std::optional<PhysicsBodyDataShape> shape;
    love::Vector2 roundedCoord(touch.roundedX, touch.roundedY);

    switch (shapeType) {
    case Shape::Rectangle:
      shape = drawTool.getPhysicsBodyData().getRectangleShape(initialCoord, roundedCoord);
      break;
    case Shape::Circle: {
      int roundDx = love::DrawAlgorithms::floatUnit(initialCoord.x - touch.touchX);
      int roundDy = love::DrawAlgorithms::floatUnit(initialCoord.y - touch.touchY);

      shape = drawTool.getPhysicsBodyData().getCircleShape(
          initialCoord, roundedCoord, &drawTool.getDrawData(), roundDx, roundDy);
      break;
    }
    case Shape::Triangle:
      shape = drawTool.getPhysicsBodyData().getTriangleShape(
          initialCoord, roundedCoord, std::nullopt);
      break;
    }

    if (shape) {
      drawTool.getPhysicsBodyData().tempShape = *shape;
    }

    if (touch.touch.released) {
      if (drawTool.getPhysicsBodyData().commitTempShape()) {
        drawTool.saveDrawing("shape");
      }

      isGestureStarted = false;
    }
  }

  void drawOverlay(Lv &lv) {
  }

private:
  bool isGestureStarted = false;
  love::Vector2 initialCoord;
  Shape shapeType;
};
