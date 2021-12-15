#include "clock.h"

void Clock::reset(unsigned int tempo_, unsigned int beatsPerBar_) {
  tempo = tempo_;
  beatsPerBar = beatsPerBar_;
  reset();
}

void Clock::reset() {
  performTime = 0;
  timePerBeat = (1.0 / double(tempo)) * 60.0; // bpm -> seconds per beat
  timeSinceBeat = 0;
  totalBeatsElapsed = 0;
}

void Clock::update(double dt) {
  performTime += dt;
  timeSinceBeat += dt;
  if (timeSinceBeat >= timePerBeat) {
    totalBeatsElapsed++;
    timeSinceBeat = 0;
  }
}

double Clock::getDuration(unsigned int bars, unsigned int beats, double seconds) {
  return (((bars * beatsPerBar) + beats) * timePerBeat) + seconds;
}

double Clock::getTimeUntilNext(Quantize quant, unsigned int count) {
  switch (quant) {
  case Quantize::Bar: {
    auto absolute = getDuration(count, 0, 0);
    auto indexInBar = totalBeatsElapsed % beatsPerBar;
    return absolute - (indexInBar * timePerBeat) - timeSinceBeat;
  }
  case Quantize::Beat: {
    auto absolute = getDuration(0, count, 0);
    return absolute - timeSinceBeat;
  }
  }
}
