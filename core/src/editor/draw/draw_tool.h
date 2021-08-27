#pragma once

#include "precomp.h"
#include "props.h"

#include "lv.h"
#include "subtools/draw_subtool_interface.h"
#include "editor/draw/physics_body_data.h"
#include "../gesture_pan_zoom.h"

class Editor;

#define DRAW_DEFAULT_VIEW_WIDTH 10.0f
#define DRAW_MIN_VIEW_WIDTH 1.0f
#define DRAW_MAX_VIEW_WIDTH 25.0f

class DrawTool {
public:
  std::shared_ptr<love::DrawData> drawData;
  std::shared_ptr<PhysicsBodyData> physicsBodyData;

  DrawTool(const DrawTool &) = delete; // Prevent accidental copies
  const DrawTool &operator=(const DrawTool &) = delete;

  explicit DrawTool(Editor &editor_);
  ~DrawTool();

  void resetState();
  void onSetActive();
  void update(double dt);
  void drawOverlay();

  void sendDrawToolEvent();
  void sendLayersEvent();

  // Subtool functions
  void resetTempGraphics();
  void clearTempGraphics();
  void addTempPathData(love::PathData pathData);
  void setTempTranslation(float x, float y);
  float getPixelScale();

  void addPathData(const std::shared_ptr<love::PathData> &pathData);
  void addPathData(love::PathData pathData);
  void saveDrawing(std::string commandDescription);

  love::DrawData &getDrawData();
  love::DrawDataFrame &getDrawDataFrame();
  PhysicsBodyData &getPhysicsBodyData();
  float getZoomAmount();

private:
  friend struct DrawToolSelectSubtoolReceiver;
  friend struct DrawToolSelectColorReceiver;
  friend struct DrawToolLayerActionReceiver;
  friend struct DrawToolClearArtworkReceiver;
  friend struct DrawToolClearCollisionShapesReceiver;

  bool isDrawToolEventDirty = false;
  bool didBecomeActive = false;
  float tempTranslateX = 0;
  float tempTranslateY = 0;

  Lv &lv { Lv::getInstance() };

  Editor &editor;

  std::unordered_map<std::string, std::string> selectedSubtools;
  std::string lastHash;
  mutable love::Transform viewTransform;
  float viewWidth = DRAW_DEFAULT_VIEW_WIDTH;
  love::Vector2 viewPosition;

  std::vector<std::unique_ptr<DrawSubtool>> subtools;
  bool isPlayingAnimation = false;
  std::shared_ptr<love::ToveGraphicsHolder> tempGraphics;

  DrawSubtool &getCurrentSubtool();
  GesturePanZoom panZoom {
    DRAW_MIN_VIEW_WIDTH,
    DRAW_MAX_VIEW_WIDTH,
    { -DRAW_MAX_SIZE, -DRAW_MAX_SIZE },
    { DRAW_MAX_SIZE, DRAW_MAX_SIZE },
  };

  void makeNewLayer();
  void deleteLayerAndValidate(const love::DrawDataLayerId &layerId);

  // for 'copy cell'
  love::DrawDataLayerId copiedLayerId;
  love::OneIndexFrame copiedFrameIndex;

  bool isCollisionVisible = true;
  bool isOnionSkinningEnabled = false;
  love::graphics::Canvas *onionSkinningCanvas = nullptr;
  void makeOnionSkinningCanvas();
  void renderOnionSkinning();

  void loadLastSave();
  void fitViewWidth();
};

inline love::DrawData &DrawTool::getDrawData() {
  return *drawData;
}

inline love::DrawDataFrame &DrawTool::getDrawDataFrame() {
  return *drawData->currentLayerFrame();
}

inline PhysicsBodyData &DrawTool::getPhysicsBodyData() {
  return *physicsBodyData;
}
