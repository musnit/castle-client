#pragma once

#include "instrument.h"
#include "sound/sample.h"

// sampler uses the same `Sample` sound source as the PlaySound rule response.
class Sampler : public Instrument {
public:
  Sampler() = default;
  ~Sampler();

  inline std::string getType() const override {
    return "sampler";
  }

  Sample sample;

  void play(Sound &sound, Pattern::Note note) override;
};
