#pragma once

#include "precomp.h"
#include "draw_subtool_interface.h"

class DrawLineSubtool : public DrawSubtool {
public:
  explicit DrawLineSubtool(DrawTool &drawTool_)
      : DrawSubtool(drawTool_) {
  }
  ~DrawLineSubtool() {
  }

  std::string category() {
    return "artwork_draw";
  }

  std::string name() {
    return "line";
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

    love::PathData pathData;
    pathData.points.push_back(love::Point(initialCoord.x, initialCoord.y));
    pathData.points.push_back(love::Point(touch.roundedX, touch.roundedY));
    pathData.style = 1;
    pathData.isTransparent = false;

    if (touch.touch.released) {
      drawTool.addPathData(pathData);
      drawTool.getDrawDataFrame().resetGraphics();
      drawTool.getDrawDataFrame().resetFill();
      drawTool.dirtySelectedFrameBounds();
      drawTool.saveDrawing("line segment");
      drawTool.resetTempGraphics();
    } else {
      // repeatedly clear and draw the updated segment as we drag the touch around
      drawTool.resetTempGraphics();
      drawTool.addTempPathData(pathData);
    }
  }

  void drawOverlay(Lv &lv) {
  }

private:
  bool isGestureStarted = false;
  love::Vector2 initialCoord;
};
