#pragma once

#include "precomp.h"
#include "bridge.h"
#include "scene.h"
#include "variables.h"
#include "edit_variables.h"
#include "selection.h"
#include "grab.h"
#include "scale_rotate.h"
#include "draw/draw_tool.h"
#include "sound/sound_tool.h"
#include "text/text_tool.h"
#include "grid.h"
#include "commands.h"
#include "belt.h"
#include "player.h"
#include "capture.h"

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
  void loadEmptyScene();

  bool hasScene();
  Scene &getScene();
  bool getIsPlaying();
  void setIsPlaying(bool playing_);
  Player *maybeGetPlayer();
  void maybeLoadPlayerSnapshot(const char *json);
  void setClockProps();

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
  ScaleRotateTool &getScaleRotateTool();
  Bridge &getBridge();

  // top-level editor mode
  enum class EditMode {
    Default, // arrange actors and inspect their behaviors/properties
    Draw, // edit an actor's drawing
    Sound, // edit sound and music data
    Text, // edit text properties
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
    bool updateBase64Png = false;
    bool applyLayout = false;
  };
  void updateBlueprint(ActorId actorId, UpdateBlueprintParams params);
  void updateActorsWithEntryId(
      const std::string &entryId, UpdateBlueprintParams params, ActorId skipActorId = nullActor);

  void triggerAutoSave();
  bool isInspectorOpen = false;
  bool androidHandleBackPressed();

private:
  friend struct EditorGlobalActionReceiver;
  friend struct EditorInspectorActionReceiver;
  friend struct DrawToolSelectSubtoolReceiver;
  friend struct DrawToolSelectColorReceiver;
  friend struct DrawToolLayerActionReceiver;
  friend struct DrawToolClearArtworkReceiver;
  friend struct DrawToolClearCollisionShapesReceiver;
  friend struct DrawToolViewInContextReceiver;
  friend struct DrawToolTmpGridSettingsReceiver;
  friend struct ImportImageActionReceiver;
  friend struct SoundToolSetDataReceiver;
  friend struct SoundToolSceneMusicReceiver;
  friend struct SoundToolActionReceiver;
  friend struct SoundToolSetSubtoolReceiver;
  friend struct TrackToolChangeInstrumentReceiver;
  friend struct TrackToolChangePatternReceiver;

  Lv &lv { Lv::getInstance() };
  Bridge &bridge;

  Variables variables; // Stub empty instance that we can pass to our edited scene
  EditVariables editVariables;

  Clock clock;
  Sound sound;

  bool playing = false;
  std::unique_ptr<Scene> scene; // The edited version of the scene, non-`null` once data is loaded
  std::unique_ptr<Player> player; // Only non-`null` when playing

  Commands commands { *this };
  EditMode editMode = EditMode::Default;

  // 'Default'-mode members
  Belt belt { *this };
  Selection selection { *this, belt };
  Grid grid;

  Tool currentTool = Tool::Grab;
  GrabTool grab { *this };
  ScaleRotateTool scaleRotate { *this };

  // Other modes
  DrawTool drawTool { *this };
  SoundTool soundTool { *this };
  TextTool textTool { *this };

  bool defaultViewApplied = false;
  std::pair<float, float> getDefaultView(); // Width and y offset -- could refactor into a struct

  // events and data
  void maybeSendData(double dt);

  bool isEditorStateDirty;
  void sendGlobalActions();

  void sendLibrary();

  bool isSelectedActorStateDirty;
  void sendSelectedActorData();

  void sendAllBehaviorsData();
  void sendRulesData();

  // behaviorId present indicates dirty state for selected actor
  std::set<int> selectedComponentStateDirty;
  void sendSelectedComponent(int behaviorId);

  std::unique_ptr<Capture> capture;

  float autoSaveCountdown = 0; // If `> 0`, auto-save after this much time in seconds
  void updateAutoSave(double dt);

  void save();
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

inline ScaleRotateTool &Editor::getScaleRotateTool() {
  return scaleRotate;
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

inline void Editor::triggerAutoSave() {
  autoSaveCountdown = 0.2;
}

inline bool Editor::getIsPlaying() {
  return playing;
}

inline Player *Editor::maybeGetPlayer() {
  return player.get();
}
