#pragma once

#include "precomp.h"
#include "draw_subtool_interface.h"
#include "editor/draw/util.h"
#include "editor/draw/image_processing.h"

class DrawEyedropperSubtool : public DrawSubtool {
public:
  explicit DrawEyedropperSubtool(DrawTool &drawTool_, bool isBitmap_)
      : DrawSubtool(drawTool_)
      , isBitmap(isBitmap_) {
  }
  ~DrawEyedropperSubtool() {
  }

  std::string category() {
    if (isBitmap) {
      return "bitmap";
    } else {
      return "artwork";
    }
  }

  std::string name() {
    return "eyedropper";
  }

  void onReset() {
  }

  float getRadius() {
    return 0.25f * drawTool.getZoomAmount();
  }

  void onTouch(DrawSubtoolTouch &touch) {
    lastTouchCoord.x = touch.touchX;
    lastTouchCoord.y = touch.touchY;
    if (touch.touch.pressed) {
      // save the previous color for comparison
      initialColor = drawTool.selectedColor;
    }

    bool hasColor = DrawUtil::pickColor(
        drawTool.getDrawDataFrame(), touch.touchX, touch.touchY, getRadius(), newColor);
    if (hasColor) {
      drawTool.selectedColor = newColor;
    }
  }

  void drawOverlay(Lv &lv) {
    if (hasTouch) {
      lv.graphics.push(love::Graphics::STACK_ALL);
      auto radius = getRadius() * 2.0f;
      lv.graphics.setLineWidth(0.2f * drawTool.getZoomAmount());

      // draw big circle of new color under our touch
      lv.graphics.setColor(newColor);
      lv.graphics.circle(love::Graphics::DrawMode::DRAW_LINE, lastTouchCoord.x, lastTouchCoord.y,
          radius + 0.2f * drawTool.getZoomAmount());

      // draw slightly smaller circle of initial color for comparison
      lv.graphics.setColor(initialColor);
      lv.graphics.circle(
          love::Graphics::DrawMode::DRAW_LINE, lastTouchCoord.x, lastTouchCoord.y, radius);
      lv.graphics.pop();
    }
  }

private:
  love::Vector2 lastTouchCoord;
  love::Colorf initialColor;
  love::Colorf newColor;
  bool isBitmap = false;
};
