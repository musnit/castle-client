#include "draw_tool.h"

#include "archive.h"
#include "behaviors/all.h"
#include "editor.h"

struct DrawToolEvent {
  PROP((std::unordered_map<std::string, std::string>), selectedSubtools);
  PROP(std::vector<float>, color);
};

void DrawTool::sendDrawToolEvent() {
  DrawToolEvent ev;

  for (auto entry : selectedSubtools) {
    ev.selectedSubtools()[entry.first] = entry.second;
  }

  // TODO
  ev.color().push_back(255.0);
  ev.color().push_back(0.0);
  ev.color().push_back(0.0);

  editor.getBridge().sendEvent("EDITOR_DRAW_TOOL", ev);
}

//
// Constructor, destructor
//

DrawTool::DrawTool(Editor &editor_)
    : editor(editor_) {
  selectedSubtools["root"] = "artwork";
  selectedSubtools["artwork"] = "artwork_draw";
  selectedSubtools["artwork_draw"] = "pencil_no_grid";
  selectedSubtools["artwork_move"] = "move";
  selectedSubtools["artwork_erase"] = "erase_medium";
  selectedSubtools["collision"] = "collision_draw";
  selectedSubtools["collision_draw"] = "rectangle";
  selectedSubtools["collision_move"] = "move";

  viewWidth = 10;
  viewX = 0;
  viewY = 0;

  isDrawToolEventDirty = true;
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

  if (scene.getGesture().getCount() == 2) {
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

  lv.graphics.pop();
}
