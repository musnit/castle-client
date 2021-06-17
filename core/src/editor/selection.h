#pragma once

#include "precomp.h"
#include "scene.h"
#include "behaviors/body.h"

class Selection {
public:
  Selection(const Selection &) = delete; // Prevent accidental copies
  const Selection &operator=(const Selection &) = delete;

  Selection() {}

  void touchToSelect(Scene &scene);

  bool hasSelection();
  ActorIdSet &getSelectedActorIds();
  
  void selectActor(ActorId actorId);
  void deselectActor(ActorId actorId);
  void deselectAllActors();

private:
  Lv &lv { Lv::getInstance() };
  ActorIdSet selection;

  void applySelection(Scene &scene);
  void selectActorFromHits(const BodyBehavior::ActorsAtTouch &hits);
};

inline ActorIdSet &Selection::getSelectedActorIds() {
  return selection;
}

inline bool Selection::hasSelection() {
  return selection.empty();
}

inline void Selection::selectActor(ActorId actorId) {
  if (!selection.contains(actorId)) {
    selection.emplace(actorId);
  }
}

inline void Selection::deselectActor(ActorId actorId) {
  if (selection.contains(actorId)) {
    selection.remove(actorId);
  }
}

inline void Selection::deselectAllActors() {
  selection.clear();
}
