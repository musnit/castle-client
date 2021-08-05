#pragma once

#include "precomp.h"
#include "gesture.h"
#include "lv.h"

class DrawTool;

class DrawSubtoolTouch {
public:
  DrawSubtoolTouch(const Touch &touch_)
      : touch(touch_) {
  }

  const Touch &touch;
  float touchX;
  float touchY;
  float roundedX;
  float roundedY;
  float clampedX;
  float clampedY;
};

class DrawSubtool {
public:
  explicit DrawSubtool(DrawTool &drawTool_)
      : drawTool(drawTool_) {
  }
  virtual ~DrawSubtool() {
  }

  virtual std::string category() = 0;
  virtual std::string name() = 0;
  virtual void onReset() = 0;
  virtual void onTouch(DrawSubtoolTouch &touch) = 0;
  virtual void drawOverlay(Lv &lv) = 0;

  bool hasTouch = false;

protected:
  DrawTool &drawTool;
};
