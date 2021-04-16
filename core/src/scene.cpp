#include "scene.h"

#include "behaviors/all.h"


//
// Constructor, destructor
//

Scene::Scene()
    : behaviors(std::make_unique<AllBehaviors>(*this)) {
  // Create the background body (a static body useful to attach joints to)
  {
    b2BodyDef physicsBackgroundBodyDef;
    physicsBackgroundBody = physicsWorld.CreateBody(&physicsBackgroundBodyDef);
  }

  // Seed the random number generator
  // TODO(nikki): This seems to not actually help?
  rng.setSeed({ love::uint64(lv.timer.getTime()) });
}

Scene::~Scene() = default;

Scene::Scene(Scene &&) = default;


//
// Actor management
//

// Whether `T::props` exists -- used by `addActor`
template<typename T, typename = void>
static constexpr auto hasPropsMember = false;
template<typename T>
static constexpr auto hasPropsMember<T, std::void_t<decltype(std::declval<T>().props)>> = true;

ActorId Scene::addActor(Reader *maybeReader, const char *maybeParentEntryId) {
  // Find parent entry
  const LibraryEntry *maybeParentEntry = nullptr;
  if (maybeParentEntryId) {
    maybeParentEntry = library.maybeGetEntry(maybeParentEntryId);
    if (!maybeParentEntry && !maybeReader) {
      return nullActor; // Parent entry requested but doesn't exist, and we also have no actor data
    }
  }

  // Actor
  auto actorId = registry.create();
  registry.emplace<Actor>(actorId, nextNewDrawOrder++);
  needDrawOrderSort = true;

  // Components reading code that's called below
  std::optional<Reader> maybeFallbackComponentsReader;
  const auto readComponents = [&](Reader &reader) {
    // Fallback to blueprint's components
    if (maybeFallbackComponentsReader) {
      reader.setFallback(maybeFallbackComponentsReader->jsonValue());
    }

    // Load each component
    reader.each([&](const char *behaviorName) {
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

        // Add component to actor
        auto &component = behavior.addComponent(actorId);

        // Read enabled state
        component.disabled = reader.boolean("disabled", false);

        // Read props
        if constexpr (hasPropsMember<decltype(component)>) {
          reader.read(component.props);
        }

        // Call `handleReadComponent`
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
    auto &parentJson = maybeParentEntry->getJsonValue();
    Reader parentReader(parentJson);
    parentReader.obj("actorBlueprint", [&]() {
      parentReader.obj("components", [&]() {
        // TODO(nikki): We can cache the component reader in the `LibraryEntry` to reuse the
        //              reader lookup cache when we add one
        if (maybeReader) {
          // Have an actor reader, just set the parent reader to fallback to
          maybeFallbackComponentsReader = Reader(*parentReader.jsonValue());
        } else {
          // No actor reader given, read directly from parent
          readComponents(parentReader);
        }
      });
    });
  }

  // Read from actor reader
  if (maybeReader) {
    maybeReader->obj("components", [&]() {
      readComponents(*maybeReader);
    });
  }

  // Debug draw (must be enabled in 'all.h' for this to work)
  // if (getBehaviors().byType<BodyBehavior>().hasComponent(actorId)) {
  //  getBehaviors().byType<DebugDrawBehavior>().addComponent(actorId);
  //}

  return actorId;
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
    if constexpr (Handlers::hasDisableComponent<decltype(behavior)>) {
      if (auto component = behavior.maybeGetComponent(actorId)) {
        behavior.handleDisableComponent(actorId, *component, true);
      }
    }
  });
  registry.destroy(actorId);
  needDrawOrderSort = true;
}

void Scene::setActorDrawOrder(ActorId actorId, int newDrawOrder) {
  getActor(actorId).drawOrder = newDrawOrder;
  nextNewDrawOrder = std::max(nextNewDrawOrder, newDrawOrder + 1);
  needDrawOrderSort = true;
}

void Scene::ensureDrawOrderSort() const {
  if (needDrawOrderSort) {
    const_cast<entt::registry &>(registry).sort<Actor>([&](const Actor &a, const Actor &b) {
      return a.drawOrder < b.drawOrder;
    });
    needDrawOrderSort = false;
    auto nextCompactDrawOrder = 0;
    registry.view<const Actor>().each([&](const Actor &actor) {
      actor.drawOrder = nextCompactDrawOrder++;
    });
    nextNewDrawOrder = nextCompactDrawOrder;
  }
}


//
// Update
//

void Scene::update(double dt) {
  // Update time
  performTime += dt; // For now we're always performing

  // Update gesture first so behaviors can read it
  gesture.update();

  // Step physics. Do this before behavior performance to allow behaviors to make changes after.
  // We're using a fixed timestep (see https://gafferongames.com/post/fix_your_timestep/).
  {
    constexpr auto maxSteps = 60;
    constexpr auto updateRate = 120.0, updatePeriod = 1 / updateRate;
    physicsUpdateTimeRemaining += dt;
    auto nSteps = 0;
    while (physicsUpdateTimeRemaining >= updatePeriod) {
      if (nSteps > maxSteps) {
        physicsUpdateTimeRemaining = 0;
        break;
      }
      physicsWorld.Step(updatePeriod, 6, 2);
      physicsUpdateTimeRemaining -= updatePeriod;
    }
  }

  // Perform behaviors
  getBehaviors().forEach([&](auto &behavior) {
    if constexpr (Handlers::hasPerform<decltype(behavior)>) {
      behavior.handlePerform(dt);
    }
  });
}


//
// Draw
//

void Scene::draw() const {
  lv.graphics.clear(props.backgroundColor(), {}, {});

  lv.graphics.push(love::Graphics::STACK_ALL);

  // Temporary view transform
  constexpr auto viewWidth = 10.0, viewHeight = 7.0 * viewWidth / 5.0;
  viewTransform.reset();
  viewTransform.scale(800.0 / viewWidth, 800.0 / viewWidth);
  viewTransform.translate(0.5 * viewWidth, 0.5 * viewHeight);
  lv.graphics.applyTransform(&viewTransform);

  // Scene
  forEachActorByDrawOrder([&](ActorId actorId, const Actor &actor) {
    getBehaviors().forEach([&](auto &behavior) {
      if constexpr (Handlers::hasDrawComponent<decltype(behavior)>) {
        if (auto component = behavior.maybeGetComponent(actorId)) {
          behavior.handleDrawComponent(actorId, *component);
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
