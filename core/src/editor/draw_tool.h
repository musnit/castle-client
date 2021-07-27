#pragma once

#include "precomp.h"
#include "props.h"

#include "lv.h"
#include "draw_subtools/draw_subtool_interface.h"

class Editor;

class DrawTool {
public:
  std::shared_ptr<love::DrawData> drawData;

  DrawTool(const DrawTool &) = delete; // Prevent accidental copies
  const DrawTool &operator=(const DrawTool &) = delete;

  explicit DrawTool(Editor &editor_);

  void resetState();
  void update(double dt);
  void drawOverlay();

  void sendDrawToolEvent();

  // Subtool functions
  void resetTempGraphics();
  void clearTempGraphics();
  void addTempPathData(love::PathData *pathData);
  love::DrawDataFrame *drawDataFrame();
  void saveDrawing(std::string commandDescription);

  love::DrawData &getDrawData();

private:
  friend struct DrawToolSelectSubtoolReceiver;
  friend struct DrawToolSelectColorReceiver;

  bool isDrawToolEventDirty;

  Lv &lv { Lv::getInstance() };

  Editor &editor;

  std::unordered_map<std::string, std::string> selectedSubtools;
  std::string lastHash;
  mutable love::Transform viewTransform;
  float viewWidth;
  float viewX;
  float viewY;
  love::Colorf color;
  std::vector<std::unique_ptr<DrawSubtool>> subtools;
  bool isPlayingAnimation;
  std::unique_ptr<love::ToveGraphicsHolder> tempGraphics;

  DrawSubtool &getCurrentSubtool();
};

inline love::DrawData &DrawTool::getDrawData() {
  return *drawData;
}
