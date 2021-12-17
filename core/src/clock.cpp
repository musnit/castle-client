#include "clock.h"
#include "scene.h"
#include "behaviors/all.h"

void Clock::reset(unsigned int tempo_, unsigned int beatsPerBar_) {
  tempo = tempo_;
  beatsPerBar = beatsPerBar_;
  stepsPerBeat = 4;
  reset();
}

void Clock::reset() {
  performTime = 0;
  timePerBeat = (1.0 / double(tempo)) * 60.0; // bpm -> seconds per beat
  timeSinceBeat = 0;
  timeSinceStep = 0;
  totalBeatsElapsed = 0;
  totalBarsElapsed = 0;
  totalStepsElapsed = 0;

  fireBeatTriggers(Quantize::Bar, 0);
  fireBeatTriggers(Quantize::Beat, 0);
  fireBeatTriggers(Quantize::Step, 0);
}

void Clock::update(double dt) {
  performTime += dt;
  timeSinceBeat += dt;
  timeSinceStep += dt;

  if (timeSinceStep >= currentStepInterval()) {
    totalStepsElapsed++;
    timeSinceStep -= currentStepInterval();
    // TODO: with swing, compute next interval
    fireBeatTriggers(Quantize::Step, totalStepsElapsed % stepsPerBeat);
  }

  if (timeSinceBeat >= timePerBeat) {
    totalBeatsElapsed++;
    timeSinceBeat -= timePerBeat;
    fireBeatTriggers(Quantize::Beat, totalBeatsElapsed % beatsPerBar);
    if (totalBeatsElapsed % beatsPerBar == 0) {
      // keep a running tally in case we later support changing beatsPerBar mid-run
      totalBarsElapsed++;
      fireBeatTriggers(Quantize::Bar, totalBarsElapsed);
    }
  }
}

double Clock::currentStepInterval() {
  // TODO: swing would make these alternate long and short
  return timePerBeat / double(stepsPerBeat);
}

double Clock::getDuration(double bars, double beats, double steps) {
  // TODO: swing needs definition here
  return (((bars * beatsPerBar) + beats) * timePerBeat) + steps * currentStepInterval();
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
    return absolute - delta;
  }
  case Quantize::Beat: {
    auto absolute = getDuration(0, count, 0);
    return absolute - timeSinceBeat;
  }
  case Quantize::Step: {
    auto absolute = getDuration(0, 0, count);
    return absolute - timeSinceStep;
  }
  }
}

void Clock::fireBeatTriggers(Clock::Quantize unit, int index) {
  auto &rulesBehavior = scene.getBehaviors().byType<RulesBehavior>();
  rulesBehavior.fireBeatTriggers(unit, index);
}
