#include "draw_tool.h"

#include "archive.h"
#include "behaviors/all.h"
#include "editor/editor.h"
#include "engine.h"

#include "subtools/draw_freehand_subtool.h"
#include "subtools/draw_line_subtool.h"
#include "subtools/draw_shape_subtool.h"
#include "subtools/draw_erase_subtool.h"
#include "subtools/draw_erase_segment_subtool.h"
#include "subtools/draw_fill_subtool.h"
#include "subtools/draw_move_all_subtool.h"
#include "subtools/draw_move_subtool.h"
#include "subtools/draw_bend_subtool.h"
#include "subtools/collision_shape_subtool.h"
#include "subtools/collision_erase_subtool.h"
#include "subtools/collision_move_all_subtool.h"
#include "subtools/collision_move_subtool.h"
#include "subtools/collision_scale_subtool.h"
#include "util.h"

//
// Events
//

struct DrawToolSelectSubtoolReceiver {
  inline static const BridgeRegistration<DrawToolSelectSubtoolReceiver> registration {
    "DRAW_TOOL_SELECT_SUBTOOL"
  };

  struct Params {
    PROP(std::string, category);
    PROP(std::string, name);
  } params;

  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    editor->drawTool.selectedSubtools[params.category()] = params.name();
    editor->drawTool.sendDrawToolEvent();
  }
};

struct DrawToolSelectColorReceiver {
  inline static const BridgeRegistration<DrawToolSelectColorReceiver> registration {
    "DRAW_TOOL_SELECT_COLOR"
  };

  struct Params {
    PROP(love::Colorf, color);
  } params;

  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    if (!editor)
      return;
    editor->drawTool.drawData->color = params.color();
    editor->drawTool.sendDrawToolEvent();
    editor->drawTool.saveDrawing("update color");
  }
};

struct DrawToolViewInContextReceiver {
  inline static const BridgeRegistration<DrawToolViewInContextReceiver> registration {
    "DRAW_TOOL_VIEW_IN_CONTEXT"
  };

  struct Params {
    PROP(bool, enabled) = false;
  } params;

  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    if (!editor)
      return;
    editor->drawTool.viewInContext = params.enabled();
  }
};

struct DrawToolEvent {
  PROP((std::unordered_map<std::string, std::string>), selectedSubtools);
  PROP(love::Colorf, color);
};

void DrawTool::sendDrawToolEvent() {
  DrawToolEvent ev;

  for (auto &entry : selectedSubtools) {
    ev.selectedSubtools()[entry.first] = entry.second;
  }

  ev.color() = drawData->color;
  editor.getBridge().sendEvent("EDITOR_DRAW_TOOL", ev);
}

struct DrawLayersEvent {
  struct Frame {
    PROP(int, order);
    PROP(bool, isLinked);
    PROP(std::optional<std::string>, base64Png);
  };

  struct Layer {
    PROP(love::DrawDataLayerId, id);
    PROP(std::string, title);
    PROP(int, order);
    PROP(bool, isVisible);
    PROP((std::vector<Frame>), frames) {};
  };

  PROP(int, numFrames);
  PROP(love::DrawDataLayerId, selectedLayerId);
  PROP(int, selectedFrameIndex);
  PROP(bool, canPasteCell);
  PROP(bool, isOnionSkinningEnabled);
  PROP((std::vector<Layer>), layers);

  PROP(std::optional<std::string>, collisionBase64Png);
  PROP(bool, isCollisionVisible);
};

