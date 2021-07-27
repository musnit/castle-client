#include "draw_tool.h"

#include "archive.h"
#include "behaviors/all.h"
#include "editor.h"
#include "engine.h"

#include "draw_subtools/draw_freehand_subtool.h"
#include "draw_subtools/draw_line_subtool.h"
#include "draw_subtools/draw_shape_subtool.h"
#include "draw_subtools/draw_erase_segment_subtool.h"

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

//
// Subtool functions
//

void DrawTool::resetTempGraphics() {
  tempGraphics = std::make_unique<love::ToveGraphicsHolder>();
}

void DrawTool::clearTempGraphics() {
  tempGraphics = NULL;
}

void DrawTool::addTempPathData(love::PathData *pathData) {
  if (!pathData->color) {
    // TODO: why does love::ghost::Color exist
    love::ghost::Color c;
    c.data[0] = color.r;
    c.data[1] = color.g;
    c.data[2] = color.b;
    c.data[3] = color.a;
    pathData->color = c;
  }

  drawData->updatePathDataRendering(pathData);
  tempGraphics->addPath(pathData->tovePath);
}

love::DrawDataFrame *DrawTool::drawDataFrame() {
  return drawData->currentLayerFrame();
}

void DrawTool::saveDrawing(std::string commandDescription) {
  drawData->updateFramePreview();

  auto &scene = editor.getScene();
  auto &drawBehavior = scene.getBehaviors().byType<Drawing2Behavior>();
  auto actorId = editor.getSelection().firstSelectedActorId();
  auto component = drawBehavior.maybeGetComponent(actorId);


  auto newDrawData = drawData->serialize();
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
  subtools.push_back(std::make_unique<DrawEraseSegmentSubtool>(*this));
}

void DrawTool::resetState() {
  viewWidth = 10;
  viewX = 0;
  viewY = 0;
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
    auto componentDrawData = component->drawData;
    drawData = std::make_shared<love::DrawData>(componentDrawData);
  }

  const Gesture &gesture = scene.getGesture();

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

        DrawSubtool &subtool = getCurrentSubtool();
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
  }

  if (gesture.getCount() == 2) {
    // TODO: pan
  }
}


//
// Draw
//

#define VIEW_HEIGHT_TO_WIDTH_RATIO (7.0 / 5.0)

void DrawTool::drawOverlay() const {
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
  viewTransform.translate(-viewX, -viewY);
  viewTransform.translate(0.5 * viewWidth, topOffset);
  lv.graphics.applyTransform(&viewTransform);


  lv.graphics.clear(love::Colorf(0, 0, 0, 1), {}, {});

  lv.graphics.setColor({ 1, 1, 1, 1 });

  drawData->render(std::nullopt);

  if (tempGraphics) {
    tempGraphics->update();
    tempGraphics->draw();
  }

  lv.graphics.pop();
}
