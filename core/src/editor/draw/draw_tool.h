#pragma once

#include "precomp.h"
#include "props.h"

#include "lv.h"
#include "subtools/draw_subtool_interface.h"
#include "editor/draw/physics_body_data.h"
#include "editor/grid.h"
#include "../gesture_pan_zoom.h"
#include "image_importer.h"

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
  bool isViewInContextEnabled();
  void setIsPlayingAnimation(bool isPlayingAnimation);
  bool getIsPlayingAnimation();
  int getCurrentAnimationFrame();

  love::Colorf selectedColor;
  love::DrawDataLayerId selectedLayerId;
  love::OneIndexFrame selectedFrameIndex;
  void validateSelection();

  love::PathDataList *selectedFramePathDataList();
  void dirtySelectedFrameBounds();

private:
  friend struct DrawToolSelectSubtoolReceiver;
  friend struct DrawToolSelectColorReceiver;
  friend struct DrawToolLayerActionReceiver;
  friend struct DrawToolClearArtworkReceiver;
  friend struct DrawToolClearCollisionShapesReceiver;
  friend struct DrawToolViewInContextReceiver;
  friend struct DrawToolTmpGridSettingsReceiver;

  bool isDrawToolEventDirty = false;
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
  love::AnimationState animationState;
  love::AnimationComponentProperties animationProperties;
  std::shared_ptr<love::ToveGraphicsHolder> tempGraphics;

  DrawSubtool &getCurrentSubtool();
  GesturePanZoom panZoom {
    DRAW_MIN_VIEW_WIDTH,
    DRAW_MAX_VIEW_WIDTH,
    { -DRAW_MAX_SIZE, -DRAW_MAX_SIZE },
    { DRAW_MAX_SIZE, DRAW_MAX_SIZE },
  };
  Grid grid;
  void drawGrid(float windowWidth, float topOffset);

  void makeNewLayer();
  void deleteLayerAndValidate(const love::DrawDataLayerId &layerId);

  // for 'copy cell'
  std::string copiedFrameData;

  bool isCollisionVisible = true;
  bool viewInContext = false;
  bool isOnionSkinningEnabled = false;
  love::graphics::Canvas *onionSkinningCanvas = nullptr;
  void makeOnionSkinningCanvas();
  void renderOnionSkinning();
  void selectFirstLayerAndFrame();

  void loadLastSave();
  void fitViewWidth();

  // TODO: delete these: for grid color testing
  love::Colorf tmpBackgroundColor { 0.73, 0.73, 0.73, 1 };
  love::Colorf tmpGridColor { 0, 0, 0, 1 };
  love::Colorf tmpAxisColor { 1, 1, 1, 1 };
  float tmpGridDotRadius = 4;
  bool tmpIsGridForeground = false;

  ImageImporter imageImporter;
};

inline love::DrawData &DrawTool::getDrawData() {
  return *drawData;
}

inline love::DrawDataFrame &DrawTool::getDrawDataFrame() {
  return *(drawData->layerForId(selectedLayerId)->frames[selectedFrameIndex.toZeroIndex()]);
}

inline PhysicsBodyData &DrawTool::getPhysicsBodyData() {
  return *physicsBodyData;
}

inline bool DrawTool::isViewInContextEnabled() {
  return viewInContext;
}

inline bool DrawTool::getIsPlayingAnimation() {
  return isPlayingAnimation;
}

inline int DrawTool::getCurrentAnimationFrame() {
  return animationProperties.currentFrame.toZeroIndex();
}
