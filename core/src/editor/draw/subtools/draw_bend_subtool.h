#pragma once

#include "precomp.h"
#include "draw_subtool_interface.h"
#include "editor/draw/util.h"

class DrawBendSubtool : public DrawSubtool {
public:
  explicit DrawBendSubtool(DrawTool &drawTool_)
      : DrawSubtool(drawTool_) {
  }

  ~DrawBendSubtool() {
  }

  std::string category() {
    return "artwork_move";
  }

  std::string name() {
    return "bend";
  }

  void onReset() {
    isGestureStarted = false;
    isUsingBendPoint = false;
    grabbedPath = std::nullopt;
  }

  void onTouch(DrawSubtoolTouch &touch) {
    if (!isGestureStarted) {
      isGestureStarted = true;
      grabbedPath = std::nullopt;
      initialCoord.x = touch.touchX;
      initialCoord.y = touch.touchY;
      isUsingBendPoint = false;

      auto &pathDataList = *(drawTool.selectedFramePathDataList());
      for (int i = pathDataList.size() - 1; i >= 0; i--) {
        auto &pathData = pathDataList[i];
        if (!pathData.isFreehand
            && DrawUtil::pathIntersectsCircle(
                pathData, touch.touchX, touch.touchY, 0.5 * drawTool.getZoomAmount())) {
          grabbedPath = pathData;
          pathDataList.erase(pathDataList.begin() + i);
          drawTool.getDrawDataFrame().resetGraphics();
          break;
        }
      }
    }

    float distance = sqrtf(
        powf(initialCoord.x - touch.touchX, 2.0) + powf(initialCoord.y - touch.touchY, 2.0));
    if (distance > 0.1 * drawTool.getZoomAmount()) {
      isUsingBendPoint = true;
    }

    if (grabbedPath) {
      if (isUsingBendPoint) {
        grabbedPath->style = 1;
        grabbedPath->bendPoint = love::Point(touch.clampedX, touch.clampedY);
      }

      ReleasePath(grabbedPath->tovePath);
      grabbedPath->tovePath.ptr = NULL;
    }

    if (touch.touch.released) {
      if (grabbedPath) {
        if (!isUsingBendPoint) {
          if (grabbedPath->bendPoint) {
            grabbedPath->style = 1;
            grabbedPath->bendPoint = std::nullopt;
          } else {
            grabbedPath->style = grabbedPath->style + 1;
            if (grabbedPath->style > 3) {
              grabbedPath->style = 1;
            }
          }
        }

        drawTool.addPathData(*grabbedPath);

        drawTool.getDrawDataFrame().resetGraphics();
        drawTool.getDrawDataFrame().resetFill();
        drawTool.dirtySelectedFrameBounds();
        drawTool.saveDrawing("bend");
      }

      drawTool.clearTempGraphics();
    } else {
      if (grabbedPath) {
        drawTool.resetTempGraphics();
        drawTool.addTempPathData(*grabbedPath);
      }
    }
  }

  void drawOverlay(Lv &lv) {
  }

private:
  std::optional<love::PathData> grabbedPath;
  love::Vector2 initialCoord;
  bool isGestureStarted = false;
  bool isUsingBendPoint = false;
};
