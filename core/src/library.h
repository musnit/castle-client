#pragma once

#include "precomp.h"


class Reader;

class LibraryEntry {
  // An asset in the library. Right now actor blueprints are pretty much the only asset type.

public:
  LibraryEntry(const LibraryEntry &) = delete; // Prevent accidental copies
  const LibraryEntry &operator=(const LibraryEntry &) = delete;

  explicit LibraryEntry(const json::Value &jsonValue, json::CrtAllocator &baseAlloc);

  const json::Value &getJsonValue() const;


private:
  friend class Library;

  // Each library entry has its own memory pool so that the json values within a library entry are
  // close together in memory and deallocated all at once when the library entry is dropped. The
  // memory pool gets its memory from the library entry's containing `Library`'s `baseAlloc`.
  json::MemoryPoolAllocator<json::CrtAllocator> alloc;

  json::Value jsonValue;
};

class Library {
  // Stores a library of entries that scenes can read / write. The scene doesn't store this data
  // directly to allow for sharing / caching entry data across scenes in the future, if we end up
  // doing that.

public:
  Library(const Library &) = delete; // Prevent accidental copies
  const Library &operator=(const Library &) = delete;

  Library() = default;


  // Entry access

  const LibraryEntry *maybeGetEntry(const char *entryId); // `nullptr` if not found


  // Entry read / write

  void readEntry(Reader &reader); // Creates or updates existing entry based on `entryId` read


private:
  json::CrtAllocator baseAlloc;

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
