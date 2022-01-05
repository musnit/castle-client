#pragma once

#include "precomp.h"
#include "lv.h"
#include "editor/gesture_pan_zoom.h"
#include "editor/grid.h"
#include "sound/song.h"

class Editor;

#define SOUND_DEFAULT_VIEW_WIDTH 10.0f
#define SOUND_MIN_VIEW_WIDTH 4.0f
#define SOUND_MAX_VIEW_WIDTH 25.0f
#define SOUND_DEFAULT_VIEW_BOUND 5.0f

class SoundTool {
public:
  SoundTool(const SoundTool &) = delete; // Prevent accidental copies
  const SoundTool &operator=(const SoundTool &) = delete;

  explicit SoundTool(Editor &editor_);

  void resetState();
  void onSetActive();
  void update(double dt);
  void drawOverlay();

  void setSong(Song &song);
  bool hasSong();

  std::string sessionId; // used to pass data back to the correct place in editor frontend
  void sendPatternEvent();
  void sendSceneMusicData();

  // play/pause currently edited song
  void togglePlay();

private:
  Lv &lv { Lv::getInstance() };
  Editor &editor;

  Song *song = nullptr;

  // for pattern editing
  float gridCellSize = 0.75f;
  GesturePanZoom panZoom {
    SOUND_MIN_VIEW_WIDTH,
    SOUND_MAX_VIEW_WIDTH,
    { 0.0f, -SOUND_DEFAULT_VIEW_BOUND },
    { SOUND_DEFAULT_VIEW_BOUND, SOUND_DEFAULT_VIEW_BOUND },
  };
  Grid grid;
  void drawGrid(float viewScale, love::Vector2 &viewOffset);
  void drawPattern(Pattern *pattern);
  void drawNoteAxis();
  mutable love::Transform viewTransform;
  love::Vector2 viewPosition;
  float viewWidth = SOUND_DEFAULT_VIEW_WIDTH;

  // for playback
  bool isPlaying;
  double playStartTime;

  // adding notes
  bool hasTouch = false;
  Pattern::Note tempNote;
};

inline void SoundTool::setSong(Song &song_) {
  // editing in place for now w/o ownership - do something smarter when we support headless patterns
  song = &song_;
}

inline bool SoundTool::hasSong() {
  return song != nullptr;
}
