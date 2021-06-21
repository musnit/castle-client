#include "editor.h"
#include "archive.h"
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
      if (selection.hasSelection()) {
        auto selectedActorId = selection.firstSelectedActorId();
        scene->getBehaviors().forEach([&](auto &behavior) {
          if (behavior.hasComponent(selectedActorId)) {
            auto behaviorId = std::remove_reference_t<decltype(behavior)>::behaviorId;
            selectedComponentStateDirty.insert(behaviorId);
          }
        });
      }
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

void Editor::sendGlobalActions() {
  EditorGlobalActionsEvent ev;
  if (selection.hasSelection()) {
    ev.selectedActorId = entt::to_integral(selection.firstSelectedActorId());
  }
  bridge.sendEvent("EDITOR_GLOBAL_ACTIONS", ev);
};

struct EditorAllBehaviorsEvent {
  struct Behavior {
    struct PropertySpec {
      PROP(std::string, name);
      PROP(std::string, type);
      PROP(std::string, label);
      PROP(float, min);
      PROP(float, max);
      PROP(bool, rulesGet);
      PROP(bool, rulesSet);
      PROP(std::vector<std::string>, allowedValues);
    };
    
    PROP(int, behaviorId);
    PROP(std::string, name);
    PROP(std::string, displayName);
    PROP(bool, isActive) = false;
    PROP(std::vector<PropertySpec>, propertySpecs);
  };
  PROP(std::vector<Behavior>, behaviors);
};

void Editor::sendAllBehaviors() {
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
      constexpr auto &attribs = Prop::attribs;

      EditorAllBehaviorsEvent::Behavior::PropertySpec spec;
      spec.name = Prop::name;
      spec.type = prop.getType();
      spec.label = attribs.label_;
      spec.min = attribs.min_;
      spec.max = attribs.max_;
      spec.rulesGet = attribs.rulesGet_;
      spec.rulesSet = attribs.rulesSet_;
      if (attribs.allowedValues_[0]) {
        for (auto &allowedValue : attribs.allowedValues_) {
          if (!allowedValue) {
            break;
          }
          spec.allowedValues().push_back(allowedValue);
        }
      }
      
      elem.propertySpecs().push_back(spec);
    });
    
    ev.behaviors().push_back(elem);
   });
   bridge.sendEvent("EDITOR_ALL_BEHAVIORS", ev);
};

struct EditorSelectedComponentEvent {
  PROP(bool, isDisabled) = false;
  PROP(std::string, properties);
};

// send behavior property values for the selected actor's components
void Editor::sendSelectedComponent(int behaviorId) {
  scene->getBehaviors().byId(behaviorId, [&](auto &behavior) {
    using BehaviorType = std::remove_reference_t<decltype(behavior)>;
    auto component = behavior.maybeGetComponent(selection.firstSelectedActorId());
    if (component) {
      EditorSelectedComponentEvent ev;
      ev.isDisabled = component->disabled;

      // TODO: maybe template the Event over this Component in order to embed props directly
      Archive ar;
      ar.write([&](Archive::Writer &writer) {
        // writer.write(component->props);
        writer.write((const decltype(component->props) &)component->props);
      });
      ev.properties = ar.toJson();

      std::string eventName = std::string("EDITOR_SELECTED_COMPONENT:") + BehaviorType::name;
      bridge.sendEvent(eventName.c_str(), ev);
    }
  });
}

void Editor::maybeSendData() {
  if (isEditorStateDirty) {
    sendGlobalActions();
    isEditorStateDirty = false;
  }
  if (isAllBehaviorsStateDirty) {
    sendAllBehaviors();
    isAllBehaviorsStateDirty = false;
  }
  if (!selectedComponentStateDirty.empty()) {
    for (auto behaviorId : selectedComponentStateDirty) {
      sendSelectedComponent(behaviorId);
    }
    selectedComponentStateDirty.clear();
  }
}
