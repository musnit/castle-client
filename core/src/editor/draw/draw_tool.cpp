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
#include "subtools/draw_palette_swap_subtool.h"
#include "subtools/draw_move_all_subtool.h"
#include "subtools/draw_move_subtool.h"
#include "subtools/draw_bend_subtool.h"
#include "subtools/draw_eyedropper_subtool.h"
#include "subtools/collision_shape_subtool.h"
#include "subtools/collision_erase_subtool.h"
#include "subtools/collision_move_all_subtool.h"
#include "subtools/collision_move_subtool.h"
#include "subtools/collision_scale_subtool.h"
#include "subtools/bitmap_fill_subtool.h"
#include "subtools/bitmap_erase_fill_subtool.h"
#include "subtools/bitmap_erase_brush_subtool.h"
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
    editor->drawTool.selectedColor = params.color();
    editor->drawTool.sendDrawToolEvent();
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
  PROP(bool, isImportingImage) = false;
};

void DrawTool::sendDrawToolEvent() {
  DrawToolEvent ev;

  for (auto &entry : selectedSubtools) {
    ev.selectedSubtools()[entry.first] = entry.second;
  }

  ev.color() = selectedColor;
  ev.isImportingImage() = isImportingImage();
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
    PROP(bool, isBitmap);
    PROP((std::vector<Frame>), frames) {};
  };

  PROP(int, numFrames);
  PROP(love::DrawDataLayerId, selectedLayerId);
  PROP(int, selectedFrameIndex);
  PROP(bool, canPasteCell);
  PROP(bool, copiedCellIsBitmap);
  PROP(bool, isOnionSkinningEnabled);
  PROP(bool, isPlayingAnimation);
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
    DrawLayersEvent::Layer layerData { layer->id, layer->title, ii, layer->isVisible,
      layer->isBitmap };

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

  ev.selectedLayerId = selectedLayerId;
  ev.selectedFrameIndex = selectedFrameIndex.value;
  ev.canPasteCell = copiedFrameData != "";
  ev.copiedCellIsBitmap = ev.canPasteCell() && copiedFrameIsBitmap;
  ev.isOnionSkinningEnabled = isOnionSkinningEnabled;
  ev.isPlayingAnimation = isPlayingAnimation;

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
      drawTool.setIsPlayingAnimation(false);
      if (drawTool.selectedLayerId != params.layerId()) {
        auto newLayerId = params.layerId();
        auto oldLayerId = drawTool.selectedLayerId;

        Commands::Params commandParams;
        commandParams.coalesce = true;
        editor->getCommands().execute(
            "select layer", commandParams,
            [newLayerId](Editor &editor, bool) {
              auto &drawTool = editor.drawTool;
              drawTool.selectedLayerId = newLayerId;
              drawTool.sendLayersEvent();
            },
            [oldLayerId](Editor &editor, bool) {
              auto &drawTool = editor.drawTool;
              drawTool.selectedLayerId = oldLayerId;
              drawTool.sendLayersEvent();
            });
      }
    } else if (action == "selectLayerAndFrame") {
      drawTool.setIsPlayingAnimation(false);
      if (drawTool.selectedLayerId != params.layerId()
          || drawTool.selectedFrameIndex.value != params.frameIndex()) {
        auto newFrameIndex = params.frameIndex();
        auto newLayerId = params.layerId();
        auto oldFrameIndex = drawTool.selectedFrameIndex.value;
        auto oldLayerId = drawTool.selectedLayerId;
        Commands::Params commandParams;
        commandParams.coalesce = true;
        editor->getCommands().execute(
            "select cell", commandParams,
            [newFrameIndex, newLayerId](Editor &editor, bool) {
              auto &drawTool = editor.drawTool;
              drawTool.selectedFrameIndex.value = newFrameIndex;
              drawTool.selectedLayerId = newLayerId;
              drawTool.sendLayersEvent();
            },
            [oldFrameIndex, oldLayerId](Editor &editor, bool) {
              auto &drawTool = editor.drawTool;
              drawTool.selectedFrameIndex.value = oldFrameIndex;
              drawTool.selectedLayerId = oldLayerId;
              drawTool.sendLayersEvent();
            });
      }
    } else if (action == "selectFrame") {
      drawTool.setIsPlayingAnimation(false);
      if (drawTool.selectedFrameIndex.value != params.frameIndex()) {
        auto newFrameIndex = params.frameIndex();
        auto oldFrameIndex = drawTool.selectedFrameIndex.value;
        Commands::Params commandParams;
        commandParams.coalesce = true;
        editor->getCommands().execute(
            "select frame", commandParams,
            [newFrameIndex](Editor &editor, bool) {
              auto &drawTool = editor.drawTool;
              drawTool.selectedFrameIndex.value = newFrameIndex;
              drawTool.sendLayersEvent();
            },
            [oldFrameIndex](Editor &editor, bool) {
              auto &drawTool = editor.drawTool;
              drawTool.selectedFrameIndex.value = oldFrameIndex;
              drawTool.sendLayersEvent();
            });
      }
    } else if (action == "stepBackward") {
      auto newFrameIndex = drawTool.selectedFrameIndex.value - 1;
      if (newFrameIndex < 1) {
        newFrameIndex = drawTool.drawData->getNumFrames();
      }
      drawTool.selectedFrameIndex.value = newFrameIndex;
      drawTool.sendLayersEvent();
    } else if (action == "stepForward") {
      auto newFrameIndex = drawTool.selectedFrameIndex.value + 1;
      if (newFrameIndex > drawTool.drawData->getNumFrames()) {
        newFrameIndex = 1;
      }
      drawTool.selectedFrameIndex.value = newFrameIndex;
      drawTool.sendLayersEvent();
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
      drawTool.sendDrawToolEvent(); // subtool may have changed
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
        drawTool.selectedFrameIndex.value = index.value;
      } else {
        drawTool.drawData->addFrame();
        drawTool.selectedFrameIndex.value = drawTool.drawData->getNumFrames();
      }
      drawTool.saveDrawing("add frame");
    } else if (action == "deleteFrame") {
      drawTool.drawData->deleteFrame(params.frameIndex());
      drawTool.validateSelection();
      drawTool.saveDrawing("delete frame");
    } else if (action == "copyCell") {
      auto sourceLayer = drawTool.drawData->layerForId(drawTool.selectedLayerId);
      if (sourceLayer) {
        auto &sourceFrame = sourceLayer->frames[drawTool.selectedFrameIndex.toZeroIndex()];
        Archive frameArchive;
        frameArchive.write([&](Writer &writer) {
          sourceFrame->write(writer);
        });
        drawTool.copiedFrameData = frameArchive.toJson();
        drawTool.copiedFrameIsBitmap = sourceLayer->isBitmap;
        drawTool.sendLayersEvent();
      }
    } else if (action == "pasteCell") {
      auto destLayer = drawTool.drawData->layerForId(params.layerId());
      if (drawTool.copiedFrameData != "" && drawTool.copiedFrameIsBitmap == destLayer->isBitmap) {
        auto newFrame = std::make_shared<love::DrawDataFrame>();
        auto frameArchive = Archive::fromJson(drawTool.copiedFrameData.c_str());
        frameArchive.read([&](Reader &reader) {
          reader.read(*newFrame);
        });
        drawTool.drawData->copyCell(std::move(newFrame), params.layerId(), params.frameIndex());
        drawTool.saveDrawing("paste cell");
      }
    } else if (action == "setCellLinked") {
      // TODO: calling drawData->setCellLinked crashes on android
      // this code is copied from DrawData and works when it's in this file but not
      // when it's in DrawData

      /*drawTool.drawData->setCellLinked(
          params.layerId(), params.frameIndex(), bool(params.doubleValue()));*/

      love::DrawDataLayerId layerId = params.layerId();
      love::OneIndexFrame frameIndex = params.frameIndex();
      bool isLinked = bool(params.doubleValue());

      if (frameIndex.value < 2) {
        return;
      }
      auto layer = drawTool.drawData->layerForId(layerId);
      if (layer->frames[frameIndex.toZeroIndex()]->isLinked == isLinked) {
        return;
      }
      if (isLinked) {
        auto newFrame = std::make_shared<love::DrawDataFrame>(true, layer);
        layer->frames[frameIndex.toZeroIndex()] = std::move(newFrame);
      } else {
        love::OneIndexFrame realFrameIndex;
        realFrameIndex.setFromZeroIndex(
            drawTool.drawData->getRealFrameIndexForLayerId(layerId, frameIndex));
        // copyCell(layerId, realFrameIndex, layerId, frameIndex);

        love::OneIndexFrame sourceFrameIndex = realFrameIndex;
        love::OneIndexFrame destFrameIndex = frameIndex;

        auto sourceLayer = drawTool.drawData->layerForId(layerId),
             destLayer = drawTool.drawData->layerForId(layerId);
        if (sourceLayer && destLayer
            && sourceFrameIndex.toZeroIndex() < (int)sourceLayer->frames.size()
            && destFrameIndex.toZeroIndex() < (int)destLayer->frames.size()) {
          auto &oldFrame = sourceLayer->frames[sourceFrameIndex.toZeroIndex()];
          auto newFrame = std::make_shared<love::DrawDataFrame>();

          Archive oldArchive;
          oldArchive.write([&](Writer &writer) {
            oldFrame->write(writer);
          });
          auto newFrameArchive = Archive::fromJson(oldArchive.toJson().c_str());
          newFrameArchive.read([&](Reader &reader) {
            newFrame->read(reader);
          });
          newFrame->setParentLayer(destLayer);

          destLayer->frames[destFrameIndex.toZeroIndex()] = std::move(newFrame);
        }
      }

      drawTool.saveDrawing("set cell linked");
    } else if (action == "scaleBitmapLayer") {
      float delta = float(params.doubleValue());
      drawTool.resizeSelectedBitmapLayer(delta);
      drawTool.saveDrawing("scale layer");
    } else if (action == "enableOnionSkinning") {
      drawTool.isOnionSkinningEnabled = bool(params.doubleValue());
      drawTool.sendLayersEvent();
    } else if (action == "setIsPlayingAnimation") {
      drawTool.setIsPlayingAnimation(bool(params.doubleValue()));
      drawTool.sendLayersEvent();
    } else if (action == "importImage") {
      auto uri = params.stringValue();
      drawTool.imageImporter.importImage(uri);
      drawTool.sendDrawToolEvent(); // indicate to ui that import started
      editor->isEditorStateDirty = true; // top level undo/redo state changes during import
    } else if (action == "cancelImportImage") {
      drawTool.imageImporter.reset();
      drawTool.sendDrawToolEvent();
      editor->isEditorStateDirty = true; // top level undo/redo state changes during import
    } else if (action == "confirmImportImage") {
      drawTool.makeNewLayerFromImageImporter();
      drawTool.saveDrawing("import image to layer");
      drawTool.sendDrawToolEvent();
      editor->isEditorStateDirty = true; // top level undo/redo state changes during import
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
    auto &drawTool = editor->drawTool;
    drawTool.getDrawData().clearFrame(drawTool.selectedLayerId, drawTool.selectedFrameIndex);
    drawTool.saveDrawing("clear all artwork");
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

void DrawTool::addTempPathData(std::shared_ptr<love::PathData> pathData) {
  if (!pathData->color) {
    pathData->color = selectedColor;
  }

  drawData->updatePathDataRendering(pathData.get());
  tempGraphics->addPath(pathData->getTovePath());
}

void DrawTool::setTempTranslation(float x, float y) {
  tempTranslateX = x;
  tempTranslateY = y;
}

float DrawTool::getPixelScale() {
  return editor.getScene().getPixelScale();
}

void DrawTool::addPathData(std::shared_ptr<love::PathData> &pathData) {
  if (DrawUtil::floatEquals(pathData->points[0].x, pathData->points[1].x)
      && DrawUtil::floatEquals(pathData->points[0].y, pathData->points[1].y)) {
    return;
  }

  if (!pathData->color) {
    pathData->color = selectedColor;
  }

  selectedFramePathDataList()->push_back(pathData);
}

void DrawTool::setIsPlayingAnimation(bool isPlayingAnimation_) {
  isPlayingAnimation = isPlayingAnimation_;
  if (isPlayingAnimation) {
    auto &drawBehavior = editor.getScene().getBehaviors().byType<Drawing2Behavior>();
    auto actorId = editor.getSelection().firstSelectedActorId();
    if (auto component = drawBehavior.maybeGetComponent(actorId); component) {
      Drawing2Behavior::getAnimationComponentProperties(*component, animationProperties);
    }
    animationState.animationFrameTime = 0.0f;
    animationProperties.playing = true;
    animationProperties.loop = true;
  }
}

void DrawTool::saveDrawing(std::string commandDescription) {
  if (!drawData || !physicsBodyData) {
    return;
  }
  drawData->updateFramePreview(selectedLayerId, selectedFrameIndex);
  physicsBodyData->updatePreview();

  auto &scene = editor.getScene();
  scene.getLibrary().ensureGhostActorsExist();

  auto &drawBehavior = scene.getBehaviors().byType<Drawing2Behavior>();
  auto actorId = editor.getSelection().firstSelectedActorId();
  auto component = drawBehavior.maybeGetComponent(actorId);
  if (!component) {
    return;
  }

  auto newDrawData = drawData->serialize();
  auto newPhysicsBodyData = physicsBodyData->serialize();
  auto newHash = drawBehavior.hash(newDrawData, newPhysicsBodyData);
  lastHash = newHash;

  auto oldDrawData = component->drawData->serialize();
  auto oldPhysicsBodyData = component->physicsBodyData->serialize();
  auto oldHash = component->hash;

  static const auto setDrawingProps = [](Editor &editor, ActorId actorId,
                                          const std::string &drawData,
                                          const std::string &physicsBodyData,
                                          const std::string &hash) {
    auto &scene = editor.getScene();

    auto &drawBehavior = scene.getBehaviors().byType<Drawing2Behavior>();
    auto drawComponent = drawBehavior.maybeGetComponent(actorId);
    if (!drawComponent) {
      return;
    }
    drawComponent->drawData = std::make_shared<love::DrawData>(drawData);
    drawComponent->physicsBodyData = std::make_shared<PhysicsBodyData>(physicsBodyData);
    drawComponent->hash = hash;

    auto &bodyBehavior = scene.getBehaviors().byType<BodyBehavior>();
    auto bodyComponent = bodyBehavior.maybeGetComponent(actorId);
    auto drawDataBounds
        = drawComponent->drawData->getBounds(int(drawComponent->props.initialFrame() - 1));
    auto physicsBodyBounds = drawComponent->physicsBodyData->getBounds();
    bodyComponent->props.editorBounds().minX = fmin(drawDataBounds.minX, physicsBodyBounds.minX);
    bodyComponent->props.editorBounds().maxX = fmax(drawDataBounds.maxX, physicsBodyBounds.maxX);
    bodyComponent->props.editorBounds().minY = fmin(drawDataBounds.minY, physicsBodyBounds.minY);
    bodyComponent->props.editorBounds().maxY = fmax(drawDataBounds.maxY, physicsBodyBounds.maxY);
    bodyBehavior.setFixturesFromDrawing(
        actorId, drawComponent->physicsBodyData->getFixturesForBody());

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
  subtools.push_back(std::make_unique<DrawPaletteSwapSubtool>(*this, false));
  subtools.push_back(std::make_unique<DrawMoveAllSubtool>(*this, false));
  subtools.push_back(std::make_unique<DrawMoveSubtool>(*this));
  subtools.push_back(std::make_unique<DrawBendSubtool>(*this));
  subtools.push_back(std::make_unique<DrawEyedropperSubtool>(*this, false));
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
  subtools.push_back(std::make_unique<BitmapFillSubtool>(*this));
  subtools.push_back(std::make_unique<DrawPaletteSwapSubtool>(*this, true));
  subtools.push_back(std::make_unique<BitmapEraseFillSubtool>(*this));
  subtools.push_back(
      std::make_unique<BitmapEraseBrushSubtool>(*this, BitmapEraseBrushSubtool::Size::Small));
  subtools.push_back(
      std::make_unique<BitmapEraseBrushSubtool>(*this, BitmapEraseBrushSubtool::Size::Medium));
  subtools.push_back(
      std::make_unique<BitmapEraseBrushSubtool>(*this, BitmapEraseBrushSubtool::Size::Large));
  subtools.push_back(std::make_unique<DrawMoveAllSubtool>(*this, true));
  subtools.push_back(std::make_unique<DrawEyedropperSubtool>(*this, true));
}

DrawTool::~DrawTool() {
  if (onionSkinningCanvas) {
    delete onionSkinningCanvas;
  }
}

void DrawTool::resetState() {
  selectedColor = love::Colorf(249.0f / 255.0f, 163.0f / 255.0f, 27.0f / 255.0f, 1.0f);
  selectedLayerId = "";
  selectedFrameIndex = 1;

  viewWidth = DRAW_DEFAULT_VIEW_WIDTH;
  viewPosition.x = 0;
  viewPosition.y = 0;
  tempTranslateX = 0;
  tempTranslateY = 0;

  isPlayingAnimation = false;

  selectedSubtools["root"] = "artwork";
  selectedSubtools["artwork"] = "artwork_draw";
  selectedSubtools["artwork_draw"] = "pencil_no_grid";
  selectedSubtools["artwork_fill"] = "flood_fill";
  selectedSubtools["artwork_move"] = "move";
  selectedSubtools["artwork_erase"] = "erase_medium";
  selectedSubtools["collision"] = "collision_draw";
  selectedSubtools["collision_draw"] = "rectangle";
  selectedSubtools["collision_move"] = "move";
  selectedSubtools["bitmap"] = "bitmap_fill";
  selectedSubtools["bitmap_fill"] = "flood_fill";
  selectedSubtools["bitmap_erase"] = "erase_fill";

  // don't reset `copiedFrame`

  isOnionSkinningEnabled = false;
  isCollisionVisible = true;
  viewInContext = false;
  setIsPlayingAnimation(false);

  imageImporter.reset();
  resetTempGraphics();
}

void DrawTool::makeNewLayer() {
  if (drawData) {
    // find highest integer in an existing layer id, add one
    auto highestLayerId = 0;
    static std::regex pattern("layer(\\d+)");
    for (auto &layer : drawData->layers) {
      const std::string layerId = layer->id;
      auto it = layerId.begin(), end = layerId.end();
      for (std::smatch match; std::regex_search(it, end, match, pattern); it = match[0].second) {
        auto indexStr = match.str(1);
        auto index = std::stoi(indexStr);
        if (index > highestLayerId) {
          highestLayerId = index;
        }
      }
    }

    auto newLayerOrder = -1;
    for (auto ii = 0; ii < int(drawData->layers.size()); ii++) {
      if (drawData->layers[ii]->id == selectedLayerId) {
        newLayerOrder = ii + 1;
        break;
      }
    }

    auto newLayerNum = highestLayerId + 1;
    love::DrawDataLayerId newLayerId = fmt::format("layer{}", newLayerNum);
    drawData->addLayer(fmt::format("Layer {}", newLayerNum), newLayerId, newLayerOrder);
    selectedLayerId = newLayerId;
    selectedSubtools["root"] = "artwork";
  }
}

void DrawTool::deleteLayerAndValidate(const love::DrawDataLayerId &layerId) {
  if (drawData) {
    int indexRemoved = drawData->deleteLayer(layerId);
    if (drawData->getNumLayers() == 0) {
      makeNewLayer();
      selectedFrameIndex = 1;
    } else if (indexRemoved >= 0 && selectedLayerId == layerId) {
      if (indexRemoved < drawData->getNumLayers()) {
        selectedLayerId = drawData->layers[indexRemoved]->id;
      } else if (indexRemoved > 0) {
        selectedLayerId = drawData->layers[indexRemoved - 1]->id;
      } else if (drawData->getNumLayers() > 0) {
        selectedLayerId = drawData->layers[0]->id;
      } else {
        selectedLayerId = "";
      }
    }
    if (auto layer = drawData->layerForId(selectedLayerId); layer && layer->isBitmap) {
      if (selectedSubtools["root"] == "artwork") {
        selectedSubtools["root"] = "bitmap";
      }
    } else {
      if (selectedSubtools["root"] == "bitmap") {
        selectedSubtools["root"] = "artwork";
      }
    }
    sendDrawToolEvent();
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
    drawData->renderFrameIndex(selectedFrameIndex.toZeroIndex() - 1);
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
  selectedLayerId = "";
  selectedFrameIndex.setFromZeroIndex(0);

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
  if (lastHash != hash || !drawData) {
    loadLastSave();
  } else {
    selectFirstLayerAndFrame();
  }

  fitViewWidth();
}

void DrawTool::fitViewWidth() {
  if (!drawData) {
    return;
  }
  auto bounds = drawData->getBounds(selectedFrameIndex.toZeroIndex());
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
  if (selectedLayerId == "") {
    selectFirstLayerAndFrame();
  }
  validateSelection();
}

void DrawTool::selectFirstLayerAndFrame() {
  if (drawData) {
    if (drawData->getNumLayers() > 0) {
      selectedLayerId = drawData->layers[drawData->getNumLayers() - 1]->id;
    }
    selectedFrameIndex.setFromZeroIndex(0);
  }

  sendLayersEvent();
}

void DrawTool::validateSelection() {
  auto numFrames = drawData->getNumFrames();
  if (selectedFrameIndex.toZeroIndex() >= numFrames) {
    selectedFrameIndex.setFromZeroIndex(numFrames - 1);
  }
  auto existingLayer = drawData->layerForId(selectedLayerId);
  if (!existingLayer) {
    if (drawData->getNumLayers() == 0) {
      makeNewLayer();
    } else {
      selectedLayerId = drawData->layers[0]->id;
    }
  }
  if (auto layer = drawData->layerForId(selectedLayerId); layer && layer->isBitmap) {
    if (selectedSubtools["root"] == "artwork") {
      selectedSubtools["root"] = "bitmap";
    }
  } else {
    if (selectedSubtools["root"] == "bitmap") {
      selectedSubtools["root"] = "artwork";
    }
  }
  sendLayersEvent();
  sendDrawToolEvent();
}

love::PathDataList *DrawTool::selectedFramePathDataList() {
  return &getDrawDataFrame().pathDataList;
}

void DrawTool::dirtySelectedFrameBounds() {
  drawData->updateFrameBounds(selectedFrameIndex);
}

bool DrawTool::resizeSelectedBitmapLayer(float delta) {
  // always unlink before resize
  drawData->setCellLinked(selectedLayerId, selectedFrameIndex, false);

  if (auto layer = drawData->layerForId(selectedLayerId); layer && layer->isBitmap) {
    auto &selectedFrame = getDrawDataFrame();
    auto maxImageSize = DRAW_MAX_SIZE * 2.0f * drawData->fillPixelsPerUnit;

    selectedFrame.getFillImage(); // ensure deserialized
    int initialWidth = selectedFrame.fillImageData->getWidth(),
        initialHeight = selectedFrame.fillImageData->getHeight();
    float absoluteScale = std::max(float(initialWidth), float(initialHeight)) / maxImageSize;
    absoluteScale += delta;
    if (absoluteScale > 1.0f)
      absoluteScale = 1.0f;
    if (absoluteScale < 0.05f)
      absoluteScale = 0.05f;

    int size = int(absoluteScale * maxImageSize);
    auto oldFillImageData = selectedFrame.fillImageData;
    selectedFrame.fillImageData = ImageProcessing::fitToSize(selectedFrame.fillImageData, size);

    // recompute bounds and clamp
    dirtySelectedFrameBounds();
    int finalWidth = selectedFrame.fillImageData->getWidth(),
        finalHeight = selectedFrame.fillImageData->getHeight();
    auto &bounds = selectedFrame.fillImageBounds;
    bounds.minX += (initialWidth - finalWidth) * 0.5f;
    bounds.minY += (initialHeight - finalHeight) * 0.5f;
    if (bounds.minX < -maxImageSize * 0.5f)
      bounds.minX = -maxImageSize * 0.5f;
    if (bounds.minY < -maxImageSize * 0.5f)
      bounds.minY = -maxImageSize * 0.5f;
    bounds.maxX = bounds.minX + finalWidth;
    bounds.maxY = bounds.minY + finalHeight;

    selectedFrame.updateFillImageWithFillImageData();
    oldFillImageData->release();
    return true;
  }
  return false;
}

void DrawTool::makeNewLayerFromImageImporter() {
  if (imageImporter.status == ImageImporter::Status::Importing) {
    makeNewLayer();
    selectedSubtools["root"] = "bitmap";

    // flag this layer as bitmap-only
    drawData->layerForId(selectedLayerId)->isBitmap = true;

    // selected frame's bitmap is image importer's data
    auto unlinkedFrameIndex
        = drawData->getRealFrameIndexForLayerId(selectedLayerId, selectedFrameIndex);
    auto &selectedFrame = *(drawData->layerForId(selectedLayerId)->frames[unlinkedFrameIndex]);

    selectedFrame.fillImageData = imageImporter.getFilteredImageData();
    selectedFrame.fillImageData->retain();
    dirtySelectedFrameBounds();

    // initially center the bitmap
    auto width = selectedFrame.fillImageData->getWidth(),
         height = selectedFrame.fillImageData->getHeight();
    selectedFrame.fillImageBounds.minX = -float(width / 2);
    selectedFrame.fillImageBounds.minY = -float(height / 2);
    selectedFrame.fillImageBounds.maxX = float(width / 2);
    selectedFrame.fillImageBounds.maxY = float(height / 2);

    imageImporter.reset();
  }
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

  if (isPlayingAnimation) {
    drawData->runAnimation(animationState, animationProperties, float(dt));
  }

  if (imageImporter.status == ImageImporter::Status::Importing) {
    imageImporter.update(dt);
  }

  const Gesture &gesture = scene.getGesture();
  DrawSubtool &subtool = getCurrentSubtool();

  const auto endSubtoolTouch = [this](DrawSubtool &subtool) {
    subtool.hasTouch = false;

    // remove any partial gesture (e.g. first touch of 2-finger pan)
    resetTempGraphics();

    subtool.onReset();
    // TODO: do we need this call?
    loadLastSave();

    auto currentLayer = drawData->layerForId(selectedLayerId);
    if (!currentLayer->isVisible) {
      editor.getCommands().notify("alert", "Edited an invisible layer!");
    }
  };

  if (gesture.getCount() == 1 && gesture.getMaxCount() == 1) {
    if (!isPlayingAnimation && imageImporter.status == ImageImporter::Status::None) {
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
          // always unlink current cell if you try to draw on it
          drawData->setCellLinked(selectedLayerId, selectedFrameIndex, false);
        }

        subtool.onTouch(childTouchData);
        if (touch.released) {
          endSubtoolTouch(subtool);
        } else {
          subtool.hasTouch = true;
        }
      });
    }
  } else if (gesture.getCount() == 2) {
    if (subtool.hasTouch) {
      endSubtoolTouch(subtool);
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
  love::Vector2 gridMin {
    -DRAW_MAX_SIZE + gridCellSize * 0.5f,
    -DRAW_MAX_SIZE + gridCellSize * 0.5f,
  };
  love::Vector2 gridMax {
    DRAW_MAX_SIZE + gridCellSize * 0.5f,
    DRAW_MAX_SIZE + gridCellSize * 0.5f,
  };
  grid.draw(gridCellSize, gridMin, gridMax, windowWidth / viewWidth, viewPosition, gridOffset,
      tmpGridDotRadius, false);

  lv.graphics.setColor(tmpAxisColor);
  grid.draw(gridCellSize, gridMin, gridMax, windowWidth / viewWidth, viewPosition, gridOffset,
      tmpGridDotRadius, true);
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
  lv.graphics.setLineWidth(0.1);

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
  love::OneIndexFrame frameIndexToRender = selectedFrameIndex;
  if (isPlayingAnimation) {
    frameIndexToRender.setFromZeroIndex(getCurrentAnimationFrame());
  }
  drawData->renderForTool(
      selectedLayerId, frameIndexToRender, tempTranslateX, tempTranslateY, tempGraphics);

  if (isOnionSkinningEnabled) {
    renderOnionSkinning();
  }

  if (selectedSubtools["root"] == "collision" && isCollisionVisible) {
    // draw collision in front iff editing collision
    lv.graphics.setColor({ 0, 0, 0, 1 });
    physicsBodyData->render();
  }

  getCurrentSubtool().drawOverlay(lv);
  imageImporter.draw();

  if (tmpIsGridForeground) {
    drawGrid(windowWidth, topOffset);
  }

  lv.graphics.pop();
}
