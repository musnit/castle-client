#pragma once

#include "precomp.h"

#include "scene.h"


class Editor;

class Commands {
public:
  Commands(const Commands &) = delete; // Prevent accidental copies
  const Commands &operator=(const Commands &) = delete;

  explicit Commands(Editor &editor_);


  using Closure = std::function<void(Editor &editor, bool)>;

  struct ExecuteParams {
    bool noSaveUndo = false;
  };
  void execute(
      std::string description, ExecuteParams params, Closure doClosure, Closure undoClosure);

  bool canUndo();
  void undo();
  bool canRedo();
  void redo();


private:
  Editor &editor;


  enum Phase {
    DO,
    UNDO,
    NUM_PHASES,
  };

  struct Command {
    std::string description;
    struct Entry {
      Closure closure {};
      SmallVector<ActorId, 2> selection;
    };
    Entry entries[NUM_PHASES] {};
  };
  std::deque<Command> undos;
  std::deque<Command> redos;


  void executePhase(Command &command, Phase phase, bool isLive);

  void undoOrRedo(Phase phase, std::deque<Command> &from, std::deque<Command> &to);
};


// Inlined implementations

inline Commands::Commands(Editor &editor_)
    : editor(editor_) {
}

inline bool Commands::canUndo() {
  return undos.size() > 0;
}

inline void Commands::undo() {
  undoOrRedo(UNDO, undos, redos);
}

inline bool Commands::canRedo() {
  return redos.size() > 0;
}

inline void Commands::redo() {
  undoOrRedo(DO, redos, undos);
}
