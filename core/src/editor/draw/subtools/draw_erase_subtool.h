#pragma once

#include "precomp.h"
#include "draw_subtool_interface.h"
#include "editor/draw/util.h"
#include "editor/draw/subpath_intersections.h"

class DrawEraseSubtool : public DrawSubtool {
public:
  enum class Size {
    Small,
    Medium,
    Large,
  };

  explicit DrawEraseSubtool(DrawTool &drawTool_, Size size_)
      : DrawSubtool(drawTool_) {
    size = size_;
  }

  ~DrawEraseSubtool() {
  }

  std::string category() {
    return "artwork_erase";
  }

  std::string name() {
    switch (size) {
    case Size::Small:
      return "erase_small";
    case Size::Medium:
      return "erase_medium";
    case Size::Large:
      return "erase_large";
    }
  }

  float getRadius() {
    float radius;
    switch (size) {
    case Size::Small:
      radius = 0.8f;
      break;
    case Size::Medium:
      radius = 1.4f;
      break;
    case Size::Large:
      radius = 2.5f;
      break;
    }
    return radius * drawTool.getZoomAmount();
  }

  void onReset() {
    didChange = false;
  }

  void onTouch(DrawSubtoolTouch &touch) {
    lastTouchCoord.x = touch.touchX;
    lastTouchCoord.y = touch.touchY;

    auto radius = getRadius();

    std::vector<int> pathIndicesToRemove;
    std::vector<love::PathData> pathsToAdd;

    auto pathDataList = drawTool.getDrawData().currentPathDataList();
    if (pathDataList) {
      int index = 0;
      for (auto &pathData : *pathDataList) {
        if (DrawUtil::pathIntersectsCircle(pathData, touch.touchX, touch.touchY, radius)) {
          // remove the intersecting path, then maybe replace it
          pathIndicesToRemove.push_back(index);
          if (!pathData.bendPoint && pathData.style == 1) {
            // we can potentially cut this path
            maybeAddReplacementPaths(&pathsToAdd, pathData, touch.touchX, touch.touchY, radius);
          }
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
        drawTool.getDrawData().updateSelectedFrameBounds();
        drawTool.saveDrawing("erase");
        drawTool.resetTempGraphics();
      }
    } else {
      didChange = pathIndicesToRemove.size() > 0;
      for (auto iter = pathIndicesToRemove.rbegin(); iter != pathIndicesToRemove.rend(); iter++) {
        auto index = *iter;
        pathDataList->erase(pathDataList->begin() + index);
      }
      for (auto pathData : pathsToAdd) {
        // we may need to test the new paths for erasure later in this same gesture,
        // so add them to the final draw data
        drawTool.addPathData(pathData);
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
  Size size;
  love::Vector2 lastTouchCoord;
  bool didChange = false;

  inline bool isPointInCircle(love::Point &p, float centerX, float centerY, float radius) {
    auto dx = p.x - centerX, dy = p.y - centerY;
    return sqrt(dx * dx + dy * dy) < radius;
  }

  void addReplacementPathData(std::vector<love::PathData> *pathsToAdd,
      love::PathData &pathDataToReplace, love::Point &p1, love::Point &p2) {
    love::PathData newPath;
    newPath.copyAttributes(pathDataToReplace);
    newPath.points.push_back(p1);
    newPath.points.push_back(p2);
    pathsToAdd->push_back(newPath);
  }

  void maybeAddReplacementPaths(std::vector<love::PathData> *pathsToAdd,
      love::PathData &pathDataToReplace, float centerX, float centerY, float radius) {
    for (int ii = 0, n = pathDataToReplace.points.size(); ii < n - 1; ii++) {
      auto p1 = pathDataToReplace.points[ii];
      auto p2 = pathDataToReplace.points[ii + 1];
      auto isP1InCircle = isPointInCircle(p1, centerX, centerY, radius);
      auto isP2InCircle = isPointInCircle(p2, centerX, centerY, radius);
      if (isP1InCircle && isP2InCircle) {
        // both points are in circle, can erase this segment completely
      } else {
        love::Point center(centerX, centerY);
        auto intersections = DrawSubpathIntersections::lineArc(love::Subpath::SubpathLine(p1, p2),
            love::Subpath::SubpathArc(center, radius, 0, 2.0 * M_PI));
        if (intersections.size() > 0) {
          if (isP1InCircle) {
            addReplacementPathData(pathsToAdd, pathDataToReplace, intersections[0], p2);
          } else if (isP2InCircle) {
            addReplacementPathData(pathsToAdd, pathDataToReplace, p1, intersections[0]);
          } else {
            // neither point is in circle, but line still passes through circle
            if (intersections.size() == 2) {
              // this should always be true. not sure what it'd mean if this is false
              if (p1.distance(intersections[0]) < p1.distance(intersections[1])) {
                addReplacementPathData(pathsToAdd, pathDataToReplace, p1, intersections[0]);
                addReplacementPathData(pathsToAdd, pathDataToReplace, intersections[1], p2);
              } else {
                addReplacementPathData(pathsToAdd, pathDataToReplace, p1, intersections[1]);
                addReplacementPathData(pathsToAdd, pathDataToReplace, intersections[0], p2);
              }
            }
          }
        } else {
          addReplacementPathData(pathsToAdd, pathDataToReplace, p1, p2);
        }
      }
    }
  }
};
