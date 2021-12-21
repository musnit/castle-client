#pragma once

#include "precomp.h"
#include "lv.h"
#include "editor/grid.h"
#include "sound/pattern.h"

class Editor;

#define SOUND_DEFAULT_VIEW_WIDTH 10.0f

class SoundTool {
public:
  SoundTool(const SoundTool &) = delete; // Prevent accidental copies
  const SoundTool &operator=(const SoundTool &) = delete;

  explicit SoundTool(Editor &editor_);

  void resetState();
  void onSetActive();
  void update(double dt);
  void drawOverlay();

  // TODO: extend to support songs
  void setPattern(Pattern *pattern);
  bool hasPattern();

private:
  Lv &lv { Lv::getInstance() };
  Editor &editor;

  std::shared_ptr<Pattern> pattern;

  // for pattern editing
  float gridCellSize = 1.0f;
  Grid grid;
  void drawGrid(float viewScale);
  void drawPattern();
  mutable love::Transform viewTransform;
};

inline void SoundTool::setPattern(Pattern *pattern_) {
  pattern = std::shared_ptr<Pattern>(pattern_);
}

inline bool SoundTool::hasPattern() {
  return pattern != nullptr;
}
