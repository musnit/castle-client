#pragma once

#include "precomp.h"

class Pattern {
public:
  struct Note {
    double time = 0; // in steps
    float key = 0; // up to receiving instrument to interpret key, might be pitch
    // could later add length, velocity, probability, ...

    inline bool operator==(const Note &b) {
      return time == b.time && key == b.key;
    }
  };

  Pattern() = default;
  Pattern(const Pattern &) = delete;
  const Pattern &operator=(const Pattern &) = delete;

  void toggleNote(double step, float key);

  std::string name; // for referencing/stopping/etc.

  // TODO: serialize/deserialize via archive/props
  // TODO: get next time anything happens
  // TODO: get notes at time / since time / in range?

  inline std::map<double, SmallVector<Note, 2>>::iterator begin() {
    return notes.begin();
  }

  inline std::map<double, SmallVector<Note, 2>>::iterator end() {
    return notes.end();
  }

private:
  std::map<double, SmallVector<Note, 2>> notes; // ordered time (in steps) -> notes at step
};
