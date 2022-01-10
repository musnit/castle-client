#pragma once

#include "pattern.h"
#include "instruments/instrument.h"

class Sound;

class Stream {
public:
  explicit Stream(double startTime, Pattern &pattern, Instrument &instrument);
  double startTime; // in steps
  Pattern &pattern;
  Instrument &instrument;

  double nextTime(); // in steps
  bool hasNext();
  void playNextNotes(Sound &sound);

private:
  std::map<double, SmallVector<Pattern::Note, 2>>::iterator current;
};

inline Stream::Stream(double startTime_, Pattern &pattern_, Instrument &instrument_)
    : startTime(startTime_)
    , pattern(pattern_)
    , instrument(instrument_) {
  current = pattern.begin();
}

inline double Stream::nextTime() {
  return startTime + current->first;
}

inline bool Stream::hasNext() {
  return current != pattern.end();
}

inline void Stream::playNextNotes(Sound &sound) {
  auto &notes = current->second;
  for (auto &note : notes) {
    instrument.play(sound, note);
  }
  current++;
}
