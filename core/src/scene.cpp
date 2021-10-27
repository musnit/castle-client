#include "scene.h"

#include "behaviors/all.h"
#include "library.h"
#include "js.h"


//
// Constructor, destructor
//

Scene::Scene(Bridge &bridge_, Variables &variables_, bool isEditing_, Reader *maybeReader)
    : variables(variables_)
    , bridge(bridge_)
    , isEditing(isEditing_)
    , physicsContactListener(*this)
    , behaviors(std::make_unique<AllBehaviors>(*this))
    , library(std::make_unique<Library>(*this)) {
  // Link to variables
  variables.linkScene(this);

  // Physics setup
  {
    // Associate contact listener
    physicsWorld.SetContactListener(&physicsContactListener);

    // Create background body (a static body useful to attach joints to)
    b2BodyDef physicsBackgroundBodyDef;
    physicsBackgroundBody = physicsWorld.CreateBody(&physicsBackgroundBodyDef);
  }

  // Seed the random number generator
  rng.setSeed({ love::uint64(lv.timer.getTime()) });

  // Read
  if (maybeReader) {
    read(*maybeReader);
  }
}

Scene::~Scene() {
  // Unlink from variables
  variables.unlinkScene(this);
}


//
// Read, write
//

void Scene::read(Reader &reader) {
  reader.setScene(this);

  // Library
  reader.each("library", [&]() {
    library->readEntry(reader);
  });

  // Actors
  auto inherit = reader.boolean("actorBlueprintInherit", false);
  reader.each("actors", [&]() {
    // Legacy actor ID
    auto maybeActorIdStr = reader.str("actorId");
    if (!maybeActorIdStr) {
      Debug::log("tried to read actor without `actorId`!");
      return;
    }
    // auto actorIdStr = *maybeActorIdStr;

    // Actor
    auto maybeParentEntryId = reader.str("parentEntryId", nullptr);
    reader.obj("bp", [&]() {
      ActorDesc actorDesc;
      actorDesc.reader = &reader;
      actorDesc.parentEntryId = maybeParentEntryId;
      actorDesc.inherit = inherit;
      addActor(actorDesc);
    });
  });

  // Scene-level props
  reader.obj("sceneProperties", [&]() {
    reader.read(props);
  });
}

void Scene::write(Writer &writer) const {
  // Library
  writer.obj("library", [&]() {
    library->write(writer);
  });

  // Actors
  writer.arr("actors", [&]() {
    forEachActorByDrawOrder([&](ActorId actorId) {
      writer.obj([&]() {
        writer.str("actorId", std::to_string(entt::to_integral(actorId)));
        if (auto parentEntryId = maybeGetParentEntryId(actorId)) {
          writer.str("parentEntryId", parentEntryId);
        }
        writer.obj("bp", [&]() {
          writeActor(actorId, writer, {});
        });
      });
    });
  });
  writer.boolean("actorBlueprintInherit", true); // Lua client checks for this

  // Scene-level props
  writer.obj("sceneProperties", [&]() {
    writer.write(props);
  });
}


//
// Actor management
//

ActorId Scene::addActor(const ActorDesc &params) {
  // Find parent entry
  const LibraryEntry *maybeParentEntry = nullptr;
  if (params.parentEntryId) {
    maybeParentEntry = library->maybeGetEntry(params.parentEntryId);
    if (!maybeParentEntry && !params.reader) {
      return nullActor; // Parent entry requested but doesn't exist, and we also have no actor data
    }
  }

  // Actor
  auto actorId = params.requestedActorId != nullActor ? registry.create(params.requestedActorId)
                                                      : registry.create();

  // Draw order
  setDrawOrder(actorId, params.drawOrderParams);

  // Track parent entry id
  if (params.parentEntryId) {
    setParentEntryId(actorId, params.parentEntryId);
  }

  // Track ghost-ness
  if (params.isGhost) {
    registry.emplace<Ghost>(actorId);
  }

  // Components reading code that's called below
  std::optional<Reader> maybeFallbackComponentsReader;
  const auto readComponents = [&](Reader &reader) {
    // Fallback to blueprint's components
    if (params.inherit && maybeFallbackComponentsReader) {
      reader.setFallback(maybeFallbackComponentsReader->jsonValue());
    }

    // Load each component
    reader.each([&](const char *behaviorName) {
      if (reader.jsonValue()->GetType() != json::kObjectType) {
        return;
      }
      auto found = false;
      getBehaviors().byName(behaviorName, [&](auto &behavior) {
        // We found a behavior with this name
        found = true;

        // Fallback to blueprints's properties for this component
        if (maybeFallbackComponentsReader) {
          maybeFallbackComponentsReader->obj(behaviorName, [&]() {
            reader.setFallback(maybeFallbackComponentsReader->jsonValue());
          });
        }

        // Add component and read its properties. Call behavior's read handler if it has one.
        auto &component = behavior.addComponent(actorId);
        component.disabled = reader.boolean("disabled", false);
        reader.read(component.props);
        if constexpr (Handlers::hasReadComponent<decltype(behavior)>) {
          behavior.handleReadComponent(actorId, component, reader);
        }
      });
    });

    // After all components are loaded, call enable handlers in behavior order
    getBehaviors().forEach([&](auto &behavior) {
      if constexpr (Handlers::hasEnableComponent<decltype(behavior)>) {
        if (auto component = behavior.maybeGetComponent(actorId);
            component && !component->disabled) {
          behavior.handleEnableComponent(actorId, *component);
        }
      }
    });
  };

  // Find parent components reader
  if (maybeParentEntry) {
    maybeParentEntry->read([&](Reader &parentReader) {
      parentReader.obj("actorBlueprint", [&]() {
        parentReader.obj("components", [&]() {
          // PERF: We can cache the component reader in the `LibraryEntry` to reuse the reader
          //       lookup cache when we add one
          if (params.reader) {
            // Have an actor reader, just set the parent reader to fallback to
            maybeFallbackComponentsReader = Reader(*parentReader.jsonValue());
          } else {
            // No actor reader given, read directly from parent
            parentReader.setScene(this); // New reader so make sure to associate with scene
            readComponents(parentReader);
          }
        });
      });
    });
  }

  // Read from actor reader
  if (params.reader) {
    params.reader->obj("components", [&]() {
      readComponents(*params.reader);
    });
  }

#ifdef ENABLE_DEBUG_DRAW
  // Debug draw (must be enabled in 'all.h' for this to work)
  if (getBehaviors().byType<BodyBehavior>().hasComponent(actorId)) {
    getBehaviors().byType<DebugDrawBehavior>().addComponent(actorId);
  }
#endif

  // Set position
  if (params.pos) {
    getBehaviors().byType<BodyBehavior>().setPosition(actorId, { params.pos->x, params.pos->y });
  }

  return actorId;
}

