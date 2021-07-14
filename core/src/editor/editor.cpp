#include "editor.h"
#include "engine.h"
#include "archive.h"
#include "behaviors/all.h"

Editor::Editor(Bridge &bridge_)
    : bridge(bridge_) {
  isEditorStateDirty = true;
  isAllBehaviorsStateDirty = true;
  isVariablesStateDirty = true;
  isTagsStateDirty = true;
}

void Editor::clearState() {
  selection.deselectAllActors();
  isEditorStateDirty = true;
  isAllBehaviorsStateDirty = true;
  isVariablesStateDirty = true;
  isTagsStateDirty = true;
}

void Editor::readScene(Reader &reader) {
  scene = std::make_unique<Scene>(bridge, variables, true, &reader);
  isEditorStateDirty = true;
  isAllBehaviorsStateDirty = true;
  isTagsStateDirty = true;
  Debug::log("editor: read scene");
}

void Editor::readVariables(Reader &reader) {
  editVariables.read(reader);
  isEditorStateDirty = true;
  isVariablesStateDirty = true;
};

void Editor::update(double dt) {
  if (scene) {
    // TODO: Update scene when performing
    {
      /* if (scene->isRestartRequested()) {
        sceneArchive.read([&](Reader &reader) {
          reader.obj("snapshot", [&]() {
            scene = std::make_unique<Scene>(bridge, variables, true, &reader);
          });
        });
      }

      Debug::display("fps: {}", lv.timer.getFPS());
      Debug::display("actors: {}", scene->numActors());

      scene->update(dt); */
    }

    // Non-performing update
    {
      // Need to tell scene to update gesture, since we didn't `scene->update()`
      // TODO: Should gesture just be moved out of scene?
      scene->updateGesture();

      selection.touchToSelect(*scene);

      if (selection.isSelectionChanged()) {
        isEditorStateDirty = true;
        isAllBehaviorsStateDirty = true;
        if (selection.hasSelection()) {
          scene->getBehaviors().forEach([&](auto &behavior) {
            auto behaviorId = std::remove_reference_t<decltype(behavior)>::behaviorId;
            selectedComponentStateDirty.insert(behaviorId);
          });
        }
        selection.setSelectionChanged(false);
      }

      // Update current tool
      switch (currentTool) {
      case Tool::Grab:
        grab.update(dt);
        break;
      case Tool::ScaleRotate:
        break;
      }
    }

    maybeSendData();
  }
}

void Editor::draw() {
  if (!scene) {
    return;
  }

  scene->draw();

  auto &bodyBehavior = scene->getBehaviors().byType<BodyBehavior>();

  // Bounding boxes
  {
    const auto drawBodyOutline = [&](ActorId actorId) {
      if (auto body = bodyBehavior.maybeGetPhysicsBody(actorId)) {
        auto bounds = bodyBehavior.getEditorBounds(actorId);
        auto info = bodyBehavior.getRenderInfo(actorId);

        // Multiply here rather than use `love.graphics.scale` to keep line widths unscaled
        bounds.minX() *= info.widthScale;
        bounds.maxX() *= info.widthScale;
        bounds.minY() *= info.heightScale;
        bounds.maxY() *= info.heightScale;

        lv.graphics.push();

        auto [x, y] = body->GetPosition();
        lv.graphics.translate(x, y);
        lv.graphics.rotate(body->GetAngle());

        lv.graphics.rectangle(love::Graphics::DRAW_LINE, bounds.minX(), bounds.minY(),
            bounds.maxX() - bounds.minX(), bounds.maxY() - bounds.minY());

        lv.graphics.pop();
      }
    };

    lv.graphics.push(love::Graphics::STACK_ALL);

    scene->applyViewTransform();

    lv.graphics.setLineWidth(1.25f * scene->getPixelScale());
    lv.graphics.setColor({ 0.8, 0.8, 0.8, 0.8 });
    scene->forEachActor([&](ActorId actorId) {
      drawBodyOutline(actorId);
    });

    lv.graphics.setLineWidth(2 * scene->getPixelScale());
    lv.graphics.setColor({ 0, 1, 0, 0.8 });
    for (auto actorId : selection.getSelectedActorIds()) {
      Debug::display("selected actor {}", actorId);
      drawBodyOutline(actorId);
    }

    lv.graphics.pop();
  }

  // Current tool overlay
  {
    switch (currentTool) {
    case Tool::Grab:
      grab.drawOverlay();
      break;
    case Tool::ScaleRotate:
      break;
    }
  }

  // Debug commands
  Debug::display("{} undos:", commands.undos.size());
  for (auto &command : commands.undos) {
    std::string selectionString;
    for (auto actorId : command.entries[Commands::UNDO].selection) {
      selectionString.append(fmt::format("{} ", entt::to_integral(actorId)));
    }
    Debug::display("  {} actor {}", command.description, selectionString);
  }
  Debug::display("{} redos:", commands.redos.size());
  for (auto &command : commands.redos) {
    std::string selectionString;
    for (auto actorId : command.entries[Commands::DO].selection) {
      selectionString.append(fmt::format("{} ", entt::to_integral(actorId)));
    }
    Debug::display("  {} actor {}", command.description, selectionString);
  }
}

