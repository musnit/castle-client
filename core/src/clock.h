#pragma once

#include "precomp.h"

class Scene;

class Clock {
  // Maintains a quantized version of time according to bars, beats, and subbeats
  // according to a tempo (in beats per minute), and converts between scene time
  // and clock time.

public:
  enum class Quantize {
    Bar,
    Beat,
    Step,
  };

  Clock() = default;
  Clock(const Clock &) = delete; // Prevent accidental copies
  const Clock &operator=(const Clock &) = delete;

  inline static int nextClockId = 0;
  int clockId = nextClockId++;

  void reset();
  void setScene(Scene *scene);
  void unlinkScene(Scene *scene);
  void reset(unsigned int tempo, unsigned int beatsPerBar, unsigned int stepsPerBeat);

  void setTempo(unsigned int tempo); // don't reset, continue running
  unsigned int getTempo();

  // expect update(dt) and frame() to both be called;
  // update is not necessarily called from the graphics thread;
  // frame is called from graphics thread once per frame
  void update(double performDt);
  void frame();

  double getDuration(double bars, double beats, double steps);

  // get the time (in steps) until the next `count` `quant`s from now.
  // if `allowRecentPast` is true and we're within ~1/60th of the previous `quant`,
  // we may return a small negative value indicating that this time just happened.
  double getTimeUntilNext(Quantize quant, double count, bool allowRecentPast = true);

  unsigned int getBeatsPerBar();
  unsigned int getStepsPerBeat();
  unsigned int getTotalBeatsElapsed();
  unsigned int getTotalBarsElapsed();
  unsigned int getBeatIndexInBar();
  double getPerformTimeSinceBeat();
  double getTime(); // steps

private:
  love::thread::MutexRef mutex;
  Scene *scene = nullptr;
  double clockTime = 0; // steps

  unsigned int tempo = 120;
  unsigned int beatsPerBar = 4;
  unsigned int stepsPerBeat = 4;

  double stepsPerSecond = 0;
  double timeSinceBeat = 0;
  double timeSinceStep = 0;
  int totalBeatsElapsed = 0;
  int totalBarsElapsed = 0;
  int totalStepsElapsed = 0;

  // flags indicating whether we need to fire a trigger on next frame
  bool fireBeatTriggerStep = false, fireBeatTriggerBeat = false, fireBeatTriggerBar = false;

  double currentStepInterval();

  void fireBeatTriggers(Quantize unit, int index);
};

inline void Clock::setScene(Scene *scene_) {
  scene = scene_;
}

inline void Clock::unlinkScene(Scene *scene_) {
  if (scene == scene_) {
    scene = nullptr;
  }
}

inline unsigned int Clock::getTempo() {
  return tempo;
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

// assumes clock hasn't changed tempo since last beat
inline double Clock::getPerformTimeSinceBeat() {
  love::thread::Lock lock(mutex);
  return timeSinceBeat / stepsPerSecond;
}

inline double Clock::getTime() {
  love::thread::Lock lock(mutex);
  return clockTime;
}

inline unsigned int Clock::getBeatsPerBar() {
  return beatsPerBar;
}

inline unsigned int Clock::getStepsPerBeat() {
  return stepsPerBeat;
}
