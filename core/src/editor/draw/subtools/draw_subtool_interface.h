#pragma once

#include "precomp.h"
#include "gesture.h"
#include "lv.h"

class DrawTool;

class DrawSubtoolTouch {
public:
  explicit DrawSubtoolTouch(const Touch &touch_)
      : touch(touch_) {
  }

  const Touch &touch;
  float touchX = 0;
  float touchY = 0;
  float roundedX = 0;
  float roundedY = 0;
  float clampedX = 0;
  float clampedY = 0;
};

class DrawSubtool {
public:
  explicit DrawSubtool(DrawTool &drawTool_)
      : drawTool(drawTool_) {
  }
  virtual ~DrawSubtool() = default;

  virtual std::string category() = 0;
  virtual std::string name() = 0;
  virtual void onReset() = 0;
  virtual void onTouch(DrawSubtoolTouch &touch) = 0;
  virtual void drawOverlay(Lv &lv) = 0;

  bool hasTouch = false;

protected:
  DrawTool &drawTool;
};
