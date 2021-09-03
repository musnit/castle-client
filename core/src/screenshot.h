#pragma once

#include "precomp.h"
#include "scene.h"

class Screenshot {
public:
  Screenshot(const Screenshot &) = delete;
  const Screenshot &operator=(const Screenshot &) = delete;
  explicit Screenshot(int width);
  ~Screenshot();

  std::string getBase64Screenshot(Scene *scene);

private:
  Lv &lv { Lv::getInstance() };
  SceneDrawingOptions drawingOptions;
  love::graphics::Canvas *canvas = nullptr;
};
