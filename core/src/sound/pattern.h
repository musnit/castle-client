#pragma once

#include "precomp.h"
#include "archive.h"

class Clock;

class Pattern {
public:
  struct Note {
    double time = 0; // in steps
    float key = 0; // up to receiving instrument to interpret key, might be pitch
    // could later add length, velocity, probability, ...

    inline bool operator==(const Note &b) {
      return time == b.time && key == b.key;
    }

    inline void write(Writer &writer) const {
      writer.num("key", key);
    }

    inline void read(Reader &reader) {
      key = reader.num("key", 0);
    }
  };

  Pattern() = default;
  Pattern(const Pattern &);
  const Pattern &operator=(const Pattern &) = delete;
  void write(Writer &writer) const;
  void read(Reader &reader);

  bool hasNote(double step, float key);
  bool addNote(double step, float key);
  bool removeNote(double step, float key);

  enum class Loop {
    None,
    NextBar,
    // TODO: specific loop length
  };
  Loop loop = Loop::NextBar;

  double getLoopLength(Clock &clock);

  inline std::map<double, SmallVector<Note, 2>>::iterator begin() {
    return notes.begin();
  }

  inline std::map<double, SmallVector<Note, 2>>::iterator end() {
    return notes.end();
  }

  inline std::map<double, SmallVector<Note, 2>>::reverse_iterator rbegin() {
    return notes.rbegin();
  }

  inline std::map<double, SmallVector<Note, 2>>::reverse_iterator rend() {
    return notes.rend();
  }

private:
  std::map<double, SmallVector<Note, 2>> notes; // ordered time (in steps) -> notes at step
};
