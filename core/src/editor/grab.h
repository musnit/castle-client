#pragma once

#include "precomp.h"

#include "lv.h"
#include "props.h"
#include "gesture.h"

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

  void changeSettings(const std::string &action, double value);

  inline static const TouchToken touchToken;

private:
  Lv &lv { Lv::getInstance() };

  Editor &editor;
};
