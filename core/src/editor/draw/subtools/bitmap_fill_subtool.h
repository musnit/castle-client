#pragma once

#include "precomp.h"
#include "draw_subtool_interface.h"

class BitmapFillSubtool : public DrawSubtool {
public:
  explicit BitmapFillSubtool(DrawTool &drawTool_)
      : DrawSubtool(drawTool_) {
  }
  ~BitmapFillSubtool() {
  }

  std::string category() {
    return "bitmap_fill";
  }

  std::string name() {
    return "flood_fill";
  }

  void onReset() {
    didChange = false;
  }

  void onTouch(DrawSubtoolTouch &touch) {
    if (drawTool.getDrawDataFrame().floodFill(touch.touchX, touch.touchY, drawTool.selectedColor)) {
      didChange = true;
    }

    if (touch.touch.released) {
      if (didChange) {
        drawTool.saveDrawing("fill");
      }
      didChange = false;
    }
  }

  void drawOverlay(Lv &lv) {
  }

private:
  bool didChange = false;
};
