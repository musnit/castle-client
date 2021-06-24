#include "selection.h"
#include "behaviors/all.h"
#include "engine.h"

void Selection::applySelection(Scene &scene) {
  for (auto actorId : selection) {
    if (!scene.hasActor(actorId)) {
      deselectActor(actorId);
    }
  }
}

void Selection::selectActorFromHits(const BodyBehavior::ActorsAtTouch &hits) {
  // TODO: prioritize draw order, belt
  // for now just pick first choice
  deselectAllActors();
  if (hits.size() > 0) {
    Debug::log("select actor");
    auto pick = hits.front();
    selectActor(pick);
  }
}

void Selection::touchToSelect(Scene &scene) {
  scene.getGesture().withSingleTouch([&](const Touch &touch) {
    auto &bodyBehavior = scene.getBehaviors().byType<BodyBehavior>();
    auto isShortPress = lv.timer.getTime() - touch.pressTime < 0.2;

    BodyBehavior::ActorsAtTouch hits;
    bodyBehavior.forEachActorAtPoint(
        touch.pos.x, touch.pos.y, [&](ActorId actorId, const b2Fixture *fixture) {
          if (std::find(hits.begin(), hits.end(), actorId) == hits.end()) {
            hits.push_back(actorId);
          }
          return true;
        });

    // Press and move? Check at point and select if nothing already selected there.
    if (!touch.isUsed() && touch.movedNear && isShortPress) {
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
      engine.getEditor().getSelection().deselectAllActors();
      engine.getEditor().getSelection().selectActor(ActorId(params.actorId()));
    }
  }
};
