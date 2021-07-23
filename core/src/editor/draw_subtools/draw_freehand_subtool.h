#pragma once

#include "precomp.h"
#include "draw_subtool_interface.h"

class DrawFreehandSubtool : public DrawSubtool {
public:
  std::string category() {
    return "artwork_draw";
  }

  std::string name() {
    return "pencil_no_grid";
  }

  void onReset() {
  }

  void onTouch(DrawSubtoolTouch &touch) {
    love::ghost::PathData *pathData = new love::PathData();

    love::ghost::Color c;
    c.data[0] = 1.0;
    c.data[1] = 0.0;
    c.data[2] = 0.0;
    c.data[3] = 1.0;

    pathData->color = c;
    pathData->points.push_back(love::ghost::Point(initialCoord.x, initialCoord.y));
    pathData->points.push_back(love::ghost::Point(touch.touchX, touch.touchY));
    pathData->style = 1;
    pathData->isFreehand = true;
    pathData->isTransparent = false;

    drawTool->addTempPathData(pathData);

    initialCoord.x = touch.touchX;
    initialCoord.y = touch.touchY;
  }

private:
  love::Vector2 initialCoord;
  // currentPathData
  // currentPathDataList
};