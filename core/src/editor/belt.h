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

  bool firstFrame = true;

  float height = 0;
  float top = 0, bottom = 0;
  float elemSize = 0;

  float cursorX = 0;
  float cursorVX = 0;

  SmallVector<float, 5> dragVXs;

  struct TouchData {
    // Extra data we add to touches
    bool neverPlace = false; // Whether to never allow placing actors from this touch
  };


  float getElementX(int index) const;
};
