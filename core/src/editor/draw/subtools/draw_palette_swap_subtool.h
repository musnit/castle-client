#pragma once

#include "precomp.h"
#include "draw_subtool_interface.h"
#include "editor/draw/util.h"
#include "editor/draw/image_processing.h"

class DrawPaletteSwapSubtool : public DrawSubtool {
public:
  explicit DrawPaletteSwapSubtool(DrawTool &drawTool_, bool isBitmap_)
      : DrawSubtool(drawTool_)
      , isBitmap(isBitmap_) {
  }
  ~DrawPaletteSwapSubtool() {
  }

  std::string category() {
    if (isBitmap) {
      return "bitmap_fill";
    } else {
      return "artwork_fill";
    }
  }

  std::string name() {
    return "palette_swap";
  }

  void onReset() {
    didChange = false;
  }

  float getRadius() {
    return 0.25f * drawTool.getZoomAmount();
  }

  void onTouch(DrawSubtoolTouch &touch) {
    if (!didChange) { // don't allow drag, only swap one color per gesture
      auto &frame = drawTool.getDrawDataFrame();
      love::Colorf colorToReplace;
      bool hasColor
          = DrawUtil::pickColor(frame, touch.touchX, touch.touchY, getRadius(), colorToReplace);

      bool filledPath = false, swappedPixels = false;
      if (hasColor) {
        // swap path colors
        auto &pathDataList = frame.pathDataList;
        if (!isBitmap) {
          for (auto &pathData : pathDataList) {
            if (love::DrawAlgorithms::colorsEqual(pathData->color, colorToReplace)) {
              pathData->clearTovePath();
              pathData->color = drawTool.selectedColor;
              filledPath = true;
            }
          }
        }
        // swap fill
        auto fillImageData = frame.fillImageData;
        if (fillImageData) {
          int numSwapped
              = ImageProcessing::paletteSwap(fillImageData, colorToReplace, drawTool.selectedColor);
          swappedPixels = numSwapped > 0;
        }
      }

      if (filledPath) {
        frame.resetGraphics();
      }
      if (swappedPixels) {
        frame.compressFillCanvas();
        frame.updateFillImageWithFillImageData();
      }
      didChange = filledPath || swappedPixels;
    }

    if (touch.touch.released) {
      if (didChange) {
        drawTool.saveDrawing("swap colors");
      }
      didChange = false;
    }
  }

  void drawOverlay(Lv &lv) {
  }

private:
  bool isBitmap = false;
  bool didChange = false;
};