void DrawTool::sendLayersEvent() {
  if (!drawData) {
    return;
  }

  DrawLayersEvent ev;

  for (int ii = 0, nn = int(drawData->layers.size()); ii < nn; ii++) {
    auto &layer = drawData->layers[ii];
    DrawLayersEvent::Layer layerData { layer->id, layer->title, ii, layer->isVisible };

    for (int jj = 0, mm = int(layer->frames.size()); jj < mm; jj++) {
      auto &frame = layer->frames[jj];
      if (!frame->base64Png) {
        frame->base64Png = frame->renderPreviewPng(-1);
      }
      DrawLayersEvent::Frame frameData { jj, frame->isLinked, frame->base64Png };
      layerData.frames().push_back(frameData);
    }

    if (ii == 0) {
      ev.numFrames = layer->frames.size();
    }

    ev.layers().push_back(layerData);
  }

  ev.selectedLayerId = drawData->selectedLayerId;
  ev.selectedFrameIndex = drawData->selectedFrame.value;
  ev.canPasteCell = copiedLayerId != "" && copiedFrameIndex.value > 0;
  ev.isOnionSkinningEnabled = isOnionSkinningEnabled;

  if (!physicsBodyData->base64Png) {
    physicsBodyData->updatePreview();
  }
  ev.collisionBase64Png = physicsBodyData->base64Png;
  ev.isCollisionVisible = isCollisionVisible;

  editor.getBridge().sendEvent("EDITOR_DRAW_LAYERS", ev);
}

struct DrawToolLayerActionReceiver {
  inline static const BridgeRegistration<DrawToolLayerActionReceiver> registration {
    "DRAW_TOOL_LAYER_ACTION"
  };

  struct Params {
    PROP(love::DrawDataLayerId, layerId);
    PROP(int, frameIndex);
    PROP(std::string, action);
    PROP(double, doubleValue);
    PROP(std::string, stringValue);
  } params;

  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    if (!editor)
      return;

    auto &drawTool = editor->drawTool;
    if (!drawTool.drawData)
      return;

    auto action = params.action();
    if (action == "selectLayer") {
      // TODO: setIsPlayingAnimation(false)
      if (drawTool.drawData->selectedLayerId != params.layerId()) {
        drawTool.drawData->selectedLayerId = params.layerId();
        drawTool.saveDrawing("select layer");
      }
    } else if (action == "selectLayerAndFrame") {
      // TODO: setIsPlayingAnimation(false)
      if (drawTool.drawData->selectedLayerId != params.layerId()
          && drawTool.drawData->selectedFrame.value != params.frameIndex()) {
        drawTool.drawData->selectedLayerId = params.layerId();
        drawTool.drawData->selectedFrame.value = params.frameIndex();
        drawTool.saveDrawing("select cell");
      }
    } else if (action == "selectFrame") {
      // TODO: setIsPlayingAnimation(false)
      if (drawTool.drawData->selectedFrame.value != params.frameIndex()) {
        drawTool.drawData->selectedFrame.value = params.frameIndex();
        drawTool.saveDrawing("select frame");
      }
    } else if (action == "stepBackward") {
      auto newFrameIndex = drawTool.drawData->selectedFrame.value - 1;
      if (newFrameIndex < 1) {
        newFrameIndex = drawTool.drawData->getNumFrames();
      }
      drawTool.drawData->selectedFrame.value = newFrameIndex;
      drawTool.saveDrawing("step backward");
    } else if (action == "stepForward") {
      auto newFrameIndex = drawTool.drawData->selectedFrame.value + 1;
      if (newFrameIndex > drawTool.drawData->getNumFrames()) {
        newFrameIndex = 1;
      }
      drawTool.drawData->selectedFrame.value = newFrameIndex;
      drawTool.saveDrawing("step forward");
    } else if (action == "setLayerIsVisible") {
      auto layer = drawTool.drawData->layerForId(params.layerId());
      layer->isVisible = bool(params.doubleValue());
      drawTool.saveDrawing("set layer visibility");
    } else if (action == "setCollisionIsVisible") {
      drawTool.isCollisionVisible = bool(params.doubleValue());
      drawTool.sendLayersEvent();
    } else if (action == "addLayer") {
      drawTool.makeNewLayer();
      drawTool.saveDrawing("add layer");
    } else if (action == "deleteLayer") {
      drawTool.deleteLayerAndValidate(params.layerId());
      drawTool.saveDrawing("delete layer");
    } else if (action == "setLayerOrder") {
      drawTool.drawData->setLayerOrder(params.layerId(), int(params.doubleValue()));
      drawTool.saveDrawing("reorder layer");
    } else if (action == "addFrame") {
      auto frameIndexToAdd = params.frameIndex();
      if (frameIndexToAdd > 0) {
        love::OneIndexFrame index(frameIndexToAdd);
        drawTool.drawData->addFrame(index);
      } else {
        drawTool.drawData->addFrame();
      }
      drawTool.saveDrawing("add frame");
    } else if (action == "deleteFrame") {
      drawTool.drawData->deleteFrame(params.frameIndex());
      drawTool.saveDrawing("delete frame");
    } else if (action == "copyCell") {
      drawTool.copiedLayerId = params.layerId();
      drawTool.copiedFrameIndex = params.frameIndex();
      drawTool.sendLayersEvent();
    } else if (action == "pasteCell") {
      drawTool.drawData->copyCell(
          drawTool.copiedLayerId, drawTool.copiedFrameIndex, params.layerId(), params.frameIndex());
      drawTool.saveDrawing("paste cell");
    } else if (action == "setCellLinked") {
      drawTool.drawData->setCellLinked(
          params.layerId(), params.frameIndex(), bool(params.doubleValue()));
      drawTool.saveDrawing("set cell linked");
    } else if (action == "enableOnionSkinning") {
      drawTool.isOnionSkinningEnabled = bool(params.doubleValue());
      drawTool.sendLayersEvent();
    }
  }
};

