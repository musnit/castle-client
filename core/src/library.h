#pragma once

#include "precomp.h"

#include "lv.h"
#include "archive.h"
#include "scene.h"


class LibraryEntry {
  // An asset in the library. Right now actor blueprints are pretty much the only asset type.

public:
  LibraryEntry(const LibraryEntry &) = delete; // Prevent accidental copies
  const LibraryEntry &operator=(const LibraryEntry &) = delete;

  explicit LibraryEntry(Library &library_, const char *entryId_, const json::Value &jsonValue,
      json::CrtAllocator &baseAlloc);
  ~LibraryEntry();

  template<typename F>
  void read(F &&f) const; // `f` must be `(Reader &)`, gets called with a reader of our JSON
  void write(Writer &writer) const; // Overwrites current value at writer with our JSON

  const std::string &getEntryId() const;
  const std::string &getTitle() const;
  bool getTitleEdited() const; // Whether the user explicitly changed the title from the default

  std::pair<std::optional<const char *>, int> getBase64Png() const;
  love::Image *getPreviewImage() const;

  ActorId getGhostActorId();

  void disambiguateTitle();


private:
  friend class Library;
  Library &library;

  // Each library entry has its own memory pool so that the json values within a library entry are
  // close together in memory and deallocated all at once when the library entry is dropped. The
  // memory pool gets its memory from the library entry's containing `Library`'s `baseAlloc`.
  json::MemoryPoolAllocator<json::CrtAllocator> alloc;

  json::Value jsonValue;

  std::string entryId;
  std::string title;
  bool titleEdited = false;

  mutable bool previewImageGenerated = false;
  mutable std::unique_ptr<love::ImageData> previewImageData;
  mutable std::unique_ptr<love::Image> previewImage;

  bool ghostActorCreated = false;
  ActorId ghostActorId = nullActor;
};

class Library {
  // Stores a library of entries that scenes can read / write. The scene doesn't store this data
  // directly to allow for sharing / caching entry data across scenes in the future, if we end up
  // doing that.

public:
  Library(const Library &) = delete; // Prevent accidental copies
  const Library &operator=(const Library &) = delete;

  explicit Library(Scene &scene_);


  // Entry ids

  static std::string generateEntryId();


  // Entry access

  LibraryEntry *maybeGetEntry(const char *entryId); // `nullptr` if not found
  template<typename F>
  void forEachEntry(F &&f); // `F` takes `(LibraryEntry &)`, iterates in order
  int numEntries() const;
  const LibraryEntry *indexEntry(int index); // `nullptr` if out of bounds
  void removeEntry(const char *entryId); // Does nothing if not found


  // Read / write

  void readEntry(Reader &reader); // Creates or updates existing entry based on `entryId` read

  void write(Writer &writer) const;


  // Ghost actors

  void ensureGhostActorsExist();


  // For editor to track library-data-needs-send status
  bool editorNeedsSend = true;


private:
  Lv &lv { Lv::getInstance() };
  friend class LibraryEntry;

  Scene &scene;

  json::CrtAllocator baseAlloc;

  std::unordered_map<std::string, LibraryEntry> entries;
  std::vector<LibraryEntry *> order;
  bool orderDirty = true;

  std::unordered_map<std::string, ActorId> ghostActorIds;

  std::unique_ptr<love::Canvas> textPreviewCanvas;
  std::unique_ptr<love::Font> textPreviewFont = std::unique_ptr<love::Font>(
      lv.graphics.newDefaultFont(32, love::TrueTypeRasterizer::HINTING_NORMAL));
  float textPreviewFontHeight = textPreviewFont->getHeight();
  float textPreviewOffset = 0.3f * textPreviewFontHeight;
  float textPreviewSize = 4 * textPreviewFontHeight;
  float textPreviewCanvasSize = textPreviewSize + 2 * textPreviewOffset;


  void markDirty();


  void ensureOrder();
};


// Inline implementations

inline Library::Library(Scene &scene_)
    : scene(scene_) {
}

inline const std::string &LibraryEntry::getEntryId() const {
  return entryId;
}

inline const std::string &LibraryEntry::getTitle() const {
  return title;
}

inline bool LibraryEntry::getTitleEdited() const {
  return titleEdited;
}

inline std::pair<std::optional<const char *>, int> LibraryEntry::getBase64Png() const {
  std::pair<std::optional<const char *>, int> result;
  read([&](Reader &reader) {
    result = reader.strAndLength("base64Png");
  });
  return result;
}

template<typename F>
void LibraryEntry::read(F &&f) const {
  if (jsonValue.IsObject()) {
    Reader reader(jsonValue);
    f(reader);
  }
}

inline void LibraryEntry::write(Writer &writer) const {
  writer.setValue(jsonValue);
}

inline LibraryEntry *Library::maybeGetEntry(const char *entryId) {
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

inline int Library::numEntries() const {
  return int(entries.size());
}

inline const LibraryEntry *Library::indexEntry(int index) {
  ensureOrder();
  if (0 <= index && index < int(order.size())) {
    return order[index];
  }
  return nullptr;
}

inline void Library::removeEntry(const char *entryId) {
  entries.erase(entryId);
  markDirty();
}

inline void Library::write(Writer &writer) const {
  const_cast<Library &>(*this).forEachEntry([&](const LibraryEntry &entry) {
    writer.obj(entry.getEntryId(), [&]() {
      entry.write(writer);
    });
  });
}
