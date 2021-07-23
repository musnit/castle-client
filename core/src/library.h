#pragma once

#include "precomp.h"

#include "lv.h"
#include "archive.h"


class LibraryEntry {
  // An asset in the library. Right now actor blueprints are pretty much the only asset type.

public:
  LibraryEntry(const LibraryEntry &) = delete; // Prevent accidental copies
  const LibraryEntry &operator=(const LibraryEntry &) = delete;

  explicit LibraryEntry(const json::Value &jsonValue, json::CrtAllocator &baseAlloc);

  template<typename F>
  void read(F &&f) const;

  love::Image *getPreviewImage() const;


private:
  friend class Library;

  // Each library entry has its own memory pool so that the json values within a library entry are
  // close together in memory and deallocated all at once when the library entry is dropped. The
  // memory pool gets its memory from the library entry's containing `Library`'s `baseAlloc`.
  json::MemoryPoolAllocator<json::CrtAllocator> alloc;

  json::Value jsonValue;

  std::string title;

  mutable bool previewImageGenerated = false;
  mutable std::unique_ptr<love::ImageData> previewImageData;
  mutable std::unique_ptr<love::Image> previewImage;
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
  template<typename F>
  void forEachEntry(F &&f); // `F` takes `(LibraryEntry &)`, iterates in order
  int numEntries() const;
  const LibraryEntry *indexEntry(int index); // `nullptr` if out of bounds


  // Entry read / write

  void readEntry(Reader &reader); // Creates or updates existing entry based on `entryId` read


private:
  json::CrtAllocator baseAlloc;

  std::unordered_map<std::string, LibraryEntry> entries;
  std::vector<LibraryEntry *> order;
  bool orderDirty = true;


  void markOrderDirty();
  void ensureOrder();
};


// Inline implementations

template<typename F>
void LibraryEntry::read(F &&f) const {
  if (jsonValue.IsObject()) {
    Reader reader(jsonValue);
    f(reader);
  }
}

inline const LibraryEntry *Library::maybeGetEntry(const char *entryId) {
  if (auto found = entries.find(entryId); found != entries.end()) {
    return &found->second;
  }
  return nullptr;
}

template<typename F>
void Library::forEachEntry(F &&f) {
  ensureOrder();
  for (auto entry : order) {
    f(*entry);
  }
}

inline const LibraryEntry *Library::indexEntry(int index) {
  ensureOrder();
  if (0 <= index && index < int(order.size())) {
    return order[index];
  }
  return nullptr;
}

inline int Library::numEntries() const {
  return int(entries.size());
}
