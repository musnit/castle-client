#pragma once

#include "precomp.h"

#include "selection.h"

class Editor;

class GrabTool {
  // Tool that lets actors be moved around with touches and drags

public:
  GrabTool(const GrabTool &) = delete; // Prevent accidental copies
  const GrabTool &operator=(const GrabTool &) = delete;

  explicit GrabTool(Selection &selection_);

  void update(Editor &editor, Scene &scene, double dt);
  void drawOverlay(Scene &scene) const;

private:
  Selection &selection;

  bool gridEnabled = true;
  float gridSize = 0.25;
};
