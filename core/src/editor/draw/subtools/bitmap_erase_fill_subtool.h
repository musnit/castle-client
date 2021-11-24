#pragma once

#include "precomp.h"
#include "draw_subtool_interface.h"

class BitmapEraseFillSubtool : public DrawSubtool {
public:
  explicit BitmapEraseFillSubtool(DrawTool &drawTool_)
      : DrawSubtool(drawTool_) {
  }

  ~BitmapEraseFillSubtool() {
  }

  std::string category() {
    return "bitmap_erase";
  }

  std::string name() {
    return "erase_fill";
  }

  float getRadius() {
    return 0.25f * drawTool.getZoomAmount();
  }

  void onReset() {
    didChange = false;
  }

  void onTouch(DrawSubtoolTouch &touch) {
    if (drawTool.getDrawDataFrame().floodClear(touch.touchX, touch.touchY, getRadius())) {
      didChange = true;
    }

    if (touch.touch.released) {
      if (didChange) {
        drawTool.getDrawDataFrame().resetFill();
        drawTool.saveDrawing("erase fill");
      }
    }
  }

  void drawOverlay(Lv &lv) {
  }

private:
  bool didChange = false;
};
