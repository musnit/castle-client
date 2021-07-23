#pragma once

#include "precomp.h"
#include "draw_subtool_interface.h"
#include "../draw/util.h"

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

    // TODO: actual color
    love::ghost::Color c;
    c.data[0] = 1.0;
    c.data[1] = 0.0;
    c.data[2] = 0.0;
    c.data[3] = 1.0;

    auto shape = DrawUtil::getRectangleShape(
        initialCoord.x, initialCoord.y, touch.roundedX, touch.roundedY);
    if (shape) {
      for (int ii = 0; ii < shape->length; ii++) {
        auto &path = shape->paths[ii];
        path.color = c;
        path.isTransparent = false;
      }
    }

    if (touch.touch.released) {
      // TODO: commit path data
      for (int ii = 0; ii < shape->length; ii++) {
        drawTool.addTempPathData(shape->paths + ii);
      }
    } else {
      // repeatedly clear and draw the updated shape as we drag the touch around
      drawTool.resetTempGraphics();
      for (int ii = 0; ii < shape->length; ii++) {
        drawTool.addTempPathData(shape->paths + ii);
      }
    }
  }

private:
  bool isGestureStarted = false;
  love::Vector2 initialCoord;
  Shape shape;
};
