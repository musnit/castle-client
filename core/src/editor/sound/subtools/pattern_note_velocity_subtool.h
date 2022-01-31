#pragma once

#include "precomp.h"
#include "sound_subtool_interface.h"

class PatternNoteVelocitySubtool : public SoundSubtool {
public:
  explicit PatternNoteVelocitySubtool(SoundTool &soundTool_)
      : SoundSubtool(soundTool_) {
  }
  ~PatternNoteVelocitySubtool() {
  }

  std::string category() {
    return "pattern";
  }

  std::string name() {
    return "note_velocity";
  }

  void onReset() {
    if (hasChanges) {
      // discard
      soundTool.discardChanges();
    }
    hasTouch = false;
    hasChanges = false;
    selectedNoteTime = -1;
    selectedNote.key = 999;
    initialTouchY = 0;
    initialNoteVel = 0;
  }

  void onTouch(SoundSubtoolTouch &touch) {
    auto pattern = soundTool.getSelectedPattern();
    if (!pattern) {
      return;
    }

    if (touch.touch.pressed) {
      hasTouch = true;
      if (pattern->hasNote(touch.step, touch.key)) {
        // select note where touch starts
        selectedNoteTime = touch.step;
        selectedNote.key = touch.key;
        auto note = pattern->maybeGetNote(selectedNoteTime, selectedNote.key);
        initialTouchY = touch.touchY;
        initialNoteVel = note->vel;
      }
    } else if (touch.touch.released) {
      if (hasChanges) {
        soundTool.updateSelectedComponent("change note volume");
        hasChanges = false; // changes were committed
      }
      hasTouch = false;
      selectedNote.key = 999; // reset for next gesture
    } else {
      // adjust velocity based on touch delta
      if (auto note = pattern->maybeGetNote(selectedNoteTime, selectedNote.key); note) {
        auto maxGestureLen = soundTool.trackTool.gridCellSize * 4.0f;
        float delta = (initialTouchY - touch.touchY) / maxGestureLen;
        note->vel = std::max(0, std::min(128, initialNoteVel + int(delta * 128.0f)));
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
    auto track = soundTool.getSelectedTrack();
    if (!track) {
      return;
    }
    auto gridCellSize = soundTool.trackTool.gridCellSize;
    auto zeroKey = track->instrument->getZeroKey();

    // draw full note boxes in white
    lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
    for (auto &[time, notes] : *pattern) {
      auto x = time * gridCellSize;
      for (auto &note : notes) {
        auto y = ((note.key - zeroKey) * -gridCellSize) - gridCellSize;
        lv.graphics.rectangle(
            love::Graphics::DrawMode::DRAW_FILL, x, y, gridCellSize, gridCellSize);
      }
    }

    // draw inner note boxes in pattern color, according to velocity
    lv.graphics.setColor(pattern->color());
    for (auto &[time, notes] : *pattern) {
      auto x = (time + 0.5f) * gridCellSize;
      for (auto &note : notes) {
        auto y = ((note.key - zeroKey) * -gridCellSize) - gridCellSize * 0.5f;
        auto boxSize = (float(note.vel) / 128.0f) * gridCellSize;
        lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, x - boxSize * 0.5f,
            y - boxSize * 0.5f, boxSize, boxSize);
      }
    }

    if (hasTouch) {
    }
  }

  bool highlightAxis(int key) {
    return hasTouch && key == selectedNote.key;
  }

private:
  bool hasChanges = false;
  bool hasTouch = false;
  Pattern::Note selectedNote;
  double selectedNoteTime = 0;
  float initialTouchY = 0;
  int initialNoteVel = 0;
};
