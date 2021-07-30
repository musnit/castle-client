#include "editor.h"
#include "engine.h"
#include "archive.h"
#include "behaviors/all.h"

Editor::Editor(Bridge &bridge_)
    : bridge(bridge_) {
  isEditorStateDirty = true;
  isSelectedActorStateDirty = true;
}

void Editor::clearState() {
  editMode = EditMode::Default;
  selection.deselectAllActors();
  belt.deselect();
  isEditorStateDirty = true;
  isSelectedActorStateDirty = true;
  currentTool = Tool::Grab;
  drawTool.resetState();
}

void Editor::readScene(Reader &reader) {
  scene = std::make_unique<Scene>(bridge, variables, true, &reader);
  isEditorStateDirty = true;
  isSelectedActorStateDirty = true;
  Debug::log("editor: read scene");
}

void Editor::readVariables(Reader &reader) {
  editVariables.read(reader);
  isEditorStateDirty = true;
};

void Editor::update(double dt) {
  if (!scene) {
    return;
  }
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

    switch (editMode) {
    case EditMode::Default: {
      selection.touchToSelect(*scene);

      if (selection.isSelectionChanged()) {
        isEditorStateDirty = true;
        isSelectedActorStateDirty = true;
        if (selection.hasSelection()) {
          scene->getBehaviors().forEach([&](auto &behavior) {
            auto behaviorId = std::remove_reference_t<decltype(behavior)>::behaviorId;
            selectedComponentStateDirty.insert(behaviorId);
          });
        }
        selection.setSelectionChanged(false);
      }

      // Update belt -- do this before tools to allow it to steal touches
      belt.update(dt);

      // Update current tool
      switch (currentTool) {
      case Tool::Grab:
        grab.update(dt);
        break;
      case Tool::ScaleRotate:
        break;
      }

      break; // EditMode::Default
    }
    case EditMode::Draw:
      drawTool.update(dt);
      break;
    }
  }

  maybeSendData();
}

void Editor::draw() {
  if (!scene) {
    return;
  }

  if (editMode == EditMode::Draw) {
    drawTool.drawOverlay();
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

  // Belt
  belt.drawOverlay();

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
    if (engine.getIsEditing()) {
      engine.maybeGetEditor()->editorJSLoaded();
    }
  }
};

void Editor::editorJSLoaded() {
  // send static data which won't change after initial load
  Debug::log("editor: send static data");
  sendRulesData();
  sendAllBehaviorsData();

  // send initial data that will only change rarely
  sendSceneSettings();
  getVariables().sendVariablesData(getBridge());
  sendTagsData();
  drawTool.sendDrawToolEvent();
}

struct EditorGlobalActionsEvent {
  PROP(bool, performing) = false;
  PROP(int, selectedActorId) = -1;
  PROP(bool, isTextActorSelected) = false;
  PROP(bool, isBlueprintSelected) = false;
  PROP(std::string, editMode);

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
    PROP(std::string, value);
  } params;

  void receive(Engine &engine) {
    auto action = params.action();
    if (!engine.getIsEditing()) {
      return;
    }
    auto editor = engine.maybeGetEditor();

    // TODO: expect keys from `ActionsAvailable`, e.g. onPlay, onRewind, onUndo...
    Debug::log("editor received global action: {}", action);
    if (action == "onUndo") {
      editor->commands.undo();
    } else if (action == "onRedo") {
      editor->commands.redo();
    } else if (action == "setMode") {
      auto newMode = params.value();
      if (newMode == "draw") {
        editor->editMode = Editor::EditMode::Draw;
      } else if (newMode == "default") {
        editor->editMode = Editor::EditMode::Default;
        editor->currentTool = Editor::Tool::Grab;
      }
      editor->isEditorStateDirty = true;
    }
  }
};

void Editor::sendGlobalActions() {
  if (!scene) {
    return;
  }
  EditorGlobalActionsEvent ev;
  if (selection.hasSelection()) {
    ev.selectedActorId = entt::to_integral(selection.firstSelectedActorId());
    ev.isBlueprintSelected = selection.isBlueprintSelected();
    scene->getBehaviors().byName("Text", [&](auto &behavior) {
      if (behavior.hasComponent(selection.firstSelectedActorId())) {
        ev.isTextActorSelected = true;
      }
    });
  }

  ev.actionsAvailable().onUndo = commands.canUndo();
  ev.actionsAvailable().onRedo = commands.canRedo();
  switch (editMode) {
  case EditMode::Default:
    ev.editMode = "default";
    break;
  case EditMode::Draw:
    ev.editMode = "draw";
    break;
  }

  bridge.sendEvent("EDITOR_GLOBAL_ACTIONS", ev);
};

