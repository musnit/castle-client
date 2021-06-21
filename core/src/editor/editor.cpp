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
    struct PropertySpec {
      PROP(std::string, name);
      PROP(std::string, type);
    };
    
    PROP(int, behaviorId);
    PROP(std::string, name);
    PROP(std::string, displayName);
    PROP(bool, isActive) = false;
    PROP(std::vector<PropertySpec>, propertySpecs);
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
      using BehaviorType = std::remove_reference_t<decltype(behavior)>;
      EditorAllBehaviorsEvent::Behavior elem;
      elem.behaviorId = BehaviorType::behaviorId;
      elem.name = BehaviorType::name;
      elem.displayName = BehaviorType::displayName;
      if (selection.hasSelection()) {
        elem.isActive = behavior.hasComponent(selection.firstSelectedActorId());
      }

      static typename BehaviorType::ComponentType emptyComponent;
      Props::forEach(emptyComponent.props, [&](auto &prop) {
        using Prop = std::remove_reference_t<decltype(prop)>;
        EditorAllBehaviorsEvent::Behavior::PropertySpec spec;
        spec.name = Prop::name;
        spec.type = prop.getType();

        elem.propertySpecs().push_back(spec);
      });

      ev.behaviors().push_back(elem);
    });
    bridge.sendEvent("EDITOR_ALL_BEHAVIORS", ev);
    isAllBehaviorsStateDirty = false;
  }
}
