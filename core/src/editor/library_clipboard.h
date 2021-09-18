#pragma once

#include "precomp.h"
#include "library.h"
#include "bridge.h"

class Editor;

class LibraryClipboard {
public:
  LibraryClipboard(const LibraryClipboard &) = delete;
  const LibraryClipboard &operator=(const LibraryClipboard &) = delete;
  LibraryClipboard() = default;

  bool hasEntry();
  std::optional<std::string> getCurrentEntryId();
  void copyLibraryEntry(LibraryEntry *entry);
  void pasteCurrentEntry(Editor *editor);

  void sendClipboardData(Bridge &bridge, Scene &scene);

private:
  std::optional<std::string> currentEntryId;
  std::optional<std::string> currentEntryJson;
};

inline std::optional<std::string> LibraryClipboard::getCurrentEntryId() {
  return currentEntryId;
}