#pragma once

#include "precomp.h"
#include "props.h"

#include "lv.h"

class Editor;

class ScaleRotateTool {
public:
  ScaleRotateTool(const ScaleRotateTool &) = delete; // Prevent accidental copies
  const ScaleRotateTool &operator=(const ScaleRotateTool &) = delete;

  explicit ScaleRotateTool(Editor &editor_);

  void update(double dt);
  void drawOverlay() const;

  struct Props {
    PROP(bool, gridEnabled) = true;
    PROP(float, gridSize) = 0.5;
    PROP(bool, rotateIncrementEnabled) = true;
    PROP(float, rotateIncrementDegrees) = 5;
  } props;

  void changeSettings(const std::string &action, double value);

private:
  Lv &lv { Lv::getInstance() };

  Editor &editor;
};
