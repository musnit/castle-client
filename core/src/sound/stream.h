#pragma once

#include "pattern.h"
#include "instruments/instrument.h"

class Sound;
class Clock;

class Stream {
public:
  explicit Stream(Clock &clock, Pattern &pattern, Instrument &instrument);
  double startTime; // in steps
  Pattern &pattern;
  Instrument &instrument;

  double nextTime(); // in steps
  bool hasNext();
  void playNextNotes(Sound &sound);

private:
  std::map<double, SmallVector<Pattern::Note, 2>>::iterator current;
  double patternClockLoopLength = 0; // computed loop length from pattern+clock
};

inline Stream::Stream(Clock &clock, Pattern &pattern_, Instrument &instrument_)
    : pattern(pattern_)
    , instrument(instrument_) {
  love::thread::Lock lock(pattern.mutex);
  startTime = clock.getTime();
  current = pattern.begin();
  patternClockLoopLength = pattern.getLoopLength(clock);
}

inline double Stream::nextTime() {
  love::thread::Lock lock(pattern.mutex);
  return startTime + current->first;
}

inline bool Stream::hasNext() {
  love::thread::Lock lock(pattern.mutex);
  return current != pattern.end();
}

inline void Stream::playNextNotes(Sound &sound) {
  love::thread::Lock lock(pattern.mutex);
  auto &notes = current->second;
  for (auto &note : notes) {
    instrument.play(sound, note);
  }
  current++;

  if (!hasNext() && pattern.loop != Pattern::Loop::None) {
    // restart according to pattern's loop length
    current = pattern.begin();
    startTime += patternClockLoopLength;
  }
}
