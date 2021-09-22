#pragma once

#include "precomp.h"
#include "draw_subtool_interface.h"
#include "editor/draw/util.h"

class DrawEraseSegmentSubtool : public DrawSubtool {
public:
  explicit DrawEraseSegmentSubtool(DrawTool &drawTool_)
      : DrawSubtool(drawTool_) {
  }

  ~DrawEraseSegmentSubtool() {
  }

  std::string category() {
    return "artwork_erase";
  }

  std::string name() {
    return "erase_segment";
  }

  float getRadius() {
    return 1.0f * drawTool.getZoomAmount();
  }

  void onReset() {
    didChange = false;
  }

  void onTouch(DrawSubtoolTouch &touch) {
    lastTouchCoord.x = touch.touchX;
    lastTouchCoord.y = touch.touchY;

    auto radius = getRadius();

    std::vector<int> pathIndicesToRemove;
    auto pathDataList = drawTool.selectedFramePathDataList();
    if (pathDataList) {
      int index = 0;
      for (auto &pathData : *pathDataList) {
        if (DrawUtil::pathIntersectsCircle(pathData, touch.touchX, touch.touchY, radius)) {
          pathIndicesToRemove.push_back(index);
        }
        index++;
      }
    }

    if (drawTool.getDrawDataFrame().floodClear(touch.touchX, touch.touchY, getRadius())) {
      didChange = true;
    }

    if (touch.touch.released) {
      if (didChange) {
        drawTool.getDrawDataFrame().resetGraphics();
        drawTool.getDrawDataFrame().resetFill();
        drawTool.dirtySelectedFrameBounds();
        drawTool.saveDrawing("erase");
        drawTool.resetTempGraphics();
      }
    } else {
      for (auto iter = pathIndicesToRemove.rbegin(); iter != pathIndicesToRemove.rend(); iter++) {
        auto index = *iter;
        pathDataList->erase(pathDataList->begin() + index);
        didChange = true;
      }
      if (didChange) {
        drawTool.getDrawDataFrame().resetGraphics();
      }
    }
  }

  void drawOverlay(Lv &lv) {
    if (hasTouch) {
      lv.graphics.setColor({ 1, 1, 1, 0.3 });
      auto radius = getRadius();
      lv.graphics.circle(
          love::Graphics::DrawMode::DRAW_FILL, lastTouchCoord.x, lastTouchCoord.y, radius);
    }
  }

private:
  love::Vector2 lastTouchCoord;
  bool didChange = false;
};
