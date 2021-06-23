#pragma once

#include "precomp.h"
#include "bridge.h"
#include "scene.h"
#include "variables.h"
#include "selection.h"
#include "grab.h"

class Editor {
  // manages a scene instance that is being edited.

public:
  Editor(const Editor &) = delete; // Prevent accidental copies
  const Editor &operator=(const Editor &) = delete;

  explicit Editor(Bridge &bridge_);

  void update(double dt);
  void draw();

  void readScene(Reader &reader);
  void readVariables(Reader &reader);

  bool hasScene();
  Scene &getScene();

  Selection &getSelection();
  void setSelectedComponentStateDirty(int behaviorId);

private:
  Lv &lv { Lv::getInstance() };
  Bridge &bridge;

  Variables variables;

  Archive sceneArchive;
  std::unique_ptr<Scene> scene;

  Selection selection;

  enum class Tool {
    Grab,
    ScaleRotate,
  };
  Tool currentTool = Tool::Grab;
  GrabTool grab { selection };

  // events and data
  void maybeSendData();

  bool isEditorStateDirty;
  void sendGlobalActions();

  bool isAllBehaviorsStateDirty;
  void sendAllBehaviors();

  // behaviorId present indicates dirty state for selected actor
  std::set<int> selectedComponentStateDirty;
  void sendSelectedComponent(int behaviorId);
};

inline bool Editor::hasScene() {
  return !!scene;
}

inline Scene &Editor::getScene() {
  return *scene;
}

inline Selection &Editor::getSelection() {
  return selection;
}

inline void Editor::setSelectedComponentStateDirty(int behaviorId) {
  selectedComponentStateDirty.insert(behaviorId);
};
