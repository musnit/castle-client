#pragma once

#include "precomp.h"
#include "props.h"

#include "lv.h"

class Editor;

class DrawTool {
public:
  DrawTool(const DrawTool &) = delete; // Prevent accidental copies
  const DrawTool &operator=(const DrawTool &) = delete;

  explicit DrawTool(Editor &editor_);

  void update(double dt);
  void drawOverlay() const;

  void sendDrawToolEvent();

private:
  friend struct DrawToolSelectSubtoolReceiver;

  bool isDrawToolEventDirty;

  Lv &lv { Lv::getInstance() };

  Editor &editor;

  std::unordered_map<std::string, std::string> selectedSubtools;
  std::string lastHash;
  std::shared_ptr<love::DrawData> drawData;
  mutable love::Transform viewTransform;
  float viewWidth;
  float viewX;
  float viewY;
};
