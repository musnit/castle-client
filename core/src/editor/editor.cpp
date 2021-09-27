#include "editor.h"
#include "engine.h"
#include "archive.h"
#include "behaviors/all.h"
#include "library.h"

Editor::Editor(Bridge &bridge_)
    : bridge(bridge_) {
  isEditorStateDirty = true;
  isSelectedActorStateDirty = true;
}

void Editor::clearState() {
  isInspectorOpen = false;
  editMode = EditMode::Default;
  selection.deselectAllActors();
  belt.deselect();
  isEditorStateDirty = true;
  isSelectedActorStateDirty = true;
  currentTool = Tool::Grab;
  drawTool.resetState();
  commands.clear();
  auto &drawingBehavior = scene->getBehaviors().byType<Drawing2Behavior>();
  drawingBehavior.clearEditorDataCache();
  auto &textBehavior = scene->getBehaviors().byType<TextBehavior>();
  textBehavior.resetState();
  if (capture) {
    capture = nullptr;
  }
  scene = nullptr;
  editVariables.clear();
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

void Editor::loadEmptyScene() {
  editVariables.clear();
  scene = std::make_unique<Scene>(bridge, variables, true);
  isEditorStateDirty = true;
  isSelectedActorStateDirty = true;
  Debug::log("editor: init empty scene");
}

// Keeping this as a free function to make it easier to reuse later
static void twoFingerPan(const Gesture &gesture, const love::Transform &viewTransform,
    love::Vector2 &viewPos, float &viewWidth) {
  constexpr float defaultViewWidth = 10;
  constexpr float minViewWidth = defaultViewWidth / 10;
  constexpr float maxViewWidth = defaultViewWidth * 4;

  // Check for and find two touches
  if (gesture.getMaxCount() != 2) {
    return;
  }
  auto touchId1 = nullTouch, touchId2 = nullTouch;
  const Touch *touch1 = nullptr, *touch2 = nullptr;
  gesture.forEachTouch([&](TouchId touchId, const Touch &touch) {
    if (!touch1) {
      touchId1 = touchId;
      touch1 = &touch;
    } else if (!touch2) {
      touchId2 = touchId;
      touch2 = &touch;
    }
  });
  if (touchId1 == nullTouch || !touch1 || touchId2 == nullTouch || !touch2) {
    return;
  }

  // Compute move
  auto touch1PrevScreenPos = touch1->screenPos - touch1->screenDelta;
  auto touch2PrevScreenPos = touch2->screenPos - touch2->screenDelta;
  auto screenCenter = (touch1->screenPos + touch2->screenPos) * 0.5;
  auto prevScreenCenter = (touch1PrevScreenPos + touch2PrevScreenPos) * 0.5;
  auto viewScale = viewTransform.getMatrix().getElements()[0]; // Assuming no rotation
  auto move = (screenCenter - prevScreenCenter) / viewScale;

  // Compute scale
  std::optional<float> scale;
  auto pinch = touch1->screenPos - touch2->screenPos;
  auto pinchLength = pinch.getLength();
  auto initialPinch = touch1->initialScreenPos - touch2->initialScreenPos;
  auto initialPinchLength = initialPinch.getLength();
  struct Zooming {}; // Marks a touch as being used for zooming
  auto touch1Zooming = gesture.hasData<Zooming>(touchId1);
  auto touch2Zooming = gesture.hasData<Zooming>(touchId2);
  auto closeToDefault = viewWidth == defaultViewWidth
      && std::abs(initialPinchLength - pinchLength) <= 0.175 * initialPinchLength;
  if (touch1Zooming || touch2Zooming || !closeToDefault) {
    // If close to 1:1, require a stronger pinch to zoom if not already zooming
    auto prevPinch = touch1PrevScreenPos - touch2PrevScreenPos;
    auto prevPinchLength = prevPinch.getLength();
    if (!(touch1Zooming && touch2Zooming)) {
      gesture.setData<Zooming>(touchId1);
      gesture.setData<Zooming>(touchId2);
      prevPinchLength = initialPinchLength;
    }
    scale = prevPinchLength / pinchLength;
  }

  // Apply scale
  if (scale) {
    auto prevViewWidth = viewWidth;
    viewWidth = std::clamp(*scale * viewWidth, minViewWidth, maxViewWidth);
    if (std::abs(viewWidth - defaultViewWidth) < 0.1 * defaultViewWidth) {
      viewWidth = defaultViewWidth;
    }
    scale = viewWidth / prevViewWidth; // Recompute to account for clamping
    auto center = const_cast<love::Transform &>(viewTransform).inverseTransformPoint(screenCenter);
    move = move - (center - viewPos) * (1 - *scale);
  }

  // Apply pan
  struct DisablePan {};
  auto touch1DisablePan = gesture.hasData<DisablePan>(touchId1);
  auto touch2DisablePan = gesture.hasData<DisablePan>(touchId2);
  if (!(touch1DisablePan || touch2DisablePan)) {
    auto prevViewPos = viewPos;
    viewPos -= move;
    if (viewWidth == defaultViewWidth) { // Snap to center only when 1:1 zoom
      auto prevDistFromCenter = prevViewPos.getLength();
      auto distFromCenter = viewPos.getLength();
      if (distFromCenter < prevDistFromCenter && distFromCenter < 0.2) {
        // Snap if panned toward and close to center, disable panning for rest of gesture
        viewPos = { 0, 0 };
        gesture.setData<DisablePan>(touchId1);
        gesture.setData<DisablePan>(touchId2);
      }
    }
  }
}

struct NavigateToCardEvent {
  PROP(std::string, cardId);
};

void Editor::update(double dt) {
  if (!scene) {
    return;
  }

  if (playing && player) {
    player->update(dt);

    if (auto nextCardId = player->getScene().getNextCardId(); nextCardId) {
      // don't load the new card here, send to the UI to possibly save previous editor state first
      NavigateToCardEvent ev { *nextCardId };
      getBridge().sendEvent("NAVIGATE_TO_CARD", ev);
      player->getScene().setNextCardId(std::nullopt);
    }

    if (capture) {
      capture->update(&player->getScene(), getBridge(), dt);
    }
  } else {
    Debug::display("fps: {}", lv.timer.getFPS());
    Debug::display("actors: {}", scene->numActors());

    // Need to tell scene to update gesture, since we didn't `scene->update()`
    scene->updateGesture();

    // Make sure ghost actors exist before tools look for them
    scene->getLibrary().ensureGhostActorsExist();

    switch (editMode) {
    case EditMode::Default: {
      auto viewPos = scene->getCameraPosition();
      auto viewWidth = scene->getCameraSize().x;
      twoFingerPan(scene->getGesture(), scene->getViewTransform(), viewPos, viewWidth);
      scene->setCameraPosition(viewPos);
      scene->setViewWidth(viewWidth);

      // Pre-update current tool (let it steal touches)
      switch (currentTool) {
      case Tool::Grab:
        // grab.preUpdate(dt);
        break;
      case Tool::ScaleRotate:
        scaleRotate.preUpdate(dt);
        break;
      }

      selection.touchToSelect(*scene);

      if (selection.isSelectionChanged()) {
        setCurrentTool(Tool::Grab);

        isEditorStateDirty = true;
        isSelectedActorStateDirty = true;
        if (selection.hasSelection()) {
          scene->getBehaviors().forEach([&](auto &behavior) {
            auto behaviorId = std::remove_reference_t<decltype(behavior)>::behaviorId;
            selectedComponentStateDirty.insert(behaviorId);
          });
          if (!selection.isGhostActorsSelected() && isInspectorOpen) {
            isInspectorOpen = false;
          }
        } else {
          isInspectorOpen = false;
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
        scaleRotate.update(dt);
        break;
      }

      break; // EditMode::Default
    }
    case EditMode::Draw:
      drawTool.update(dt);
      break;
    }

    updateAutoSave(dt);
  }

  // Make sure ghost actors exist before sending new data, because current tool's update()
  // may have modified actors
  scene->getLibrary().ensureGhostActorsExist();
  maybeSendData(dt);
}

void Editor::draw() {
  if (!scene) {
    return;
  }

  if (playing && player) {
    player->draw();
    return;
  }

  switch (editMode) {
  case EditMode::Default: {
    SceneDrawingOptions options;
    options.drawInvisibleActors = true;
    scene->draw(options);

    auto &bodyBehavior = scene->getBehaviors().byType<BodyBehavior>();
    auto &drawingBehavior = scene->getBehaviors().byType<Drawing2Behavior>();

    // Bounding boxes
    {
      const auto drawBoundingBox = [&](ActorId actorId) {
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
      const auto drawCollisionShapes = [&](ActorId actorId) {
        if (auto body = bodyBehavior.maybeGetPhysicsBody(actorId)) {
          auto info = bodyBehavior.getRenderInfo(actorId);
          lv.graphics.push();

          auto [x, y] = body->GetPosition();
          lv.graphics.translate(x, y);
          lv.graphics.rotate(body->GetAngle());
          if (auto physicsBodyData = drawingBehavior.maybeGetPhysicsBodyData(actorId)) {
            physicsBodyData->render({ info.widthScale, info.heightScale });
          }

          lv.graphics.pop();
        }
      };

      lv.graphics.push(love::Graphics::STACK_ALL);

      scene->applyViewTransform(800.0f);

      lv.graphics.setLineWidth(1.2f * scene->getPixelScale());
      lv.graphics.setColor({ 0, 0, 0, 1 });
      for (auto actorId : selection.getSelectedActorIds()) {
        if (!scene->isGhost(actorId)) {
          drawCollisionShapes(actorId);
        }
      }

      lv.graphics.setLineWidth(1.25f * scene->getPixelScale());
      lv.graphics.setColor({ 0.8, 0.8, 0.8, 0.8 });
      scene->forEachActor([&](ActorId actorId) {
        if (!scene->isGhost(actorId)) {
          drawBoundingBox(actorId);
        }
      });

      lv.graphics.setLineWidth(2 * scene->getPixelScale());
      lv.graphics.setColor({ 0, 1, 0, 0.8 });
      for (auto actorId : selection.getSelectedActorIds()) {
        if (!scene->isGhost(actorId)) {
          Debug::display("selected actor {}", actorId);
          drawBoundingBox(actorId);
        } else {
          Debug::display("selected ghost actor {}", actorId);
        }
      }

      // Current tool overlay
      {
        switch (currentTool) {
        case Tool::Grab:
          grab.drawOverlay();
          break;
        case Tool::ScaleRotate:
          scaleRotate.drawOverlay();
          break;
        }
      }

      // Card-size outline
      {
        lv.graphics.setLineWidth(2 * scene->getPixelScale());
        if (scene->isBackgroundDark()) {
          lv.graphics.setColor({ 1, 1, 1, 0.75 });
        } else {
          lv.graphics.setColor({ 0, 0, 0, 0.75 });
        }

        auto cardSize = scene->getDefaultCameraSize();
        lv.graphics.rectangle(love::Graphics::DRAW_LINE, -0.5f * cardSize.x,
            -scene->getDefaultViewYOffset(), cardSize.x, cardSize.y, 0.225f, 0.225f, 8);
      }

      // Belt highlight
      belt.drawHighlight();

      lv.graphics.pop();
    }

    // Belt
    belt.drawOverlay();
    break; // EditMode::Default
  }
  case EditMode::Draw: {
    if (drawTool.isViewInContextEnabled()) {
      SceneDrawingOptions options;
      options.drawInvisibleActors = true;
      if (drawTool.getIsPlayingAnimation()) {
        // actor being edited by draw tool
        options.editorDrawingActorId = selection.firstSelectedActorId();
        options.editorDrawingAnimationFrame = drawTool.getCurrentAnimationFrame();
      }
      scene->draw(options);
    } else {
      drawTool.drawOverlay();
    }
    break;
  }
  }
}

void Editor::updateBlueprint(ActorId actorId, UpdateBlueprintParams params) {
  auto &library = scene->getLibrary();

  // Get current entry
  std::string entryId;
  {
    auto entryIdCStr = scene->maybeGetParentEntryId(actorId);
    if (!entryIdCStr) {
      Debug::log("editor: tried to update blueprint from actor without parent entry id");
      return;
    }
    entryId = entryIdCStr;
    // Memory at `entryIdCstr` can be released by library entry update, so end scope here
  }

  // Create new entry JSON, zeroing-out position and restoring it
  Archive entryArchive;
  {
    float oldX = 0, oldY = 0;
    auto maybeBodyComponent
        = scene->getBehaviors().byType<BodyBehavior>().maybeGetComponent(actorId);
    if (maybeBodyComponent) {
      oldX = maybeBodyComponent->props.x();
      oldY = maybeBodyComponent->props.y();
      maybeBodyComponent->props.x() = 0;
      maybeBodyComponent->props.y() = 0;
    }
    auto oldEntry = library.maybeGetEntry(entryId.c_str());
    entryArchive.write([&](Writer &writer) {
      writer.str("entryId", entryId);
      writer.str("entryType", "actorBlueprint");
      writer.str("title", params.newTitle ? params.newTitle : oldEntry ? oldEntry->getTitle() : "");
      writer.obj("actorBlueprint", [&]() {
        // Write inherited properties too since we want to save everything to the blueprint
        Scene::WriteActorParams params;
        params.inheritedProperties = true;
        scene->writeActor(actorId, writer, params);
      });
      if (oldEntry) {
        if (params.updateBase64Png) {
          if (auto drawingComponent
              = scene->getBehaviors().byType<Drawing2Behavior>().maybeGetComponent(actorId)) {
            auto initialFrameZeroIndex = int(drawingComponent->props.initialFrame()) - 1;
            if (auto base64Png
                = drawingComponent->drawData->renderPreviewPng(initialFrameZeroIndex, -1);
                base64Png) {
              writer.str("base64Png", base64Png.value().c_str());
            }
          }
        } else {
          if (auto [base64Png, base64PngLength] = oldEntry->getBase64Png(); base64Png) {
            writer.str("base64Png", *base64Png);
          }
        }
      }
    });
    if (maybeBodyComponent) {
      maybeBodyComponent->props.x() = oldX;
      maybeBodyComponent->props.y() = oldY;
    }
    // Memory at `maybeBodyComponent` and `oldEntry` can be released by library entry update, so end
    // scope here
  }

  // Save new entry to library. This destroys and re-creates the associated ghost actor too.
  entryArchive.read([&](Reader &reader) {
    library.readEntry(reader);
  });

  // Update all other non-ghost actors that have this entry
  updateActorsWithEntryId(entryId, params, actorId);

  if (params.newTitle || params.updateBase64Png) {
    // if we updated the selected actor, need to send new data to JS
    if (getSelection().isSelected(actorId)) {
      isSelectedActorStateDirty = true;
    }
  }
}

void Editor::updateActorsWithEntryId(
    const std::string &entryId, UpdateBlueprintParams params, ActorId skipActorId) {
  scene->forEachActor([&](ActorId otherActorId) {
    if ((skipActorId == nullActor || otherActorId != skipActorId)
        && scene->maybeGetParentEntryId(otherActorId) == entryId) {
      // Write actor, remove and read back -- new entry properties will be used when reading
      Archive actorArchive;
      actorArchive.write([&](Writer &writer) {
        // If applying layout, don't save actor's layout properties -- it'll use the blueprint's
        Scene::WriteActorParams writeParams;
        writeParams.layoutProperties = !params.applyLayout;
        scene->writeActor(otherActorId, writer, writeParams);
      });
      actorArchive.read([&](Reader &reader) {
        Scene::ActorDesc actorDesc;
        actorDesc.requestedActorId = otherActorId;
        actorDesc.reader = &reader;
        actorDesc.parentEntryId = entryId.c_str(); // PERF: Could point to entry in `ActorDesc`,
                                                   //       avoid library lookup
        if (auto drawOrder = scene->maybeGetDrawOrder(otherActorId)) {
          actorDesc.drawOrderParams.relativeToValue = drawOrder->value;
          actorDesc.drawOrderParams.relativity = Scene::DrawOrderParams::Behind;
        }
        scene->removeActor(otherActorId);
        scene->addActor(actorDesc);
      });
    }
  });
}


//
// Saving
//

void Editor::updateAutoSave(double dt) {
  if (autoSaveCountdown > 0) {
    autoSaveCountdown -= float(dt);
    if (autoSaveCountdown <= 0) {
      autoSaveCountdown = 0;
      save();
    }
  }
}

struct EditorSceneMessageEvent {
  PROP(std::string, messageType);
  PROP(std::string, data);
};

void Editor::save() {
  if (scene) {
    EditorSceneMessageEvent ev;
    ev.messageType = "UPDATE_SCENE";
    Archive archive;
    archive.write([&](Writer &writer) {
      writer.obj("snapshot", [&]() {
        scene->write(writer);
      });
    });
    ev.data = archive.toJson();
    bridge.sendEvent("SCENE_MESSAGE", ev);
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
  getVariables().sendVariablesData(getBridge(), false);
  sendTagsData();
}

struct EditorLoadSnapshotReceiver {
  inline static const BridgeRegistration<EditorLoadSnapshotReceiver> registration {
    "LOAD_SNAPSHOT"
  };
  struct Params {
    PROP(std::string, snapshotJson);
  } params;

  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    if (editor) {
      editor->maybeLoadPlayerSnapshot(params.snapshotJson().c_str());
    }
  }
};

void Editor::maybeLoadPlayerSnapshot(const char *json) {
  // this is only used when the editor is already playing; it doesn't affect the scene being edited
  if (playing && player) {
    auto archive = Archive::fromJson(json);
    archive.read([&](Reader &reader) {
      // don't read variables, maintain existing deck state
      reader.obj("sceneData", [&]() {
        reader.obj("snapshot", [&]() {
          player->readScene(reader);
        });
      });
    });
  }
}

struct EditorRequestScreenshotReceiver {
  inline static const BridgeRegistration<EditorRequestScreenshotReceiver> registration {
    "REQUEST_SCREENSHOT"
  };

  struct Params {
  } params;
  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    if (!editor)
      return;

    editor->sendScreenshot();
  }
};

void Editor::sendScreenshot() {
  if (!screenshot) {
    screenshot = std::make_unique<Screenshot>(1350);
  }
  EditorSceneMessageEvent ev;
  ev.messageType = "SCREENSHOT_DATA";
  ev.data = screenshot->getBase64Screenshot(&getScene());
  bridge.sendEvent("SCENE_MESSAGE", ev);
}

struct EditorGlobalActionsEvent {
  PROP(bool, performing) = false;
  PROP(int, selectedActorId) = -1;
  PROP(bool, isTextActorSelected) = false;
  PROP(bool, isBlueprintSelected) = false;
  PROP(bool, isInspectorOpen) = false;
  PROP(std::string, editMode);

  struct ActionsAvailable {
    PROP(bool, onPlay) = true;
    PROP(bool, onRewind) = false;
    PROP(bool, onUndo) = false;
    PROP(bool, onRedo) = false;
    PROP(bool, startCapture) = false;
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
    if (!editor) {
      return;
    }

    Debug::log("editor received global action: {}", action);
    if (action == "onPlay") {
      if (editor->hasScene()) {
        editor->player = std::make_unique<Player>(editor->getBridge());
        {
          Archive archive;
          archive.write([&](Writer &writer) {
            writer.arr("variables", [&]() {
              editor->getVariables().write(writer);
            });
          });
          archive.read([&](Reader &reader) {
            reader.arr("variables", [&]() {
              editor->player->readVariables(reader);
            });
          });
        }
        {
          auto &scene = editor->getScene();
          Archive archive;
          archive.write([&](Writer &writer) {
            scene.write(writer);
          });
          archive.read([&](Reader &reader) {
            editor->player->readScene(reader);
          });
        }
        editor->playing = true;
        editor->isEditorStateDirty = true;
      }
    } else if (action == "onRewind") {
      editor->playing = false;
      editor->player.reset();
      editor->isEditorStateDirty = true;
    } else if (action == "onUndo") {
      editor->commands.undo();
    } else if (action == "onRedo") {
      editor->commands.redo();
    } else if (action == "setMode") {
      auto newMode = params.value();
      if (newMode == "draw") {
        editor->editMode = Editor::EditMode::Draw;
        editor->drawTool.onSetActive();
      } else if (newMode == "default") {
        editor->editMode = Editor::EditMode::Default;
        editor->currentTool = Editor::Tool::Grab;
      }
      editor->isEditorStateDirty = true;
    } else if (action == "startCapture") {
      if (!editor->capture) {
        editor->capture = std::make_unique<Capture>(512, 12, 24);
      }
      editor->capture->start();
    } else if (action == "clearCapture") {
      if (editor->capture) {
        editor->capture->clear();
      }
    }
  }
};

void Editor::sendGlobalActions() {
  if (!scene) {
    return;
  }
  EditorGlobalActionsEvent ev;
  if (playing && player) {
    ev.performing = true;
    ev.actionsAvailable().startCapture = !capture || !capture->isCapturing();
  } else {
    if (selection.hasSelection()) {
      ev.selectedActorId = entt::to_integral(selection.firstSelectedActorId());
      ev.isBlueprintSelected = selection.isGhostActorsSelected();
      ev.isInspectorOpen = isInspectorOpen;
      scene->getBehaviors().byName("Text", [&](auto &behavior) {
        if (behavior.hasComponent(selection.firstSelectedActorId())) {
          ev.isTextActorSelected = true;
        }
      });
    }

    ev.actionsAvailable().onUndo = commands.canUndo();
    ev.actionsAvailable().onRedo = commands.canRedo();
  }

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

void Editor::sendLibrary() {
  if (scene) {
    bridge.sendEvent("EDITOR_LIBRARY", [&](Writer &writer) {
      writer.obj("library", [&]() {
        scene->getLibrary().write(writer);
      });
    });
  }
}

struct EditorSelectedActorEvent {
  struct Behavior {
    PROP(bool, isActive) = false;
  };

  struct LibraryEntry {
    PROP(std::string, title);
    PROP(std::string, base64Png);
  };

  PROP((std::unordered_map<std::string, Behavior>), behaviors);
  PROP(LibraryEntry, libraryEntry);
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

  if (auto entryId = scene->maybeGetParentEntryId(selection.firstSelectedActorId())) {
    auto &library = scene->getLibrary();
    if (auto entry = library.maybeGetEntry(entryId)) {
      ev.libraryEntry().title = entry->getTitle();
      if (auto [base64Png, base64PngLength] = entry->getBase64Png(); base64Png) {
        ev.libraryEntry().base64Png = std::string(*base64Png);
      }
    }
  }

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

    // TODO: specialize per behavior with a handler

    std::string eventName = std::string("EDITOR_SELECTED_COMPONENT:") + BehaviorType::name;
    if (component) {
      if constexpr (std::is_same_v<RulesBehavior, BehaviorType>) {
        EditorSelectedRulesComponentEvent ev { component->disabled, "" };
        if (component->editData) {
          json::StringBuffer buffer;
          json::Writer writer(buffer);
          component->editData->value.Accept(writer);
          ev.rulesJson = std::string(buffer.GetString(), buffer.GetLength());
        }
        bridge.sendEvent("EDITOR_SELECTED_COMPONENT:Rules", ev);
      } else {
        using ComponentType = std::remove_reference_t<decltype(*component)>;
        EditorSelectedComponentEvent<BehaviorType, ComponentType> ev { actorId, component, *scene };
        bridge.sendEvent(eventName.c_str(), ev);
      }

      if constexpr (std::is_same_v<Drawing2Behavior, BehaviorType>) {
        // TODO: fold into behavior's handler
        Drawing2Behavior::EditorSelectedDrawingFramesEvent ev;
        behavior.writeBase64PngFrames(*component, &ev);
        bridge.sendEvent("EDITOR_SELECTED_DRAWING_FRAMES", ev);
      }

    } else {
      EditorNoComponentEvent ev;
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
          auto component = behavior.maybeGetComponent(actorId);
          auto oldHasComponent = component != nullptr;
          auto oldData = std::make_shared<RulesEditData>();
          if (component && component->editData) {
            oldData->set(component->editData->value);
          }
          auto newData = std::make_shared<Archive>(Archive::fromJson(params.stringValue().c_str()));
          editor->getCommands().execute(
              "change rules", commandParams,
              [actorId, newData = std::move(newData)](Editor &editor, bool) {
                auto &rulesBehavior = editor.getScene().getBehaviors().byType<RulesBehavior>();
                if (!rulesBehavior.hasComponent(actorId)) {
                  rulesBehavior.addComponent(actorId);
                  rulesBehavior.enableComponent(actorId);
                  editor.setSelectedActorStateDirty();
                }
                if (auto component = rulesBehavior.maybeGetComponent(actorId)) {
                  if (!component->editData) {
                    component->editData = std::make_unique<RulesEditData>();
                  }
                  newData->read([&](Reader &reader) {
                    component->editData->set(*reader.jsonValue());
                  });
                }
                editor.updateBlueprint(actorId, {});
                editor.setSelectedComponentStateDirty(RulesBehavior::behaviorId);
              },
              [actorId, oldHasComponent, oldData = std::move(oldData)](Editor &editor, bool) {
                auto &rulesBehavior = editor.getScene().getBehaviors().byType<RulesBehavior>();
                if (oldHasComponent) {
                  if (auto component = rulesBehavior.maybeGetComponent(actorId)) {
                    if (!component->editData) {
                      component->editData = std::make_unique<RulesEditData>();
                    }
                    component->editData->set(oldData->value);
                  }
                } else {
                  rulesBehavior.removeComponent(actorId);
                  editor.setSelectedActorStateDirty();
                }
                editor.updateBlueprint(actorId, {});
                editor.setSelectedComponentStateDirty(RulesBehavior::behaviorId);
              });
        } else {
          // TODO: Skip `updateBlueprint` if property is non-inherited, once we start tracking that
          //       in `PropAttribs`
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
                  editor.updateBlueprint(actorId, {});
                  editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
                },
                [actorId, propId, oldValue = std::string(oldValueCStr)](Editor &editor, bool) {
                  auto &behavior = editor.getScene().getBehaviors().byType<BehaviorType>();
                  behavior.setProperty(actorId, propId, oldValue.c_str(), false);
                  editor.updateBlueprint(actorId, {});
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
                  editor.updateBlueprint(actorId, {});
                  editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
                },
                [actorId, propId, oldValue](Editor &editor, bool) {
                  auto &behavior = editor.getScene().getBehaviors().byType<BehaviorType>();
                  behavior.setProperty(actorId, propId, oldValue, false);
                  editor.updateBlueprint(actorId, {});
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
              editor.updateBlueprint(actorId, {});
              editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
            },
            [actorId](Editor &editor, bool) {
              auto &behavior = editor.getScene().getBehaviors().byType<BehaviorType>();
              behavior.disableComponent(actorId);
              editor.updateBlueprint(actorId, {});
              editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
            });
      } else if (action == "disable") {
        static auto description = std::string("disable ") + BehaviorType::displayName;
        editor->getCommands().execute(
            description, {},
            [actorId](Editor &editor, bool) {
              auto &behavior = editor.getScene().getBehaviors().byType<BehaviorType>();
              behavior.disableComponent(actorId);
              editor.updateBlueprint(actorId, {});
              editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
            },
            [actorId](Editor &editor, bool) {
              auto &behavior = editor.getScene().getBehaviors().byType<BehaviorType>();
              behavior.enableComponent(actorId);
              editor.updateBlueprint(actorId, {});
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
              editor.updateBlueprint(actorId, {});
              editor.setSelectedComponentStateDirty(BehaviorType::behaviorId);
              editor.setSelectedActorStateDirty();
            },
            [actorId](Editor &editor, bool) {
              auto &behavior = editor.getScene().getBehaviors().byType<BehaviorType>();
              behavior.removeComponent(actorId);
              editor.updateBlueprint(actorId, {});
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
              editor.updateBlueprint(actorId, {});
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
              editor.updateBlueprint(actorId, {});
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
                editor.updateBlueprint(actorId, {});
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
                editor.updateBlueprint(actorId, {});
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
                editor.updateBlueprint(actorId, {});
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
                editor.updateBlueprint(actorId, {});
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

struct EditorApplyLayoutToBlueprintReceiver {
  inline static const BridgeRegistration<EditorApplyLayoutToBlueprintReceiver> registration {
    "EDITOR_APPLY_LAYOUT_TO_BLUEPRINT"
  };

  struct Params {
  } params;

  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    if (!editor || !editor->hasScene()) {
      return;
    }
    auto &scene = editor->getScene();
    auto &library = scene.getLibrary();
    auto &selection = editor->getSelection();
    if (!selection.hasSelection()) {
      return; // Need a non-ghost selection
    }
    auto actorId = selection.firstSelectedActorId();

    auto entryIdCStr = scene.maybeGetParentEntryId(actorId);
    if (!entryIdCStr) {
      return;
    }
    auto entryId = std::string(entryIdCStr);
    auto entry = library.maybeGetEntry(entryId.c_str());
    if (!entry) {
      return;
    }

    auto archive = std::make_shared<Archive>();
    archive->write([&](Writer &writer) {
      writer.obj("entry", [&]() {
        entry->write(writer);
      });
      writer.arr("actors", [&]() {
        scene.forEachActor([&](ActorId otherActorId) {
          if (auto otherEntryId = scene.maybeGetParentEntryId(otherActorId);
              otherEntryId && otherEntryId == entryId) {
            writer.obj([&]() {
              writer.num("actorId", int(entt::to_integral(otherActorId)));
              writer.obj("bp", [&]() {
                scene.writeActor(otherActorId, writer, {});
              });
            });
          }
        });
      });
    });

    editor->getCommands().execute(
        "apply layout changes", {},
        [actorId](Editor &editor, bool) {
          Editor::UpdateBlueprintParams params;
          params.applyLayout = true;
          editor.updateBlueprint(actorId, params);
        },
        [archive = std::move(archive), entryId = std::move(entryId)](Editor &editor, bool) {
          auto &scene = editor.getScene();
          auto &library = scene.getLibrary();
          archive->read([&](Reader &reader) {
            reader.obj("entry", [&]() {
              library.readEntry(reader);
            });
            reader.each("actors", [&]() {
              auto maybeOtherActorId = reader.num("actorId");
              if (!maybeOtherActorId) {
                return;
              }
              auto otherActorId = ActorId(*maybeOtherActorId);
              reader.obj("bp", [&]() {
                Scene::ActorDesc actorDesc;
                actorDesc.requestedActorId = otherActorId;
                actorDesc.reader = &reader;
                actorDesc.parentEntryId = entryId.c_str();
                if (auto drawOrder = scene.maybeGetDrawOrder(otherActorId)) {
                  actorDesc.drawOrderParams.relativeToValue = drawOrder->value;
                  actorDesc.drawOrderParams.relativity = Scene::DrawOrderParams::Behind;
                }
                scene.removeActor(otherActorId);
                scene.addActor(actorDesc);
              });
            });
          });
        });
  }
};

struct EditorChangeDrawOrderReceiver {
  inline static const BridgeRegistration<EditorChangeDrawOrderReceiver> registration {
    "EDITOR_CHANGE_DRAW_ORDER"
  };

  struct Params {
    PROP(std::string, change);
  } params;

  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    if (!editor || !editor->hasScene()) {
      return;
    }
    auto &scene = editor->getScene();
    auto &selection = editor->getSelection();
    if (!selection.hasSelection() || selection.isGhostActorsSelected()) {
      return; // Need a non-ghost selection
    }
    auto actorId = selection.firstSelectedActorId();

    // Front / back
    auto front = params.change() == "front";
    auto back = params.change() == "back";
    if (front || back) {
      auto maybeDrawOrder = scene.maybeGetDrawOrder(actorId);
      if (!maybeDrawOrder) {
        return;
      }
      auto currDrawOrderValue = maybeDrawOrder->value;
      if (front) {
        editor->getCommands().execute(
            "move to front", {},
            [actorId](Editor &editor, bool) {
              Scene::DrawOrderParams params;
              params.relativity = Scene::DrawOrderParams::FrontOfAll;
              editor.getScene().setDrawOrder(actorId, params);
            },
            [actorId, currDrawOrderValue](Editor &editor, bool) {
              Scene::DrawOrderParams params;
              params.relativeToValue = currDrawOrderValue;
              params.relativity = Scene::DrawOrderParams::Behind;
              editor.getScene().setDrawOrder(actorId, params);
            });
      } else {
        editor->getCommands().execute(
            "move to back", {},
            [actorId](Editor &editor, bool) {
              Scene::DrawOrderParams params;
              params.relativity = Scene::DrawOrderParams::BehindAll;
              editor.getScene().setDrawOrder(actorId, params);
            },
            [actorId, currDrawOrderValue](Editor &editor, bool) {
              Scene::DrawOrderParams params;
              params.relativeToValue = currDrawOrderValue;
              params.relativity = Scene::DrawOrderParams::FrontOf;
              editor.getScene().setDrawOrder(actorId, params);
            });
      }
      return;
    }

    // Forward / backward
    enum MoveDir { Forward, Backward };
    static const auto moveInDir = [](Editor &editor, ActorId actorId, const MoveDir dir) {
      auto &scene = editor.getScene();
      auto maybeDrawOrder = scene.maybeGetDrawOrder(actorId);
      if (!maybeDrawOrder) {
        return;
      }
      auto currDrawOrderValue = maybeDrawOrder->value;

      // Find next draw order in move direction among actors we're overlapping with
      int foundDrawOrderValue = -1;
      scene.ensureDrawOrderSort(); // Ensure order is compact before
      auto &bodyBehavior = scene.getBehaviors().byType<BodyBehavior>();
      if (auto body = bodyBehavior.maybeGetPhysicsBody(actorId)) {
        for (auto fixture = body->GetFixtureList(); fixture; fixture = fixture->GetNext()) {
          auto bb = fixture->GetAABB(0);
          bodyBehavior.forEachActorAtBoundingBox(bb.lowerBound.x, bb.lowerBound.y, bb.upperBound.x,
              bb.upperBound.y, [&](ActorId otherActorId, const b2Fixture *) {
                if (actorId != otherActorId) {
                  if (auto otherDrawOrder = scene.maybeGetDrawOrder(otherActorId)) {
                    auto otherDrawOrderValue = otherDrawOrder->value;
                    if (dir == Forward) {
                      // Find lowest draw order greater than us
                      if (otherDrawOrderValue > currDrawOrderValue
                          && (foundDrawOrderValue == -1
                              || otherDrawOrderValue < foundDrawOrderValue)) {
                        foundDrawOrderValue = otherDrawOrderValue;
                      }
                    } else {
                      // Find greatest draw order less than us
                      if (otherDrawOrderValue < currDrawOrderValue
                          && (foundDrawOrderValue == -1
                              || otherDrawOrderValue > foundDrawOrderValue)) {
                        foundDrawOrderValue = otherDrawOrderValue;
                      }
                    }
                  }
                }
                return true;
              });
        }
      }

      if (foundDrawOrderValue != -1) {
        Scene::DrawOrderParams params;
        params.relativeToValue = foundDrawOrderValue;
        if (dir == Forward) {
          params.relativity = Scene::DrawOrderParams::FrontOf; // In front of actor in front of us
        } else {
          params.relativity = Scene::DrawOrderParams::Behind; // Behind actor behind us
        }
        scene.setDrawOrder(actorId, params);
      }
    };
    if (params.change() == "forward") {
      editor->getCommands().execute(
          "move forward", {},
          [actorId](Editor &editor, bool) {
            moveInDir(editor, actorId, Forward);
          },
          [actorId](Editor &editor, bool) {
            moveInDir(editor, actorId, Backward);
          });
    } else if (params.change() == "backward") {
      editor->getCommands().execute(
          "move backward", {},
          [actorId](Editor &editor, bool) {
            moveInDir(editor, actorId, Backward);
          },
          [actorId](Editor &editor, bool) {
            moveInDir(editor, actorId, Forward);
          });
    }
  }
};

struct EditorInspectorActionReceiver {
  inline static const BridgeRegistration<EditorInspectorActionReceiver> registration {
    "EDITOR_INSPECTOR_ACTION"
  };

  struct Params {
    PROP(std::string, action);
    PROP(std::string, stringValue);
  } params;

  void receive(Engine &engine) {
    if (!engine.getIsEditing()) {
      return;
    }
    auto action = params.action();
    auto editor = engine.maybeGetEditor();

    Debug::log("editor received inspector action: {}", action);

    if (action == "toggleScaleRotate") {
      editor->setCurrentTool(editor->getCurrentTool() != Editor::Tool::ScaleRotate
              ? Editor::Tool::ScaleRotate
              : Editor::Tool::Grab);
    }

    if (action == "openInspector") {
      auto &selection = editor->getSelection();
      if (selection.hasSelection()) {
        if (!selection.isGhostActorsSelected()) {
          // auto-select blueprint for selected actor
          auto actorId = selection.firstSelectedActorId();
          selection.selectGhostActorForActor(actorId);
        } else {
          // selection didn't change, but need to send missing components now
          // TODO: BEN
          auto actorId = selection.firstSelectedActorId();
          selection.deselectAllActors(false);
          selection.selectActor(actorId);
        }
        editor->getBelt().enableHighlight();
        editor->isInspectorOpen = true;
      }
      return;
    }
    if (action == "closeInspector") {
      editor->isInspectorOpen = false;
      editor->getSelection().deselectAllActors();
      return;
    }

    auto actorId = editor->getSelection().firstSelectedActorId();
    if (actorId == nullActor) {
      return;
    }
    auto &scene = editor->getScene();
    auto &library = scene.getLibrary();

    if (action == "updateSelectionTitle") {
      Editor::UpdateBlueprintParams updateBlueprintParams;
      updateBlueprintParams.newTitle = params.stringValue().c_str();
      editor->updateBlueprint(actorId, updateBlueprintParams);
      return;
    }

    if (action == "deleteSelection") {
      if (scene.isGhost(actorId)) {
        // Deleting a blueprint

        // first accumulate all instances that use the blueprint
        std::unordered_map<ActorId, std::shared_ptr<Archive>> deletedInstanceArchives;
        std::unordered_map<ActorId, std::optional<int>> deletedInstanceDrawOrders;
        std::vector<ActorId> deletedInstanceActorIds;
        scene.ensureDrawOrderSort();

        if (auto entryIdCStr = scene.maybeGetParentEntryId(actorId)) {
          auto haveActorsWithEntry = false;
          scene.forEachActor([&](ActorId otherActorId) {
            if (!haveActorsWithEntry) {
              if (auto otherEntryIdCStr = scene.maybeGetParentEntryId(otherActorId)) {
                if (!std::strcmp(entryIdCStr, otherEntryIdCStr)) {

                  std::optional<int> drawOrderRelativeToValue;
                  if (auto drawOrder = scene.maybeGetDrawOrder(otherActorId)) {
                    drawOrderRelativeToValue = drawOrder->value;
                  }
                  deletedInstanceDrawOrders.emplace(otherActorId, drawOrderRelativeToValue);

                  auto instanceArchive = std::make_shared<Archive>();
                  instanceArchive->write([&](Writer &writer) {
                    scene.writeActor(otherActorId, writer, {});
                  });
                  deletedInstanceArchives.emplace(otherActorId, instanceArchive);
                  deletedInstanceActorIds.push_back(otherActorId);
                }
              }
            }
          });

          // delete all instances, then delete actual blueprint
          if (auto entry = library.maybeGetEntry(entryIdCStr)) {
            // Save entry to archive so we can restore it on undo
            auto archive = std::make_shared<Archive>();
            archive->write([&](Writer &writer) {
              entry->write(writer);
            });
            auto entryId = std::string(entryIdCStr);
            editor->getCommands().execute(
                "delete blueprint", {},
                [entryId, deletedInstanceActorIds](Editor &editor, bool) {
                  auto &scene = editor.getScene();
                  editor.getSelection().deselectAllActors();

                  for (auto &actorId : deletedInstanceActorIds) {
                    scene.removeActor(actorId);
                  }

                  editor.getScene().getLibrary().removeEntry(entryId.c_str());
                },
                [entryId, archive = std::move(archive), deletedInstanceActorIds,
                    deletedInstanceDrawOrders, deletedInstanceArchives](Editor &editor, bool) {
                  auto &scene = editor.getScene();
                  archive->read([&](Reader &reader) {
                    scene.getLibrary().readEntry(reader);
                  });
                  editor.getBelt().select(entryId.c_str());

                  scene.ensureDrawOrderSort();
                  for (auto iter = deletedInstanceActorIds.rbegin();
                       iter != deletedInstanceActorIds.rend(); iter++) {
                    const ActorId instanceActorId = *iter;
                    auto &instanceArchive = deletedInstanceArchives.at(instanceActorId);
                    auto &instanceDrawOrder = deletedInstanceDrawOrders.at(instanceActorId);
                    instanceArchive->read([&](Reader &reader) {
                      Scene::ActorDesc actorDesc;
                      actorDesc.requestedActorId = instanceActorId;
                      actorDesc.reader = &reader;
                      actorDesc.parentEntryId = entryId.c_str();
                      actorDesc.drawOrderParams.relativeToValue = instanceDrawOrder;
                      actorDesc.drawOrderParams.relativity = Scene::DrawOrderParams::Behind;
                      scene.addActor(actorDesc);
                    });
                  }
                });
          }
        }
      } else {
        // Deleting a single actor instance

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
          scene.writeActor(actorId, writer, {});
        });

        editor->getCommands().execute(
            "delete", {},
            [actorId](Editor &editor, bool) {
              // Deselect all and remove actor
              auto &scene = editor.getScene();
              editor.getSelection().deselectAllActors();
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
                actorDesc.drawOrderParams.relativeToValue = drawOrderRelativeToValue;
                actorDesc.drawOrderParams.relativity = Scene::DrawOrderParams::Behind;
                scene.addActor(actorDesc);
              });
            });
      }
    } else if (action == "duplicateSelection") {
      if (scene.isGhost(actorId)) {
        // Duplicating a blueprint
        if (auto oldEntryIdCstr = scene.maybeGetParentEntryId(actorId)) {
          auto oldEntryId = std::string(oldEntryIdCstr);
          auto newEntryId = Library::generateEntryId(); // Keep stable across undo / redo
          editor->getCommands().execute(
              "duplicate blueprint", {},
              [oldEntryId, newEntryId](Editor &editor, bool) {
                auto &library = editor.getScene().getLibrary();
                if (auto oldEntry = library.maybeGetEntry(oldEntryId.c_str())) {
                  // Write entry to archive, change some fields, then read back. A new entry will be
                  // created because we set a new entry id in the archive before reading.
                  Archive archive;
                  archive.write([&](Writer &writer) {
                    oldEntry->write(writer);
                    writer.overwrite("entryId", [&]() {
                      writer.setStr(newEntryId);
                    });
                  });
                  archive.read([&](Reader &reader) {
                    library.readEntry(reader);
                  });
                  editor.getSelection().deselectAllActors();
                  editor.getBelt().select(newEntryId);
                }
              },
              [newEntryId](Editor &editor, bool) {
                editor.getSelection().deselectAllActors();
                editor.getScene().getLibrary().removeEntry(newEntryId.c_str());
              });
        }
      } else {
        // Duplicating an actor
        auto newActorId = scene.generateActorId(); // Keep stable across undo / redo
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
                scene.writeActor(actorId, writer, {});
              });
              if (maybeBodyComponent) {
                maybeBodyComponent->props.x() = oldX;
                maybeBodyComponent->props.y() = oldY;
              }

              // Read from archive to create new actor. Its draw order should be right in front of
              // the original one.
              archive.read([&](Reader &reader) {
                Scene::ActorDesc actorDesc;
                actorDesc.requestedActorId = newActorId;
                actorDesc.reader = &reader;
                actorDesc.parentEntryId = scene.maybeGetParentEntryId(actorId);
                actorDesc.drawOrderParams.relativity = Scene::DrawOrderParams::FrontOf;
                actorDesc.drawOrderParams.relativeToActor = actorId;
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

  for (auto &triggerWriter : RulesBehavior::triggerWriters) {
    RuleEntryData data;
    triggerWriter.write(triggerWriter.name, &data);
    ev.triggers().push_back(data);
  }
  for (auto &responseWriter : RulesBehavior::responseWriters) {
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
  for (auto &expressionWriter : RulesBehavior::expressionWriters) {
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
    auto editor = engine.maybeGetEditor();
    if (type == "scene") {
      if (action == "setBackgroundColor") {
        auto colorValue = params.colorValue();
        auto oldColorValue = editor->getScene().props.backgroundColor();
        editor->getCommands().execute(
            "set background color", {},
            [colorValue](Editor &editor, bool) {
              editor.getScene().props.backgroundColor().set(
                  colorValue.r, colorValue.g, colorValue.b, colorValue.a);
            },
            [oldColorValue](Editor &editor, bool) {
              editor.getScene().props.backgroundColor().set(
                  oldColorValue.r, oldColorValue.g, oldColorValue.b, oldColorValue.a);
            });
      }
    } else if (type == "grab") {
      engine.maybeGetEditor()->getGrabTool().changeSettings(action, params.doubleValue());
    } else if (type == "scale_rotate") {
      engine.maybeGetEditor()->getScaleRotateTool().changeSettings(action, params.doubleValue());
    }
    engine.maybeGetEditor()->sendSceneSettings();
  }
};

struct EditorSceneSettingsEvent {
  PROP(Scene::Props *, sceneProperties);
  PROP(GrabTool::Props *, grabToolProperties);
  PROP(ScaleRotateTool::Props *, scaleRotateToolProperties);
};

void Editor::sendSceneSettings() {
  EditorSceneSettingsEvent ev;
  ev.sceneProperties = &getScene().props;
  ev.grabToolProperties = &grab.props;
  ev.scaleRotateToolProperties = &scaleRotate.props;
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

void Editor::maybeSendData(double dt) {
  if (!scene) {
    return;
  }
  if (isEditorStateDirty) {
    sendGlobalActions();
    isEditorStateDirty = false;
  }
  if (auto &library = scene->getLibrary(); library.editorNeedsSend) {
    sendLibrary();
    library.editorNeedsSend = false;
  }
  if (isSelectedActorStateDirty) {
    sendSelectedActorData();
    isSelectedActorStateDirty = false;
  }
  if (!selectedComponentStateDirty.empty()) {
    for (auto behaviorId : selectedComponentStateDirty) {
      // TODO: only send certain components unless inspector is open
      sendSelectedComponent(behaviorId);
    }
    selectedComponentStateDirty.clear();
  }
  scene->getBehaviors().byType<TextBehavior>().maybeSendBridgeData(dt);
}

struct EditorNewBlueprintReceiver {
  inline static const BridgeRegistration<EditorNewBlueprintReceiver> registration {
    "EDITOR_NEW_BLUEPRINT"
  };

  struct Params {
    std::string newEntryId = Library::generateEntryId();
    std::shared_ptr<Archive> archive = std::make_shared<Archive>();

    void read(Reader &reader) {
      reader.obj("entry", [&]() {
        archive->write([&](Writer &writer) {
          writer.setValue(*reader.jsonValue());
          writer.overwrite("entryId", [&]() {
            writer.setStr(newEntryId);
          });
        });
      });
    }
  } params;

  void receive(Engine &engine) {
    if (!engine.getIsEditing()) {
      return;
    }
    auto editor = engine.maybeGetEditor();
    if (!editor) {
      return;
    }
    editor->getCommands().execute(
        "add blueprint", {},
        [newEntryId = params.newEntryId, archive = std::move(params.archive)](
            Editor &editor, bool) {
          auto &library = editor.getScene().getLibrary();
          archive->read([&](Reader &reader) {
            library.readEntry(reader);
          });
          editor.getSelection().deselectAllActors();
          auto &belt = editor.getBelt();
          belt.select(newEntryId);
        },
        [newEntryId = params.newEntryId](Editor &editor, bool) {
          editor.getSelection().deselectAllActors();
          editor.getScene().getLibrary().removeEntry(newEntryId.c_str());
        });
  }
};