struct EditorSelectedActorEvent {
  struct Behavior {
    PROP(bool, isActive) = false;
  };
  PROP((std::unordered_map<std::string, Behavior>), behaviors);
};

void Editor::sendSelectedActorData() {
  if (!scene) {
    return;
  }
  EditorSelectedActorEvent ev;
  scene->getBehaviors().forEach([&](auto &behavior) {
    using BehaviorType = std::remove_reference_t<decltype(behavior)>;
    EditorSelectedActorEvent::Behavior elem;
    if (selection.hasSelection()) {
      elem.isActive = behavior.hasComponent(selection.firstSelectedActorId());
    }
    ev.behaviors().emplace(BehaviorType::name, elem);
  });
  bridge.sendEvent("EDITOR_SELECTED_ACTOR", ev);
}

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
    PROP((std::unordered_map<std::string, PropertySpec>), propertySpecs);
  };
  PROP((std::unordered_map<std::string, Behavior>), behaviors);
};

void Editor::sendAllBehaviorsData() {
  if (!scene) {
    return;
  }
  EditorAllBehaviorsEvent ev;
  scene->getBehaviors().forEach([&](auto &behavior) {
    using BehaviorType = std::remove_reference_t<decltype(behavior)>;
    EditorAllBehaviorsEvent::Behavior elem;
    elem.behaviorId = BehaviorType::behaviorId;
    elem.name = BehaviorType::name;
    elem.displayName = BehaviorType::displayName;
    elem.allowsDisableWithoutRemoval = BehaviorType::allowsDisableWithoutRemoval;

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

      elem.propertySpecs().emplace(Prop::name, spec);
    });

    ev.behaviors().emplace(BehaviorType::name, elem);
  });
  bridge.sendEvent("EDITOR_ALL_BEHAVIORS", ev);
};

/**
 *  Can't embed Component's Props directly in an event because we want to use the behavior getter
 *  when it's available.
 */
template<typename Behavior, typename Component>
struct EditorSelectedComponentEvent {
  ActorId actorId;
  Component *component;
  Scene &scene;

  void write(Writer &writer) const;
};

template<typename Behavior, typename Component>
void EditorSelectedComponentEvent<Behavior, Component>::write(Writer &writer) const {
  if (component) {
    auto &behavior = scene.getBehaviors().template byType<Behavior>();
    writer.boolean("isDisabled", component->disabled);
    writer.obj("props", [&]() {
      Props::forEach(component->props, [&](auto &prop) {
        if constexpr (!Archive::skipProp<std::remove_reference_t<decltype(prop())>>) {
          using Prop = std::remove_reference_t<decltype(prop)>;
          using PropValue = std::remove_reference_t<decltype(prop())>;
          constexpr auto propName = Prop::name;
          if constexpr (std::is_arithmetic_v<PropValue>) {
            // use behavior's getter when possible
            // TODO: other types of prop other than numeric
            writer.write(std::string(propName),
                behavior.handleGetProperty(actorId, *component, prop.id).template as<double>());
          } else {
            writer.write(std::string(propName), prop());
          }
        }
      });
    });
  }
}

struct EditorSelectedRulesComponentEvent {
  PROP(bool, isDisabled) = false;
  PROP(std::string, rulesJson);
};

struct EditorNoComponentEvent {
  PROP(bool, componentNotFound) = true;
};

