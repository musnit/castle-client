#include "snapshot.h"

#include "scene.h"
#include "behaviors/all.h"


//
// Constructor, destructor
//

Snapshot::Snapshot(Archive archive_)
    : archive(std::move(archive_)) {
}


//
// From file or JSON
//

Snapshot Snapshot::fromFile(const char *path) {
  return Snapshot(Archive::fromFile(path));
}

Snapshot Snapshot::fromJson(const char *json) {
  return Snapshot(Archive::fromJson(json));
}


//
// To `Scene`
//

// Whether `T::props` exists
template<typename T, typename = void>
static constexpr auto hasPropsMember = false;
template<typename T>
static constexpr auto hasPropsMember<T, std::void_t<decltype(std::declval<T>().props)>> = true;

Scene Snapshot::toScene() {
  Scene scene;
  auto &library = scene.getLibrary();

  archive.read([&](Archive::Reader &reader) {
    // Library
    reader.each("library", [&]() {
      library.readEntry(reader);
    });

    // Actors
    reader.each("actors", [&]() {
      // Actor ID
      auto maybeActorIdStr = reader.str("actorId");
      if (!maybeActorIdStr) {
        fmt::print("tried to read actor without `actorId`!");
        return;
      }
      auto actorIdStr = *maybeActorIdStr;
      fmt::print("reading actor '{}'\n", actorIdStr);

      // Add actor
      auto actorId = scene.addActor();

      // Parent entry
      std::optional<Reader> maybeEntryComponentsReader;
      if (auto maybeEntryId = reader.str("parentEntryId")) {
        if (auto maybeEntry = library.maybeGetEntry(*maybeEntryId)) {
          auto &entryJson = maybeEntry->getJsonValue();
          Reader entryReader(entryJson);
          entryReader.obj("actorBlueprint", [&]() {
            entryReader.obj("components", [&]() {
              // TODO(nikki): We can cache the component reader in the `LibraryEntry` to reuse the
              //              reader lookup cache when we add one
              maybeEntryComponentsReader = Reader(*entryReader.jsonValue());
            });
          });
        };
      }

      // Components
      reader.obj("bp", [&]() {
        reader.obj("components", [&]() {
          // Fallback to blueprint's components
          if (maybeEntryComponentsReader) {
            reader.setFallback(maybeEntryComponentsReader->jsonValue());
          }

          // Load each component
          reader.each([&](const char *behaviorName) {
            auto found = false;
            scene.getBehaviors().byName(behaviorName, [&](auto &behavior) {
              // We found a behavior with this name
              found = true;
              fmt::print("  reading component '{}'\n", behaviorName);

              // Fallback to blueprints's properties for this component
              if (maybeEntryComponentsReader) {
                maybeEntryComponentsReader->obj(behaviorName, [&]() {
                  reader.setFallback(maybeEntryComponentsReader->jsonValue());
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
            if (!found) {
              // Didn't find this behavior, just log for now
              fmt::print("  skipped component '{}'\n", behaviorName);
            }
          });

          // After all components are loaded, call enable handlers in behavior order
          scene.getBehaviors().forEachBehavior([&](auto &behavior) {
            if constexpr (Handlers::hasEnableComponent<decltype(behavior)>) {
              if (auto component = behavior.maybeGetComponent(actorId);
                  component && !component->disabled) {
                behavior.handleEnableComponent(actorId, *component);
              }
            }
          });
        });
      });

      // Debug
      if (scene.getBehaviors().byType<BodyBehavior>().hasComponent(actorId)) {
        scene.getBehaviors().byType<DebugDrawBehavior>().addComponent(actorId);
      }
    });

    // Scene-level props
    reader.obj("sceneProperties", [&]() {
      reader.read(scene.props);
    });
  });

  return scene;
}
