#pragma once

#include "precomp.h"
#include "draw_subtool_interface.h"

class CollisionEraseSubtool : public DrawSubtool {
public:
  explicit CollisionEraseSubtool(DrawTool &drawTool_)
      : DrawSubtool(drawTool_) {
  }
  ~CollisionEraseSubtool() {
  }

  std::string category() {
    return "collision";
  }

  std::string name() {
    return "collision_erase";
  }

  void onReset() {
    isGestureStarted = false;
  }

  void onTouch(DrawSubtoolTouch &touch) {
    if (!isGestureStarted) {
      isGestureStarted = true;

      love::Vector2 touchPoint(touch.touchX, touch.touchY);
      int idx = drawTool.getPhysicsBodyData().getShapeIdxAtPoint(touchPoint);
      if (idx >= 0) {
        drawTool.getPhysicsBodyData().removeShapeAtIndex(idx);
        drawTool.saveDrawing("erase");
      }
    }

    if (touch.touch.released) {
      isGestureStarted = false;
    }
  }

  void drawOverlay(Lv &lv) {
  }

private:
  bool isGestureStarted = false;
};
