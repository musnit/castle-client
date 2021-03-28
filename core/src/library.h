#pragma once

#include "precomp.h"


class Reader;

class LibraryEntry {
  // An asset in the library. Right now actor blueprints are pretty much the only asset type.

public:
  LibraryEntry(const LibraryEntry &) = delete; // Prevent accidental copies
  auto operator=(const LibraryEntry &) -> LibraryEntry & = delete;
  LibraryEntry(LibraryEntry &&) = default; // Allow moves
  auto operator=(LibraryEntry &&) -> LibraryEntry & = default;

  const json::Value &getJsonValue() const;


private:
  friend class Library;

  json::Value jsonValue;

  LibraryEntry(json::Value jsonValue);
};

class Library {
  // Stores a library entries that scenes can read / write. The scene doesn't store this data
  // directly to allow for sharing / caching entry data across scenes in the future, if we end up
  // doing that.

public:
  Library(const Library &) = delete; // Prevent accidental copies
  const Library &operator=(const Library &) = delete;
  Library(Library &&) = default; // Allow moves
  Library &operator=(Library &&) = default;

  Library() = default;


  // Entry access

  const LibraryEntry *maybeGetEntry(const char *entryId); // `nullptr` if not found


  // Entry update

  void readEntry(Reader &reader); // Creates or updates existing entry based on `entryId` read


private:
  json::MemoryPoolAllocator<json::CrtAllocator> alloc;
  std::unordered_map<std::string, LibraryEntry> entries;
};


// Inline implementations

inline const json::Value &LibraryEntry::getJsonValue() const {
  return jsonValue;
}

inline const LibraryEntry *Library::maybeGetEntry(const char *entryId) {
  if (auto found = entries.find(entryId); found != entries.end()) {
    return &found->second;
  }
  return nullptr;
}
