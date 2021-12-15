#include "clock.h"
#include "scene.h"
#include "behaviors/all.h"

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
  fireBeatTriggers();
}

void Clock::update(double dt) {
  performTime += dt;
  timeSinceBeat += dt;
  if (timeSinceBeat >= timePerBeat) {
    totalBeatsElapsed++;
    timeSinceBeat -= timePerBeat;
    fireBeatTriggers();
  }
}

double Clock::getDuration(double bars, double beats, double seconds) {
  return (((bars * beatsPerBar) + beats) * timePerBeat) + seconds;
}

double Clock::getTimeUntilNext(Quantize quant, double count) {
  if (count <= 0) {
    return 0;
  }
  switch (quant) {
  case Quantize::Bar: {
    auto absolute = getDuration(count, 0, 0);
    auto indexInBar = totalBeatsElapsed % beatsPerBar;
    auto delta = (indexInBar * timePerBeat) + timeSinceBeat;
    if (delta == 0) {
      return 0;
    }
    return absolute - delta;
  }
  case Quantize::Beat: {
    auto absolute = getDuration(0, count, 0);
    if (timeSinceBeat == 0) {
      return 0;
    }
    return absolute - timeSinceBeat;
  }
  }
}

void Clock::fireBeatTriggers() {
  bool isBarReached = totalBeatsElapsed % beatsPerBar == 0;

  auto &rulesBehavior = scene.getBehaviors().byType<RulesBehavior>();
  rulesBehavior.fireBeatTriggers(isBarReached);
}
