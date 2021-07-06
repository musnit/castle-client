#include "grab.h"

#include "behaviors/all.h"
#include "editor.h"


inline static const TouchToken grabTouchToken;


//
// Constructor, destructor
//

GrabTool::GrabTool(Editor &editor_)
    : editor(editor_) {
}


//
// Update
//

void GrabTool::update(Scene &scene, double dt) {
  scene.getGesture().withSingleTouch([&](const Touch &touch) {
    if (!touch.isUsed(grabTouchToken)) {
      // Not used by us yet, let's see if we can use it
      if (touch.isUsed() && !touch.isUsed(Selection::touchToken)) {
        return; // Bail if used by anything other than selection
      }
      if (!touch.movedNear) {
        return; // Need to move at least a bit
      }
      touch.forceUse(grabTouchToken);
    }

    auto move = touch.delta;

    if (gridEnabled) {
      auto prevTouchPos = touch.pos - touch.delta;
      love::Vector2 qPrevTouchPos {
        Grid::quantize(prevTouchPos.x, gridSize, touch.initialPos.x),
        Grid::quantize(prevTouchPos.y, gridSize, touch.initialPos.y),
      };
      love::Vector2 qTouchPos {
        Grid::quantize(touch.pos.x, gridSize, touch.initialPos.x),
        Grid::quantize(touch.pos.y, gridSize, touch.initialPos.y),
      };
      move = qTouchPos - qPrevTouchPos;
    }

    // TODO: Undo / redo

    auto &bodyBehavior = scene.getBehaviors().byType<BodyBehavior>();
    for (auto actorId : editor.getSelection().getSelectedActorIds()) {
      bodyBehavior.setProperty(actorId, decltype(BodyComponent::Props::x)::id, move.x, true);
      bodyBehavior.setProperty(actorId, decltype(BodyComponent::Props::y)::id, move.y, true);
    }
    editor.setSelectedComponentStateDirty(BodyBehavior::behaviorId);
  });
}


//
// Draw
//

void GrabTool::drawOverlay(Scene &scene) const {
  if (gridEnabled && gridSize > 0) {
    lv.graphics.setColor({ 0, 0, 0, 0.5 });
    float viewWidth = 10.0;
    // TODO: Use actual editor view position instead of `{ 0, 0 }`
    editor.getGrid().draw(2 * gridSize, -1, scene.getViewScale(), { 0, 0 },
        { 0.5f * viewWidth, scene.getViewYOffset() }, 2, false, 0);
  }
}