//
// Events
//

struct EditorDidLoadReceiver {
  inline static const BridgeRegistration<EditorDidLoadReceiver> registration { "EDITOR_JS_LOADED" };

  struct Params {
  } params;

  void receive(Engine &engine) {
    Debug::log("engine: js loaded");
    engine.getEditor().editorJSLoaded();
  }
};

void Editor::editorJSLoaded() {
  // send static data which won't change after initial load
  Debug::log("editor: send static data");
  sendRulesData();

  sendSceneSettings();
  // TODO: send behavior specs here (split out component isActive prop)
}

struct EditorGlobalActionsEvent {
  PROP(bool, performing) = false;
  PROP(int, selectedActorId) = -1;
  PROP(bool, isTextActorSelected) = false;

  struct ActionsAvailable {
    PROP(bool, onPlay) = true;
    PROP(bool, onRewind) = false;
    PROP(bool, onUndo) = false;
    PROP(bool, onRedo) = false;
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
    if (!engine.getIsEditing()) {
      return;
    }
    auto &editor = engine.getEditor();

    // TODO: expect keys from `ActionsAvailable`, e.g. onPlay, onRewind, onUndo...
    Debug::log("editor received global action: {}", action);
    if (action == "onUndo") {
      editor.commands.undo();
    } else if (action == "onRedo") {
      editor.commands.redo();
    }
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

  ev.actionsAvailable().onUndo = commands.canUndo();
  ev.actionsAvailable().onRedo = commands.canRedo();

