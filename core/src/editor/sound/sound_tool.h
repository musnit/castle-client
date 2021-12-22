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
  void setPattern(Pattern &pattern);
  bool hasPattern();

  std::string sessionId; // used to pass data back to the correct place in editor frontend
  void sendPatternEvent();
  void sendSceneMusicData();

private:
  Lv &lv { Lv::getInstance() };
  Editor &editor;

  Pattern *pattern;

  // for pattern editing
  float gridCellSize = 1.0f;
  Grid grid;
  void drawGrid(float viewScale);
  void drawPattern();
  mutable love::Transform viewTransform;
};

inline void SoundTool::setPattern(Pattern &pattern_) {
  // editing in place for now w/o ownership - do something smarter when we support songs
  pattern = &pattern_;
}

inline bool SoundTool::hasPattern() {
  return pattern != nullptr;
}
