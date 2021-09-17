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
          engine.getLibraryClipboard().copyLibraryEntry(entry);
          engine.getLibraryClipboard().sendClipboardData(editor->getBridge(), editor->getScene());
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

struct LibraryClipboardPasteReceiver {
  inline static const BridgeRegistration<LibraryClipboardPasteReceiver> registration {
    "PASTE_BLUEPRINT"
  };

  struct Params {
  } params;

  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    if (!editor)
      return;

    engine.getLibraryClipboard().pasteCurrentEntry(editor);
  }
};

void LibraryClipboard::pasteCurrentEntry(Editor *editor) {
  if (!hasEntry()) {
    return;
  }

  auto &library = editor->getScene().getLibrary();
  auto entryId = *currentEntryId;
  auto entryJson = *currentEntryJson;
  auto oldEntry = library.maybeGetEntry(entryId.c_str());

  if (!oldEntry) {
    // add new entry from clipboard
    editor->getCommands().execute(
        "add blueprint from clipboard", {},
        [entryJson](Editor &editor, bool) {
          auto &library = editor.getScene().getLibrary();
          auto archive = Archive::fromJson(entryJson.c_str());
          archive.read([&](Reader &reader) {
            library.readEntry(reader);
          });
        },
        [entryId](Editor &editor, bool) {
          auto &library = editor.getScene().getLibrary();
          library.removeEntry(entryId.c_str());
        });
  } else {
    // update existing entry from clipboard
    Archive archive;
    archive.write([&](Writer &writer) {
      oldEntry->write(writer);
    });
    auto oldEntryJson = archive.toJson();

    editor->getCommands().execute(
        "update blueprint from clipboard", {},
        [entryId, entryJson](Editor &editor, bool) {
          auto &library = editor.getScene().getLibrary();
          auto archive = Archive::fromJson(entryJson.c_str());
          archive.read([&](Reader &reader) {
            library.readEntry(reader);
          });
          editor.updateActorsWithEntryId(entryId, {});
        },
        [entryId, oldEntryJson](Editor &editor, bool) {
          auto &library = editor.getScene().getLibrary();
          auto archive = Archive::fromJson(oldEntryJson.c_str());
          archive.read([&](Reader &reader) {
            library.readEntry(reader);
          });
          editor.updateActorsWithEntryId(entryId, {});
        });
  }
}

struct LibraryClipboardSendDataReceiver {
  inline static const BridgeRegistration<LibraryClipboardSendDataReceiver> registration {
    "REQUEST_BLUEPRINT_CLIPBOARD_DATA"
  };

  struct Params {
  } params;

  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    if (!editor)
      return;

    engine.getLibraryClipboard().sendClipboardData(editor->getBridge(), editor->getScene());
  }
};

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
