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
  const Pattern &operator=(const Pattern &);
  static std::unique_ptr<Pattern> makeEmptyPattern();
  static std::unique_ptr<Pattern> fork(Pattern &);

  std::string patternId = "";
  love::Colorf color;

  void write(Writer &writer) const;
  void read(Reader &reader);

  bool hasNote(double step, float key);
  bool addNote(double step, float key);
  bool removeNote(double step, float key);

  love::thread::MutexRef mutex;

  enum class Loop {
    None,
    NextBar, // from final note, extend to start of next bar based on current clock
    ExplicitLength, // specify a length in steps, regardless of notes
  };
  Loop loop = Loop::NextBar;
  double loopLength = 0; // only used for Loop::ExplicitLength

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

  inline std::map<double, SmallVector<Note, 2>>::iterator lower_bound(double time) {
    return notes.lower_bound(time);
  }

private:
  static std::string makePatternId();
  std::map<double, SmallVector<Note, 2>> notes; // ordered time (in steps) -> notes at step
};
