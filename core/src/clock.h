#pragma once

#include "precomp.h"

class Clock {
  // Maintains a quantized version of time according to bars, beats, and subbeats
  // according to a tempo (in beats per minute), and converts between absolute scene time
  // and clock time.

public:
  enum class Quantize {
    Bar,
    Beat,
  };

  Clock() = default;
  Clock(const Clock &) = delete; // Prevent accidental copies
  const Clock &operator=(const Clock &) = delete;

  void reset();
  void reset(unsigned int tempo, unsigned int beatsPerBar);
  void update(double dt);

  double getDuration(unsigned int bars, unsigned int beats, double seconds);
  double getTimeUntilNext(Quantize quant, unsigned int count);

private:
  double performTime = 0;

  unsigned int tempo;
  unsigned int beatsPerBar;

  double timePerBeat;
  double timeSinceBeat;
  int totalBeatsElapsed;
};
