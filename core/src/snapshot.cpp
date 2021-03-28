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

Snapshot Snapshot::fromJSON(const char *json) {
  return Snapshot(Archive::fromJSON(json));
}


//
// To `Scene`
//

Scene Snapshot::toScene() {
  Scene scene;

  archive.read([&](Archive::Reader &reader) {
    // Library
    reader.each("library", [&](const char *entryId) {
      fmt::print("reading library entry '{}'\n", entryId);
    });

    // Actors
    reader.each("actors", [&]() {
      // Actor ID
      auto maybeActorId = reader.str("actorId");
      if (!maybeActorId) {
        return;
      }
      auto actorId = *maybeActorId;
      fmt::print("reading actor '{}'\n", actorId);
    });
  });

  return scene;
}
