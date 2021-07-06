#include "commands.h"

#include "editor.h"


constexpr auto maxUndos = 100;


//
// Execute
//

void Commands::execute(
    std::string description, ExecuteParams params, Closure doClosure, Closure undoClosure) {
  {
    Command command { std::move(description) };
    command.entries[DO].closure = std::move(doClosure);
    command.entries[UNDO].closure = std::move(undoClosure);

    for (auto actorId : editor.getSelection().getSelectedActorIds()) {
      command.entries[UNDO].selection.push_back(actorId);
    }
    executePhase(command, DO, true);
    for (auto actorId : editor.getSelection().getSelectedActorIds()) {
      command.entries[DO].selection.push_back(actorId);
    }

    if (!params.noSaveUndo) {
      // TODO(nikki): Coalescing
      undos.push_back(std::move(command));
      while (undos.size() > maxUndos) {
        undos.pop_front();
      }
    }
    // `command` is moved-from above, so ending its scope here...
  }

  redos.clear();

  // TODO(nikki): Clear notification

  editor.setEditorStateDirty(); // `canUndo` or `canRedo` may have changed
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
      if (std::find(entry.selection.begin(), entry.selection.end(), actorId) == entry.selection.end()) {
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
