#include "grab.h"

#include "behaviors/all.h"
#include "editor.h"

inline static const TouchToken grabTouchToken;


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

    // TODO: Quantize to grid
    // TODO: Undo / redo

    auto &bodyBehavior = scene.getBehaviors().byType<BodyBehavior>();
    for (auto actorId : selection.getSelectedActorIds()) {
      bodyBehavior.setProperty(actorId, Props::getId("x"), ExpressionValue(touch.delta.x), true);
      bodyBehavior.setProperty(actorId, Props::getId("y"), ExpressionValue(touch.delta.y), true);
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
