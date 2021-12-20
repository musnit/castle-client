#pragma once

#include "precomp.h"

class Pattern {
public:
  struct Note {
    double time = 0; // in steps
    float key = 0; // up to receiving instrument to interpret key, might be pitch
    // could later add length, velocity, probability, ...
  };

  Pattern() = default;
  Pattern(const Pattern &) = delete;
  const Pattern &operator=(const Pattern &) = delete;

  std::string name; // for referencing/stopping/etc.

  // TODO: serialize/deserialize via archive/props
  // TODO: add note
  // TODO: remove note (by time/key pair?)
  // TODO: iterate over notes
  // TODO: get next time anything happens
  // TODO: get notes at time / since time / in range?

private:
  std::map<double, SmallVector<Note, 2>> notes; // ordered time (in steps) -> notes at step
};
