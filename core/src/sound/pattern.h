#pragma once

#include "precomp.h"
#include "archive.h"

class Clock;

class Pattern {
public:
  struct Note {
    float key = 0; // up to receiving instrument to interpret key, might be pitch
    int vel = 100;
    // could later add length, vel, probability, ...

    inline bool operator==(const Note &b) {
      return key == b.key;
    }

    inline void write(Writer &writer) const {
      writer.num("key", key);

      // sparse write only if not-default
      if (vel != 100) {
        writer.num("vel", vel);
      }
    }

    inline void read(Reader &reader) {
      key = reader.num("key", 0);
      vel = reader.num("vel", 100);
    }
  };

  class Loop {
  public:
    enum Value {
      None,
      NextBar, // from final note, extend to start of next bar based on current clock
      ExplicitLength, // specify a length in steps, regardless of notes
    };
    Loop() = default;
    constexpr Loop(Value v)
        : value(v) {
    }
    constexpr operator Value() const {
      return value;
    }

    inline void write(Writer &writer) const {
      switch (value) {
      case Loop::None:
        writer.setStr("none");
        break;
      case Loop::NextBar:
        writer.setStr("nextBar");
        break;
      case Loop::ExplicitLength:
        writer.setStr("length");
        break;
      }
    };
    inline void read(Reader &reader) {
      auto loopStr = reader.str();
      if (loopStr == "none") {
        value = Loop::None;
      } else if (loopStr == "nextBar") {
        value = Loop::NextBar;
      } else if (loopStr == "length") {
        value = Loop::ExplicitLength;
      }
    };

  private:
    Value value;
  };

  Pattern() = default;
  static std::unique_ptr<Pattern> makeEmptyPattern();
  static std::unique_ptr<Pattern> fork(Pattern &);

  Note *maybeGetNote(double step, float key);
  bool hasNote(double step, float key);
  bool addNote(double step, Note note);
  bool removeNote(double step, float key);

  PROP(std::string, patternId);
  PROP(std::string, name);
  PROP(love::Colorf, color);
  PROP(Loop, loop) = Loop::NextBar;
  PROP(double, loopLength) = 0; // only used for Loop::ExplicitLength
  PROP((std::map<double, SmallVector<Note, 2>>), notes); // ordered time (in steps) -> notes at step

  double getLoopLength(Clock &clock);

  inline std::map<double, SmallVector<Note, 2>>::iterator begin() {
    return notes().begin();
  }

  inline std::map<double, SmallVector<Note, 2>>::iterator end() {
    return notes().end();
  }

  inline std::map<double, SmallVector<Note, 2>>::reverse_iterator rbegin() {
    return notes().rbegin();
  }

  inline std::map<double, SmallVector<Note, 2>>::reverse_iterator rend() {
    return notes().rend();
  }

  inline std::map<double, SmallVector<Note, 2>>::iterator lower_bound(double time) {
    return notes().lower_bound(time);
  }

private:
  static std::string makePatternId();
};
