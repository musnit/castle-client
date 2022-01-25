#pragma once

#include "precomp.h"
#include "lv.h"
#include "editor/gesture_pan_zoom.h"
#include "editor/grid.h"
#include "sound/pattern.h"

struct Sample;
class SoundTool;

#define PATTERN_DEFAULT_VIEW_WIDTH 12.0f
#define PATTERN_MIN_VIEW_WIDTH 4.0f
#define PATTERN_MAX_VIEW_WIDTH 36.0f
#define PATTERN_DEFAULT_VIEW_X_BOUND 5.0f

//
// TrackTool visualizes and edits (part of) a Track, including an Instrument and a Pattern.
//
class TrackTool {
public:
  TrackTool(const TrackTool &) = delete; // Prevent accidental copies
  const TrackTool &operator=(const TrackTool &) = delete;

  explicit TrackTool(SoundTool &);

  void resetState();
  void onSetActive();
  void update(double dt);
  void drawOverlay();

  // edit selected instrument or pattern
  void changePattern(Pattern &pattern);

  void selectPatternId(std::string &patternId);
  void updateViewConstraints();

  enum class Subtool {
    Select,
    Erase,
  };
  Subtool selectedSubtool = Subtool::Select;

private:
  friend struct TrackToolActionReceiver;

  Lv &lv { Lv::getInstance() };
  SoundTool &soundTool;

  Scene &getScene();

  // for pattern editing
  float gridCellSize = 0.75f;
  GesturePanZoom panZoom {
    PATTERN_MIN_VIEW_WIDTH,
    PATTERN_MAX_VIEW_WIDTH,
    { 0.0f, -7.0f },
    { PATTERN_DEFAULT_VIEW_X_BOUND, 9.0f },
  };
  Grid grid;
  void drawGrid(float viewScale, love::Vector2 &viewOffset);
  void drawPattern(Pattern *pattern);
  void drawNoteAxis();
  mutable love::Transform viewTransform;
  love::Vector2 viewPosition;
  float viewWidth = PATTERN_DEFAULT_VIEW_WIDTH;
  void zoomToFit();

  // adding notes
  bool hasTouch = false;
  Pattern::Note tempNote;
};
