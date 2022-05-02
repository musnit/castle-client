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

  struct Params {
    bool noSaveUndo = false;
    bool coalesce = false;
    bool coalesceLastOnly = true;
    int behaviorId = -1;
  };
  void execute(
      const std::string &description, Params params, Closure doClosure, Closure undoClosure);

  bool canUndo();
  void undo();
  bool canRedo();
  void redo();
  void clear();

  void notify(std::string type, std::string message);

private:
  Lv &lv { Lv::getInstance() };
  Editor &editor;
  friend class Editor; // Temporary because it draws some debug info for us...


  enum Phase {
    DO,
    UNDO,
    NUM_PHASES,
  };

  struct Command {
    std::string description;
    double time;
    int behaviorId;
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

inline void Commands::clear() {
  undos.clear();
  redos.clear();
}
