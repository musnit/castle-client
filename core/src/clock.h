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

  // expect update(dt) and frame() to both be called;
  // update is not necessarily called from the graphics thread;
  // frame is called from graphics thread once per frame
  void update(double dt);
  void frame();

  double getDuration(double bars, double beats, double steps);
  double getTimeUntilNext(Quantize quant, double count);

  unsigned int getBeatsPerBar();
  unsigned int getStepsPerBeat();
  unsigned int getTotalBeatsElapsed();
  unsigned int getTotalBarsElapsed();
  unsigned int getBeatIndexInBar();
  double getTimeSinceBeat();
  double getPerformTime();
  double getTimePerStep();

private:
  love::thread::MutexRef mutex;
  Scene *scene = nullptr;
  double performTime = 0;

  unsigned int tempo = 120;
  unsigned int beatsPerBar = 4;
  unsigned int stepsPerBeat = 4;

  double timePerBeat = 0;
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
  love::thread::Lock lock(mutex);
  return timeSinceBeat;
}

inline double Clock::getPerformTime() {
  love::thread::Lock lock(mutex);
  return performTime;
}

inline double Clock::getTimePerStep() {
  return timePerBeat / double(stepsPerBeat);
}

inline unsigned int Clock::getBeatsPerBar() {
  return beatsPerBar;
}

inline unsigned int Clock::getStepsPerBeat() {
  return stepsPerBeat;
}
