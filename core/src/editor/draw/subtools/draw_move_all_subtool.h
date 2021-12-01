#pragma once

#include "precomp.h"
#include "draw_subtool_interface.h"
#include "editor/draw/util.h"

class DrawMoveAllSubtool : public DrawSubtool {
public:
  explicit DrawMoveAllSubtool(DrawTool &drawTool_, bool isBitmap_)
      : DrawSubtool(drawTool_) {
    isBitmap = isBitmap_;
  }

  ~DrawMoveAllSubtool() {
  }

  std::string category() {
    if (isBitmap) {
      return "bitmap";
    } else {
      return "artwork_move";
    }
  }

  std::string name() {
    return "move_all";
  }

  void onReset() {
    isGestureStarted = false;
  }

  void onTouch(DrawSubtoolTouch &touch) {
    if (!isGestureStarted) {
      isGestureStarted = true;
      lastCoord.x = touch.touchX;
      lastCoord.y = touch.touchY;
      clampedDiff.x = 0;
      clampedDiff.y = 0;

      love::ghost::Bounds frameBounds;
      if (isBitmap) {
        frameBounds = drawTool.getDrawDataFrame().getFillImageBoundsInPathCoordinates();
      } else {
        frameBounds = drawTool.getDrawDataFrame().getPathDataBounds(std::nullopt);
      }
      bounds.minX = -DRAW_MAX_SIZE - frameBounds.minX - DRAW_LINE_WIDTH * 0.5;
      bounds.minY = -DRAW_MAX_SIZE - frameBounds.minY - DRAW_LINE_WIDTH * 0.5;
      bounds.maxX = DRAW_MAX_SIZE - frameBounds.maxX + DRAW_LINE_WIDTH * 0.5;
      bounds.maxY = DRAW_MAX_SIZE - frameBounds.maxY + DRAW_LINE_WIDTH * 0.5;
    }

    clampedDiff.x = clampedDiff.x + touch.touchX - lastCoord.x;
    clampedDiff.y = clampedDiff.y + touch.touchY - lastCoord.y;

    lastCoord.x = touch.touchX;
    lastCoord.y = touch.touchY;

    if (clampedDiff.x < bounds.minX) {
      clampedDiff.x = bounds.minX;
    }
    if (clampedDiff.y < bounds.minY) {
      clampedDiff.y = bounds.minY;
    }
    if (clampedDiff.x > bounds.maxX) {
      clampedDiff.x = bounds.maxX;
    }
    if (clampedDiff.y > bounds.maxY) {
      clampedDiff.y = bounds.maxY;
    }

    if (touch.touch.released) {
      if (!DrawUtil::floatEquals(clampedDiff.x, 0.0)
          || !DrawUtil::floatEquals(clampedDiff.y, 0.0)) {
        auto pathDataList = drawTool.selectedFramePathDataList();
        for (auto &pathData : *pathDataList) {
          ReleasePath(pathData.tovePath);
          pathData.tovePath.ptr = NULL;

          for (size_t i = 0; i < pathData.points.size(); i++) {
            pathData.points[i].x = pathData.points[i].x + clampedDiff.x;
            pathData.points[i].y = pathData.points[i].y + clampedDiff.y;
          }

          if (pathData.bendPoint) {
            pathData.bendPoint->x = pathData.bendPoint->x + clampedDiff.x;
            pathData.bendPoint->y = pathData.bendPoint->y + clampedDiff.y;
          }
        }

        drawTool.getDrawDataFrame().fillImageBounds.minX
            = drawTool.getDrawDataFrame().fillImageBounds.minX
            + drawTool.getDrawData().fillPixelsPerUnit * clampedDiff.x;
        drawTool.getDrawDataFrame().fillImageBounds.minY
            = drawTool.getDrawDataFrame().fillImageBounds.minY
            + drawTool.getDrawData().fillPixelsPerUnit * clampedDiff.y;
        drawTool.getDrawDataFrame().fillImageBounds.maxX
            = drawTool.getDrawDataFrame().fillImageBounds.maxX
            + drawTool.getDrawData().fillPixelsPerUnit * clampedDiff.x;
        drawTool.getDrawDataFrame().fillImageBounds.maxY
            = drawTool.getDrawDataFrame().fillImageBounds.maxY
            + drawTool.getDrawData().fillPixelsPerUnit * clampedDiff.y;

        drawTool.dirtySelectedFrameBounds();
        drawTool.getDrawDataFrame().resetGraphics();
        drawTool.saveDrawing("move all");
      }

      drawTool.setTempTranslation(0, 0);
      isGestureStarted = false;
    } else {
      drawTool.setTempTranslation(clampedDiff.x, clampedDiff.y);
    }
  }

  void drawOverlay(Lv &lv) {
  }

private:
  love::Vector2 lastCoord;
  love::Vector2 clampedDiff;
  love::Bounds bounds;
  bool isGestureStarted = false;
  bool isBitmap = false;
};
