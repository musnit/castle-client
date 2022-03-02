#include "clock.h"
#include "scene.h"
#include "behaviors/all.h"

void Clock::set(unsigned int tempo_, unsigned int beatsPerBar_, unsigned int stepsPerBeat_) {
  beatsPerBar = beatsPerBar_;
  stepsPerBeat = stepsPerBeat_;
  if (beatsPerBar < 2.0) {
    beatsPerBar = 2.0;
  }
  if (stepsPerBeat < 2.0) {
    stepsPerBeat = 2.0;
  }
  setTempo(tempo_);
}

void Clock::reset() {
  {
    love::thread::Lock lock(mutex);
    clockTime = 0;
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

void Clock::setTempo(unsigned int tempo_) {
  tempo = tempo_;
  if (tempo < 1.0) {
    tempo = 1.0;
  }
  {
    love::thread::Lock lock(mutex);
    // clock time is measured in steps, so steps = seconds * beatsPerSecond * stepsPerBeat
    stepsPerSecond = (double(tempo) / 60.0) * stepsPerBeat;
  }
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

double Clock::getTimeUntilNext(Quantize quant, double count, bool allowRecentPast) {
  if (count <= 0) {
    return 0;
  }
  love::thread::Lock lock(mutex);
  double absolute = 0, delta = 0;
  switch (quant) {
  case Quantize::Bar: {
    absolute = getDuration(count, 0, 0);
    auto indexInBar = totalBeatsElapsed % beatsPerBar;
    delta = (indexInBar * stepsPerBeat) + timeSinceBeat;
    break;
  }
  case Quantize::Beat: {
    absolute = getDuration(0, count, 0);
    delta = timeSinceBeat;
    break;
  }
  case Quantize::Step: {
    absolute = getDuration(0, 0, count);
    delta = timeSinceStep;
    break;
  }
  }

  // if we would wait almost a full `absolute` time, then the previous time just happened
  double epsilon = 0.02;
  if (totalBeatsElapsed == 0 && quant == Quantize::Bar) {
    // we just started this clock, allow larger delta to accommodate actors playing music at scene
    // start (avoids a bug where initial music may lag by 1 bar when card starts)
    epsilon = 0.1;
  }
  if (allowRecentPast && delta < epsilon) {
    return -delta;
  } else {
    return absolute - delta;
  }
}

void Clock::fireBeatTriggers(Clock::Quantize unit, int index) {
  if (scene) {
    auto &rulesBehavior = scene->getBehaviors().byType<RulesBehavior>();
    rulesBehavior.fireBeatTriggers(unit, index);
  }
}

void Clock::markStreamPlayedNote(int streamId) {
  if (scene) {
    auto &musicBehavior = scene->getBehaviors().byType<MusicBehavior>();
    musicBehavior.markStreamPlayedNote(streamId);
  }
}
