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
              (void)component;

              // Read props
              reader.each([&](const char *propName) {
                fmt::print("    reading prop '{}'\n", propName);
              });

              // TODO: Call `handleReadComponent` handler
            });
            if (!found) {
              // Didn't find this behavior, just log for now
              fmt::print("  skipped component '{}'\n", behaviorName);
            }
          });
        });
      });

      // Debug
      if (scene.getBehaviors().byType<BodyBehavior>().hasComponent(actorId)) {
        scene.getBehaviors().byType<DebugDrawBehavior>().addComponent(actorId);
      }
    });
  });

  return scene;
}
