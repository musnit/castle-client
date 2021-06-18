#include "editor.h"
#include "behaviors/all.h"

Editor::Editor(Bridge &bridge_, Lv &lv_)
    : bridge(bridge_)
    , lv(lv_) {
  isEditorStateDirty = true;
  isAllBehaviorsStateDirty = true;
}

void Editor::readScene(Reader &reader) {
  scene = std::make_unique<Scene>(bridge, variables, &reader);
  isEditorStateDirty = true;
  isAllBehaviorsStateDirty = true;
  Debug::log("editor: read scene");
}

void Editor::readVariables(Reader &reader) {
  variables.read(reader);
  isEditorStateDirty = true;
};

void Editor::update(double dt) {
  if (scene) {
    // TODO: Update scene when performing
    /* if (scene->isRestartRequested()) {
      sceneArchive.read([&](Reader &reader) {
        reader.obj("snapshot", [&]() {
          scene = std::make_unique<Scene>(bridge, variables, &reader);
        });
      });
    }

    Debug::display("fps: {}", lv.timer.getFPS());
    Debug::display("actors: {}", scene->numActors());

    scene->update(dt); */

    // TODO: select when not performing
    scene->updateGesture();
    selection.touchToSelect(*scene);
    if (selection.isSelectionChanged()) {
      isEditorStateDirty = true;
      isAllBehaviorsStateDirty = true;
    }
    
    maybeSendData();
  }
}

void Editor::draw() {
  if (scene) {
    scene->draw();
  }
}

//
// Events
//

struct EditorGlobalActionsEvent {
  PROP(bool, performing) = false;
  PROP(int, selectedActorId) = -1;

  struct ActionsAvailable {
    PROP(bool, onPlay) = true;
    PROP(bool, onRewind) = false;
  };
  PROP(ActionsAvailable, actionsAvailable);
};

struct EditorGlobalActionReceiver {
  inline static const BridgeRegistration<EditorGlobalActionReceiver> registration {
    "EDITOR_GLOBAL_ACTION"
  };

  struct Params {
    PROP(std::string, action);
  } params;

  void receive(Engine &engine) {
    auto action = params.action();

    // TODO: expect keys from `ActionsAvailable`, e.g. onPlay, onRewind, onUndo...
    Debug::log("editor received global action: {}", action);
  }
};

struct EditorAllBehaviorsEvent {
  struct Behavior {
    PROP(int, behaviorId);
    PROP(std::string, name);
    PROP(std::string, displayName);
    PROP(bool, isActive) = false;
    // TODO: PROP(std::vector<std::string>, dependencies);
    // TODO: propertySpecs
  };
  PROP(std::vector<Behavior>, behaviors);
};

void Editor::maybeSendData() {
  if (isEditorStateDirty) {
    EditorGlobalActionsEvent ev;
    if (selection.hasSelection()) {
      ev.selectedActorId = entt::to_integral(selection.firstSelectedActorId());
    }
    bridge.sendEvent("EDITOR_GLOBAL_ACTIONS", ev);
    isEditorStateDirty = false;
  }
  if (isAllBehaviorsStateDirty) {
    EditorAllBehaviorsEvent ev;
    scene->getBehaviors().forEach([&](auto &behavior) {
      EditorAllBehaviorsEvent::Behavior elem;
      elem.behaviorId = std::remove_reference_t<decltype(behavior)>::behaviorId;
      elem.name = std::remove_reference_t<decltype(behavior)>::name;
      elem.displayName = std::remove_reference_t<decltype(behavior)>::displayName;
      if (selection.hasSelection()) {
        elem.isActive = behavior.hasComponent(selection.firstSelectedActorId());
      }
      ev.behaviors().push_back(elem);
    });
    bridge.sendEvent("EDITOR_ALL_BEHAVIORS", ev);
    isAllBehaviorsStateDirty = false;
  }
}
