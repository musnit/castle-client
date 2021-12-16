#pragma once

#include "precomp.h"

class Scene;

class Clock {
  // Maintains a quantized version of time according to bars, beats, and subbeats
  // according to a tempo (in beats per minute), and converts between absolute scene time
  // and clock time.

public:
  enum class Quantize {
    Bar,
    Beat,
  };

  explicit Clock(Scene &scene_);
  Clock(const Clock &) = delete; // Prevent accidental copies
  const Clock &operator=(const Clock &) = delete;

  void reset();
  void reset(unsigned int tempo, unsigned int beatsPerBar);
  void update(double dt);

  double getDuration(double bars, double beats, double seconds);
  double getTimeUntilNext(Quantize quant, double count);

  unsigned int getTotalBeatsElapsed();
  unsigned int getTotalBarsElapsed();
  unsigned int getBeatIndexInBar();
  double getTimeSinceBeat();

private:
  Scene &scene;
  double performTime = 0;

  unsigned int tempo = 120;
  unsigned int beatsPerBar = 4;

  double timePerBeat = 0;
  double timeSinceBeat = 0;
  int totalBeatsElapsed = 0;
  int totalBarsElapsed = 0;

  void fireBeatTriggers();
};

inline Clock::Clock(Scene &scene_)
    : scene(scene_) {
}

inline unsigned int Clock::getTotalBeatsElapsed() {
  return totalBeatsElapsed;
}

inline unsigned int Clock::getTotalBarsElapsed() {
  return totalBarsElapsed;
}

inline unsigned int Clock::getBeatIndexInBar() {
  return totalBeatsElapsed % beatsPerBar;
}

inline double Clock::getTimeSinceBeat() {
  return timeSinceBeat;
}
