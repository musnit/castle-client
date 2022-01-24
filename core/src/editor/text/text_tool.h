#pragma once

#include "precomp.h"
#include "lv.h"

class Editor;

class TextTool {
public:
  TextTool(const TextTool &) = delete; // Prevent accidental copies
  const TextTool &operator=(const TextTool &) = delete;

  explicit TextTool(Editor &editor_);

  void resetState();
  void onSetActive();
  void drawOverlay();

private:
  Lv &lv { Lv::getInstance() };
  Editor &editor;
};
