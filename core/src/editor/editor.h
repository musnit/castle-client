#pragma once

#include "precomp.h"
#include "bridge.h"
#include "scene.h"
#include "variables.h"
#include "edit_variables.h"
#include "selection.h"
#include "grab.h"
#include "draw/draw_tool.h"
#include "grid.h"
#include "commands.h"
#include "belt.h"

class Editor {
  // manages a scene instance that is being edited.

public:
  Editor(const Editor &) = delete; // Prevent accidental copies
  const Editor &operator=(const Editor &) = delete;

  explicit Editor(Bridge &bridge_);

  void editorJSLoaded();
  void clearState();

  void update(double dt);
  void draw();

  void readScene(Reader &reader);
  void readVariables(Reader &reader);

  bool hasScene();
  Scene &getScene();

  Belt &getBelt();

  Selection &getSelection();
  void setEditorStateDirty();
  void setSelectedActorStateDirty();
  void setSelectedComponentStateDirty(int behaviorId);
  void sendTagsData();
  void sendSceneSettings();

  Commands &getCommands();
  EditVariables &getVariables();

  Grid &getGrid();
  GrabTool &getGrabTool();
  Bridge &getBridge();

  // top-level editor mode
  enum class EditMode {
    Default, // arrange actors and inspect their behaviors/properties
    Draw, // edit an actor's drawing
  };
  EditMode getEditMode();

  enum class Tool {
    Grab,
    ScaleRotate,
  };
  Tool getCurrentTool() const;
  void setCurrentTool(Tool tool);

  struct UpdateBlueprintParams {
    const char *newTitle = nullptr;
  };
  void updateBlueprint(ActorId actorId, UpdateBlueprintParams params);

private:
  friend struct EditorGlobalActionReceiver;
  friend struct EditorInspectorActionReceiver;
  friend struct DrawToolSelectSubtoolReceiver;
  friend struct DrawToolSelectColorReceiver;
  friend struct DrawToolLayerActionReceiver;

  Lv &lv { Lv::getInstance() };
  Bridge &bridge;

  Variables variables;
  EditVariables editVariables;

  Archive sceneArchive;
  std::unique_ptr<Scene> scene;

  Commands commands { *this };
  EditMode editMode = EditMode::Default;

  // 'Default'-mode members
  bool isInspectorOpen = false;

  Belt belt { *this };
  Selection selection { *this, belt };
  Grid grid;

  Tool currentTool = Tool::Grab;
  GrabTool grab { *this };

  // 'Draw'-mode members
  DrawTool drawTool { *this };

  // events and data
  void maybeSendData();

  bool isEditorStateDirty;
  void sendGlobalActions();

  bool isSelectedActorStateDirty;
  void sendSelectedActorData();

  void sendAllBehaviorsData();
  void sendRulesData();

  // behaviorId present indicates dirty state for selected actor
  std::set<int> selectedComponentStateDirty;
  void sendSelectedComponent(int behaviorId);
};

inline bool Editor::hasScene() {
  return !!scene;
}

inline Scene &Editor::getScene() {
  // TODO: Consider refactoring to `maybeGetScene` that returns possibly `nullptr` to encourage
  //       callsites to check
  return *scene;
}

inline Belt &Editor::getBelt() {
  return belt;
}

inline Selection &Editor::getSelection() {
  return selection;
}

inline void Editor::setSelectedComponentStateDirty(int behaviorId) {
  selectedComponentStateDirty.insert(behaviorId);
}

inline void Editor::setEditorStateDirty() {
  isEditorStateDirty = true;
}

inline void Editor::setSelectedActorStateDirty() {
  isSelectedActorStateDirty = true;
}

inline Commands &Editor::getCommands() {
  return commands;
}

inline EditVariables &Editor::getVariables() {
  return editVariables;
}

inline Grid &Editor::getGrid() {
  return grid;
}

inline GrabTool &Editor::getGrabTool() {
  return grab;
}

inline Bridge &Editor::getBridge() {
  return bridge;
}

inline Editor::EditMode Editor::getEditMode() {
  return editMode;
}

inline Editor::Tool Editor::getCurrentTool() const {
  return currentTool;
}

inline void Editor::setCurrentTool(Tool tool) {
  currentTool = tool;
}
