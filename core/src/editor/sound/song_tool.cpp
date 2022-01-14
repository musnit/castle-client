#include "track_tool.h"
#include "engine.h"
#include "bridge.h"
#include "sound/instruments/sampler.h"
#include "sound_tool.h"

SongTool::SongTool(SoundTool &soundTool_)
    : soundTool(soundTool_) {
}

Scene &SongTool::getScene() {
  return soundTool.editor.getScene();
}

void SongTool::resetState() {
  hasTouch = false;
  viewWidth = SONG_DEFAULT_VIEW_WIDTH;
}

void SongTool::onSetActive() {
  hasTouch = false;
  viewWidth = SONG_DEFAULT_VIEW_WIDTH;
  viewPosition.x = 0.0f;
  viewPosition.y = 0.0f;
  updateViewConstraints();
}

void SongTool::updateViewConstraints() {
  // TODO: fit to song
  panZoom.viewMax.x = SONG_DEFAULT_VIEW_BOUND;
}

void SongTool::update(double dt) {
  auto &scene = getScene();
  const Gesture &gesture = scene.getGesture();
  if (gesture.getCount() == 1 && gesture.getMaxCount() == 1) {
    gesture.withSingleTouch([&](const Touch &touch) {
      love::Vector2 originalTouchPosition = { touch.screenPos.x, touch.screenPos.y };
      auto transformedTouchPosition = viewTransform.inverseTransformPoint(originalTouchPosition);
      // TODO:
      // touch track axis to play sound of that track? and select track properties
      // touch 'new' region to add new track
      // touch pattern to select, or double touch to edit
      // touch empty part of existing track to add pattern
      // drag patterns to other cells to clone
    });
  } else if (gesture.getCount() == 2) {
    hasTouch = false;
    // cancel touch

    panZoom.update(gesture, viewTransform);
    auto newView = panZoom.apply(viewPosition, viewWidth);
    viewPosition = newView.first;
    viewWidth = newView.second;
  }

  if (gesture.getCount() != 2 && panZoom.isActive()) {
    panZoom.clear();
  }
}

void SongTool::drawGrid(float viewScale, love::Vector2 &viewOffset) {
  lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 0.4f });
  auto gridDotRadius = 3.5f;
  auto gridSize = 0.0f; // indicates infinite grid
  grid.draw(gridCellSize, gridSize, viewScale, viewPosition, viewOffset, gridDotRadius, false);
};

void SongTool::drawPattern(Pattern *pattern, float unit) {
  auto &clock = getScene().getClock();

  // draw pattern rectangle
  lv.graphics.setColor({ 0.8f, 0.8f, 0.8f, 1.0f });
  auto patternWidth = stepsToBars(pattern->getLoopLength(clock));
  lv.graphics.rectangle(
      love::Graphics::DrawMode::DRAW_FILL, 0, 0, patternWidth * unit, 0.95f * unit);

  // summarize notes
  // TODO: editor maintains min/max per track
  lv.graphics.setColor({ 0.3f, 0.3f, 0.3f, 1.0f });
  constexpr auto maxKey = 24.0f, minKey = -24.0f;
  auto keyHeight = unit / (maxKey - minKey);
  auto noteWidth = stepsToBars(unit);
  auto centerY = unit * 0.5f - keyHeight;
  for (auto &[time, notes] : *pattern) {
    auto x = stepsToBars(time) * unit;
    for (auto &note : notes) {
      auto y = ((note.key - 48) * -keyHeight) + centerY;
      lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, x, y, noteWidth, keyHeight);
    }
  }
}

void SongTool::drawTrack(Song::Track *track, int index, double timeInSong, float unit) {
  // draw pattern
  // TODO: advance thru entire sequence for this track, draw all patterns, indicate loops
  // TODO: don't need to draw outside viewport
  drawPattern(&track->pattern, unit);

  // draw track-specific playhead
  if (soundTool.isPlaying) {
    auto loopLength = soundTool.trackLoopLengths[index];
    while (loopLength > 0 && timeInSong > loopLength) {
      timeInSong -= loopLength;
    }
    auto bars = stepsToBars(timeInSong);
    float playheadX = bars * unit;
    lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
    lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, playheadX, 0, 0.1f, 0.95f * unit);
  }
}

