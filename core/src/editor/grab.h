#pragma once

#include "precomp.h"

#include "lv.h"


class Editor;

class GrabTool {
public:
  GrabTool(const GrabTool &) = delete; // Prevent accidental copies
  const GrabTool &operator=(const GrabTool &) = delete;

  explicit GrabTool(Editor &editor_);

  void update(double dt);
  void drawOverlay() const;


private:
  Lv &lv { Lv::getInstance() };

  Editor &editor;

  bool gridEnabled = true;
  float gridSize = 0.25;
};