struct DrawToolClearArtworkReceiver {
  inline static const BridgeRegistration<DrawToolClearArtworkReceiver> registration {
    "DRAW_TOOL_CLEAR_ARTWORK"
  };

  struct Params {
  } params;

  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    if (!editor)
      return;
    editor->drawTool.getDrawData().clearFrame();
    editor->drawTool.saveDrawing("clear all artwork");
  }
};

struct DrawToolClearCollisionShapesReceiver {
  inline static const BridgeRegistration<DrawToolClearCollisionShapesReceiver> registration {
    "DRAW_TOOL_CLEAR_COLLISION_SHAPES"
  };

  struct Params {
  } params;

  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    if (!editor)
      return;
    editor->drawTool.physicsBodyData = std::make_shared<PhysicsBodyData>();
    editor->drawTool.saveDrawing("clear all collision shapes");
  }
};

struct DrawToolTmpGridSettingsReceiver {
  inline static const BridgeRegistration<DrawToolTmpGridSettingsReceiver> registration {
    "DRAW_TOOL_TEMP_GRID_SETTINGS"
  };

  struct Params {
    PROP(love::Colorf, backgroundColor);
    PROP(love::Colorf, gridColor);
    PROP(love::Colorf, axisColor);
    PROP(float, gridDotRadius) = 4;
    PROP(bool, isGridForeground) = false;
  } params;

  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    if (!editor)
      return;

    editor->drawTool.tmpBackgroundColor = params.backgroundColor();
    editor->drawTool.tmpGridColor = params.gridColor();
    editor->drawTool.tmpAxisColor = params.axisColor();
    editor->drawTool.tmpGridDotRadius = params.gridDotRadius();
    editor->drawTool.tmpIsGridForeground = params.isGridForeground();
  }
};

//
// Subtool functions
//

DrawSubtool &DrawTool::getCurrentSubtool() {
  std::string currentCategory = "root";
  std::string currentName = selectedSubtools[currentCategory];

  while (selectedSubtools.find(currentName) != selectedSubtools.end()) {
    currentCategory = currentName;
    currentName = selectedSubtools[currentName];
  }

  for (auto &subtool : subtools) {
    if (subtool->category() == currentCategory && subtool->name() == currentName) {
      return *subtool;
    }
  }

  return *subtools[0];
}

float DrawTool::getZoomAmount() {
  return float(viewWidth) / DRAW_DEFAULT_VIEW_WIDTH;
}

void DrawTool::clearTempGraphics() {
  tempGraphics = std::make_shared<love::ToveGraphicsHolder>();
}

void DrawTool::resetTempGraphics() {
  tempGraphics = std::make_shared<love::ToveGraphicsHolder>();
}

void DrawTool::addTempPathData(love::PathData pathData) {
  if (!pathData.color) {
    pathData.color = drawData->color;
  }

  drawData->updatePathDataRendering(&pathData);
  tempGraphics->addPath(pathData.tovePath);
}