ActorId Scene::generateActorId() {
  auto result = registry.create();
  registry.destroy(result);
  return result;
}

void Scene::removeActor(ActorId actorId) {
  if (!hasActor(actorId)) {
    Debug::log("removeActor: no such actor");
    return;
  }
  getBehaviors().forEach([&](auto &behavior) {
    if constexpr (Handlers::hasPreRemoveActor<decltype(behavior)>) {
      if (auto component = behavior.maybeGetComponent(actorId)) {
        behavior.handlePreRemoveActor(actorId, *component);
      }
    }
  });
  getBehaviors().forEach([&](auto &behavior) {
    // NOTE: Must be consistent with `BaseBehavior::removeComponent` and
    //       `BaseBehavior::disableComponent`
    if constexpr (Handlers::hasDisableComponent<decltype(behavior)>) {
      if (auto component = behavior.maybeGetComponent(actorId)) {
        behavior.handleDisableComponent(actorId, *component, true);
      }
    }
  });
  registry.destroy(actorId);
  needDrawOrderSort = true;
}

void Scene::ensureDrawOrderSort() const {
  if (needDrawOrderSort) {
    const_cast<entt::registry &>(registry).sort<DrawOrder>(std::less());
    needDrawOrderSort = false;

    // 'Compact' draw orders: set values from 1 to `numActors()` in order, zero-out tie breaks
    auto nextCompactDrawOrder = 1;
    drawOrderView.each([&](DrawOrder &drawOrder) {
      drawOrder.value = nextCompactDrawOrder++;
      drawOrder.tieBreak = 0;
    });
    frontDrawOrder = nextCompactDrawOrder;
    nextDrawOrderTieBreak = initialDrawOrderTieBreak;
  }
}

void Scene::writeActor(ActorId actorId, Writer &writer, WriteActorParams params) const {
  writer.obj("components", [&]() {
    if (!params.inheritedProperties) {
      // TODO: More generalized system for saying which properties are inherited and which aren't
      //       (eg. add an attribute in `PropAttribs`). For now just specialcasing to layout
      //       properties as non-inherited.
      if (auto maybeBodyComponent
          = getBehaviors().byType<BodyBehavior>().maybeGetComponent(actorId);
          maybeBodyComponent) {
        writer.obj("Body", [&]() {
          writer.num("x", maybeBodyComponent->props.x());
          writer.num("y", maybeBodyComponent->props.y());
          if (params.layoutProperties) {
            writer.num("angle", maybeBodyComponent->props.angle());
            writer.num("widthScale", maybeBodyComponent->props.widthScale());
            writer.num("heightScale", maybeBodyComponent->props.heightScale());
          }
        });
      }
      if (auto maybeDrawing2Component
          = getBehaviors().byType<Drawing2Behavior>().maybeGetComponent(actorId);
          maybeDrawing2Component) {
        writer.obj("Drawing2", [&]() {
          writer.num("initialFrame", maybeDrawing2Component->props.initialFrame());
        });
      }
    } else {
      getBehaviors().forEach([&](auto &behavior) {
        if (auto component = behavior.maybeGetComponent(actorId)) {
          using Behavior = std::remove_reference_t<decltype(behavior)>;
          writer.obj(Behavior::name, [&]() {
            writer.write(component->props);
            if constexpr (Handlers::hasWriteComponent<decltype(behavior)>) {
              behavior.handleWriteComponent(actorId, *component, writer);
            }
            writer.boolean("disabled", component->disabled);
          });
        }
      });
    }
  });
}


