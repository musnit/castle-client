#pragma once

#include "precomp.h"
#include "lv.h"
#include "sound/pattern.h"

class Editor;

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
};

inline void SoundTool::setPattern(Pattern *pattern_) {
  pattern = std::shared_ptr<Pattern>(pattern_);
}

inline bool SoundTool::hasPattern() {
  return pattern != nullptr;
}