  bridge.sendEvent("EDITOR_GLOBAL_ACTIONS", ev);
};

struct EditorAllBehaviorsEvent {
  struct Behavior {
    struct PropertySpec {
      struct Attribs {
        PROP(std::string, label);
        PROP(std::optional<float>, min);
        PROP(std::optional<float>, max);
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
    PROP(bool, allowsDisableWithoutRemoval);
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
    elem.allowsDisableWithoutRemoval = BehaviorType::allowsDisableWithoutRemoval;
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

struct EditorSelectedRulesComponentEvent {
  PROP(bool, isDisabled) = false;
  PROP(std::string, rulesJson);
};

struct EditorNoComponentEvent {
  PROP(bool, componentNotFound) = true;
};

// send behavior property values for the selected actor's components
void Editor::sendSelectedComponent(int behaviorId) {
  scene->getBehaviors().byId(behaviorId, [&](auto &behavior) {
    using BehaviorType = std::remove_reference_t<decltype(behavior)>;
    auto component = behavior.maybeGetComponent(selection.firstSelectedActorId());
    std::string eventName = std::string("EDITOR_SELECTED_COMPONENT:") + BehaviorType::name;
    if (component) {
      if constexpr (std::is_same_v<RulesBehavior, BehaviorType>) {
        // rules doesn't use Props, send raw rules json instead
        EditorSelectedRulesComponentEvent ev { component->disabled, "" };
        if (component->editData) {
          ev.rulesJson = component->editData->rulesJson;
        }
        bridge.sendEvent("EDITOR_SELECTED_COMPONENT:Rules", ev);
      } else {
        using ComponentType = std::remove_reference_t<decltype(*component)>;
        EditorSelectedComponentEvent<ComponentType> ev { component->disabled, &component->props };
        bridge.sendEvent(eventName.c_str(), ev);
      }
    } else {
      EditorNoComponentEvent ev;
      bridge.sendEvent(eventName.c_str(), ev);
    }
  });
}

const char *Editor::getRulesData(ActorId actorId) {
  auto &behavior = getScene().getBehaviors().byType<RulesBehavior>();
  auto component = behavior.maybeGetComponent(actorId);
  if (component && component->editData) {
    return component->editData->rulesJson.c_str();
  }
  return "";
}

void Editor::setRulesData(ActorId actorId, const char *rulesJson) {
  auto &behavior = getScene().getBehaviors().byType<RulesBehavior>();
  auto component = behavior.maybeGetComponent(actorId);
  if (component) {
    if (rulesJson) {
      auto jsonString = std::string(rulesJson);
      component->editSetRulesJson(jsonString);
    } else {
      auto jsonString = std::string("");
      component->editSetRulesJson(jsonString);
    }
  }
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
    PROP(std::string, propertyType);
    PROP(double, doubleValue);
    PROP(std::string, stringValue);
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
    auto &editor = engine.getEditor();

    auto actorId = editor.getSelection().firstSelectedActorId();
    if (actorId == nullActor) {
      return;
    }

    editor.getScene().getBehaviors().byName(params.behaviorName().c_str(), [&](auto &behavior) {
      using BehaviorType = std::remove_reference_t<decltype(behavior)>;

      if (action == "set") {
        Commands::Params commandParams;
        commandParams.coalesce = true;
        commandParams.coalesceLastOnly = false;
        if constexpr (std::is_same_v<BehaviorType, RulesBehavior>) {
          bool oldHasComponent = behavior.hasComponent(actorId);
          auto oldValueCStr = editor.getRulesData(actorId);
          editor.getCommands().execute(
              "change rules", commandParams,
              [actorId, oldHasComponent, newRulesJson = params.stringValue()](
                  Editor &editor, bool) {
                auto &rulesBehavior = editor.getScene().getBehaviors().byType<RulesBehavior>();
                if (!oldHasComponent) {
                  rulesBehavior.addComponent(actorId);
                  rulesBehavior.enableComponent(actorId);
                  editor.setAllBehaviorsStateDirty();
                }
                editor.setRulesData(actorId, newRulesJson.c_str());
                editor.setSelectedComponentStateDirty(RulesBehavior::behaviorId);
              },
              [actorId, oldHasComponent, oldRulesJson = std::string(oldValueCStr)](
                  Editor &editor, bool) {
                auto &rulesBehavior = editor.getScene().getBehaviors().byType<RulesBehavior>();
                if (!oldHasComponent) {
                  rulesBehavior.removeComponent(actorId);
                  editor.setAllBehaviorsStateDirty();
                }
                editor.setRulesData(actorId, oldRulesJson.c_str());
                editor.setSelectedComponentStateDirty(RulesBehavior::behaviorId);
              });
        } else {
          auto propId = Props::getId(params.propertyName().c_str());
          auto propType = params.propertyType();
          auto description = "change " + params.propertyName();
          if (propType == "string") {
            auto oldValueCStr = behavior.getProperty(actorId, propId).template as<const char *>();
            if (!oldValueCStr) {
              oldValueCStr = "";
            }
            editor.getCommands().execute(
                description, commandParams,
                [actorId, propId, newValue = params.stringValue()](Editor &editor, bool) {
                  auto &behavior = editor.getScene().getBehaviors().byType<BehaviorType>();
                  behavior.setProperty(actorId, propId, newValue.c_str(), false);
                  editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
                },
                [actorId, propId, oldValue = std::string(oldValueCStr)](Editor &editor, bool) {
                  auto &behavior = editor.getScene().getBehaviors().byType<BehaviorType>();
                  behavior.setProperty(actorId, propId, oldValue.c_str(), false);
                  editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
                });
          } else {
            auto oldValue = behavior.getProperty(actorId, propId).template as<double>();
            auto newValue = params.doubleValue();
            Debug::log("{} {} {}", params.propertyName(), oldValue, newValue);
            editor.getCommands().execute(
                description, commandParams,
                [actorId, propId, newValue](Editor &editor, bool) {
                  auto &behavior = editor.getScene().getBehaviors().byType<BehaviorType>();
                  behavior.setProperty(actorId, propId, newValue, false);
                  editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
                },
                [actorId, propId, oldValue](Editor &editor, bool) {
                  auto &behavior = editor.getScene().getBehaviors().byType<BehaviorType>();
                  behavior.setProperty(actorId, propId, oldValue, false);
                  editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
                });
          }
        }
      } else if (action == "enable") {
        static auto description = std::string("enable ") + BehaviorType::displayName;
        editor.getCommands().execute(
            description, {},
            [actorId](Editor &editor, bool) {
              auto &behavior = editor.getScene().getBehaviors().byType<BehaviorType>();
              behavior.enableComponent(actorId);
              editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
            },
            [actorId](Editor &editor, bool) {
              auto &behavior = editor.getScene().getBehaviors().byType<BehaviorType>();
              behavior.disableComponent(actorId);
              editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
            });
      } else if (action == "disable") {
        static auto description = std::string("disable ") + BehaviorType::displayName;
        editor.getCommands().execute(
            description, {},
            [actorId](Editor &editor, bool) {
              auto &behavior = editor.getScene().getBehaviors().byType<BehaviorType>();
              behavior.disableComponent(actorId);
              editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
            },
            [actorId](Editor &editor, bool) {
              auto &behavior = editor.getScene().getBehaviors().byType<BehaviorType>();
              behavior.enableComponent(actorId);
              editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
            });
      } else if (action == "add") {
        static auto description = std::string("add ") + BehaviorType::displayName;
        editor.getCommands().execute(
            description, {},
            [actorId](Editor &editor, bool) {
              auto &behavior = editor.getScene().getBehaviors().byType<BehaviorType>();
              behavior.addComponent(actorId);
              behavior.enableComponent(actorId);
              editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
              editor.setAllBehaviorsStateDirty();
            },
            [actorId](Editor &editor, bool) {
              auto &behavior = editor.getScene().getBehaviors().byType<BehaviorType>();
              behavior.removeComponent(actorId);
              editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
              editor.setAllBehaviorsStateDirty();
            });
      } else if (action == "remove") {
        static auto description = std::string("remove ") + BehaviorType::displayName;
        // TODO(nikki): Generate component blueprint to use in undo
        editor.getCommands().execute(
            description, {},
            [actorId](Editor &editor, bool) {
              auto &behavior = editor.getScene().getBehaviors().byType<BehaviorType>();
              behavior.removeComponent(actorId);
              editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
              editor.setAllBehaviorsStateDirty();
            },
            [actorId](Editor &editor, bool) {
              // TODO(nikki): Restore from component blueprint
              auto &behavior = editor.getScene().getBehaviors().byType<BehaviorType>();
              behavior.addComponent(actorId);
              behavior.enableComponent(actorId);
              editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
              editor.setAllBehaviorsStateDirty();
            });
      }
      editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
      if constexpr (std::is_same_v<BehaviorType, TagsBehavior>) {
        // extra dirty state on tags data
        editor.setTagsStateDirty();
      }
    });
    // TODO: swap
  }
};

struct EditorInspectorActionReceiver {
  inline static const BridgeRegistration<EditorInspectorActionReceiver> registration {
    "EDITOR_INSPECTOR_ACTION"
  };

