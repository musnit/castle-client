#pragma once

#include "precomp.h"
#include "sound_subtool_interface.h"

class PatternAddNoteSubtool : public SoundSubtool {
public:
  explicit PatternAddNoteSubtool(SoundTool &soundTool_)
      : SoundSubtool(soundTool_) {
  }
  ~PatternAddNoteSubtool() {
  }

  std::string category() {
    return "pattern";
  }

  std::string name() {
    return "add_note";
  }

  void onReset() {
    hasTouch = false;
    tempNote.time = -1;
    tempNote.key = 999;
  }

  void onTouch(SoundSubtoolTouch &touch) {
    auto pattern = soundTool.getSelectedPattern();
    if (!pattern) {
      return;
    }
    bool playNote = false;
    if (touch.touch.released) {
      if (touch.step >= 0 && !pattern->hasNote(touch.step, touch.key)) {
        playNote = true;
        pattern->addNote(touch.step, touch.key);
        soundTool.updateSelectedComponent("add notes");
      }
      hasTouch = false;
      tempNote.key = 999; // reset for next gesture
    } else {
      if (touch.touch.pressed || touch.key != tempNote.key) {
        // moved to a different note while touch was active
        playNote = true;
      }
      hasTouch = true;
      tempNote.time = touch.step;
      tempNote.key = touch.key;
    }
    if (playNote) {
      if (auto track = soundTool.getSelectedTrack(); track) {
        track->instrument->play(soundTool.getScene().getSound(), { touch.step, touch.key });
      }
    }
  }

  void drawOverlay(Lv &lv) {
    auto gridCellSize = soundTool.trackTool.gridCellSize;
    if (hasTouch) {
      // draw temp note
      auto x = tempNote.time * gridCellSize;
      auto y = ((tempNote.key - 60) * -gridCellSize) - gridCellSize;
      lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, x, y, gridCellSize, gridCellSize);
    }
  }

  bool highlightAxis(int key) {
    return hasTouch && key == tempNote.key;
  }

private:
  bool hasTouch = false;
  Pattern::Note tempNote;
};
