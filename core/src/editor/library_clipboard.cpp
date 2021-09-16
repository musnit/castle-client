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
          editor->getLibraryClipboard().sendClipboardData(editor->getBridge());
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
};

void LibraryClipboard::sendClipboardData(Bridge &bridge) {
  // TODO: number of actors using entry
  // used by scenecreator/sheets/NewBlueprintsSheet
  LibraryClipboardDataEvent ev { hasEntry() };
  bridge.sendEvent("BLUEPRINT_CLIPBOARD_DATA", ev);
}
