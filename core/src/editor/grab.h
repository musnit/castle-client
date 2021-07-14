#pragma once

#include "precomp.h"
#include "props.h"

#include "lv.h"

class Editor;

class GrabTool {
public:
  GrabTool(const GrabTool &) = delete; // Prevent accidental copies
  const GrabTool &operator=(const GrabTool &) = delete;

  explicit GrabTool(Editor &editor_);

  void update(double dt);
  void drawOverlay() const;

  struct Props {
    PROP(bool, gridEnabled) = true;
    PROP(float, gridSize) = 0.25;
  } props;

  void changeSettings(std::string action, double value);

private:
  Lv &lv { Lv::getInstance() };

  Editor &editor;
};
