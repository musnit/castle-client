#pragma once

#include "instrument.h"
#include "sound/sample.h"

// sampler uses the same `Sample` sound source as the PlaySound rule response.
class Sampler : public Instrument {
public:
  explicit Sampler();
  ~Sampler();

  inline std::string getType() const override {
    return "sampler";
  }

  Sample sample;

  void play(Sound &sound, Pattern::Note note) override;
  void read(Reader &reader) override;
  void write(Writer &writer) const override;

  inline std::unique_ptr<Instrument> clone() const override {
    return std::make_unique<Sampler>(*this);
  }

  inline std::string getEditorIconName() override {
    if (sample.type() == "sfxr") {
      return "sfxr";
    } else if (sample.type() == "microphone") {
      return "recording";
    } else if (sample.type() == "library") {
      return "file";
    } else if (sample.type() == "tone") {
      return "tone";
    }
    return "tone";
  }
};
