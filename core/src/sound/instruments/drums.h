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

    struct Hat {
      PROP(float, decay, .min(0.05) .max(0.35)) = 0.1f;
      PROP(float, freq, .label("tone") .min(0.5) .max(1)) = 0.9f;
      PROP(float, body, .label("body") .min(0) .max(1)) = 0.1f;
    };
    PROP(bool, useClosedHat) = true;
    PROP(Hat, closedHat);

    struct Snare {
      PROP(float, decay, .min(0.05) .max(0.5)) = 0.2f;
      PROP(float, freq, .label("tone") .min(0) .max(1)) = 0.5f;
      PROP(float, tambre, .label("tambre") .min(0) .max(1)) = 0.5f;
    };
    PROP(bool, useSnare) = true;
    PROP(Snare, snare);
  } params;

  inline int getZeroKey() override {
    // traditional bass drum midi standard
    return 36;
  }
  void play(Sound &sound, Pattern::Note note) override;
  void read(Reader &reader) override;
  void write(Writer &writer) const override;

  inline std::unique_ptr<Instrument> clone() const override {
    return std::make_unique<Drums>(*this);
  }

  void dirtyCache();

private:
  std::string kickKey;
  std::string closedHatKey;
  std::string snareKey;
  void playKick(Sound &sound, Params::Kick &kick, float amplitude);
  void playHat(Sound &sound, Params::Hat &hat, float amplitude);
  void playSnare(Sound &sound, Params::Snare &snare, float amplitude);
};

inline void Drums::dirtyCache() {
  kickKey = "";
  closedHatKey = "";
  snareKey = "";
}
