#pragma once

#include "precomp.h"
#include "lv.h"
#include "editor/gesture_pan_zoom.h"
#include "editor/grid.h"
#include "sound/song.h"
#include "behaviors/music.h"

class Editor;
struct Sample;

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

  void setSongFromComponent(MusicComponent *c);
  bool hasSong();

  void sendPatternEvent();
  void sendInstrumentEvent();

  // play/pause currently edited song
  void togglePlay();

  // edit current instrument
  void changeInstrument(Sample &sample);

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
  void updateViewConstraints();
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

  Song::Track *getSelectedTrack();
};

inline void SoundTool::setSongFromComponent(MusicComponent *component) {
  song = &(component->props.song());
  sendPatternEvent();
  sendInstrumentEvent();
}

inline bool SoundTool::hasSong() {
  return song != nullptr;
}

inline Song::Track *SoundTool::getSelectedTrack() {
  if (hasSong() && song->tracks.size() > 0) {
    // TODO: other tracks / selected track
    return song->tracks[0].get();
  }
  return nullptr;
}
