#pragma once

#include "precomp.h"
#include "draw_subtool_interface.h"
#include "editor/draw/util.h"

class DrawFillSubtool : public DrawSubtool {
public:
  explicit DrawFillSubtool(DrawTool &drawTool_)
      : DrawSubtool(drawTool_) {
  }
  ~DrawFillSubtool() {
  }

  std::string category() {
    return "artwork";
  }

  std::string name() {
    return "fill";
  }

  void onReset() {
    didChange = false;
  }

  float getRadius() {
    return 0.5f * drawTool.getZoomAmount();
  }

  void onTouch(DrawSubtoolTouch &touch) {
    std::set<size_t> pathIndicesToFill;
    auto radius = getRadius();
    bool filledPath = false;

    auto pathDataList = drawTool.getDrawData().currentPathDataList();
    if (pathDataList) {
      for (size_t i = 0; i < pathDataList->size(); i++) {
        if (DrawUtil::pathIntersectsCircle(
                (*pathDataList)[i], touch.touchX, touch.touchY, radius)) {
          if (!love::DrawAlgorithms::colorsEqual(
                  drawTool.getDrawData().color, (*pathDataList)[i].color)) {
            pathIndicesToFill.insert(i);
          }
        }
      }

      for (size_t i = 0; i < pathDataList->size(); i++) {
        if (pathIndicesToFill.find(i) != pathIndicesToFill.end()) {
          for (int j = i - 1; j >= 0; j--) {
            if (pathIndicesToFill.find(j) != pathIndicesToFill.end()) {
              break;
            }

            if (!drawTool.getDrawData().arePathDatasFloodFillable(
                    (*pathDataList)[j], (*pathDataList)[j + 1])) {
              break;
            }

            pathIndicesToFill.insert(j);
          }

          for (int j = i + 1; j < pathDataList->size(); j++) {
            if (pathIndicesToFill.find(j) != pathIndicesToFill.end()) {
              break;
            }

            if (!drawTool.getDrawData().arePathDatasFloodFillable(
                    (*pathDataList)[j - 1], (*pathDataList)[j])) {
              break;
            }

            pathIndicesToFill.insert(j);
          }
        }
      }

      for (size_t i = 0; i < pathDataList->size(); i++) {
        if (pathIndicesToFill.find(i) != pathIndicesToFill.end()) {
          auto &pathData = (*pathDataList)[i];
          pathData.tovePath.ptr = NULL;
          pathData.color = drawTool.getDrawData().color;
          filledPath = true;
        }
      }
    }

    if (filledPath) {
      didChange = true;
      drawTool.getDrawDataFrame().resetGraphics();
    } else {
      // don't allow filling both path and fill in the same frame.
      // makes it easier to fill only a path
      if (drawTool.getDrawDataFrame().floodFill(touch.touchX, touch.touchY)) {
        didChange = true;
      }
    }

    if (touch.touch.released) {
      if (didChange) {
        drawTool.saveDrawing("fill");
      }
      didChange = false;
    }
  }

  void drawOverlay(Lv &lv) {
  }

private:
  bool didChange = false;
};
