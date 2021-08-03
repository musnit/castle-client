#pragma once

#include "precomp.h"
#include "scene.h"
#include "behaviors/body.h"
#include "belt.h"
#include "scene.h"

class Editor;

class Selection {
public:
  Selection(const Selection &) = delete; // Prevent accidental copies
  const Selection &operator=(const Selection &) = delete;

  explicit Selection(Editor &editor_, Belt &belt_);

  void touchToSelect(Scene &scene);

  bool hasSelection();
  bool isSelectionChanged();
  void setSelectionChanged(bool selectionChanged);
  ActorIdSet &getSelectedActorIds();
  ActorId firstSelectedActorId();
  bool isSelected(ActorId actorId);

  void selectActor(ActorId actorId);
  void deselectActor(ActorId actorId);
  void deselectAllActors(bool deselectBelt = true);
  void selectGhostActorForActor(ActorId actorId);

  bool isGhostActorsSelected();

  inline static const TouchToken touchToken;

private:
  Lv &lv { Lv::getInstance() };
  Editor &editor;
  Belt &belt;
  ActorIdSet selection;

  void applySelection(Scene &scene);
  void selectActorFromHits(const BodyBehavior::ActorsAtTouch &hits);
  bool selectionChanged = false;
};

inline Selection::Selection(Editor &editor_, Belt &belt_)
    : editor(editor_)
    , belt(belt_) {
}

inline ActorIdSet &Selection::getSelectedActorIds() {
  return selection;
}

inline ActorId Selection::firstSelectedActorId() {
  if (hasSelection()) {
    return *(selection.begin());
  }
  return nullActor;
}

inline bool Selection::isSelected(ActorId actorId) {
  return selection.contains(actorId);
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
  if (!selection.contains(actorId)) {
    selection.emplace(actorId);
    selectionChanged = true;
  }
}

inline void Selection::deselectActor(ActorId actorId) {
  if (selection.contains(actorId)) {
    selection.remove(actorId);
    selectionChanged = true;
  }
}
