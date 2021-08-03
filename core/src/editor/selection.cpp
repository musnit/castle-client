#include "selection.h"
#include "behaviors/all.h"
#include "engine.h"
#include "library.h"

void Selection::deselectAllActors(bool deselectBelt) {
  if (deselectBelt) {
    belt.deselect();
  }
  if (!selection.empty()) {
    if (deselectBelt) {
      selection.clear();
    } else {
      auto &scene = editor.getScene();
      for (auto actorId : selection) {
        if (!scene.isGhost(actorId)) {
          selection.remove(actorId);
        }
      }
    }
    selectionChanged = true;
  }
}

void Selection::applySelection(Scene &scene) {
  for (auto actorId : selection) {
    if (!scene.hasActor(actorId)) {
      deselectActor(actorId);
    }
  }
}

bool Selection::isGhostActorsSelected() {
  auto &scene = editor.getScene();
  for (auto actorId : selection) {
    if (!scene.isGhost(actorId)) {
      // we have some non-ghost actor in the selection
      return false;
    }
  }
  return hasSelection();
}

void Selection::selectGhostActorForActor(ActorId actorId) {
  auto &scene = editor.getScene();
  if (!scene.isGhost(actorId)) {
    if (auto parentEntryId = scene.maybeGetParentEntryId(actorId)) {
      auto &library = scene.getLibrary();
      if (auto selectedEntry = library.maybeGetEntry(parentEntryId)) {
        auto ghostActorId = selectedEntry->getGhostActorId();
        if (!selection.contains(ghostActorId)) {
          selection.clear();
          selectActor(ghostActorId);
        }
      }
    }
  }
}

void Selection::selectActorFromHits(const BodyBehavior::ActorsAtTouch &hits) {
  ActorId pick = nullActor;
  if (auto nHits = int(hits.size()); nHits > 0) {
    for (auto i = nHits - 1; i >= 0; --i) {
      auto nextI = i == 0 ? nHits - 1 : i - 1;
      if (isSelected(hits[i])) {
        pick = hits[nextI];
      }
    }
    pick = pick != nullActor ? pick : hits.back();
  }
  deselectAllActors();
  if (pick != nullActor) {
    selectActor(pick);
  }
}

void Selection::touchToSelect(Scene &scene) {
  scene.getGesture().withSingleTouch([&](const Touch &touch) {
    auto &bodyBehavior = scene.getBehaviors().byType<BodyBehavior>();
    auto isShortPress = lv.timer.getTime() - touch.pressTime < 0.2;

    // Get hits sorted in selection order
    BodyBehavior::ActorsAtTouch hits;
    bodyBehavior.forEachActorAtPoint(
        touch.pos.x, touch.pos.y, [&](ActorId actorId, const b2Fixture *fixture) {
          if (std::find(hits.begin(), hits.end(), actorId) == hits.end()) {
            hits.push_back(actorId);
          }
          return true;
        });
    std::sort(hits.begin(), hits.end(), [&](ActorId a, ActorId b) {
      // TODO(nikki): Prefer actors associated with currently selected belt entry
      auto maybeDrawOrderA = scene.maybeGetDrawOrder(a);
      auto maybeDrawOrderB = scene.maybeGetDrawOrder(b);
      if (maybeDrawOrderA && !maybeDrawOrderB) {
        return true;
      }
      if (maybeDrawOrderB && !maybeDrawOrderA) {
        return false;
      }
      return *maybeDrawOrderA < *maybeDrawOrderB;
    });

    // Press and move? Check at point and select if nothing already selected there.
    if (!touch.isUsed() && touch.movedNear && isShortPress) {
      // TODO: This should maybe use `touch.initialPos` vs. `touch.pos` since user meant to select
      //       where the touch started dragging, not where it is now (may have left actor bounds).
      //       `touch.initialPos` is what we used in Lua too.
      auto touchesExistingSelection = false;
      for (auto actorId : hits) {
        if (selection.contains(actorId)) {
          touchesExistingSelection = true;
          break;
        }
      }
      if (!touchesExistingSelection) {
        selectActorFromHits(hits);
        touch.use(touchToken);
        applySelection(scene);
      }
    }

    // Quick press and release without moving? Select!
    if (!touch.isUsed() && touch.released && !touch.movedNear && isShortPress) {
      selectActorFromHits(hits);
      touch.use(touchToken);
      applySelection(scene);
    }
  });
}

//
// Events
//

struct SelectActorEditReceiver {
  inline static const BridgeRegistration<SelectActorEditReceiver> registration { "SELECT_ACTOR" };

  struct Params {
    PROP(int, actorId) = -1;
  } params;

  void receive(Engine &engine) {
    if (engine.getIsEditing()) {
      engine.maybeGetEditor()->getSelection().deselectAllActors();
      engine.maybeGetEditor()->getSelection().selectActor(ActorId(params.actorId()));
    }
  }
};

struct SelectBlueprintReceiver {
  inline static const BridgeRegistration<SelectBlueprintReceiver> registration {
    "SELECT_BLUEPRINT"
  };

  struct Params {
  } params;

  void receive(Engine &engine) {
    if (engine.getIsEditing()) {
      auto &selection = engine.maybeGetEditor()->getSelection();
      if (selection.hasSelection()) {
        auto actorId = selection.firstSelectedActorId();
        selection.selectGhostActorForActor(actorId);
      }
    }
  }
};