void DrawTool::setTempTranslation(float x, float y) {
  tempTranslateX = x;
  tempTranslateY = y;
}

float DrawTool::getPixelScale() {
  return editor.getScene().getPixelScale();
}

void DrawTool::addPathData(const std::shared_ptr<love::PathData> &pathData) {
  if (DrawUtil::floatEquals(pathData->points[0].x, pathData->points[1].x)
      && DrawUtil::floatEquals(pathData->points[0].y, pathData->points[1].y)) {
    return;
  }

  if (!pathData->color) {
    pathData->color = drawData->color;
  }

  drawData->currentPathDataList()->push_back(*pathData);
}

void DrawTool::addPathData(love::PathData pathData) {
  if (DrawUtil::floatEquals(pathData.points[0].x, pathData.points[1].x)
      && DrawUtil::floatEquals(pathData.points[0].y, pathData.points[1].y)) {
    return;
  }

  if (!pathData.color) {
    pathData.color = drawData->color;
  }

  drawData->currentPathDataList()->push_back(pathData);
}

void DrawTool::saveDrawing(std::string commandDescription) {
  drawData->updateFramePreview();
  physicsBodyData->updatePreview();

  auto &scene = editor.getScene();
  auto &drawBehavior = scene.getBehaviors().byType<Drawing2Behavior>();
  auto actorId = editor.getSelection().firstSelectedActorId();
  auto component = drawBehavior.maybeGetComponent(actorId);

  auto newDrawData = drawData->serialize();
  auto newPhysicsBodyData = physicsBodyData->serialize();
  auto newHash = drawBehavior.hash(newDrawData, newPhysicsBodyData);
  lastHash = newHash;

  auto oldDrawData = component->drawData->serialize();
  auto oldPhysicsBodyData = component->physicsBodyData->serialize();
  auto oldHash = component->hash;

  static const auto setDrawingProps
      = [](Editor &editor, ActorId actorId, const std::string &drawData,
            const std::string &physicsBodyData, const std::string &hash) {
          auto &scene = editor.getScene();
          auto &drawBehavior = scene.getBehaviors().byType<Drawing2Behavior>();
          auto component = drawBehavior.maybeGetComponent(actorId);

          component->drawData = std::make_shared<love::DrawData>(drawData);
          component->physicsBodyData = std::make_shared<PhysicsBodyData>(physicsBodyData);
          component->hash = hash;

          Editor::UpdateBlueprintParams updateBlueprintParams;
          updateBlueprintParams.updateBase64Png = true;
          editor.updateBlueprint(actorId, updateBlueprintParams);
          editor.setSelectedComponentStateDirty(Drawing2Behavior::behaviorId);
        };

  Commands::Params commandParams;
  editor.getCommands().execute(
      std::move(commandDescription), commandParams,
      [actorId, newDrawData, newPhysicsBodyData, newHash](Editor &editor, bool) {
        setDrawingProps(editor, actorId, newDrawData, newPhysicsBodyData, newHash);
      },
      [actorId, oldDrawData, oldPhysicsBodyData, oldHash](Editor &editor, bool) {
        setDrawingProps(editor, actorId, oldDrawData, oldPhysicsBodyData, oldHash);
      });

  // TODO: only send changed frame, not all layers/frames
  sendLayersEvent();
}


//
// Constructor, destructor
//

