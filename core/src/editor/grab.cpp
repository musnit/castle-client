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

void GrabTool::changeSettings(const std::string &action, double value) {
  if (action == "setGridEnabled") {
    props.gridEnabled() = (bool)value;
  } else if (action == "setGridSize") {
    props.gridSize() = float(value);
  }
}


//
// Update
//

void GrabTool::update(double dt) {
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
    if (!touch.isUsed(grabTouchToken) && !fromBelt) {
      // Not used by us yet, let's see if we can use it
      if (touch.isUsed() && !touch.isUsed(Selection::touchToken)) {
        return; // Bail if used by anything other than selection
      }
      if (!touch.movedNear) {
        return; // Need to move at least a bit
      }
      touch.forceUse(grabTouchToken);
    }

    // Calculate position delta, quantizing to grid if it's enabled
    auto delta = touch.delta;
    if (props.gridEnabled()) {
      auto gridSize = props.gridSize();
      auto prevTouchPos = touch.pos - touch.delta;
      love::Vector2 qPrevTouchPos {
        Grid::quantize(prevTouchPos.x, gridSize, touch.initialPos.x),
        Grid::quantize(prevTouchPos.y, gridSize, touch.initialPos.y),
      };
      love::Vector2 qTouchPos {
        Grid::quantize(touch.pos.x, gridSize, touch.initialPos.x),
        Grid::quantize(touch.pos.y, gridSize, touch.initialPos.y),
      };
      delta = qTouchPos - qPrevTouchPos;
    }
    if (!fromBelt && delta == love::Vector2 { 0, 0 }) {
      return;
    }

    auto &bodyBehavior = scene.getBehaviors().byType<BodyBehavior>();

    // Setup lists of positions before and after the edit
    struct ActorPosition {
      ActorId actorId;
      love::Vector2 pos;
    };
    SmallVector<ActorPosition, 2> before;
    SmallVector<ActorPosition, 2> after;
    for (auto actorId : selection.getSelectedActorIds()) {
      love::Vector2 beforePos {
        bodyBehavior.getProperty(actorId, decltype(BodyComponent::Props::x)::id).as<float>(),
        bodyBehavior.getProperty(actorId, decltype(BodyComponent::Props::y)::id).as<float>(),
      };
      before.push_back({ actorId, beforePos });
      after.push_back({ actorId, beforePos + delta });
    }

    // Execute command that sets to before or after positions based on undo / redo. Common code is
    // factored out into `setPositions`.
    static const auto setPositions = [](Editor &editor, const decltype(before) &positions) {
      auto &scene = editor.getScene();
      auto &bodyBehavior = scene.getBehaviors().byType<BodyBehavior>();
      for (auto &[actorId, pos] : positions) {
        bodyBehavior.setPosition(actorId, { pos.x, pos.y });
      }
      editor.setSelectedComponentStateDirty(BodyBehavior::behaviorId);
    };
    if (!fromBelt) {
      // Not placing new actor from belt -- regular move
      Commands::Params commandParams;
      commandParams.coalesce = true;
      editor.getCommands().execute(
          "move", commandParams,
          [after = std::move(after)](Editor &editor, bool) {
            setPositions(editor, after);
          },
          [before = std::move(before)](Editor &editor, bool) {
            setPositions(editor, before);
          });
    } else {
      // Placing new actor from belt -- don't save undos during gesture, just save one final command
      // on release that adds actor at final position. Also cancel the whole process if dragged back
      // into the belt.
      if (!editor.getBelt().isInside(touch)) {
        setPositions(editor, after);
        if (touch.released && !after.empty()) {
          auto actorId = after[0].actorId;
          auto entryId = std::string(scene.maybeGetParentEntryId(actorId));
          auto pos = after[0].pos;
          scene.removeActor(actorId);
          editor.getCommands().execute(
              "add", {},
              [actorId, entryId, pos](Editor &editor, bool) {
                Scene::ActorDesc actorDesc;
                actorDesc.requestedActorId = actorId;
                actorDesc.parentEntryId = entryId.c_str();
                actorDesc.pos = pos;
                editor.getScene().addActor(actorDesc);
              },
              [actorId](Editor &editor, bool) {
                editor.getSelection().deselectActor(actorId);
                editor.getScene().removeActor(actorId);
              });
        }
      } else {
        // Dragged back into belt -- cancel
        for (auto [actorId, pos] : after) {
          scene.removeActor(actorId);
        }
        editor.getSelection().deselectAllActors();
      }
    }
  });
}


//
// Draw
//

void GrabTool::drawOverlay() const {
  if (!editor.hasScene()) {
    return;
  }
  auto &scene = editor.getScene();

  auto gridSize = props.gridSize();
  if (props.gridEnabled() && gridSize > 0) {
    lv.graphics.setColor({ 0, 0, 0, 0.5 });
    editor.getGrid().draw(2 * gridSize, -1, scene.getViewScale(), scene.getCameraPosition(),
        { scene.getCameraSize().x, scene.getViewYOffset() }, 2, false, 0);
  }
}
