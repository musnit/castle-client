#pragma once

#include "clock.h"
#include "pattern.h"
#include "instruments/instrument.h"

class Sound;

class Stream {
public:
  explicit Stream(Clock &clock, std::unique_ptr<Pattern> pattern, Instrument &instrument);
  double startTime; // in steps
  std::unique_ptr<Pattern> pattern;
  Instrument &instrument;

  double nextTime(); // in steps
  bool hasNext();
  void playNextNotes(Sound &sound);
  void skipToNext();

private:
  std::map<double, SmallVector<Pattern::Note, 2>>::iterator current;
  double patternClockLoopLength = 0; // computed loop length from pattern+clock
};

inline Stream::Stream(Clock &clock, std::unique_ptr<Pattern> pattern_, Instrument &instrument_)
    : instrument(instrument_) {
  pattern = std::move(pattern_);
  startTime = clock.getTime();
  current = pattern->begin();
  patternClockLoopLength = pattern->getLoopLength(clock);
}

inline double Stream::nextTime() {
  return startTime + current->first;
}

inline bool Stream::hasNext() {
  return current != pattern->end();
}

inline void Stream::playNextNotes(Sound &sound) {
  auto &notes = current->second;
  for (auto &note : notes) {
    instrument.play(sound, note);
  }
  skipToNext();
}

inline void Stream::skipToNext() {
  current++;

  if (!hasNext() && pattern->loop != Pattern::Loop::None) {
    // restart according to pattern's loop length
    current = pattern->begin();
    startTime += patternClockLoopLength;
  }
}
