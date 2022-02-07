#include "commands.h"

#include "editor.h"
#include "library.h"


constexpr auto maxUndos = 100;
constexpr auto undoCoalesceInterval = 2.2;


//
// Execute
//

void Commands::execute(
    std::string description, Params params, Closure doClosure, Closure undoClosure) {
  auto coalesced = false;
  {
    Command command {
      std::move(description),
      lv.timer.getTime(),
      params.behaviorId,
    };
    command.entries[DO].closure = std::move(doClosure);
    command.entries[UNDO].closure = std::move(undoClosure);

    // Execute command, tracking selections before and after. Keep selections list sorted so we can
    // use equality to compare.
    for (auto actorId : editor.getSelection().getSelectedActorIds()) {
      command.entries[UNDO].selection.push_back(actorId);
    }
    std::sort(command.entries[UNDO].selection.begin(), command.entries[UNDO].selection.end());
    executePhase(command, DO, true);
    for (auto actorId : editor.getSelection().getSelectedActorIds()) {
      command.entries[DO].selection.push_back(actorId);
    }
    std::sort(command.entries[DO].selection.begin(), command.entries[DO].selection.end());

    if (!params.noSaveUndo) {
      // Coalesce with a previous command or add as a new one
      if (params.coalesce) {
        for (auto it = undos.rbegin(); it != undos.rend(); ++it) {
          auto &prevCommand = *it;
          if (command.time - prevCommand.time < undoCoalesceInterval
              && prevCommand.behaviorId == command.behaviorId
              && prevCommand.description == command.description
              && prevCommand.entries[UNDO].selection == command.entries[UNDO].selection) {
            // Found command to coalesce with -- use its undo entry and replace it
            command.entries[UNDO] = std::move(prevCommand.entries[UNDO]);
            prevCommand = std::move(command);
            coalesced = true;
            break;
          }
          if (params.coalesceLastOnly) {
            break; // Only checking against the last command
          }
        }
      }
      if (!coalesced) {
        // Didn't coalesce -- add at end -- `coalesced` is true if moved-from above
        undos.push_back(std::move(command)); // NOLINT(bugprone-use-after-move)
      }

      // Limit number of undos
      while (undos.size() > maxUndos) {
        undos.pop_front();
      }
    }
    // `command` is moved-from above, so ending its scope here...
  }

  redos.clear();

  notify("", "");

  if (!coalesced) {
    editor.setEditorStateDirty(); // `canUndo` or `canRedo` may have changed -- avoid over-sending
                                  // when coalescing though
  }
}

void Commands::executePhase(Command &command, Phase phase, bool isLive) {
  auto &entry = command.entries[phase];

  // Execute closure
  entry.closure(editor, isLive);

  // Restore selections
  if (!isLive) {
    auto &scene = editor.getScene();
    auto &selection = editor.getSelection();
    for (auto actorId : entry.selection) {
      if (scene.hasActor(actorId)) {
        selection.selectActor(actorId);
      }
    }
    for (auto actorId : selection.getSelectedActorIds()) {
      if (std::find(entry.selection.begin(), entry.selection.end(), actorId)
          == entry.selection.end()) {
        selection.deselectActor(actorId);
      }
    }

    scene.getLibrary().ensureGhostActorsExist();

    // Update belt selection
    auto &belt = editor.getBelt();
    belt.deselect();
    belt.updateSelection(true); // Ensure ghost actors are created
    if (!entry.selection.empty()) {
      auto allGhosts = true;
      for (auto actorId : entry.selection) {
        if (!scene.isGhost(actorId)) {
          allGhosts = false;
        }
      }
      if (allGhosts) {
        for (auto actorId : entry.selection) {
          if (auto parentEntryId = scene.maybeGetParentEntryId(actorId)) {
            belt.select(parentEntryId);
          }
        }
      }
      belt.updateSelection(true); // Select ghost actor based on selected entry id
    }
  }

  editor.triggerAutoSave();
}


//
// Undo / redo
//

void Commands::undoOrRedo(Phase phase, std::deque<Command> &from, std::deque<Command> &to) {
  if (from.size() > 0) {
    auto command = std::move(from.back());
    from.pop_back();
    executePhase(command, phase, false);
    if (phase == DO) {
      notify("redo", command.description);
    } else if (phase == UNDO) {
      notify("undo", command.description);
    }
    to.push_back(std::move(command));

    editor.setEditorStateDirty(); // `canUndo` or `canRedo` may have changed
  }
}


//
// Notification
//

struct EditorCommandNotifyEvent {
  PROP(std::string, type);
  PROP(std::string, message);
};

void Commands::notify(std::string type, std::string message) {
  EditorCommandNotifyEvent ev { std::move(type), std::move(message) };
  editor.getBridge().sendEvent("EDITOR_COMMAND_NOTIFY", ev);
}
