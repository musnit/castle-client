#pragma once

#include "precomp.h"
#include "draw_subtool_interface.h"
#include "editor/draw/util.h"

#define HANDLE_TOUCH_RADIUS 30.0
#define HANDLE_DRAW_RADIUS 12.0

class CollisionScaleSubtool : public DrawSubtool {
public:
  explicit CollisionScaleSubtool(DrawTool &drawTool_)
      : DrawSubtool(drawTool_) {
  }

  ~CollisionScaleSubtool() {
  }

  std::string category() {
    return "collision_move";
  }

  std::string name() {
    return "scale-rotate";
  }

  void onReset() {
    isGestureStarted = false;
    handle = std::nullopt;
  }

  void onTouch(DrawSubtoolTouch &touch) {
    if (!isGestureStarted) {
      isGestureStarted = true;

      initialCoord.x = touch.touchX;
      initialCoord.y = touch.touchY;

      if (shapeIndex >= 0) {
        float handleTouchRadius = HANDLE_TOUCH_RADIUS * drawTool.getPixelScale();
        auto scaleRotateShape = drawTool.getPhysicsBodyData().getShapeAtIndex(shapeIndex);
        if (scaleRotateShape) {
          SmallVector<PhysicsBodyDataHandle, 4> handles;
          drawTool.getPhysicsBodyData().getHandlesForShape(*scaleRotateShape, handles);
          for (int i = 0; i < handles.size(); i++) {
            float distance = sqrtf(
                powf(touch.touchX - handles[i].x, 2.0) + powf(touch.touchY - handles[i].y, 2.0));
            if (distance < handleTouchRadius) {
              handle = handles[i];

              if (scaleRotateShape->type == CollisionShapeType::Triangle) {
                otherPoints.clear();
                for (int j = 0; j < handles.size(); j++) {
                  if (j != i) {
                    otherPoints.push_back(love::Vector2(handles[j].x, handles[j].y));
                  }
                }
              }

              break;
            }
          }
        } else {
          shapeIndex = -1;
        }
      }

      // only allow choosing a new shape if we didn't find a handle
      if (!handle) {
        shapeIndex = drawTool.getPhysicsBodyData().getShapeIdxAtPoint(initialCoord);
      }
    }

    if (shapeIndex >= 0 && handle) {
      love::Vector2 otherCoord(handle->oppositeX, handle->oppositeY);

      auto scaleRotateShape = drawTool.getPhysicsBodyData().getShapeAtIndex(shapeIndex);
      if (scaleRotateShape) {
        std::optional<PhysicsBodyDataShape> shape;
        love::Vector2 roundedCoord(touch.roundedX, touch.roundedY);

        switch (scaleRotateShape->type) {
        case CollisionShapeType::Rectangle: {
          shape = drawTool.getPhysicsBodyData().getRectangleShape(otherCoord, roundedCoord);
          break;
        }
        case CollisionShapeType::Circle: {
          int roundDx = love::DrawAlgorithms::floatUnit(handle->oppositeX - touch.touchX);
          int roundDy = love::DrawAlgorithms::floatUnit(handle->oppositeY - touch.touchY);

          shape = drawTool.getPhysicsBodyData().getCircleShape(
              otherCoord, roundedCoord, &drawTool.getDrawData(), roundDx, roundDy);
          break;
        }
        case CollisionShapeType::Triangle: {
          shape = drawTool.getPhysicsBodyData().getTriangleShape(
              roundedCoord, otherPoints[0], otherPoints[1]);
          break;
        }
        }

        if (shape) {
          drawTool.getPhysicsBodyData().updateShapeAtIdx(shapeIndex, *shape);
        }
      }
    }

    if (touch.touch.released) {
      if (handle) {
        drawTool.saveDrawing("scale");
      }

      isGestureStarted = false;
      handle = std::nullopt;
    }
  }

  void drawOverlay(Lv &lv) {
    lv.graphics.setColor({ 1, 0, 0, 1 });
    lv.graphics.setPointSize(30.0);

    if (shapeIndex < 0 || shapeIndex >= drawTool.getPhysicsBodyData().getNumShapes()) {
      shapeIndex = drawTool.getPhysicsBodyData().getNumShapes() - 1;
    }

    auto scaleRotateShape = drawTool.getPhysicsBodyData().getShapeAtIndex(shapeIndex);
    if (scaleRotateShape) {
      SmallVector<PhysicsBodyDataHandle, 4> handles;
      drawTool.getPhysicsBodyData().getHandlesForShape(*scaleRotateShape, handles);
      for (int i = 0; i < handles.size(); i++) {
        lv.graphics.circle(love::Graphics::DrawMode::DRAW_FILL, handles[i].x, handles[i].y,
            HANDLE_DRAW_RADIUS * drawTool.getPixelScale());
      }
    }
  }

private:
  int shapeIndex = 0;
  std::optional<PhysicsBodyDataHandle> handle;
  std::vector<love::Vector2> otherPoints;
  love::Vector2 initialCoord;
  bool isGestureStarted = false;
};
