#include "scale_rotate.h"

#include "behaviors/all.h"
#include "editor.h"


inline static const TouchToken scaleRotateTouchToken;


//
// Constructor, destructor
//

ScaleRotateTool::ScaleRotateTool(Editor &editor_)
    : editor(editor_) {
}

void ScaleRotateTool::changeSettings(const std::string &action, double value) {
  if (action == "setGridEnabled") {
    props.gridEnabled() = bool(value);
  } else if (action == "setGridSize") {
    props.gridSize() = float(value);
  } else if (action == "setRotateIncrementEnabled") {
    props.rotateIncrementEnabled() = bool(value);
  } else if (action == "setRotateIncrementDegrees") {
    props.rotateIncrementDegrees() = float(value);
  }
}


//
// Update
//

void ScaleRotateTool::update(double dt) {
  if (!editor.hasScene()) {
    return;
  }
  auto &scene = editor.getScene();
  auto &selection = editor.getSelection();

  if (!selection.hasSelection()) {
    return;
  }

  scene.getGesture().withSingleTouch([&](const Touch &touch) {
    auto fromBelt = touch.isUsed(Belt::placedTouchToken);
    if (!touch.isUsed(scaleRotateTouchToken) && !fromBelt) {
      // Not used by us yet, let's see if we can use it
      if (touch.isUsed() && !touch.isUsed(Selection::touchToken)) {
        return; // Bail if used by anything other than selection
      }
      if (!touch.movedNear) {
        return; // Need to move at least a bit
      }
      touch.forceUse(scaleRotateTouchToken);
    }
  });
}


//
// Draw
//

void ScaleRotateTool::drawOverlay() const {
  if (!editor.hasScene()) {
    return;
  }
  auto &scene = editor.getScene();

  auto gridSize = props.gridSize();
  if (props.gridEnabled() && gridSize > 0) {
    lv.graphics.setColor({ 0, 0, 0, 0.5 });
    editor.getGrid().draw(gridSize, -1, scene.getViewScale(), scene.getCameraPosition(),
        { 0.5f * scene.getCameraSize().x, scene.getViewYOffset() }, 2, false);
  }

  Debug::display("scale / rotate tool!");
}
