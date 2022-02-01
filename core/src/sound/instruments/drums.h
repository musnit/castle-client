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
      PROP(float, freq, .label("tune") .min(40) .max(120)) = 80.0f;
      PROP(float, sweep, .label("sweep") .min(0) .max(1)) = 0.6f;
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

    PROP(bool, useOpenHat) = true;
    PROP(Hat, openHat);

    struct Snare {
      PROP(float, decay, .min(0.1) .max(0.5)) = 0.2f;
      PROP(float, freq, .label("tone") .min(0) .max(1)) = 0.5f;
      PROP(float, tambre, .label("tambre") .min(0) .max(1)) = 0.5f;
    };
    PROP(bool, useSnare) = true;
    PROP(Snare, snare);

    struct Tom {
      PROP(float, decay, .min(0.1) .max(0.4)) = 0.2f;
      PROP(float, freq, .label("tone") .min(0) .max(1)) = 0.75f;
    };
    PROP(bool, useHiTom) = true;
    PROP(Tom, hiTom);

    PROP(bool, useLoTom) = true;
    PROP(Tom, loTom);
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

  void drawEditorKeyAxis(
      Lv &lv, love::Font *font, float width, bool highlightKey, int keyPressed) override;
  void dirtyCache();

private:
  std::string kickKey;
  std::string closedHatKey;
  std::string openHatKey;
  std::string snareKey;
  std::string loTomKey;
  std::string hiTomKey;
  void playKick(Sound &sound, Params::Kick &kick, float amplitude);
  void playHat(Sound &sound, bool closed, Params::Hat &hat, float amplitude);
  void playSnare(Sound &sound, Params::Snare &snare, float amplitude);
  void playTom(Sound &sound, bool hi, Params::Tom &tom, float amplitude);
};

inline void Drums::dirtyCache() {
  kickKey = "";
  closedHatKey = "";
  openHatKey = "";
  snareKey = "";
  loTomKey = "";
  hiTomKey = "";
}
