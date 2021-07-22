#pragma once

#include "precomp.h"
#include "props.h"

#include "lv.h"


class Editor;

class Belt {
public:
  Belt(const Belt &) = delete; // Prevent accidental copies
  const Belt &operator=(const Belt &) = delete;

  explicit Belt(Editor &editor_);

  void update(double dt);
  void drawOverlay() const;


private:
  Lv &lv { Lv::getInstance() };

  Editor &editor;

  float height = 0;
  float top = 0;
  float cursorX = 0;
  float elemSize = 0;
};
