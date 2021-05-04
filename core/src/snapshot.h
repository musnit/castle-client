#pragma once

#include "precomp.h"

#include "archive.h"
#include "variables.h"


class Scene;

class Snapshot {
  // Represents a saved state of a scene. Can be constructed either from JSON (parses the JSON) or
  // from a `Scene` (saves the scene). Is immutable once created.
  //
  // Can make JSON or a `Scene` out of it whenever.

public:
  Snapshot(const Snapshot &) = delete; // Prevent accidental copies
  const Snapshot &operator=(const Snapshot &) = delete;


  // From file or JSON

  static Snapshot fromFile(const char *path);
  static Snapshot fromJson(const char *json);


  // To JSON

  std::string toJson();


  // To `Scene`

  std::unique_ptr<Scene> toScene(Variables &variables);


private:
  const Archive archive;


  explicit Snapshot(Archive archive_);
};
