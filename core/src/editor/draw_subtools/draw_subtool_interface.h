#pragma once

#include "precomp.h"
#include "gesture.h"

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
  virtual std::string category() = 0;
  virtual std::string name() = 0;
  virtual void onReset() = 0;
  virtual void onTouch(DrawSubtoolTouch &touch) = 0;


  void setDrawTool(DrawTool *drawTool_) {
    drawTool = drawTool_;
  }
  bool hasTouch;

protected:
  DrawTool *drawTool;
};
