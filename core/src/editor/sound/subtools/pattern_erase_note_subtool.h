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
    if (hasChanges) {
      // discard
      soundTool.discardChanges();
    }
    hasChanges = false;
  }

  void onTouch(SoundSubtoolTouch &touch) {
    auto pattern = soundTool.getSelectedPattern();
    if (!pattern) {
      return;
    }
    if (touch.touch.released) {
      if (hasChanges) {
        soundTool.updateSelectedComponent("remove notes");
      }
    } else {
      if (touch.step >= 0 && pattern->hasNote(touch.step, touch.key)) {
        pattern->removeNote(touch.step, touch.key);
        hasChanges = true;
      }
    }
  }

  void drawOverlay(Lv &lv) {
  }

  bool highlightAxis(int key) {
    return false;
  }

private:
  bool hasChanges = false;
};
