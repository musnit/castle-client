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
#define SONG_MIN_VIEW_WIDTH 4.0f
#define SONG_MAX_VIEW_WIDTH 25.0f
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

  // for sequence editing
  float gridCellSize = 1.5f;
  GesturePanZoom panZoom {
    SONG_MIN_VIEW_WIDTH,
    SONG_MAX_VIEW_WIDTH,
    { 0.0f, -SONG_DEFAULT_VIEW_BOUND },
    { SONG_DEFAULT_VIEW_BOUND, SONG_DEFAULT_VIEW_BOUND },
  };
  Grid grid;
  void drawGrid(float viewScale, love::Vector2 &viewOffset);
  void drawSong(Song *song, double timePlaying);
  void drawTrack(Song::Track *track, int index, double timePlaying, float unit);
  void drawSequence(std::map<double, std::string> &sequence, float unit);
  void drawTrackAxis(Song *song);
  mutable love::Transform viewTransform;
  love::Vector2 viewPosition;
  float viewWidth = SONG_DEFAULT_VIEW_WIDTH;

  std::unique_ptr<love::Font> tempFont { lv.graphics.newDefaultFont(
      16.0f, love::TrueTypeRasterizer::HINTING_NORMAL) };

  bool hasTouch = false;
};
