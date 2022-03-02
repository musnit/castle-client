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
    PROP(float, volume, .min(0.0f) .max(1.0f)) = 1.0f;
  } props;

  // editor functionality
  virtual void drawEditorKeyAxis(
      Lv &lv, love::Font *font, float width, bool highlightKey, int keyPressed);
  virtual void drawEditorGridCellColors(
      Lv &lv, unsigned int initialStepIndex, int initialNoteIndex, float width, float height);

  inline bool isBlack(int scaleDegree) {
    while (scaleDegree < 0) {
      scaleDegree += 12;
    }
    return scaleDegree == 1 || scaleDegree == 3 || scaleDegree == 6 || scaleDegree == 8
        || scaleDegree == 10;
  }
  virtual std::string getEditorIconName() = 0;
  void drawEditorIcon(Lv &lv, float width, float height);

private:
  static love::graphics::Image *loadEditorIcon(Lv &lv, const std::string &name);
  static inline std::unordered_map<std::string, love::graphics::Image *> editorIcons;
};

inline std::string Instrument::getType() const {
  return "instrument";
}
