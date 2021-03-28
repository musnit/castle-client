#include "snapshot.h"

#include "scene.h"


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
      auto maybeActorId = reader.str("actorId");
      if (!maybeActorId) {
        fmt::print("tried to read actor without `actorId`!");
        return;
      }
      auto actorId = *maybeActorId;
      fmt::print("reading actor '{}'\n", actorId);

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
          if (maybeEntryComponentsReader) {
            // Fallback to blueprint's components
            reader.setFallback(maybeEntryComponentsReader->jsonValue());
          }

          reader.each([&](const char *behaviorName) {
            fmt::print("  reading component '{}'\n", behaviorName);

            if (maybeEntryComponentsReader) {
              maybeEntryComponentsReader->obj(behaviorName, [&]() {
                // Fallback to blueprints's properties for this component
                reader.setFallback(maybeEntryComponentsReader->jsonValue());
              });
            }

            reader.each([&](const char *propName) {
              fmt::print("    reading prop '{}'\n", propName);
            });
          });
        });
      });
    });
  });

  return scene;
}