// send behavior property values for the selected actor's components
void Editor::sendSelectedComponent(int behaviorId) {
  if (!scene) {
    return;
  }
  scene->getBehaviors().byId(behaviorId, [&](auto &behavior) {
    auto actorId = selection.firstSelectedActorId();
    using BehaviorType = std::remove_reference_t<decltype(behavior)>;
    auto component = behavior.maybeGetComponent(actorId);
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
        EditorSelectedComponentEvent<BehaviorType, ComponentType> ev { actorId, component, *scene };
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
         .allowedValues("add", "remove", "set", "enable", "disable", "swapMotion")
         );
    PROP(std::string, propertyName);
    PROP(std::string, propertyType);
    PROP(double, doubleValue);
    PROP(std::string, stringValue);
  } params;

  void receive(Engine &engine) {
    if (!engine.getIsEditing()) {
      return;
    }
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
    auto editor = engine.maybeGetEditor();

    auto actorId = editor->getSelection().firstSelectedActorId();
    if (actorId == nullActor) {
      return;
    }

    editor->getScene().getBehaviors().byName(params.behaviorName().c_str(), [&](auto &behavior) {
      using BehaviorType = std::remove_reference_t<decltype(behavior)>;

      if (action == "set") {
        Commands::Params commandParams;
        commandParams.coalesce = true;
        commandParams.coalesceLastOnly = false;
        if constexpr (std::is_same_v<BehaviorType, RulesBehavior>) {
          bool oldHasComponent = behavior.hasComponent(actorId);
          auto oldValueCStr = editor->getRulesData(actorId);
          editor->getCommands().execute(
              "change rules", commandParams,
              [actorId, oldHasComponent, newRulesJson = params.stringValue()](
                  Editor &editor, bool) {
                auto &rulesBehavior = editor.getScene().getBehaviors().byType<RulesBehavior>();
                if (!oldHasComponent) {
                  rulesBehavior.addComponent(actorId);
                  rulesBehavior.enableComponent(actorId);
                  editor.setSelectedActorStateDirty();
                }
                editor.setRulesData(actorId, newRulesJson.c_str());
                editor.setSelectedComponentStateDirty(RulesBehavior::behaviorId);
              },
              [actorId, oldHasComponent, oldRulesJson = std::string(oldValueCStr)](
                  Editor &editor, bool) {
                auto &rulesBehavior = editor.getScene().getBehaviors().byType<RulesBehavior>();
                if (!oldHasComponent) {
                  rulesBehavior.removeComponent(actorId);
                  editor.setSelectedActorStateDirty();
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
            editor->getCommands().execute(
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
            editor->getCommands().execute(
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
        editor->getCommands().execute(
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
        editor->getCommands().execute(
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
        editor->getCommands().execute(
            description, {},
            [actorId](Editor &editor, bool) {
              auto &behavior = editor.getScene().getBehaviors().byType<BehaviorType>();
              behavior.addComponent(actorId);
              behavior.enableComponent(actorId);
              editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
              editor.setSelectedActorStateDirty();
            },
            [actorId](Editor &editor, bool) {
              auto &behavior = editor.getScene().getBehaviors().byType<BehaviorType>();
              behavior.removeComponent(actorId);
              editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
              editor.setSelectedActorStateDirty();
            });
      } else if (action == "remove") {
        static auto description = std::string("remove ") + BehaviorType::displayName;

        // Save component data to archive so we can restore it on undo
        auto disabled = false;
        auto archive = std::make_shared<Archive>();
        if (auto component = behavior.maybeGetComponent(actorId)) {
          disabled = component->disabled;
          archive->write([&](Writer &writer) {
            writer.write(component->props);
            if constexpr (Handlers::hasWriteComponent<decltype(behavior)>) {
              behavior.handleWriteComponent(actorId, *component, writer);
            }
          });
        }

        editor->getCommands().execute(
            description, {},
            [actorId](Editor &editor, bool) {
              // Remove component
              auto &behavior = editor.getScene().getBehaviors().byType<BehaviorType>();
              behavior.removeComponent(actorId);
              editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
              editor.setSelectedActorStateDirty();
            },
            [actorId, disabled, archive = std::move(archive)](Editor &editor, bool) {
              // Add component and restore data from archive
              auto &behavior = editor.getScene().getBehaviors().byType<BehaviorType>();
              auto &component = behavior.addComponent(actorId);
              component.disabled = disabled;
              archive->read([&](Reader &reader) {
                reader.read(component.props);
                if constexpr (Handlers::hasReadComponent<decltype(behavior)>) {
                  behavior.handleReadComponent(actorId, component, reader);
                }
              });
              if (!disabled) {
                behavior.enableComponent(actorId);
              }
              editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
              editor.setSelectedActorStateDirty();
            });
      } else if (action == "swapMotion") {
        // swap is just add+remove in the same command.
        // this is only used when changing between Motion behaviors.
        // TODO: merge motion behaviors, then we don't need this anymore.
        if constexpr (std::is_same_v<BehaviorType, MovingBehavior>) {
          static auto description = std::string("change dynamic motion to fixed motion");
          editor->getCommands().execute(
              description, {},
              [actorId](Editor &editor, bool) {
                auto &oldBehavior = editor.getScene().getBehaviors().byType<BehaviorType>();
                auto &newBehavior
                    = editor.getScene().getBehaviors().byType<RotatingMotionBehavior>();
                oldBehavior.removeComponent(actorId);
                newBehavior.addComponent(actorId);
                newBehavior.enableComponent(actorId);
                editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
                editor.setSelectedComponentStateDirty(RotatingMotionBehavior::behaviorId);
                editor.setSelectedActorStateDirty();
              },
              [actorId](Editor &editor, bool) {
                auto &oldBehavior = editor.getScene().getBehaviors().byType<BehaviorType>();
                auto &newBehavior
                    = editor.getScene().getBehaviors().byType<RotatingMotionBehavior>();
                newBehavior.removeComponent(actorId);
                oldBehavior.addComponent(actorId);
                oldBehavior.enableComponent(actorId);
                editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
                editor.setSelectedComponentStateDirty(RotatingMotionBehavior::behaviorId);
                editor.setSelectedActorStateDirty();
              });
        }
        if constexpr (std::is_same_v<BehaviorType, RotatingMotionBehavior>) {
          static auto description = std::string("change fixed motion to dynamic motion");
          editor->getCommands().execute(
              description, {},
              [actorId](Editor &editor, bool) {
                auto &oldBehavior = editor.getScene().getBehaviors().byType<BehaviorType>();
                auto &newBehavior = editor.getScene().getBehaviors().byType<MovingBehavior>();
                oldBehavior.removeComponent(actorId);
                newBehavior.addComponent(actorId);
                newBehavior.enableComponent(actorId);
                editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
                editor.setSelectedComponentStateDirty(MovingBehavior::behaviorId);
                editor.setSelectedActorStateDirty();
              },
              [actorId](Editor &editor, bool) {
                auto &oldBehavior = editor.getScene().getBehaviors().byType<BehaviorType>();
                auto &newBehavior = editor.getScene().getBehaviors().byType<MovingBehavior>();
                newBehavior.removeComponent(actorId);
                oldBehavior.addComponent(actorId);
                oldBehavior.enableComponent(actorId);
                editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
                editor.setSelectedComponentStateDirty(MovingBehavior::behaviorId);
                editor.setSelectedActorStateDirty();
              });
        }
      }
      editor->setSelectedComponentStateDirty(BehaviorType::behaviorId);
      if constexpr (std::is_same_v<BehaviorType, TagsBehavior>) {
        // extra dirty state on tags data
        editor->sendTagsData();
      }
    });
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
    if (!engine.getIsEditing()) {
      return;
    }
    auto action = params.action();
    auto editor = engine.maybeGetEditor();

    Debug::log("editor received inspector action: {}", action);
    if (action == "closeInspector") {
      editor->getSelection().deselectAllActors();
      return;
    }

    auto actorId = editor->getSelection().firstSelectedActorId();
    if (actorId == nullActor) {
      return;
    }

    if (action == "deleteSelection") {
      // TODO: Save and restore `parentEntryId`

      auto &scene = editor->getScene();

      // Get current draw order and parent entry id values to restore on undo
      scene.ensureDrawOrderSort();
      std::optional<int> drawOrderRelativeToValue;
      if (auto drawOrder = scene.maybeGetDrawOrder(actorId)) {
        drawOrderRelativeToValue = drawOrder->value;
      }
      std::optional<std::string> parentEntryId;
      if (auto parentEntryIdCStr = scene.maybeGetParentEntryId(actorId)) {
        parentEntryId = parentEntryIdCStr;
      }

      // Save actor to archive so we can restore it on undo
      auto archive = std::make_shared<Archive>();
      archive->write([&](Writer &writer) {
        scene.writeActor(actorId, writer);
      });

      editor->getCommands().execute(
          "delete", {},
          [actorId](Editor &editor, bool) {
            // Deselect and remove actor
            auto &scene = editor.getScene();
            editor.getSelection().deselectActor(actorId);
            scene.removeActor(actorId);
          },
          [actorId, drawOrderRelativeToValue, parentEntryId, archive = std::move(archive)](
              Editor &editor, bool) {
            // Read actor back. Draw order should be right behind current actor with old value.
            auto &scene = editor.getScene();
            scene.ensureDrawOrderSort();
            archive->read([&](Reader &reader) {
              Scene::ActorDesc actorDesc;
              actorDesc.requestedActorId = actorId;
              actorDesc.reader = &reader;
              if (parentEntryId) {
                actorDesc.parentEntryId = parentEntryId->c_str();
              }
              actorDesc.drawOrderRelativeToValue = drawOrderRelativeToValue;
              actorDesc.drawOrderRelativity = Scene::ActorDesc::Behind;
              scene.addActor(actorDesc);
            });
          });
    } else if (action == "duplicateSelection") {
      // Generate new actor id now to keep it stable across undos and redos
      auto &scene = editor->getScene();
      auto newActorId = scene.generateActorId();
      editor->getCommands().execute(
          "duplicate", {},
          [actorId, newActorId](Editor &editor, bool) {
            auto &scene = editor.getScene();

            // Write actor to archive, nudging position a bit and then restoring it
            float oldX = 0, oldY = 0;
            auto maybeBodyComponent
                = scene.getBehaviors().byType<BodyBehavior>().maybeGetComponent(actorId);
            if (maybeBodyComponent) {
              oldX = maybeBodyComponent->props.x();
              oldY = maybeBodyComponent->props.y();
              maybeBodyComponent->props.x() += 0.5;
              maybeBodyComponent->props.y() += 0.5;
            }
            Archive archive;
            archive.write([&](Writer &writer) {
              scene.writeActor(actorId, writer);
            });
            if (maybeBodyComponent) {
              maybeBodyComponent->props.x() = oldX;
              maybeBodyComponent->props.y() = oldY;
            }

            // Read from archive to create new actor. Its draw order should be right in front of the
            // original one.
            archive.read([&](Reader &reader) {
              Scene::ActorDesc actorDesc;
              actorDesc.requestedActorId = newActorId;
              actorDesc.reader = &reader;
              actorDesc.parentEntryId = scene.maybeGetParentEntryId(actorId);
              actorDesc.drawOrderRelativity = Scene::ActorDesc::FrontOf;
              actorDesc.drawOrderRelativeToActor = actorId;
              scene.addActor(actorDesc);
              scene.ensureDrawOrderSort();
            });

            // Select new actor
            editor.getSelection().deselectActor(actorId);
            editor.getSelection().selectActor(newActorId);
          },
          [newActorId](Editor &editor, bool) {
            // Remove new actor
            auto &scene = editor.getScene();
            scene.removeActor(newActorId);
          });
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
    if (data.description().compare(0, conditionPrefix.size(), conditionPrefix) == 0
        && data.description().find("condition is met") == std::string::npos) {
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
    PROP(std::string, type);
    PROP(std::string, action);
    PROP(love::Colorf, colorValue);
    PROP(double, doubleValue);
  } params;

  void receive(Engine &engine) {
    if (!engine.getIsEditing()) {
      return;
    }
    auto type = params.type();
    auto action = params.action();
    if (type == "scene") {
      if (action == "setBackgroundColor") {
        auto colorValue = params.colorValue();
        engine.maybeGetEditor()->getScene().props.backgroundColor().set(
            colorValue.r, colorValue.g, colorValue.b, colorValue.a);
      }
    } else if (type == "grab") {
      engine.maybeGetEditor()->getGrabTool().changeSettings(action, params.doubleValue());
    }
    // TODO: ScaleRotate settings
    engine.maybeGetEditor()->sendSceneSettings();
  }
};

struct EditorSceneSettingsEvent {
  PROP(Scene::Props *, sceneProperties);
  PROP(GrabTool::Props *, grabToolProperties);
  // TODO: ScaleRotate properties
};

void Editor::sendSceneSettings() {
  EditorSceneSettingsEvent ev;
  ev.sceneProperties = &getScene().props;
  ev.grabToolProperties = &grab.props;
  bridge.sendEvent("EDITOR_SCENE_SETTINGS", ev);
};

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
  if (!scene) {
    return;
  }
  if (isEditorStateDirty) {
    sendGlobalActions();
    isEditorStateDirty = false;
  }
  if (isSelectedActorStateDirty) {
    sendSelectedActorData();
    Debug::display("sent selected actor data");
    isSelectedActorStateDirty = false;
  }
  if (!selectedComponentStateDirty.empty()) {
    for (auto behaviorId : selectedComponentStateDirty) {
      sendSelectedComponent(behaviorId);
    }
    Debug::display("sent selected component");
    selectedComponentStateDirty.clear();
  }
  scene->getBehaviors().byType<TextBehavior>().maybeSendBridgeData();
}