DrawTool::DrawTool(Editor &editor_)
    : editor(editor_) {
  resetState();

  subtools.push_back(std::make_unique<DrawFreehandSubtool>(*this));
  subtools.push_back(std::make_unique<DrawLineSubtool>(*this));
  subtools.push_back(std::make_unique<DrawShapeSubtool>(*this, DrawShapeSubtool::Shape::Rectangle));
  subtools.push_back(std::make_unique<DrawShapeSubtool>(*this, DrawShapeSubtool::Shape::Circle));
  subtools.push_back(std::make_unique<DrawShapeSubtool>(*this, DrawShapeSubtool::Shape::Triangle));
  subtools.push_back(std::make_unique<DrawEraseSubtool>(*this, DrawEraseSubtool::Size::Small));
  subtools.push_back(std::make_unique<DrawEraseSubtool>(*this, DrawEraseSubtool::Size::Medium));
  subtools.push_back(std::make_unique<DrawEraseSubtool>(*this, DrawEraseSubtool::Size::Large));
  subtools.push_back(std::make_unique<DrawEraseSegmentSubtool>(*this));
  subtools.push_back(std::make_unique<DrawFillSubtool>(*this));
  subtools.push_back(std::make_unique<DrawMoveAllSubtool>(*this));
  subtools.push_back(std::make_unique<DrawMoveSubtool>(*this));
  subtools.push_back(std::make_unique<DrawBendSubtool>(*this));
  subtools.push_back(
      std::make_unique<CollisionShapeSubtool>(*this, CollisionShapeSubtool::Shape::Rectangle));
  subtools.push_back(
      std::make_unique<CollisionShapeSubtool>(*this, CollisionShapeSubtool::Shape::Circle));
  subtools.push_back(
      std::make_unique<CollisionShapeSubtool>(*this, CollisionShapeSubtool::Shape::Triangle));
  subtools.push_back(std::make_unique<CollisionEraseSubtool>(*this));
  subtools.push_back(std::make_unique<CollisionMoveAllSubtool>(*this));
  subtools.push_back(std::make_unique<CollisionMoveSubtool>(*this));
  subtools.push_back(std::make_unique<CollisionScaleSubtool>(*this));
}

DrawTool::~DrawTool() {
  if (onionSkinningCanvas) {
    delete onionSkinningCanvas;
  }
}

void DrawTool::resetState() {
  viewWidth = DRAW_DEFAULT_VIEW_WIDTH;
  viewPosition.x = 0;
  viewPosition.y = 0;
  tempTranslateX = 0;
  tempTranslateY = 0;

  isDrawToolEventDirty = true;
  isPlayingAnimation = false;

  selectedSubtools["root"] = "artwork";
  selectedSubtools["artwork"] = "artwork_draw";
  selectedSubtools["artwork_draw"] = "pencil_no_grid";
  selectedSubtools["artwork_move"] = "move";
  selectedSubtools["artwork_erase"] = "erase_medium";
  selectedSubtools["collision"] = "collision_draw";
  selectedSubtools["collision_draw"] = "rectangle";
  selectedSubtools["collision_move"] = "move";

  copiedLayerId = "";
  copiedFrameIndex.value = 0;

  isOnionSkinningEnabled = false;
  isCollisionVisible = true;
  viewInContext = false;

  resetTempGraphics();
}

void DrawTool::makeNewLayer() {
  if (drawData) {
    auto newLayerNum = drawData->getNumLayers() + 1;
    drawData->addLayer(fmt::format("Layer {}", newLayerNum), fmt::format("layer{}", newLayerNum));
  }
}

void DrawTool::deleteLayerAndValidate(const love::DrawDataLayerId &layerId) {
  if (drawData) {
    if (drawData->deleteLayer(layerId) && drawData->getNumLayers() == 0) {
      makeNewLayer();
    }
  }
}


//
// Onion skinning
//

void DrawTool::makeOnionSkinningCanvas() {
  if (onionSkinningCanvas) {
    delete onionSkinningCanvas;
    onionSkinningCanvas = nullptr;
  }
  onionSkinningCanvas = love::DrawDataFrame::newCanvas(512, 512);
}

void DrawTool::renderOnionSkinning() {
  if (!drawData) {
    return;
  }
  if (!onionSkinningCanvas) {
    makeOnionSkinningCanvas();
  }
  love::DrawDataFrame::renderToCanvas(onionSkinningCanvas, [this]() {
    lv.graphics.push(love::Graphics::STACK_ALL);
    lv.graphics.origin();
    lv.graphics.scale(512.0f / (DRAW_MAX_SIZE * 2.0f), 512.0f / (DRAW_MAX_SIZE * 2.0f));
    lv.graphics.translate(DRAW_MAX_SIZE, DRAW_MAX_SIZE);
    lv.graphics.clear(love::Colorf(0, 0, 0, 1), {}, {});
    lv.graphics.setColor({ 1, 1, 1, 1 });
    drawData->renderOnionSkinning();
    lv.graphics.pop();
  });

  lv.graphics.setColor({ 1, 1, 1, 0.4 });
  float scale = (DRAW_MAX_SIZE * 2.0) / 512.0;
  love::Matrix4 m(-DRAW_MAX_SIZE, -DRAW_MAX_SIZE, 0, scale, scale, 0, 0, 0, 0);
  onionSkinningCanvas->draw(&lv.graphics, onionSkinningCanvas->getQuad(), m);
  lv.graphics.setColor({ 1, 1, 1, 1 });
}

