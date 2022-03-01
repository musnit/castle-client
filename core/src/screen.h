#pragma once

#include "scene.h"

class Screen {
  virtual void update(double dt) = 0;
  virtual void draw() = 0;
  virtual void suspend() = 0;
  virtual void resume() = 0;
  virtual void clearState() = 0;
  virtual bool hasScene() = 0;
  virtual Scene &getScene() = 0;
};
