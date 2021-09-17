#include "library_clipboard.h"
#include "engine.h"

bool LibraryClipboard::hasEntry() {
  return currentEntryId.has_value();
}

struct LibraryClipboardCopyReceiver {
  inline static const BridgeRegistration<LibraryClipboardCopyReceiver> registration {
    "COPY_SELECTED_BLUEPRINT"
  };

  struct Params {
  } params;

  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    if (!editor)
      return;
    auto &selection = editor->getSelection();
    if (selection.isGhostActorsSelected()) {
      auto actorId = selection.firstSelectedActorId();
      auto &scene = editor->getScene();
      if (auto entryIdCStr = scene.maybeGetParentEntryId(actorId)) {
        auto &library = scene.getLibrary();
        if (auto entry = library.maybeGetEntry(entryIdCStr)) {
          editor->getLibraryClipboard().copyLibraryEntry(entry);
          editor->getLibraryClipboard().sendClipboardData(editor->getBridge(), editor->getScene());
        }
      }
    }
  }
};

void LibraryClipboard::copyLibraryEntry(LibraryEntry *entry) {
  if (!entry)
    return;

  Archive archive;
  archive.write([&](Writer &writer) {
    entry->write(writer);
  });
  currentEntryId = entry->getEntryId();
  currentEntryJson = archive.toJson();
}

// TODO: paste
// listen for PASTE_BLUEPRINT
// if entryId already exists, override that blueprint and update actors
// otherwise just add this entryId to the library/belt

struct LibraryClipboardDataEvent {
  PROP(bool, hasEntry) = false;
  PROP(int, numActorsUsingEntry) = 0;

  // don't send the `LibraryEntry *` directly because we want a snapshot
  // of the moment when it was copied, and it may have changed later
  PROP(std::optional<std::string>, entryJson);
};

void LibraryClipboard::sendClipboardData(Bridge &bridge, Scene &scene) {
  auto numOtherActors = 0;
  if (hasEntry()) {
    scene.forEachActor([&](ActorId otherActorId) {
      auto entryIdCStr = currentEntryId->c_str();
      if (auto otherEntryIdCStr = scene.maybeGetParentEntryId(otherActorId)) {
        if (!scene.isGhost(otherActorId) && !std::strcmp(entryIdCStr, otherEntryIdCStr)) {
          numOtherActors++;
        }
      }
    });
  }

  LibraryClipboardDataEvent ev { hasEntry(), numOtherActors, currentEntryJson };
  bridge.sendEvent("EDITOR_BLUEPRINT_CLIPBOARD_DATA", ev);
}
