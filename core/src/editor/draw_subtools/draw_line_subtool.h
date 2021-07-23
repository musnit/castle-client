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

    love::ghost::PathData *pathData = new love::PathData();

    love::ghost::Color c;
    c.data[0] = 1.0;
    c.data[1] = 0.0;
    c.data[2] = 0.0;
    c.data[3] = 1.0;

    pathData->color = c;
    pathData->points.push_back(love::ghost::Point(initialCoord.x, initialCoord.y));
    pathData->points.push_back(love::ghost::Point(touch.roundedX, touch.roundedY));
    pathData->style = 1;
    pathData->isTransparent = false;

    if (touch.touch.released) {
      // TODO: commit path data
      drawTool.addTempPathData(pathData);
    } else {
      // repeatedly clear and draw the updated segment as we drag the touch around
      drawTool.resetTempGraphics();
      drawTool.addTempPathData(pathData);
    }
  }

private:
  bool isGestureStarted = false;
  love::Vector2 initialCoord;
};
