#pragma once

#include "precomp.h"
#include "draw_subtool_interface.h"
#include "editor/draw/util.h"

class DrawShapeSubtool : public DrawSubtool {
public:
  enum class Shape {
    Rectangle,
    Circle,
    Triangle,
  };

  explicit DrawShapeSubtool(DrawTool &drawTool_, Shape shape_)
      : DrawSubtool(drawTool_) {
    shape = shape_;
  }

  ~DrawShapeSubtool() {
  }

  std::string category() {
    return "artwork_draw";
  }

  std::string name() {
    switch (shape) {
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

    auto paths = std::make_optional<DrawUtil::PathsList>();
    switch (shape) {
    case Shape::Rectangle:
      paths = DrawUtil::getRectangleShape(
          initialCoord.x, initialCoord.y, touch.roundedX, touch.roundedY);
      break;
    case Shape::Circle: {
      auto roundUnitX = DrawUtil::unit(touch.touchX - initialCoord.x);
      auto roundUnitY = DrawUtil::unit(touch.touchY - initialCoord.y);
      paths = DrawUtil::getCircleShapeRoundToGrid(drawTool.getDrawData(), initialCoord.x,
          initialCoord.y, touch.roundedX, touch.roundedY, roundUnitX, roundUnitY);
      break;
    }
    case Shape::Triangle:
      paths = DrawUtil::getRightTriangleShape(
          initialCoord.x, initialCoord.y, touch.roundedX, touch.roundedY);
      break;
    }

    if (paths) {
      for (int ii = 0; ii < paths->length; ii++) {
        auto &path = paths->paths[ii];
        path.isTransparent = false;
      }
    }

    if (touch.touch.released) {
      // TODO: commit path data
      if (paths) {
        for (int ii = 0; ii < paths->length; ii++) {
          drawTool.addTempPathData(paths->paths + ii);
        }
      }
    } else {
      // repeatedly clear and draw the updated paths as we drag the touch around
      drawTool.resetTempGraphics();
      if (paths) {
        for (int ii = 0; ii < paths->length; ii++) {
          drawTool.addTempPathData(paths->paths + ii);
        }
      }
    }
  }

  void drawOverlay(Lv &lv) {
  }

private:
  bool isGestureStarted = false;
  love::Vector2 initialCoord;
  Shape shape;
};
