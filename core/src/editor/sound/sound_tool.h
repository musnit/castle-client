#pragma once

#include "precomp.h"
#include "lv.h"
#include "editor/grid.h"
#include "sound/song.h"

class Editor;

#define SOUND_DEFAULT_VIEW_WIDTH 10.0f

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
  float gridCellSize = 0.5f;
  Grid grid;
  void drawGrid(float viewScale);
  void drawPattern(Pattern *pattern);
  mutable love::Transform viewTransform;

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
