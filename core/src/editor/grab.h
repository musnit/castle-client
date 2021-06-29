#pragma once

#include "precomp.h"

#include "selection.h"


class Editor;

class GrabTool {
public:
  GrabTool(const GrabTool &) = delete; // Prevent accidental copies
  const GrabTool &operator=(const GrabTool &) = delete;

  explicit GrabTool(Editor &editor_, Selection &selection_);

  void update(Scene &scene, double dt);
  void drawOverlay(Scene &scene) const;


private:
  Lv &lv { Lv::getInstance() };

  Editor &editor;
  Selection &selection;

  bool gridEnabled = true;
  float gridSize = 0.25;
};
