#pragma once

#include "precomp.h"
#include "gesture.h"
#include "lv.h"

class SoundTool;

class SoundSubtoolTouch {
public:
  explicit SoundSubtoolTouch(const Touch &touch_)
      : touch(touch_) {
  }

  const Touch &touch;

  float touchX = 0;
  float touchY = 0;

  double step = 0; // x axis is time (double)
  float key = 0; // whatever this tool represents in y-space
};

class SoundSubtool {
public:
  explicit SoundSubtool(SoundTool &soundTool_)
      : soundTool(soundTool_) {
  }
  virtual ~SoundSubtool() = default;

  virtual std::string category() = 0;
  virtual std::string name() = 0;
  virtual void onReset() = 0;
  virtual void onTouch(SoundSubtoolTouch &touch) = 0;
  virtual void drawOverlay(Lv &lv) = 0;
  virtual bool highlightAxis() = 0;
  virtual int highlightAxisKey() = 0;

protected:
  SoundTool &soundTool;
};