  struct Params {
    PROP(std::string, action);
  } params;

  void receive(Engine &engine) {
    auto action = params.action();

    Debug::log("editor received inspector action: {}", action);
    if (action == "closeInspector") {
      engine.getEditor().getSelection().deselectAllActors();
    }
  }
};

struct EditorRulesDataEvent {
  PROP(std::vector<RuleEntryData>, triggers);
  PROP(std::vector<RuleEntryData>, responses);
  PROP(std::vector<RuleEntryData>, conditions);
  PROP(std::vector<RuleEntryData>, expressions);
};

void Editor::sendRulesData() {
  EditorRulesDataEvent ev;

  for (auto triggerWriter : RulesBehavior::triggerWriters) {
    RuleEntryData data;
    triggerWriter.write(triggerWriter.name, &data);
    ev.triggers().push_back(data);
  }
  for (auto responseWriter : RulesBehavior::responseWriters) {
    RuleEntryData data;
    responseWriter.write(responseWriter.name, &data);

    // TODO: conditional responses should be converted into boolean expressions.
    // for now, use kludge heuristic of looking for descriptions prefixed with 'If '
    static auto conditionPrefix = std::string("If ");
    if (data.description().compare(0, conditionPrefix.size(), conditionPrefix) == 0) {
      ev.conditions().push_back(data);
    } else {
      ev.responses().push_back(data);
    }
  }
  for (auto expressionWriter : RulesBehavior::expressionWriters) {
    RuleEntryData data;
    expressionWriter.write(expressionWriter.name, &data);
    ev.expressions().push_back(data);
  }

  bridge.sendEvent("EDITOR_RULES_DATA", ev);
}

struct EditorChangeSceneSettingsReceiver {
  inline static const BridgeRegistration<EditorChangeSceneSettingsReceiver> registration {
    "EDITOR_CHANGE_SCENE_SETTINGS"
  };

