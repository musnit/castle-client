#pragma once

#include "precomp.h"
#include "draw_subtool_interface.h"
#include "editor/draw/util.h"

struct PathDataWithGrabPoint {
  love::PathData pathData;
  int grabPointIndex;

  PathDataWithGrabPoint(love::PathData pathData, int grabPointIndex)
      : pathData(pathData)
      , grabPointIndex(grabPointIndex) {
  }
};

class DrawMoveSubtool : public DrawSubtool {
public:
  explicit DrawMoveSubtool(DrawTool &drawTool_)
      : DrawSubtool(drawTool_) {
  }

  ~DrawMoveSubtool() {
  }

  std::string category() {
    return "artwork_move";
  }

  std::string name() {
    return "move";
  }

  void onReset() {
    isGestureStarted = false;
    grabbedPaths.clear();
  }

  void onTouch(DrawSubtoolTouch &touch) {
    if (!isGestureStarted) {
      isGestureStarted = true;

      auto &pathDataList = *(drawTool.selectedFramePathDataList());
      for (int i = pathDataList.size() - 1; i >= 0; i--) {
        auto &pathData = pathDataList[i];
        if (!pathData.isFreehand) {
          for (size_t p = 0; p < pathData.points.size(); p++) {
            float distance = sqrtf(powf(touch.touchX - pathData.points[p].x, 2.0)
                + powf(touch.touchY - pathData.points[p].y, 2.0));

            if (distance < drawTool.getDrawData().scale * 0.05) {
              grabbedPaths.push_back(PathDataWithGrabPoint(pathData, p));
              pathDataList.erase(pathDataList.begin() + i);
              break;
            }
          }
        }
      }

      if (grabbedPaths.size() == 0) {
        auto &pathDataList = *(drawTool.selectedFramePathDataList());
        for (int i = pathDataList.size() - 1; i >= 0; i--) {
          auto &pathData = pathDataList[i];
          if (!pathData.isFreehand) {
            if (DrawUtil::pathIntersectsCircle(
                    pathData, touch.touchX, touch.touchY, 0.5 * drawTool.getZoomAmount())) {
              love::Point touchPoint(touch.touchX, touch.touchY);

              love::PathData newPathData1;
              newPathData1.points.push_back(pathData.points[0]);
              newPathData1.points.push_back(touchPoint);
              newPathData1.style = pathData.style;
              newPathData1.color = pathData.color;

              love::PathData newPathData2;
              newPathData2.points.push_back(touchPoint);
              newPathData2.points.push_back(pathData.points[1]);
              newPathData2.style = pathData.style;
              newPathData2.color = pathData.color;

              grabbedPaths.push_back(PathDataWithGrabPoint(newPathData1, 1));
              grabbedPaths.push_back(PathDataWithGrabPoint(newPathData2, 0));

              pathDataList.erase(pathDataList.begin() + i);

              break;
            }
          }
        }
      }

      if (grabbedPaths.size() > 0) {
        drawTool.getDrawDataFrame().resetGraphics();
      }
    }

    for (size_t i = 0; i < grabbedPaths.size(); i++) {
      grabbedPaths[i].pathData.points[grabbedPaths[i].grabPointIndex].x = touch.roundedX;
      grabbedPaths[i].pathData.points[grabbedPaths[i].grabPointIndex].y = touch.roundedY;

      grabbedPaths[i].pathData.clearTovePath();
    }

    if (touch.touch.released) {
      if (grabbedPaths.size() > 0) {
        for (size_t i = 0; i < grabbedPaths.size(); i++) {
          drawTool.addPathData(grabbedPaths[i].pathData);
        }

        drawTool.getDrawDataFrame().resetGraphics();
        drawTool.getDrawDataFrame().resetFill();
        drawTool.dirtySelectedFrameBounds();
        drawTool.saveDrawing("move");
      }

      grabbedPaths.clear();
      drawTool.clearTempGraphics();
    } else {
      drawTool.resetTempGraphics();

      for (size_t i = 0; i < grabbedPaths.size(); i++) {
        drawTool.addTempPathData(grabbedPaths[i].pathData);
      }
    }
  }

  void drawOverlay(Lv &lv) {
    std::vector<love::Vector2> points;

    auto pathDataList = drawTool.selectedFramePathDataList();
    for (auto &pathData : *pathDataList) {
      if (!pathData.isFreehand) {
        for (size_t p = 0; p < pathData.points.size(); p++) {
          points.push_back(love::Vector2(pathData.points[p].x, pathData.points[p].y));
        }
      }
    }

    lv.graphics.setColor({ 1, 0.6, 0.6, 1 });
    lv.graphics.setPointSize(30.0);
    lv.graphics.points(&points[0], NULL, points.size());
  }

private:
  std::vector<PathDataWithGrabPoint> grabbedPaths;
  bool isGestureStarted = false;
};
