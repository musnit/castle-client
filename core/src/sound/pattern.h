#pragma once

#include "precomp.h"
#include "archive.h"

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

  void toggleNote(double step, float key);

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
