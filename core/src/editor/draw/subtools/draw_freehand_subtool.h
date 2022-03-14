#pragma once

#include "precomp.h"
#include "draw_subtool_interface.h"
#include "editor/draw/util.h"

class DrawFreehandSubtool : public DrawSubtool {
public:
  explicit DrawFreehandSubtool(DrawTool &drawTool_)
      : DrawSubtool(drawTool_) {
  }
  ~DrawFreehandSubtool() {
  }

  std::string category() {
    return "artwork_draw";
  }

  std::string name() {
    return "pencil_no_grid";
  }

  void onReset() {
    isGestureStarted = false;
    currentPathData = std::nullopt;
    currentPathDataList.clear();
  }

  void onTouch(DrawSubtoolTouch &touch) {
    if (!isGestureStarted) {
      isGestureStarted = true;

      initialCoord.x = touch.clampedX;
      initialCoord.y = touch.clampedY;
      currentPathData = std::nullopt;
      currentPathDataList.clear();
    }

    love::Point newCoord(touch.clampedX, touch.clampedY);

    currentPathData = love::PathData();
    currentPathData->points.push_back(initialCoord);
    currentPathData->points.push_back(newCoord);
    currentPathData->style = 1;
    currentPathData->isFreehand = true;
    currentPathData->isTransparent = false;

    float dist = sqrtf(
        powf(initialCoord.x - touch.clampedX, 2.0) + powf(initialCoord.y - touch.clampedY, 2.0));
    if (dist > 0.2) {
      initialCoord = newCoord;
      currentPathDataList.push_back(currentPathData->copy());
      currentPathData = std::nullopt;
    }

    if (touch.touch.released) {
      if (currentPathData
          && (!DrawUtil::floatEquals(currentPathData->points[0].x, currentPathData->points[1].x)
              || !DrawUtil::floatEquals(
                  currentPathData->points[0].y, currentPathData->points[1].y))) {
        currentPathDataList.push_back(currentPathData->copy());
      }

      for (size_t i = 0; i < currentPathDataList.size(); i++) {
        currentPathDataList[i].clearTovePath();
        drawTool.addPathData(currentPathDataList[i].copy());
      }

      drawTool.getDrawDataFrame().resetGraphics();
      drawTool.getDrawDataFrame().resetFill();
      drawTool.dirtySelectedFrameBounds();
      drawTool.saveDrawing("freehand pencil");

      drawTool.clearTempGraphics();
    } else {
      drawTool.resetTempGraphics();

      for (size_t i = 0; i < currentPathDataList.size(); i++) {
        drawTool.addTempPathData(currentPathDataList[i].copy());
      }

      if (currentPathData) {
        drawTool.addTempPathData(currentPathData->copy());
      }
    }
  }

  void drawOverlay(Lv &lv) {
  }

private:
  love::Point initialCoord;
  std::optional<love::PathData> currentPathData;
  std::vector<love::PathData> currentPathDataList;
  bool isGestureStarted = false;
};
