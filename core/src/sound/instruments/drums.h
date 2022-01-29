#pragma once

#include "instrument.h"

class Drums : public Instrument {
public:
  explicit Drums();
  ~Drums();

  inline std::string getType() const override {
    return "drums";
  }

  struct Params {
    struct Kick {
      PROP(float, decay, .min(0.05) .max(1.0)) = 0.3f;
      PROP(float, punch) = 0.9f;
      PROP(float, freq, .label("tune") .min(40) .max(120)) = 60.0f;
      PROP(float, sweep, .label("sweep") .min(0) .max(1)) = 0.5f;
    };
    PROP(bool, useKick) = true;
    PROP(Kick, kick);
  } params;

  void play(Sound &sound, Pattern::Note note) override;
  void read(Reader &reader) override;
  void write(Writer &writer) const override;

  inline std::unique_ptr<Instrument> clone() const override {
    return std::make_unique<Drums>(*this);
  }

  void dirtyCache();

private:
  std::string kickKey;
  void playKick(Sound &sound, Params::Kick &kick, float amplitude);
};

inline void Drums::dirtyCache() {
  kickKey = "";
}
