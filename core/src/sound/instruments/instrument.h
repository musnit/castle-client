#pragma once

#include "lv.h"
#include "archive.h"
#include "sound/sound.h"
#include "sound/pattern.h"

class Instrument {
public:
  Instrument() = default;
  Instrument(const Instrument &);
  const Instrument &operator=(const Instrument &);
  virtual ~Instrument();

  virtual void write(Writer &writer) const;
  virtual void read(Reader &reader);
  static std::unique_ptr<Instrument> readVirtual(Reader &reader);
  virtual std::unique_ptr<Instrument> clone() const = 0;

  virtual std::string getType() const;
  virtual int getZeroKey() {
    // midi middle C
    return 60;
  }
  virtual void play(Sound &sound, Pattern::Note note) = 0;

  struct Props {
    PROP(std::string, name);
    PROP(bool, muted) = false;
  } props;

  // editor functionality
  virtual void drawEditorKeyAxis(
      Lv &lv, love::Font *font, float width, bool highlightKey, int keyPressed);
};

inline std::string Instrument::getType() const {
  return "instrument";
}
