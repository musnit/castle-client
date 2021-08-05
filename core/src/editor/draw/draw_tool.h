#pragma once

#include "precomp.h"
#include "props.h"

#include "lv.h"
#include "subtools/draw_subtool_interface.h"
#include "editor/draw/physics_body_data.h"
#include "../gesture_pan_zoom.h"

class Editor;

#define DRAW_DEFAULT_VIEW_WIDTH 10.0
#define DRAW_MIN_VIEW_WIDTH 1.0
#define DRAW_MAX_VIEW_WIDTH 25.0

class DrawTool {
public:
  std::shared_ptr<love::DrawData> drawData;
  std::shared_ptr<PhysicsBodyData> physicsBodyData;

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
  void addTempPathData(love::PathData pathData);
  void addTempPathData(love::PathData *pathData);
  void addTempPathData(std::shared_ptr<love::PathData> pathData);
  void addPathData(std::shared_ptr<love::PathData> pathData);
  void addPathData(love::PathData pathData);
  void saveDrawing(std::string commandDescription);

  love::DrawData &getDrawData();
  love::DrawDataFrame &getDrawDataFrame();
  float getZoomAmount();

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
  love::Vector2 viewPosition;

  love::Colorf color;
  std::vector<std::unique_ptr<DrawSubtool>> subtools;
  bool isPlayingAnimation;
  std::unique_ptr<love::ToveGraphicsHolder> tempGraphics;

  DrawSubtool &getCurrentSubtool();
  GesturePanZoom panZoom;
};

inline love::DrawData &DrawTool::getDrawData() {
  return *drawData;
}

inline love::DrawDataFrame &DrawTool::getDrawDataFrame() {
  return *drawData->currentLayerFrame();
}
