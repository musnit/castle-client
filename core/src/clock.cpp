#include "clock.h"
#include "scene.h"
#include "behaviors/all.h"

void Clock::reset(unsigned int tempo_, unsigned int beatsPerBar_, unsigned int stepsPerBeat_) {
  tempo = tempo_;
  beatsPerBar = beatsPerBar_;
  stepsPerBeat = stepsPerBeat_;
  if (tempo < 1.0) {
    tempo = 1.0;
  }
  if (beatsPerBar < 2.0) {
    beatsPerBar = 2.0;
  }
  if (stepsPerBeat < 2.0) {
    stepsPerBeat = 2.0;
  }
  reset();
}

void Clock::reset() {
  {
    love::thread::Lock lock(mutex);
    clockTime = 0;
    // clock time is measured in steps, so steps = seconds * beatsPerSecond * stepsPerBeat
    stepsPerSecond = (double(tempo) / 60.0) * stepsPerBeat;
    timeSinceBeat = 0;
    timeSinceStep = 0;
    totalBeatsElapsed = 0;
    totalBarsElapsed = 0;
    totalStepsElapsed = 0;
    fireBeatTriggerStep = false;
    fireBeatTriggerBeat = false;
    fireBeatTriggerBar = false;
  }

  fireBeatTriggers(Quantize::Bar, 0);
  fireBeatTriggers(Quantize::Beat, 0);
  fireBeatTriggers(Quantize::Step, 0);
}

// not on graphics thread
void Clock::update(double dt) {
  love::thread::Lock lock(mutex);
  double dSteps = dt * stepsPerSecond;
  clockTime += dSteps;

  timeSinceBeat += dSteps;
  timeSinceStep += dSteps;

  if (timeSinceStep >= currentStepInterval()) {
    totalStepsElapsed++;
    timeSinceStep -= currentStepInterval();
    // TODO: with swing, compute next interval
    fireBeatTriggerStep = true;
  }

  if (timeSinceBeat >= stepsPerBeat) {
    totalBeatsElapsed++;
    timeSinceBeat -= stepsPerBeat;
    fireBeatTriggerBeat = true;
    if (totalBeatsElapsed % beatsPerBar == 0) {
      // keep a running tally in case we later support changing beatsPerBar mid-run
      totalBarsElapsed++;
      fireBeatTriggerBar = true;
    }
  }
}

// guaranteed on graphics thread
void Clock::frame() {
  love::thread::Lock lock(mutex);
  if (fireBeatTriggerStep) {
    fireBeatTriggers(Quantize::Step, totalStepsElapsed % stepsPerBeat);
    fireBeatTriggerStep = false;
  }
  if (fireBeatTriggerBeat) {
    fireBeatTriggers(Quantize::Beat, totalBeatsElapsed % beatsPerBar);
    fireBeatTriggerBeat = false;
  }
  if (fireBeatTriggerBar) {
    fireBeatTriggers(Quantize::Bar, totalBarsElapsed);
    fireBeatTriggerBar = false;
  }
}

double Clock::currentStepInterval() {
  // TODO: swing would make these alternate long and short
  return 1.0f;
}

double Clock::getDuration(double bars, double beats, double steps) {
  // TODO: swing needs definition here
  return (((bars * beatsPerBar) + beats) * stepsPerBeat) + steps;
}

double Clock::getTimeUntilNext(Quantize quant, double count) {
  if (count <= 0) {
    return 0;
  }
  love::thread::Lock lock(mutex);
  switch (quant) {
  case Quantize::Bar: {
    auto absolute = getDuration(count, 0, 0);
    auto indexInBar = totalBeatsElapsed % beatsPerBar;
    auto delta = (indexInBar * stepsPerBeat) + timeSinceBeat;
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
  if (scene) {
    auto &rulesBehavior = scene->getBehaviors().byType<RulesBehavior>();
    rulesBehavior.fireBeatTriggers(unit, index);
  }
}
