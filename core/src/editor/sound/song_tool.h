#pragma once

#include "precomp.h"
#include "lv.h"
#include "editor/gesture_pan_zoom.h"
#include "editor/grid.h"
#include "sound/song.h"

struct Sample;
class SoundTool;
class Pattern;

#define SONG_DEFAULT_VIEW_WIDTH 10.0f
#define SONG_MIN_VIEW_WIDTH 5.0f
#define SONG_MAX_VIEW_WIDTH 30.0f
#define SONG_DEFAULT_VIEW_BOUND 5.0f

//
// SongTool visualizes and edits the structure of a song.
//
class SongTool {
public:
  SongTool(const SongTool &) = delete; // Prevent accidental copies
  const SongTool &operator=(const SongTool &) = delete;

  explicit SongTool(SoundTool &);

  void resetState();
  void onSetActive();
  void update(double dt);
  void drawOverlay();

  void updateViewConstraints();

  enum class Subtool {
    Select,
    Erase,
  };
  Subtool selectedSubtool = Subtool::Select;

private:
  Lv &lv { Lv::getInstance() };
  SoundTool &soundTool;

  Scene &getScene();

  double stepsToBars(double steps);
  double barsToSteps(double bars);

  // for sequence editing
  float gridCellSize = 1.5f;
  GesturePanZoom panZoom {
    SONG_MIN_VIEW_WIDTH,
    SONG_MAX_VIEW_WIDTH,
    { -SONG_DEFAULT_VIEW_BOUND, -SONG_DEFAULT_VIEW_BOUND },
    { SONG_DEFAULT_VIEW_BOUND, SONG_DEFAULT_VIEW_BOUND },
  };
  Grid grid;
  void drawGrid(float viewScale, love::Vector2 &viewOffset);
  void drawSong(Song *song, double timePlaying);
  void drawTrack(Song::Track *track, int index, double timePlaying, float unit);
  void drawSequence(Song::Track::Sequence &sequence, int zeroKey, float unit);
  void drawPattern(const std::string &patternId, Pattern &pattern, float startTime,
      float patternLength, bool isLoop, int zeroKey, float unit);
  void drawTimeAxis();
  void drawTrackAxis(Song *song, double timePlaying);
  void drawDragPattern(float unit);
  mutable love::Transform viewTransform;
  love::Vector2 viewPosition;
  float viewWidth = SONG_DEFAULT_VIEW_WIDTH;

  // for moving patterns
  std::string dragPatternId;
  int dragPatternTrackIndex = 0;
  double dragPatternStartTime = 0;
  love::Vector2 dragPatternTouchStart;
  love::Vector2 dragPatternTouchDelta;

  std::unique_ptr<love::Font> tempFont { lv.graphics.newDefaultFont(
      16.0f, love::TrueTypeRasterizer::HINTING_NORMAL) };

  bool hasTouch = false;

  inline float noZoomUnits(float units) {
    return units / (800.0f / viewWidth);
  };
};
