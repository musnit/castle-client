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
    editor->drawTool.color = params.color();
    editor->drawTool.sendDrawToolEvent();
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

  ev.color() = color;
  editor.getBridge().sendEvent("EDITOR_DRAW_TOOL", ev);
}

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

//
// Subtool functions
//

void DrawTool::resetTempGraphics() {
  tempGraphics = std::make_unique<love::ToveGraphicsHolder>();
}

void DrawTool::addTempPathData(love::PathData pathData) {
  if (!pathData.color) {
    // TODO: why does love::ghost::Color exist
    love::ghost::Color c;
    c.data[0] = color.r;
    c.data[1] = color.g;
    c.data[2] = color.b;
    c.data[3] = color.a;
    pathData.color = c;
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
    // TODO: why does love::ghost::Color exist
    love::ghost::Color c;
    c.data[0] = color.r;
    c.data[1] = color.g;
    c.data[2] = color.b;
    c.data[3] = color.a;
    pathData->color = c;
  }

  drawData->currentPathDataList()->push_back(*pathData);
}

void DrawTool::addPathData(love::PathData pathData) {
  if (DrawUtil::floatEquals(pathData.points[0].x, pathData.points[1].x)
      && DrawUtil::floatEquals(pathData.points[0].y, pathData.points[1].y)) {
    return;
  }

  if (!pathData.color) {
    // TODO: why does love::ghost::Color exist
    love::ghost::Color c;
    c.data[0] = color.r;
    c.data[1] = color.g;
    c.data[2] = color.b;
    c.data[3] = color.a;
    pathData.color = c;
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
}

void DrawTool::resetState() {
  viewWidth = DRAW_DEFAULT_VIEW_WIDTH;
  viewPosition.x = 0;
  viewPosition.y = 0;
  color = love::Colorf(1, 1, 0, 1);

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

  resetTempGraphics();
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

  if (isDrawToolEventDirty) {
    isDrawToolEventDirty = false;
    sendDrawToolEvent();
  }

  auto &drawBehavior = scene.getBehaviors().byType<Drawing2Behavior>();
  auto actorId = editor.getSelection().firstSelectedActorId();
  auto component = drawBehavior.maybeGetComponent(actorId);
  auto hash = component->hash;

  if (lastHash != hash) {
    lastHash = hash;
    drawData = std::make_shared<love::DrawData>(component->drawData);
    physicsBodyData = std::make_shared<PhysicsBodyData>(component->physicsBodyData);
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

  getCurrentSubtool().drawOverlay(lv);

  physicsBodyData->render();

  lv.graphics.pop();
}