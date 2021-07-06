#include "commands.h"

#include "editor.h"


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
        // Didn't coalesce -- add at end
        undos.push_back(std::move(command));
      }

      // Limit number of undos
      while (undos.size() > maxUndos) {
        undos.pop_front();
      }
    }
    // `command` is moved-from above, so ending its scope here...
  }

  redos.clear();

  // TODO(nikki): Clear notification

  if (!coalesced) {
    editor.setEditorStateDirty(); // `canUndo` or `canRedo` may have changed -- avoid over-sending
                                  // when coalescing though
  }
}

void Commands::executePhase(Command &command, Phase phase, bool isLive) {
  auto &entry = command.entries[phase];
  entry.closure(editor, isLive);

  // Restore selections
  if (!isLive) {
    auto &selection = editor.getSelection();
    for (auto actorId : entry.selection) {
      selection.selectActor(actorId);
    }
    for (auto actorId : selection.getSelectedActorIds()) {
      if (std::find(entry.selection.begin(), entry.selection.end(), actorId)
          == entry.selection.end()) {
        selection.deselectActor(actorId);
      }
    }

    // TODO(nikki): Restore belt selection
  }
}


//
// Undo / redo
//

void Commands::undoOrRedo(Phase phase, std::deque<Command> &from, std::deque<Command> &to) {
  if (from.size() > 0) {
    auto command = std::move(from.back());
    from.pop_back();
    executePhase(command, phase, false);
    // TODO(nikki): Notify
    to.push_back(std::move(command));

    editor.setEditorStateDirty(); // `canUndo` or `canRedo` may have changed
  }
}
