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


  struct ScaleHandle {
    enum Type { Corner, Width, Height } type = Corner;
    love::Vector2 pos;
  };
  struct RotateHandle {
    love::Vector2 pos;
    love::Vector2 pivot;
  };
  struct Handles {
    std::array<ScaleHandle, 8> scale;
    RotateHandle rotate;
    float drawRadius = 1;
  };
  std::optional<Handles> getHandles() const;
};
