#pragma once

#include "precomp.h"
#include "scene.h"
#include "behaviors/body.h"

class Selection {
public:
  Selection(const Selection &) = delete; // Prevent accidental copies
  const Selection &operator=(const Selection &) = delete;

  Selection() = default;

  void touchToSelect(Scene &scene);

  bool hasSelection();
  bool isSelectionChanged();
  void setSelectionChanged(bool selectionChanged);
  ActorIdSet &getSelectedActorIds();
  ActorId firstSelectedActorId();

  void selectActor(ActorId actorId);
  void deselectActor(ActorId actorId);
  void deselectAllActors();

  inline static const TouchToken touchToken;

private:
  Lv &lv { Lv::getInstance() };
  ActorIdSet selection;

  void applySelection(Scene &scene);
  void selectActorFromHits(const BodyBehavior::ActorsAtTouch &hits);
  bool selectionChanged = false;
};

inline ActorIdSet &Selection::getSelectedActorIds() {
  return selection;
}

inline ActorId Selection::firstSelectedActorId() {
  if (hasSelection()) {
    return *(selection.begin());
  }
  return entt::null;
}

inline bool Selection::hasSelection() {
  return !selection.empty();
}

inline bool Selection::isSelectionChanged() {
  return selectionChanged;
}

inline void Selection::setSelectionChanged(bool selectionChanged_) {
  selectionChanged = selectionChanged_;
}

inline void Selection::selectActor(ActorId actorId) {
  selectionChanged = true;
  if (!selection.contains(actorId)) {
    selection.emplace(actorId);
  }
}

inline void Selection::deselectActor(ActorId actorId) {
  selectionChanged = true;
  if (selection.contains(actorId)) {
    selection.remove(actorId);
  }
}

inline void Selection::deselectAllActors() {
  selectionChanged = true;
  selection.clear();
}
