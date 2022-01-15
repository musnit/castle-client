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
  auto &clock = scene.getClock();
  const Gesture &gesture = scene.getGesture();
  if (gesture.getCount() == 1 && gesture.getMaxCount() == 1) {
    gesture.withSingleTouch([&](const Touch &touch) {
      love::Vector2 originalTouchPosition = { touch.screenPos.x, touch.screenPos.y };
      auto transformedTouchPosition = viewTransform.inverseTransformPoint(originalTouchPosition);

      // grid x is bar, grid y is track
      auto bar = double(transformedTouchPosition.x / gridCellSize);
      auto track = floor(transformedTouchPosition.y / gridCellSize);

      if (touch.released) {
        // touch track to select track
        if (track >= 0 && soundTool.hasSong() && track < int(soundTool.song->tracks.size())) {
          std::string patternId;
          if (auto &selectedTrack = soundTool.song->tracks[track]; selectedTrack) {
            for (auto &[startTime, patternId_] : selectedTrack->sequence) {
              auto &pattern = soundTool.song->patterns[patternId];
              auto startTimeBars = stepsToBars(startTime);
              auto patternWidth = stepsToBars(pattern.getLoopLength(clock));
              if (bar >= startTimeBars && bar < startTimeBars + patternWidth) {
                patternId = patternId_;
                break;
              }
            }
          }
          if (patternId == "") {
            // selected a valid track but no pattern, so add a new pattern here
            soundTool.setTrackIndex(track);
            auto steps = std::floor(bar) * double(clock.getStepsPerBeat() * clock.getBeatsPerBar());
            soundTool.addPattern(steps, track);
          } else if (soundTool.selectedTrackIndex == track
              && soundTool.selectedPatternId == patternId) {
            // selected same pattern and track that was already selected, edit pattern
            soundTool.setMode(SoundTool::Mode::Track);
          } else {
            // select existing pattern and track
            soundTool.setPatternId(patternId);
            soundTool.setTrackIndex(track);
          }
          soundTool.sendUIEvent();
        } else if (bar < 0 && track == int(soundTool.song->tracks.size())) {
          // touched the N+1th track axis, add new track and pattern
          auto emptyPattern = Song::makeEmptyPattern();
          auto defaultTrack = Song::makeDefaultTrack();
          defaultTrack->sequence.emplace(0, emptyPattern->patternId);
          soundTool.song->patterns.emplace(emptyPattern->patternId, *emptyPattern);
          soundTool.song->tracks.push_back(std::move(defaultTrack));
          soundTool.setPatternId(emptyPattern->patternId);
          soundTool.setTrackIndex(soundTool.song->tracks.size() - 1);
          soundTool.updateSelectedComponent("add track");
        } else {
          soundTool.setPatternId("");
          soundTool.setTrackIndex(-1);
          soundTool.sendUIEvent();
          // TODO:
          // drag patterns to other cells to clone
        }
      }
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

void SongTool::drawSequence(std::map<double, std::string> &sequence, float unit) {
  auto &clock = getScene().getClock();

  for (auto &[startTime, patternId] : sequence) {
    auto &pattern = soundTool.song->patterns[patternId];
    auto startTimeBars = stepsToBars(startTime) * unit;

    // draw pattern rectangle
    if (patternId == soundTool.selectedPatternId) {
      lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
    } else {
      lv.graphics.setColor({ 0.8f, 0.8f, 0.8f, 1.0f });
    }
    auto patternWidth = stepsToBars(pattern.getLoopLength(clock));
    lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, startTimeBars, 0.025f * unit,
        patternWidth * unit, 0.95f * unit);

    // summarize notes
    // TODO: editor maintains min/max per track
    lv.graphics.setColor({ 0.3f, 0.3f, 0.3f, 1.0f });
    constexpr auto maxKey = 24.0f, minKey = -24.0f;
    auto keyHeight = unit / (maxKey - minKey);
    auto noteWidth = stepsToBars(unit);
    auto centerY = unit * 0.5f - keyHeight;
    for (auto &[time, notes] : pattern) {
      auto x = startTimeBars + stepsToBars(time) * unit;
      for (auto &note : notes) {
        auto y = ((note.key - 48) * -keyHeight) + centerY;
        lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, x, y, noteWidth, keyHeight);
      }
    }
  }
}

void SongTool::drawTrack(Song::Track *track, int index, double timeInSong, float unit) {
  // draw sequence
  // TODO: don't need to draw outside viewport
  drawSequence(track->sequence, unit);

  // draw track-specific playhead
  if (soundTool.isPlaying) {
    auto loopLength = soundTool.trackLoopLengths[index];
    while (loopLength > 0 && timeInSong > loopLength) {
      timeInSong -= loopLength;
    }
    auto bars = stepsToBars(timeInSong);
    float playheadX = bars * unit;
    lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
    lv.graphics.rectangle(
        love::Graphics::DrawMode::DRAW_FILL, playheadX, 0.025f * unit, 0.1f, 0.95f * unit);
  }
}

void SongTool::drawSong(Song *song, double timeInSong) {
  auto trackIndex = 0;
  lv.graphics.push();
  for (auto &track : song->tracks) {
    drawTrack(track.get(), trackIndex, timeInSong, gridCellSize);
    trackIndex++;
    lv.graphics.translate(0, gridCellSize);
  }
  lv.graphics.pop();
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

  auto y = 0.0f;
  auto fontInvScale = viewWidth / 800.0f;
  int trackIndex = 0;
  for (auto &track : song->tracks) {
    // TODO: also light up tracks when notes play
    if (trackIndex == soundTool.selectedTrackIndex) {
      lv.graphics.setColor({ 0.4f, 0.4f, 0.4f, 1.0f });
      lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, x, y, gridCellSize, gridCellSize);
    }
    lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
    lv.graphics.print({ { track->instrument->getType(), { 1, 1, 1, 1 } } }, tempFont.get(),
        love::Matrix4(x + gridCellSize * 0.1f, y + gridCellSize * 0.4f, 0, fontInvScale,
            fontInvScale, 0, 0, 0, 0));
    y += gridCellSize;
    trackIndex++;
  }

  // draw 'new track' region
  lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
  lv.graphics.print({ { "+ track", { 1, 1, 1, 1 } } }, tempFont.get(),
      love::Matrix4(x + gridCellSize * 0.1f, y + gridCellSize * 0.4f, 0, fontInvScale, fontInvScale,
          0, 0, 0, 0));
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

  // highlight selected track if applicable
  if (soundTool.selectedTrackIndex >= 0) {
    lv.graphics.setColor({ 0.4f, 0.4f, 0.4f, 1.0f });
    lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, viewPosition.x,
        gridCellSize * soundTool.selectedTrackIndex, viewWidth, gridCellSize);
  }

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
