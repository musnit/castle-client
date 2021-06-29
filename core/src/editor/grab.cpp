#include "grab.h"

#include "behaviors/all.h"
#include "editor.h"


inline static const TouchToken grabTouchToken;


// TODO: Will be used in 'scale rotate' and 'add from blueprint' -- put it somewhere common
static float quantize(float value, float divisor, float start = 0) {
  if (divisor == 0) {
    return value;
  }
  return divisor * std::floor(0.5f + (value - start) / divisor) + start;
}


//
// Constructor, destructor
//

GrabTool::GrabTool(Selection &selection_)
    : selection(selection_) {
}


//
// Update
//

void GrabTool::update(Editor &editor, Scene &scene, double dt) {
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
        quantize(prevTouchPos.x, gridSize, touch.initialPos.x),
        quantize(prevTouchPos.y, gridSize, touch.initialPos.y),
      };
      love::Vector2 qTouchPos {
        quantize(touch.pos.x, gridSize, touch.initialPos.x),
        quantize(touch.pos.y, gridSize, touch.initialPos.y),
      };
      move = qTouchPos - qPrevTouchPos;
    }

    // TODO: Undo / redo

    auto &bodyBehavior = scene.getBehaviors().byType<BodyBehavior>();
    for (auto actorId : selection.getSelectedActorIds()) {
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
  // TODO: Draw grid
}