//
// Update
//

void DrawTool::onSetActive() {
  viewPosition.x = 0;
  viewPosition.y = 0;
  viewWidth = DRAW_DEFAULT_VIEW_WIDTH;
  didBecomeActive = true;
}

void DrawTool::fitViewWidth() {
  if (!drawData) {
    return;
  }
  auto bounds = drawData->getBounds(drawData->selectedFrame.value - 1);
  float maxBound = 1.0f;
  if (std::abs(bounds.minX) > maxBound) {
    maxBound = std::abs(bounds.minX);
  }
  if (std::abs(bounds.maxX) > maxBound) {
    maxBound = std::abs(bounds.maxX);
  }
  if (std::abs(bounds.minY) > maxBound) {
    maxBound = std::abs(bounds.minY);
  }
  if (std::abs(bounds.maxY) > maxBound) {
    maxBound = std::abs(bounds.maxY);
  }
  if (maxBound > 1.0f) {
    viewWidth = maxBound * 2.0f;
  }

  // zoom out slightly more to allow a bit of buffer around the drawing
  viewWidth *= 1.1f;

  if (viewWidth < DRAW_MIN_VIEW_WIDTH) {
    viewWidth = DRAW_MIN_VIEW_WIDTH;
  }
  if (viewWidth > DRAW_MAX_VIEW_WIDTH) {
    viewWidth = DRAW_MAX_VIEW_WIDTH;
  }
}

void DrawTool::loadLastSave() {
  auto &scene = editor.getScene();
  if (!editor.getSelection().hasSelection()) {
    return;
  }

  auto &drawBehavior = scene.getBehaviors().byType<Drawing2Behavior>();
  auto actorId = editor.getSelection().firstSelectedActorId();
  auto component = drawBehavior.maybeGetComponent(actorId);
  if (!component) {
    return;
  }

  auto hash = component->hash;

  lastHash = hash;
  drawData = std::make_shared<love::DrawData>(component->drawData);
  physicsBodyData = std::make_shared<PhysicsBodyData>(component->physicsBodyData);

  // TODO: send elsewhere
  sendLayersEvent();
  sendDrawToolEvent();

  // TODO: _toolOptions
}

