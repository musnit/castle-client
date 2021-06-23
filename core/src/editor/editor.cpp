#include "editor.h"
#include "engine.h"
#include "archive.h"
#include "behaviors/all.h"

Editor::Editor(Bridge &bridge_)
    : bridge(bridge_) {
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
  PROP(bool, isTextActorSelected) = false;

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
    scene->getBehaviors().byName("Text", [&](auto &behavior) {
      if (behavior.hasComponent(selection.firstSelectedActorId())) {
        ev.isTextActorSelected = true;
      }
    });
  }
  bridge.sendEvent("EDITOR_GLOBAL_ACTIONS", ev);
};

struct EditorAllBehaviorsEvent {
  struct Behavior {
    struct PropertySpec {
      struct Attribs {
        PROP(std::string, label);
        PROP(float, min);
        PROP(float, max);
        PROP(bool, rulesGet);
        PROP(bool, rulesSet);
        PROP(std::vector<std::string>, allowedValues);
      };

      PROP(std::string, name);
      PROP(std::string, type);
      PROP(Attribs, attribs);
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
      spec.attribs().label = attribs.label_;
      spec.attribs().min = attribs.min_;
      spec.attribs().max = attribs.max_;
      spec.attribs().rulesGet = attribs.rulesGet_;
      spec.attribs().rulesSet = attribs.rulesSet_;
      if (attribs.allowedValues_[0]) {
        for (auto &allowedValue : attribs.allowedValues_) {
          if (!allowedValue) {
            break;
          }
          spec.attribs().allowedValues().push_back(allowedValue);
        }
      }

      elem.propertySpecs().push_back(spec);
    });

    ev.behaviors().push_back(elem);
  });
  bridge.sendEvent("EDITOR_ALL_BEHAVIORS", ev);
};

template<typename C>
struct EditorSelectedComponentEvent {
  PROP(bool, isDisabled) = false;
  PROP(typename C::Props *, props);
};

// send behavior property values for the selected actor's components
void Editor::sendSelectedComponent(int behaviorId) {
  scene->getBehaviors().byId(behaviorId, [&](auto &behavior) {
    using BehaviorType = std::remove_reference_t<decltype(behavior)>;
    auto component = behavior.maybeGetComponent(selection.firstSelectedActorId());
    if (component) {
      using ComponentType = std::remove_reference_t<decltype(*component)>;
      EditorSelectedComponentEvent<ComponentType> ev { component->disabled, &component->props };
      std::string eventName = std::string("EDITOR_SELECTED_COMPONENT:") + BehaviorType::name;
      bridge.sendEvent(eventName.c_str(), ev);
    }
  });
}

struct EditorModifyComponentReceiver {
  inline static const BridgeRegistration<EditorModifyComponentReceiver> registration {
    "EDITOR_MODIFY_COMPONENT"
  };

  struct Params {
    PROP(std::string, behaviorName);
    PROP(
         std::string, action,
         .allowedValues("add", "remove", "set", "enable", "disable", "swap")
         );
    PROP(std::string, propertyName);
    PROP(float, value); // TODO: other types besides float
  } params;

  void receive(Engine &engine) {
    auto action = params.action();
    auto attribs = std::remove_reference_t<decltype(params.action)>::attribs;
    auto actionValid = false;
    for (auto &allowedValue : attribs.allowedValues_) {
      if (!allowedValue) {
        break;
      }
      if (allowedValue == action) {
        actionValid = true;
        break;
      }
    }
    if (!actionValid) {
      Debug::log("Editor received unknown behavior action: {}", action);
      return;
    }
    Debug::log("Editor: {}:{}:{} {}", params.behaviorName(), params.propertyName(), action,
        params.value());
    if (action == "set") {
      engine.getEditor().getScene().getBehaviors().byName(
          params.behaviorName().c_str(), [&](auto &behavior) {
            auto actorId = engine.getEditor().getSelection().firstSelectedActorId();
            auto propId = Props::getId(params.propertyName().c_str());
            ExpressionValue value(params.value());
            behavior.setProperty(actorId, propId, value, false);
          });
    }
    // TODO: add, remove, enable, disable, swap
  }
};

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