void SongTool::drawSong(Song *song, double timeInSong) {
  // TODO: visualize tracks and sequences on grid
  auto trackIndex = 0;
  lv.graphics.push();
  for (auto &track : song->tracks) {
    drawTrack(track.get(), trackIndex, timeInSong, gridCellSize);
    trackIndex++;
    lv.graphics.translate(0, gridCellSize);
  }
  lv.graphics.pop();
  // TODO: 'add track' region in grid
}

double SongTool::stepsToBars(double steps) {
  auto &clock = getScene().getClock();
  auto barLength = double(clock.getBeatsPerBar()) * double(clock.getStepsPerBeat());
  return steps / barLength;
}

void SongTool::drawTrackAxis(Song *song) {
  auto x = viewPosition.x - gridCellSize; // always on left edge of view
  auto axisY = viewPosition.y - viewWidth; // idk
  auto axisHeight = viewWidth * 3.0f;

  lv.graphics.setColor({ 0.2f, 0.2f, 0.2f, 1.0f });
  lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, x, axisY, gridCellSize, axisHeight);

  lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 0.4f });
  lv.graphics.rectangle(
      love::Graphics::DrawMode::DRAW_FILL, x + gridCellSize - 0.05f, axisY, 0.05f, axisHeight);

  lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
  auto y = 0.0f;
  auto fontInvScale = viewWidth / 800.0f;
  for (auto &track : song->tracks) {
    // TODO: light up tracks when notes play or when selected
    lv.graphics.print({ { track->instrument->getType(), { 1, 1, 1, 1 } } }, tempFont.get(),
        love::Matrix4(x + gridCellSize * 0.1f, y + gridCellSize * 0.4f, 0, fontInvScale,
            fontInvScale, 0, 0, 0, 0));
    y += gridCellSize;
  }
}

void SongTool::drawOverlay() {
  float windowWidth = 800.0f;
  auto viewScale = windowWidth / viewWidth;
  love::Vector2 viewOffset;
  viewOffset.x = gridCellSize; // 1-cell x offset to accommodate axis
  constexpr auto viewHeightToWidthRatio = 7.0f / 5.0f;
  viewOffset.y = 0.1f * (viewWidth * viewHeightToWidthRatio);

  float playheadX = 0.0f;
  double timeInSong = 0;
  if (soundTool.isPlaying) {
    auto &scene = getScene();
    auto steps = scene.getClock().getTime() - soundTool.playStartTime;
    while (soundTool.songLoopLength > 0 && steps > soundTool.songLoopLength) {
      steps -= soundTool.songLoopLength;
    }
    auto bars = stepsToBars(steps);
    timeInSong = steps;
    playheadX = bars * gridCellSize;
    if (soundTool.viewFollowsPlayhead) {
      auto halfWidth = 0.33f * viewWidth;
      viewPosition.x = std::max(halfWidth, playheadX) - halfWidth;
    }
  }

  lv.graphics.push(love::Graphics::STACK_ALL);
  viewTransform.reset();
  viewTransform.scale(viewScale, viewScale);
  viewTransform.translate(-viewPosition.x, -viewPosition.y);
  viewTransform.translate(viewOffset.x, viewOffset.y);
  lv.graphics.applyTransform(&viewTransform);

  love::Colorf clearColor { 0.2f, 0.2f, 0.2f, 1.0f };
  lv.graphics.clear(clearColor, {}, {});
  lv.graphics.setLineWidth(0.1f);

  drawGrid(viewScale, viewOffset);

  // draw global song playhead under tracks
  if (soundTool.isPlaying) {
    auto lineY = -1024.0f / viewScale;
    auto lineHeight = 2048.0f / viewScale;
    lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 0.4f });
    lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, playheadX, lineY, 0.1f, lineHeight);
  }

  if (soundTool.hasSong()) {
    drawSong(soundTool.song.get(), timeInSong);
  }

  drawTrackAxis(soundTool.song.get());

  lv.graphics.pop();
}

//
// Events
//

// TODO:
// add and remove tracks
// edit a particular track/pattern
