#pragma once

#include "precomp.h"
#include "draw_subtool_interface.h"
#include "editor/draw/util.h"

class CollisionMoveSubtool : public DrawSubtool {
public:
  explicit CollisionMoveSubtool(DrawTool &drawTool_)
      : DrawSubtool(drawTool_) {
  }

  ~CollisionMoveSubtool() {
  }

  std::string category() {
    return "collision_move";
  }

  std::string name() {
    return "move";
  }

  void onReset() {
    isGestureStarted = false;
  }

  void onTouch(DrawSubtoolTouch &touch) {
    if (!isGestureStarted) {
      isGestureStarted = true;

      initialCoord.x = touch.touchX;
      initialCoord.y = touch.touchY;
      grabbedShape = std::nullopt;

      int idx = drawTool.getPhysicsBodyData().getShapeIdxAtPoint(initialCoord);
      if (idx >= 0) {
        grabbedShape = drawTool.getPhysicsBodyData().removeShapeAtIndex(idx);
      }
    }

    if (grabbedShape) {
      auto [diffX, diffY] = drawTool.getDrawData().roundGlobalDiffCoordinatesToGrid(
          touch.touchX - initialCoord.x, touch.touchY - initialCoord.y);

      drawTool.getPhysicsBodyData().tempShape = drawTool.getPhysicsBodyData().moveShapeBy(
          *grabbedShape, diffX, diffY, drawTool.getDrawData().gridCellSize());
    }

    if (touch.touch.released) {
      if (drawTool.getPhysicsBodyData().commitTempShape()) {
        drawTool.saveDrawing("move all");
      }

      isGestureStarted = false;
    }
  }

  void drawOverlay(Lv &lv) {
  }

private:
  love::Vector2 initialCoord;
  std::optional<PhysicsBodyDataShape> grabbedShape;
  bool isGestureStarted = false;
};