void DrawTool::update(double dt) {
  if (!editor.hasScene()) {
    return;
  }
  auto &scene = editor.getScene();

  if (!editor.getSelection().hasSelection()) {
    return;
  }

  auto &drawBehavior = scene.getBehaviors().byType<Drawing2Behavior>();
  auto actorId = editor.getSelection().firstSelectedActorId();
  auto component = drawBehavior.maybeGetComponent(actorId);
  if (!component) {
    return;
  }

  auto hash = component->hash;
  if (lastHash != hash) {
    loadLastSave();
  }

  if (didBecomeActive) {
    didBecomeActive = false;
    fitViewWidth();
  }

  if (isDrawToolEventDirty) {
    isDrawToolEventDirty = false;
    sendDrawToolEvent();
  }

  const Gesture &gesture = scene.getGesture();
  DrawSubtool &subtool = getCurrentSubtool();

  if (gesture.getCount() == 1 && gesture.getMaxCount() == 1) {
    if (!isPlayingAnimation) {
      gesture.withSingleTouch([&](const Touch &touch) {
        love::Vector2 originalTouchPosition = { touch.screenPos.x, touch.screenPos.y };
        auto transformedTouchPosition = viewTransform.inverseTransformPoint(originalTouchPosition);
        auto [roundedX, roundedY] = drawData->roundGlobalCoordinatesToGrid(
            transformedTouchPosition.x, transformedTouchPosition.y);
        auto [clampedX, clampedY] = drawData->clampGlobalCoordinates(
            transformedTouchPosition.x, transformedTouchPosition.y);

        DrawSubtoolTouch childTouchData(touch);
        childTouchData.touchX = transformedTouchPosition.x;
        childTouchData.touchY = transformedTouchPosition.y;
        childTouchData.roundedX = roundedX;
        childTouchData.roundedY = roundedY;
        childTouchData.clampedX = clampedX;
        childTouchData.clampedY = clampedY;

        if (touch.pressed) {
          // TODO
          // drawData->unlinkCurrentCell();
        }

        subtool.onTouch(childTouchData);
        if (touch.released) {
          subtool.hasTouch = false;
          subtool.onReset();
          // TODO: do we need this call?
          loadLastSave();
        } else {
          subtool.hasTouch = true;
        }
      });
    }
  } else if (gesture.getCount() == 2) {
    if (subtool.hasTouch) {
      subtool.hasTouch = false;
      subtool.onReset();
      loadLastSave();
    }
    panZoom.update(gesture, viewTransform);
    auto newView = panZoom.apply(viewPosition, viewWidth);
    viewPosition = newView.first;
    viewWidth = newView.second;
  }

  if (gesture.getCount() != 2 && panZoom.isActive()) {
    panZoom.clear();
  }
}


//
// Draw
//

void DrawTool::drawGrid(float windowWidth, float topOffset) {
  // TODO: final colors
  lv.graphics.setColor(tmpGridColor);
  auto gridCellSize = drawData->gridCellSize();
  love::Vector2 gridOffset(0.5f * viewWidth, topOffset);
  grid.draw(gridCellSize, DRAW_MAX_SIZE + gridCellSize * 0.5f, windowWidth / viewWidth,
      viewPosition, gridOffset, tmpGridDotRadius, false);

  lv.graphics.setColor(tmpAxisColor);
  grid.draw(gridCellSize, DRAW_MAX_SIZE + gridCellSize * 0.5f, windowWidth / viewWidth,
      viewPosition, gridOffset, tmpGridDotRadius, true);
};

void DrawTool::drawOverlay() {
  /*if (!editor.hasScene()) {
    return;
  }
  auto &scene = editor.getScene();*/

  lv.graphics.push(love::Graphics::STACK_ALL);


  constexpr auto viewHeightToWidthRatio = 7.0f / 5.0f;
  float windowWidth = 800.0f;
  // CreateCardHeader.js height is 50 and overlay top bar height is 44
  float topOffset
      = 0.5f * (viewWidth * viewHeightToWidthRatio - ((50 + 44) / (windowWidth / viewWidth)));


  viewTransform.reset();
  viewTransform.scale(windowWidth / viewWidth, windowWidth / viewWidth);
  viewTransform.translate(-viewPosition.x, -viewPosition.y);
  viewTransform.translate(0.5f * viewWidth, topOffset);
  lv.graphics.applyTransform(&viewTransform);


  lv.graphics.clear(tmpBackgroundColor, {}, {});

  if (tempGraphics) {
    tempGraphics->update();
  }

  if (!tmpIsGridForeground) {
    drawGrid(windowWidth, topOffset);
  }

  if (selectedSubtools["root"] != "collision" && isCollisionVisible) {
    lv.graphics.setColor({ 0, 0, 0, 1 });
    physicsBodyData->render();
  }

  lv.graphics.setColor({ 1, 1, 1, 1 });
  drawData->renderForTool(std::nullopt, tempTranslateX, tempTranslateY, tempGraphics);

  if (isOnionSkinningEnabled) {
    renderOnionSkinning();
  }

  if (selectedSubtools["root"] == "collision" && isCollisionVisible) {
    // draw collision in front iff editing collision
    lv.graphics.setColor({ 0, 0, 0, 1 });
    physicsBodyData->render();
  }

  getCurrentSubtool().drawOverlay(lv);

  if (tmpIsGridForeground) {
    drawGrid(windowWidth, topOffset);
  }

  lv.graphics.pop();
}
