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
    // draw pattern
    auto pattern = soundTool.getSelectedPattern();
    if (!pattern) {
      return;
    }
    auto gridCellSize = soundTool.trackTool.gridCellSize;
    lv.graphics.setColor(pattern->color());

    for (auto &[time, notes] : *pattern) {
      auto x = time * gridCellSize;
      for (auto &note : notes) {
        auto y = ((note.key - 60) * -gridCellSize) - gridCellSize;
        lv.graphics.rectangle(
            love::Graphics::DrawMode::DRAW_FILL, x, y, gridCellSize, gridCellSize);
      }
    }
  }

  bool highlightAxis(int key) {
    return false;
  }

private:
  bool hasChanges = false;
};
