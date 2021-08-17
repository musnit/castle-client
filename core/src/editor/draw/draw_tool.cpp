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

struct DrawToolEvent {
  PROP((std::unordered_map<std::string, std::string>), selectedSubtools);
  PROP(love::Colorf, color);
};

void DrawTool::sendDrawToolEvent() {
  DrawToolEvent ev;

  for (auto entry : selectedSubtools) {
    ev.selectedSubtools()[entry.first] = entry.second;
  }

  ev.color() = drawData->color;
  editor.getBridge().sendEvent("EDITOR_DRAW_TOOL", ev);
}

struct DrawLayersEvent {
  struct Frame {
    PROP(int, order);
    PROP(bool, isLinked);
    // TODO: base64png
  };

  struct Layer {
    PROP(love::DrawDataLayerId, id);
    PROP(std::string, title);
    PROP(int, order);
    PROP(bool, isVisible);
    PROP((std::vector<Frame>), frames);
  };

  PROP(int, numFrames);
  PROP(love::DrawDataLayerId, selectedLayerId);
  PROP(int, selectedFrameIndex);
  PROP(bool, canPasteCell);
  PROP(bool, isOnionSkinningEnabled);
  PROP((std::vector<Layer>), layers);
};

void DrawTool::sendLayersEvent() {
  if (!drawData) {
    return;
  }

  DrawLayersEvent ev;

  for (int ii = 0, nn = drawData->layers.size(); ii < nn; ii++) {
    auto &layer = drawData->layers[ii];
    DrawLayersEvent::Layer layerData { layer->id, layer->title, ii, layer->isVisible };

    for (int jj = 0, mm = layer->frames.size(); jj < mm; jj++) {
      auto &frame = layer->frames[jj];
      DrawLayersEvent::Frame frameData {
        jj, frame->isLinked,
        // TODO: base64png
      };
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
      drawTool.drawData->selectedLayerId = params.layerId();
      drawTool.saveDrawing("select layer");
    } else if (action == "selectLayerAndFrame") {
      // TODO: setIsPlayingAnimation(false)
      drawTool.drawData->selectedLayerId = params.layerId();
      drawTool.drawData->selectedFrame.value = params.frameIndex();
      drawTool.saveDrawing("select cell");
    } else if (action == "stepBackward") {
      auto newFrameIndex = drawTool.drawData->selectedFrame.value - 1;
      if (newFrameIndex < 1) {
        newFrameIndex = drawTool.drawData->getNumFrames();
      }
      drawTool.drawData->selectedFrame.value = newFrameIndex;
    } else if (action == "stepForward") {
      auto newFrameIndex = drawTool.drawData->selectedFrame.value + 1;
      if (newFrameIndex > drawTool.drawData->getNumFrames()) {
        newFrameIndex = 1;
      }
      drawTool.drawData->selectedFrame.value = newFrameIndex;
    } else if (action == "setLayerIsVisible") {
      auto layer = drawTool.drawData->layerForId(params.layerId());
      layer->isVisible = params.doubleValue();
    } else if (action == "addLayer") {
      drawTool.makeNewLayer();
      drawTool.saveDrawing("add layer");
    } else if (action == "deleteLayer") {
      drawTool.deleteLayerAndValidate(params.layerId());
      drawTool.saveDrawing("delete layer");
    } else if (action == "setLayerOrder") {
      drawTool.drawData->setLayerOrder(params.layerId(), params.doubleValue());
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
    } else if (action == "pasteCell") {
      drawTool.drawData->copyCell(
          drawTool.copiedLayerId, drawTool.copiedFrameIndex, params.layerId(), params.frameIndex());
    } else if (action == "setCellLinked") {
      drawTool.drawData->setCellLinked(params.layerId(), params.frameIndex(), params.doubleValue());
    } else if (action == "enableOnionSkinning") {
      drawTool.isOnionSkinningEnabled = params.doubleValue();
    }
    drawTool.sendLayersEvent();
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

  for (size_t i = 0; i < subtools.size(); i++) {
    if (subtools[i]->category() == currentCategory && subtools[i]->name() == currentName) {
      return *subtools[i];
    }
  }

  return *subtools[0];
}

float DrawTool::getZoomAmount() {
  return viewWidth / DRAW_DEFAULT_VIEW_WIDTH;
}

void DrawTool::resetTempGraphics() {
  tempGraphics = std::make_unique<love::ToveGraphicsHolder>();
}

void DrawTool::addTempPathData(love::PathData pathData) {
  if (!pathData.color) {
    pathData.color = drawData->color;
  }

  drawData->updatePathDataRendering(&pathData);
  tempGraphics->addPath(pathData.tovePath);
}

void DrawTool::addPathData(std::shared_ptr<love::PathData> pathData) {
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

          editor.updateBlueprint(actorId, {});
          editor.setSelectedComponentStateDirty(Drawing2Behavior::behaviorId);
        };

  Commands::Params commandParams;
  editor.getCommands().execute(
      commandDescription, commandParams,
      [actorId, newDrawData, newPhysicsBodyData, newHash](Editor &editor, bool) {
        setDrawingProps(editor, actorId, newDrawData, newPhysicsBodyData, newHash);
      },
      [actorId, oldDrawData, oldPhysicsBodyData, oldHash](Editor &editor, bool) {
        setDrawingProps(editor, actorId, oldDrawData, oldPhysicsBodyData, oldHash);
      });
}


