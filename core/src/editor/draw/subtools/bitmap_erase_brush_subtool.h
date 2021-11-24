#pragma once

#include "precomp.h"
#include "draw_subtool_interface.h"

class BitmapEraseBrushSubtool : public DrawSubtool {
public:
  enum class Size {
    Small,
    Medium,
    Large,
  };

  explicit BitmapEraseBrushSubtool(DrawTool &drawTool_, Size size_)
      : DrawSubtool(drawTool_) {
    size = size_;
  }

  ~BitmapEraseBrushSubtool() {
  }

  std::string category() {
    return "bitmap_erase";
  }

  std::string name() {
    switch (size) {
    case Size::Small:
      return "erase_brush_small";
    case Size::Medium:
      return "erase_brush_medium";
    case Size::Large:
      return "erase_brush_large";
    }
  }

  float getRadius() {
    float radius;
    switch (size) {
    case Size::Small:
      radius = 0.5f;
      break;
    case Size::Medium:
      radius = 1.0f;
      break;
    case Size::Large:
      radius = 2.0f;
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

    auto &frame = drawTool.getDrawDataFrame();
    if (frame.fillImageData && frame.parentLayer()->isBitmap) {
      auto fillPixelsPerUnit = frame.parentLayer()->parent()->fillPixelsPerUnit;
      auto eraseX = floor(touch.touchX * fillPixelsPerUnit) - frame.fillImageBounds.minX,
           eraseY = floor(touch.touchY * fillPixelsPerUnit) - frame.fillImageBounds.minY,
           eraseRadius = floor(getRadius() * fillPixelsPerUnit);
      int pixelCount = 0;

      love::image::Pixel zero;
      memset(&zero, 0, frame.fillImageData->getPixelSize());
      love::ghost::Point eraseCenter(eraseX, eraseY);
      for (auto y = eraseCenter.y - eraseRadius; y < eraseCenter.y + eraseRadius; y++) {
        for (auto x = eraseCenter.x - eraseRadius; x < eraseCenter.x + eraseRadius; x++) {
          if (frame.fillImageData->inside(x, y)) {
            love::ghost::Point point(x, y);
            if (eraseCenter.distance(point) <= eraseRadius) {
              pixelCount++;
              frame.fillImageData->setPixel(x, y, zero);
            }
          }
        }
      }

      didChange = didChange || pixelCount > 0;
    }

    if (touch.touch.released) {
      if (didChange) {
        drawTool.getDrawDataFrame().resetFill();
        drawTool.saveDrawing("erase");
      }
    } else {
      if (didChange) {
        drawTool.getDrawDataFrame().updateFillImageWithFillImageData();
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
  bool didChange = false;
  love::Vector2 lastTouchCoord;
};
