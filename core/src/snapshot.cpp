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

std::unique_ptr<Scene> Snapshot::toScene(Variables &variables) {
  auto scene = std::make_unique<Scene>(variables);
  auto &library = scene->getLibrary();

  // Common scene reading code used below
  const auto readScene = [&](Archive::Reader &reader) {
    // Library
    reader.each("library", [&]() {
      library.readEntry(reader);
    });

    // Actors
    reader.each("actors", [&]() {
      // Log actor ID
      auto maybeActorIdStr = reader.str("actorId");
      if (!maybeActorIdStr) {
        Debug::log("tried to read actor without `actorId`!");
        return;
      }
      // auto actorIdStr = *maybeActorIdStr;

      // Read actor
      auto maybeParentEntryId = reader.str("parentEntryId", nullptr);
      reader.obj("bp", [&]() {
        scene->addActor(&reader, maybeParentEntryId);
      });
    });

    // Scene-level props
    reader.obj("sceneProperties", [&]() {
      reader.read(scene->props);
    });
  };

  archive.read([&](Archive::Reader &reader) {
    reader.setScene(scene.get()); // Associate new reader with scene
    reader.obj("snapshot", [&]() {
      readScene(reader);
    });
  });

  return scene;
}