//
// Constructor, destructor
//

DrawTool::DrawTool(Editor &editor_)
    : editor(editor_) {
  resetState();

  love::Vector2 clampViewWidth(DRAW_MIN_VIEW_WIDTH, DRAW_MAX_VIEW_WIDTH);
  love::Vector2 clampViewPos(-DRAW_MAX_SIZE, DRAW_MAX_SIZE);
  panZoom.setConstraints(clampViewWidth, clampViewPos, clampViewPos);

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

  resetTempGraphics();
}

void DrawTool::makeNewLayer() {
  if (drawData) {
    auto newLayerNum = drawData->getNumLayers() + 1;
    drawData->addLayer(fmt::format("Layer {}", newLayerNum), fmt::format("layer{}", newLayerNum));
  }
}

void DrawTool::deleteLayerAndValidate(love::DrawDataLayerId layerId) {
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
    lastHash = hash;
    drawData = std::make_shared<love::DrawData>(component->drawData);
    physicsBodyData = std::make_shared<PhysicsBodyData>(component->physicsBodyData);

    // TODO: send elsewhere
    sendLayersEvent();
    sendDrawToolEvent();
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
        auto [clampedX, clampedY] = drawData->roundGlobalCoordinatesToGrid(
            transformedTouchPosition.x, transformedTouchPosition.y);

        DrawSubtoolTouch childTouchData(touch);
        childTouchData.touchX = transformedTouchPosition.x;
        childTouchData.touchY = transformedTouchPosition.y;
        childTouchData.roundedX = roundedX;
        childTouchData.roundedY = roundedY;
        childTouchData.clampedX = clampedX;
        childTouchData.clampedY = clampedY;

        if (touch.pressed) {
          // drawData->unlinkCurrentCell();
        }

        subtool.onTouch(childTouchData);
        if (touch.released) {
          subtool.hasTouch = false;
          subtool.onReset();
          // loadLastSave();
        } else {
          subtool.hasTouch = true;
        }
      });
    }
  } else if (gesture.getCount() == 2) {
    if (subtool.hasTouch) {
      subtool.hasTouch = false;
      subtool.onReset();
      // loadLastSave();
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

#define VIEW_HEIGHT_TO_WIDTH_RATIO (7.0 / 5.0)

void DrawTool::drawOverlay() {
  /*if (!editor.hasScene()) {
    return;
  }
  auto &scene = editor.getScene();*/

  lv.graphics.push(love::Graphics::STACK_ALL);


  float windowWidth = 800.0f;
  // DrawingCardHeader.js height is 180 and DrawingCardBottomActions.js height is 80
  float topOffset
      = 0.5 * (viewWidth * VIEW_HEIGHT_TO_WIDTH_RATIO - ((200 + 64) / (windowWidth / viewWidth)));


  viewTransform.reset();
  viewTransform.scale(windowWidth / viewWidth, windowWidth / viewWidth);
  viewTransform.translate(-viewPosition.x, -viewPosition.y);
  viewTransform.translate(0.5 * viewWidth, topOffset);
  lv.graphics.applyTransform(&viewTransform);


  lv.graphics.clear(love::Colorf(0, 0, 0, 1), {}, {});

  lv.graphics.setColor({ 1, 1, 1, 1 });

  drawData->render(std::nullopt);

  if (tempGraphics) {
    tempGraphics->update();
    tempGraphics->draw();
  }

  if (isOnionSkinningEnabled) {
    renderOnionSkinning();
  }

  getCurrentSubtool().drawOverlay(lv);

  physicsBodyData->render();

  lv.graphics.pop();
}