//
// Update
//

void Scene::updateGesture() {
  gesture.update();
}

void Scene::update(double dt) {
  // Update time
  dt = std::min(dt, 0.1); // Clamp `dt` to avoid huge steps
  performTime += dt; // For now we're always performing

  // Update gesture first so behaviors can read it
  updateGesture();

  // Step physics. Do this before behavior performance to allow behaviors to make changes after.
  // We're using a fixed timestep (see https://gafferongames.com/post/fix_your_timestep/).
  {
    constexpr auto maxSteps = 20;
    constexpr auto updateRate = 120.0, updatePeriod = 1 / updateRate;
    physicsUpdateTimeRemaining += dt;
    nPhysicsStepsPerformed = 0;
    while (physicsUpdateTimeRemaining >= updatePeriod) {
      if (nPhysicsStepsPerformed >= maxSteps) {
        physicsUpdateTimeRemaining = 0;
        break;
      }
      physicsWorld.Step(updatePeriod, 6, 2);
      physicsUpdateTimeRemaining -= updatePeriod;
      ++nPhysicsStepsPerformed;
    }
  }

  // Perform behaviors
  getBehaviors().forEach([&](auto &behavior) {
    if constexpr (Handlers::hasPerform<decltype(behavior)>) {
      behavior.handlePerform(dt);
    }
  });

  // Move camera. Do this after behavior performance so we use the latest position of the camera
  // target actor.
  auto oldCameraX = cameraX, oldCameraY = cameraY;
  if (cameraTarget != nullActor) {
    if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(cameraTarget)) {
      auto [x, y] = body->GetPosition();
      cameraX = x;
      cameraY = y;
    } else {
      cameraTarget = nullActor;
    }
  }
  auto cameraDeltaX = cameraX - oldCameraX, cameraDeltaY = cameraY - oldCameraY;
  getBehaviors().forEach([&](auto &behavior) {
    if constexpr (Handlers::hasPerformCamera<decltype(behavior)>) {
      behavior.handlePerformCamera(cameraDeltaX, cameraDeltaY);
    }
  });
}


//
// Physics contacts
//

Scene::PhysicsContactListener::PhysicsContactListener(Scene &scene_)
    : scene(scene_) {
}

void Scene::PhysicsContactListener::BeginContact(b2Contact *contact) {
  scene.getBehaviors().forEach([&](auto &behavior) {
    if constexpr (Handlers::hasBeginPhysicsContact<decltype(behavior)>) {
      behavior.handleBeginPhysicsContact(contact);
    }
  });
}

void Scene::PhysicsContactListener::EndContact(b2Contact *contact) {
  scene.getBehaviors().forEach([&](auto &behavior) {
    if constexpr (Handlers::hasEndPhysicsContact<decltype(behavior)>) {
      behavior.handleEndPhysicsContact(contact);
    }
  });
}


//
// Draw
//

void Scene::applyViewTransform(float windowWidth) const {
  viewTransform.reset();
  viewTransform.scale(windowWidth / viewWidth, windowWidth / viewWidth);
  viewTransform.translate(0.5f * viewWidth, getViewYOffset());
  viewTransform.translate(-cameraX, -cameraY);
  lv.graphics.applyTransform(&viewTransform);
}

void Scene::draw(std::optional<SceneDrawingOptions> options) const {
  lv.graphics.clear(props.backgroundColor(), {}, {});

  lv.graphics.push(love::Graphics::STACK_ALL);

  float windowWidth = 800.0f;
  if (options && options->windowWidth > 0.0f) {
    windowWidth = options->windowWidth;
  }
  applyViewTransform(windowWidth);

  // Scene
  forEachActorByDrawOrder([&](ActorId actorId) {
    getBehaviors().forEach([&](auto &behavior) {
      if constexpr (Handlers::hasDrawComponent<decltype(behavior)>) {
        if (auto component = behavior.maybeGetComponent(actorId)) {
          behavior.handleDrawComponent(actorId, *component, options);
        }
      }
    });
  });

  // Overlays
  getBehaviors().forEach([&](auto &behavior) {
    if constexpr (Handlers::hasDrawOverlay<decltype(behavior)>) {
      behavior.handleDrawOverlay();
    }
  });

  lv.graphics.pop();
}

//
// Card navigation
//

JS_DEFINE(int, JS_navigateToCardId, (const char *cardId, int cardIdLen),
    { Castle.navigateToCardId(UTF8ToString(cardId, cardIdLen)); });

void Scene::setNextCardId(std::optional<std::string> value) {
#ifdef __EMSCRIPTEN__
  if (value) {
    JS_navigateToCardId(value->c_str(), value->length());
  }
#else
  nextCardId = std::move(value);
#endif
}
