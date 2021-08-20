#pragma once

#include "precomp.h"
#include "draw_subtool_interface.h"
#include "editor/draw/util.h"

class CollisionMoveAllSubtool : public DrawSubtool {
public:
  explicit CollisionMoveAllSubtool(DrawTool &drawTool_)
      : DrawSubtool(drawTool_) {
  }

  ~CollisionMoveAllSubtool() {
  }

  std::string category() {
    return "collision_move";
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

      auto physicsBodyBounds = drawTool.getPhysicsBodyData().getBounds();
      bounds.minX = -DRAW_MAX_SIZE - physicsBodyBounds.minX;
      bounds.minY = -DRAW_MAX_SIZE - physicsBodyBounds.minY;
      bounds.maxX = DRAW_MAX_SIZE - physicsBodyBounds.maxX;
      bounds.maxY = DRAW_MAX_SIZE - physicsBodyBounds.maxY;
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
        for (size_t i = 0; i < drawTool.getPhysicsBodyData().shapes.size(); i++) {
          drawTool.getPhysicsBodyData().shapes[i]
              = drawTool.getPhysicsBodyData().moveShapeByIgnoreBounds(
                  drawTool.getPhysicsBodyData().shapes[i], clampedDiff.x, clampedDiff.y);
        }

        drawTool.saveDrawing("move all");
      }

      drawTool.getPhysicsBodyData().setTempTranslation(0, 0);
      isGestureStarted = false;
    } else {
      drawTool.getPhysicsBodyData().setTempTranslation(clampedDiff.x, clampedDiff.y);
    }
  }

  void drawOverlay(Lv &lv) {
  }

private:
  love::Vector2 lastCoord;
  love::Vector2 clampedDiff;
  love::Bounds bounds;
  bool isGestureStarted = false;
};
