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
    for (int ii = 0; ii < 4; ii++) {
      paths[ii].isTransparent = false;
    }
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

    int numPaths = 0;

    switch (shape) {
    case Shape::Rectangle:
      if (DrawUtil::getRectangleShape(
              paths, initialCoord.x, initialCoord.y, touch.roundedX, touch.roundedY)) {
        numPaths = 4;
      }
      break;
    case Shape::Circle: {
      auto roundUnitX = DrawUtil::unit(touch.touchX - initialCoord.x);
      auto roundUnitY = DrawUtil::unit(touch.touchY - initialCoord.y);
      if (DrawUtil::getCircleShapeRoundToGrid(drawTool.getDrawData(), paths, initialCoord.x,
              initialCoord.y, touch.roundedX, touch.roundedY, roundUnitX, roundUnitY)) {
        numPaths = 4;
      }
      break;
    }
    case Shape::Triangle:
      if (DrawUtil::getRightTriangleShape(
              paths, initialCoord.x, initialCoord.y, touch.roundedX, touch.roundedY)) {
        numPaths = 3;
      }
      break;
    }

    if (touch.touch.released) {
      if (numPaths) {
        for (int ii = 0; ii < numPaths; ii++) {
          drawTool.addPathData(paths[ii]);
        }
        drawTool.getDrawDataFrame().resetGraphics();
        drawTool.getDrawDataFrame().resetFill();
        drawTool.getDrawData().updateSelectedFrameBounds();
        drawTool.saveDrawing("shape");
      }
      drawTool.resetTempGraphics();
    } else {
      // repeatedly clear and draw the updated paths as we drag the touch around
      drawTool.resetTempGraphics();
      if (numPaths) {
        for (int ii = 0; ii < numPaths; ii++) {
          drawTool.addTempPathData(paths[ii]);
        }
      }
    }
  }

  void drawOverlay(Lv &lv) {
  }

private:
  love::PathData paths[4];
  bool isGestureStarted = false;
  love::Vector2 initialCoord;
  Shape shape;
};
