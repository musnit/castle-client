#pragma once

#include "clock.h"
#include "pattern.h"
#include "instruments/instrument.h"

class Sound;

class Stream {
public:
  explicit Stream(Clock &clock, std::unique_ptr<Pattern> pattern,
      std::unique_ptr<Instrument> instrument, double wait = 0);
  double startTime; // in steps

  // own a copy of Pattern and Instrument so that we're invariant to changes in the originals
  std::unique_ptr<Pattern> pattern;
  std::unique_ptr<Instrument> instrument;

  inline static int nextStreamId = 0;
  int streamId = nextStreamId++;

  double nextTime(); // in steps
  bool hasNext();
  void playNextNotes(Sound &sound);
  void skipToNext();
  void fastForward(double time);
  void stop(double finishTime = 0);

private:
  std::map<double, SmallVector<Pattern::Note, 2>>::iterator current;
  double patternClockLoopLength = 0; // computed loop length from pattern+clock
  double finishTime = -1;
};

inline Stream::Stream(Clock &clock, std::unique_ptr<Pattern> pattern_,
    std::unique_ptr<Instrument> instrument_, double wait) {
  pattern = std::move(pattern_);
  instrument = std::move(instrument_);
  startTime = clock.getTime() + wait;
  current = pattern->begin();
  patternClockLoopLength = pattern->getLoopLength(clock);
}

inline void Stream::fastForward(double time) {
  if (time > 0) {
    while (time > patternClockLoopLength) {
      time -= patternClockLoopLength;
    }
    current = pattern->lower_bound(time);
    if (!hasNext() && pattern->loop() != Pattern::Loop::None) {
      current = pattern->begin();
      startTime += patternClockLoopLength;
    }
    startTime -= time;
  }
}

inline double Stream::nextTime() {
  return startTime + current->first;
}

inline bool Stream::hasNext() {
  return current != pattern->end() && (finishTime < 0 || nextTime() < finishTime);
}

inline void Stream::playNextNotes(Sound &sound) {
  auto &notes = current->second;
  for (auto &note : notes) {
    instrument->play(sound, note);
  }
  skipToNext();
}

inline void Stream::stop(double finishTime_) {
  finishTime = finishTime_;
}

inline void Stream::skipToNext() {
  current++;
  if (!hasNext() && pattern->loop() != Pattern::Loop::None) {
    // restart according to pattern's loop length
    current = pattern->begin();
    startTime += patternClockLoopLength;
  }
}
