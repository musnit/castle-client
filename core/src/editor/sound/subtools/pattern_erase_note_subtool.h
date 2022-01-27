#pragma once

#include "precomp.h"
#include "sound_subtool_interface.h"

class PatternEraseNoteSubtool : public SoundSubtool {
public:
  explicit PatternEraseNoteSubtool(SoundTool &soundTool_)
      : SoundSubtool(soundTool_) {
  }
  ~PatternEraseNoteSubtool() {
  }

  std::string category() {
    return "pattern";
  }

  std::string name() {
    return "erase_note";
  }

  void onReset() {
  }

  void onTouch(SoundSubtoolTouch &touch) {
    auto pattern = soundTool.getSelectedPattern();
    if (!pattern) {
      return;
    }
    if (touch.touch.released) {
      if (touch.step >= 0 && pattern->hasNote(touch.step, touch.key)) {
        pattern->removeNote(touch.step, touch.key);
        soundTool.updateSelectedComponent("remove notes");
      }
    }
  }

  void drawOverlay(Lv &lv) {
  }

  bool highlightAxis(int key) {
    return false;
  }

private:
};