  struct Params {
    PROP(std::string, action);
    PROP(love::Colorf, colorValue);
    PROP(double, doubleValue);
  } params;

  void receive(Engine &engine) {
    auto action = params.action();
    if (action == "setBackgroundColor") {
      auto colorValue = params.colorValue();
      engine.getEditor().getScene().props.backgroundColor().set(
          colorValue.r, colorValue.g, colorValue.b, colorValue.a);
    }
    engine.getEditor().sendSceneSettings();
  }
};

struct EditorSceneSettingsEvent {
  PROP(Scene::Props *, sceneProperties);
  // TODO: settings for tools, such as grid for grab tool
};

void Editor::sendSceneSettings() {
  EditorSceneSettingsEvent ev;
  ev.sceneProperties = &getScene().props;
  bridge.sendEvent("EDITOR_SCENE_SETTINGS", ev);
};

struct EditorChangeVariablesReceiver {
  inline static const BridgeRegistration<EditorChangeVariablesReceiver> registration {
    "EDITOR_CHANGE_VARIABLES"
  };

  struct Params {
    PROP(std::string, action);
    PROP(std::string, variableId);
    PROP(std::string, name);
    PROP(double, initialValue);
  } params;

  void receive(Engine &engine) {
    auto action = params.action();
    if (action == "add") {
      engine.getEditor().getVariables().add(
          params.name(), params.variableId(), params.initialValue());
    } else if (action == "remove") {
      engine.getEditor().getVariables().remove(params.variableId());
    } else if (action == "update") {
      engine.getEditor().getVariables().update(
          params.variableId(), params.name(), params.initialValue());
    }
    engine.getEditor().setVariablesStateDirty();
  }
};

struct EditorVariablesEvent {
  struct VariableData {
    PROP(std::string, variableId);
    PROP(std::string, name);
    PROP(double, initialValue);
  };
  PROP(std::vector<VariableData>, variables);
};

void Editor::sendVariablesData() {
  EditorVariablesEvent ev;
  editVariables.forEach([&](const EditVariables::Variable &elem) {
    EditorVariablesEvent::VariableData data { elem.variableId, elem.name,
      elem.initialValue.as<double>() };
    ev.variables().push_back(data);
  });
  bridge.sendEvent("EDITOR_VARIABLES", ev);
}

// UI-specific global tags info
struct EditorTagsEvent {
  PROP((std::unordered_map<std::string, std::vector<int> >), tagToActorIds);
};

void Editor::sendTagsData() {
  EditorTagsEvent ev;
  auto &tagsBehavior = getScene().getBehaviors().byType<TagsBehavior>();
  tagsBehavior.map.forEach([&](TagsMap::Token t, TagsMapElem &elem) {
    auto tagString = tagsBehavior.map.getString(t);
    std::vector<int> actorIds;
    for (auto actorId : elem.actorIds) {
      actorIds.push_back(entt::to_integral(actorId));
    }
    ev.tagToActorIds().emplace(*tagString, actorIds);
  });
  bridge.sendEvent("EDITOR_TAGS", ev);
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
  if (isVariablesStateDirty) {
    sendVariablesData();
    isVariablesStateDirty = false;
  }
  if (isTagsStateDirty) {
    sendTagsData();
    isTagsStateDirty = false;
  }
  if (!selectedComponentStateDirty.empty()) {
    for (auto behaviorId : selectedComponentStateDirty) {
      sendSelectedComponent(behaviorId);
    }
    selectedComponentStateDirty.clear();
  }
  scene->getBehaviors().byType<TextBehavior>().maybeSendBridgeData();
}
