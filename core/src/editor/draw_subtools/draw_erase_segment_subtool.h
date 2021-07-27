#pragma once

#include "precomp.h"
#include "draw_subtool_interface.h"
#include "../draw/util.h"

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

  void onReset() {
    didChange = false;
  }

  void onTouch(DrawSubtoolTouch &touch) {
    lastTouchCoord.x = touch.touchX;
    lastTouchCoord.y = touch.touchY;

    // TODO: scale by draw tool's view scale
    auto radius = 1.0f;

    std::vector<int> pathIndicesToRemove;
    auto pathDataList = drawTool.getDrawData().currentPathDataList();
    if (pathDataList) {
      int index = 0;
      for (auto &pathData : *pathDataList) {
        // TODO: shouldn't need to call `updatePathDataRendering` here
        drawTool.getDrawData().updatePathDataRendering(&pathData);
        if (DrawUtil::pathIntersectsCircle(pathData, touch.touchX, touch.touchY, radius)) {
          pathIndicesToRemove.push_back(index);
        }
        index++;
      }
    }

    // TODO: check for clearing flood fill

    if (touch.touch.released) {
      if (didChange) {
        // TODO: commit changes
      }
    } else {
      for (auto index : pathIndicesToRemove) {
        pathDataList->erase(pathDataList->begin() + index);
        didChange = true;
      }
    }
  }

private:
  love::Vector2 lastTouchCoord;
  bool didChange = false;
};
