#include "track_tool.h"
#include "engine.h"
#include "bridge.h"
#include "sound/instruments/sampler.h"
#include "sound_tool.h"
#include "editor/draw/util.h"

SongTool::SongTool(SoundTool &soundTool_)
    : soundTool(soundTool_) {
}

Scene &SongTool::getScene() {
  return soundTool.editor.getScene();
}

void SongTool::resetState() {
  hasTouch = false;
  selectedSubtool = Subtool::Select;
  viewWidth = SONG_DEFAULT_VIEW_WIDTH;
  viewPosition.x = 0.0f;
  viewPosition.y = 0.0f;
}

void SongTool::onSetActive() {
  hasTouch = false;
  selectedSubtool = Subtool::Select;
  dragPatternId = "";
  dragPatternTouchDelta.x = 0.0f;
  dragPatternTouchDelta.y = 0.0f;
  dragPatternStartTime = 0;
  dragPatternTrackIndex = 0;
  updateViewConstraints();
}

void SongTool::updateViewConstraints() {
  panZoom.viewMax.x = std::max(SONG_DEFAULT_VIEW_BOUND,
      (float(stepsToBars(soundTool.songTotalLength)) + 1.0f) * gridCellSize);
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
      auto dragDeltaBars = floor((dragPatternTouchDelta.x / gridCellSize) + 0.5f);
      if (bar >= 0 && transformedTouchPosition.x < viewPosition.x) {
        // touched the floating track axis when the view was panned
        bar = -1;
      }

      bool selectedExistingTrack
          = track >= 0 && soundTool.hasSong() && track < int(soundTool.song->tracks.size());
      std::string patternId;
      double patternStartTime = 0, patternEndTime = 0;
      Song::Track::SequenceElem *selectedSequenceElem = nullptr;
      if (selectedExistingTrack && bar >= 0) {
        if (auto &selectedTrack = soundTool.song->tracks[track]; selectedTrack) {
          auto &sequence = selectedTrack->sequence;
          auto current = sequence.begin();
          while (current != sequence.end()) {
            auto &[startTime, sequenceElem] = *current;
            auto startTimeBars = stepsToBars(startTime);
            auto patternLength = soundTool.song->getSequenceElemLength(sequence, current, clock);
            if (bar >= startTimeBars && bar < startTimeBars + stepsToBars(patternLength)) {
              patternId = sequenceElem.patternId();
              patternStartTime = startTime;
              patternEndTime = startTime + patternLength;
              selectedSequenceElem = &sequenceElem;
              break;
            }
            current++;
          }
        }
      }

      if (touch.released) {
        bool touchedLoopButton = false;
        if (patternId != "") {
          auto buttonSize = noZoomUnits(36.0f + 8.0f);
          if (buttonSize <= gridCellSize * 0.4f) {
            auto yInTrack = transformedTouchPosition.y - (std::floor(track) * gridCellSize);
            auto buttonX = (stepsToBars(patternEndTime) * gridCellSize) - buttonSize;
            if (transformedTouchPosition.x >= buttonX && yInTrack <= buttonSize) {
              touchedLoopButton = true;
            }
          }
        }

        switch (selectedSubtool) {
        case Subtool::Select: {
          // touch grid on existing track/pattern?
          if (bar >= 0 && selectedExistingTrack) {
            if (dragPatternId != ""
                && (dragPatternId != patternId
                    || dragPatternStartTime + dragDeltaBars != patternStartTime)) {
              // dragged a different pattern here, clone
              auto newPatternStartTime = dragPatternStartTime + barsToSteps(dragDeltaBars);
              if (auto &selectedTrack = soundTool.song->tracks[track]; selectedTrack) {
                auto oldSequence = soundTool.song->tracks[dragPatternTrackIndex]->sequence.find(
                    dragPatternStartTime);
                Song::Track::SequenceElem newElem = oldSequence->second;
                if (selectedTrack->sequence.find(newPatternStartTime)
                    != selectedTrack->sequence.end()) {
                  selectedTrack->sequence.erase(newPatternStartTime);
                  soundTool.song->cleanUpUnusedPatterns();
                }
                selectedTrack->sequence.emplace(newPatternStartTime, newElem);
              }
              soundTool.setTrackIndex(track);
              soundTool.setPatternId(dragPatternId, newPatternStartTime);
              soundTool.updateSelectedComponent("clone pattern");
            } else if (touchedLoopButton && selectedSequenceElem) {
              // selected loop button on a sequence elem, toggle loop
              selectedSequenceElem->loop = !selectedSequenceElem->loop();
              soundTool.updateSelectedComponent("change loop");
            } else if (patternId == "") {
              // selected a valid track but no pattern, so add a new pattern here
              soundTool.setTrackIndex(track);
              auto steps = barsToSteps(std::floor(bar));
              soundTool.addPattern(steps, track);
            } else if (soundTool.selectedTrackIndex == track
                && soundTool.selectedPatternId == patternId) {
              // selected same pattern and track that was already selected, edit pattern
              soundTool.setMode(SoundTool::Mode::Track);
            } else {
              // select existing pattern and track
              soundTool.setPatternId(patternId, patternStartTime);
              soundTool.setTrackIndex(track);
            }
            soundTool.sendUIEvent();
          } else if (bar < 0 && selectedExistingTrack) {
            // just select track
            soundTool.setPatternId("", 0);
            soundTool.setTrackIndex(track);
            soundTool.sendUIEvent();
            soundTool.openTrackInspector();
          } else if (bar < 0 && track == int(soundTool.song->tracks.size())) {
            // touched the N+1th track axis, prompt to add track
            soundTool.sendNewTrackEvent();
          } else {
            soundTool.clearSelection();
            soundTool.sendUIEvent();
          }
          dragPatternId = "";
          break; // Subtool::Select
        }
        case Subtool::Erase: {
          if (bar >= 0 && selectedExistingTrack && patternId != "") {
            // erase existing sequence elem
            if (auto &selectedTrack = soundTool.song->tracks[track]; selectedTrack) {
              selectedTrack->sequence.erase(patternStartTime);
              soundTool.song->cleanUpUnusedPatterns();
              soundTool.clearSelection();
              soundTool.updateSelectedComponent("erase pattern");
            }
          }
          break;
        }
        }
      } else if ((touch.screenPos - touch.initialScreenPos).getLengthSquare() > 10 * 10) {
        if (selectedSubtool == Subtool::Select) {
          // move/clone pattern
          if (dragPatternId == "") {
            dragPatternTouchStart = transformedTouchPosition;
            dragPatternId = patternId;
            dragPatternStartTime = patternStartTime;
            dragPatternTrackIndex = track;
          }
          dragPatternTouchDelta = transformedTouchPosition - dragPatternTouchStart;
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

void SongTool::drawTimeAxis() {
  auto &clock = getScene().getClock();
  unsigned int stepsPerBeat = clock.getStepsPerBeat();
  unsigned int stepsPerBar = stepsPerBeat * clock.getBeatsPerBar();

  // TODO: don't draw outside viewport
  auto ix = 0.0f;
  auto y = gridCellSize * -0.5f;
  constexpr auto axisGrey = 136.0f / 255.0f;
  lv.graphics.setColor({ axisGrey, axisGrey, axisGrey, 1.0f });

  unsigned int step = 0;
  while (step < soundTool.songTotalLength) {
    float radius;
    if (step % stepsPerBar == 0) {
      radius = noZoomUnits(6.0f);
    } else {
      radius = noZoomUnits(3.0f);
    }
    float x = stepsToBars(double(step)) * gridCellSize;
    lv.graphics.circle(love::Graphics::DrawMode::DRAW_FILL, ix + x, y, radius);
    step += stepsPerBeat;
  }
}

void SongTool::drawGrid(float viewScale, love::Vector2 &viewOffset) {
  constexpr auto gridGrey = 136.0f / 255.0f;
  lv.graphics.setColor({ gridGrey, gridGrey, gridGrey, 1.0f });
  auto gridDotRadius = 12.0f * 0.01f;

  // grid bounds
  int numTracks = 1;
  float songLengthBars = 0.0f;
  if (soundTool.hasSong()) {
    numTracks = soundTool.song->tracks.size();
    songLengthBars = stepsToBars(soundTool.songTotalLength);
  }
  songLengthBars += 10.5f; // go beyond the end of the song a bit
  love::Vector2 gridMin { -gridDotRadius, -gridDotRadius };
  love::Vector2 gridMax {
    songLengthBars * gridCellSize,
    (float(numTracks) * gridCellSize) + gridDotRadius,
  };

  grid.draw(
      gridCellSize, gridMin, gridMax, viewScale, viewPosition, viewOffset, gridDotRadius, false);
};

void SongTool::drawPattern(const std::string &patternId, Pattern &pattern, float startTime,
    float patternLength, bool isLoop, int zeroKey, float unit) {
  auto startTimeUnits = stepsToBars(startTime) * unit;
  auto widthUnits = stepsToBars(patternLength) * unit;

  // draw pattern rectangle
  if (isLoop) {
    auto &color = pattern.color();
    lv.graphics.setColor({ color.r, color.g, color.b, 0.4f });
  } else {
    lv.graphics.setColor(pattern.color());
  }
  auto rad = isLoop ? 0.0f : unit * 0.05f;
  lv.graphics.rectangle(
      love::Graphics::DrawMode::DRAW_FILL, startTimeUnits, 0, widthUnits, unit, rad, rad);

  // summarize notes
  // TODO: editor maintains min/max per track
  auto luminance = DrawUtil::luminance((float *)&pattern.color());
  auto noteAlpha = (isLoop) ? 0.4f : 1.0f;
  if (luminance < 0.5f) {
    lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, noteAlpha });
  } else {
    lv.graphics.setColor({ 0.0f, 0.0f, 0.0f, noteAlpha });
  }
  constexpr auto maxKey = 24.0f, minKey = -24.0f;
  auto keyHeight = unit / (maxKey - minKey);
  auto noteWidth = stepsToBars(unit);
  auto centerY = unit * 0.5f - keyHeight;
  for (auto &[time, notes] : pattern) {
    if (time > patternLength) {
      break;
    }
    auto x = startTimeUnits + stepsToBars(time) * unit;
    for (auto &note : notes) {
      auto y = ((note.key - zeroKey) * -keyHeight) + centerY;
      lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, x, y, noteWidth, keyHeight);
    }
  }

  if (!isLoop) {
    // draw pattern outline
    float innerPadding = 0.0f;
    lv.graphics.push(love::Graphics::STACK_ALL);
    if (patternId == soundTool.selectedPatternId) {
      lv.graphics.setLineWidth(noZoomUnits(6.0f));
      lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
      innerPadding = noZoomUnits(3.0f);
    } else {
      lv.graphics.setColor({ 0.0f, 0.0f, 0.0f, 1.0f });
    }
    lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_LINE, startTimeUnits + innerPadding,
        innerPadding, widthUnits - innerPadding * 2.0f, unit - innerPadding * 2.0f, rad, rad);
    lv.graphics.pop();

    // draw loop button
    float buttonSize = noZoomUnits(36.0f);
    if (buttonSize <= unit * 0.4f) {
      float buttonMargin = noZoomUnits(8.0f);
      float buttonRadius = noZoomUnits(3.0f);
      lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
      lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL,
          startTimeUnits + widthUnits - buttonSize - buttonMargin, buttonMargin, buttonSize,
          buttonSize, buttonRadius, buttonRadius);
      lv.graphics.setColor({ 0.0f, 0.0f, 0.0f, 1.0f });
      lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_LINE,
          startTimeUnits + widthUnits - buttonSize - buttonMargin, buttonMargin, buttonSize,
          buttonSize, buttonRadius, buttonRadius);
    }
  }
}

void SongTool::drawSequence(Song::Track::Sequence &sequence, int zeroKey, float unit) {
  auto &clock = getScene().getClock();

  auto current = sequence.begin();
  while (current != sequence.end()) {
    auto &[startTime, sequenceElem] = *current;
    auto next = std::next(current);
    auto &patternId = sequenceElem.patternId();
    auto &pattern = soundTool.song->patterns[patternId];

    // draw main pattern
    auto patternLength = soundTool.song->getSequenceElemLength(sequence, current, clock);
    drawPattern(patternId, pattern, startTime, patternLength, false, zeroKey, unit);

    // draw loops
    if (sequenceElem.loop()) {
      double endTime = startTime + patternLength, currentTime = endTime;
      if (next != sequence.end()) {
        endTime = next->first;
      } else {
        endTime = soundTool.songTotalLength;
      }
      while (currentTime < endTime) {
        auto loopEndTime = std::min(currentTime + patternLength, endTime);
        drawPattern(
            patternId, pattern, currentTime, loopEndTime - currentTime, true, zeroKey, unit);
        currentTime = loopEndTime;
      }
    }
    current++;
  }
}

void SongTool::drawDragPattern(float unit) {
  if (dragPatternId != "") {
    auto &clock = getScene().getClock();
    auto &pattern = soundTool.song->patterns[dragPatternId];
    auto x = (stepsToBars(dragPatternStartTime) * unit) + dragPatternTouchDelta.x;
    auto y = (dragPatternTrackIndex * unit) + dragPatternTouchDelta.y;
    lv.graphics.setColor({ 0.8f, 0.8f, 0.8f, 1.0f });
    auto patternLength = pattern.getLoopLength(clock);
    lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, x, y + 0.025f * unit,
        stepsToBars(patternLength) * unit, 0.95f * unit);
  }
}

void SongTool::drawTrack(Song::Track *track, int index, double timeInSong, float unit) {
  // draw sequence
  // TODO: don't need to draw outside viewport
  drawSequence(track->sequence, track->instrument->getZeroKey(), unit);

  // draw track-specific playhead
  if (soundTool.isPlaying) {
    auto startSeq = Song::sequenceElemAtTime(*track, timeInSong);
    if (startSeq != track->sequence.end()) {
      auto timeInSeq = soundTool.getPlaybackTimeInSequenceElem(startSeq, timeInSong);
      if (timeInSeq) {
        auto bars = stepsToBars(*timeInSeq);
        float playheadX = (bars + stepsToBars(startSeq->first)) * unit;
        lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
        lv.graphics.rectangle(
            love::Graphics::DrawMode::DRAW_FILL, playheadX, 0.025f * unit, 0.1f, 0.95f * unit);
      }
    }
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

double SongTool::barsToSteps(double bars) {
  auto &clock = getScene().getClock();
  return bars * double(clock.getStepsPerBeat() * clock.getBeatsPerBar());
};

double SongTool::stepsToBars(double steps) {
  auto &clock = getScene().getClock();
  auto barLength = double(clock.getBeatsPerBar()) * double(clock.getStepsPerBeat());
  return steps / barLength;
}

void SongTool::drawTrackAxis(Song *song, double timeInSong) {
  lv.graphics.push(love::Graphics::STACK_ALL);
  // always on left edge of view
  lv.graphics.translate(std::max(viewPosition.x, 0.0f) - gridCellSize * 0.5f, gridCellSize * 0.45f);

  int trackIndex = 0;
  constexpr auto shittyFontScale = 8.0f / 800.0f;
  auto radius = gridCellSize * 0.25f;
  for (auto &track : song->tracks) {
    // draw track medallion
    if (trackIndex == soundTool.selectedTrackIndex) {
      lv.graphics.setColor({ 0.0f, 0.0f, 0.0f, 1.0f });
    } else {
      lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
    }
    lv.graphics.circle(love::Graphics::DrawMode::DRAW_FILL, 0, 0, radius);

    // light up when track plays sound
    auto power = soundTool.playbackMonitor.getPower(trackIndex);
    if (power > 0) {
      if (soundTool.isPlaying) {
        auto startSeq = Song::sequenceElemAtTime(*track, timeInSong);
        if (startSeq != track->sequence.end()) {
          auto &pattern = soundTool.song->patterns[startSeq->second.patternId()];
          lv.graphics.setColor({ pattern.color().r, pattern.color().g, pattern.color().b, power });
        }
      } else {
        lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, power });
      }
      lv.graphics.circle(love::Graphics::DrawMode::DRAW_FILL, 0, 0, radius);
    }

    // draw medallion outline
    lv.graphics.setColor({ 0.0f, 0.0f, 0.0f, 1.0f });
    lv.graphics.circle(love::Graphics::DrawMode::DRAW_LINE, 0, 0, radius);

    auto textX = (tempFont->getWidth(track->instrument->props.name()) * -0.5f) * 0.01f;
    lv.graphics.print({ { track->instrument->props.name(), { 1, 1, 1, 1 } } }, tempFont.get(),
        love::Matrix4(textX, gridCellSize * 0.3f, 0, shittyFontScale, shittyFontScale, 0, 0, 0, 0));

    lv.graphics.translate(0, gridCellSize);
    trackIndex++;
  }

  // draw 'new track' region
  lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
  lv.graphics.circle(love::Graphics::DrawMode::DRAW_FILL, 0, 0, radius);
  lv.graphics.setColor({ 0.0f, 0.0f, 0.0f, 1.0f });
  lv.graphics.circle(love::Graphics::DrawMode::DRAW_LINE, 0, 0, radius);

  auto textX = (tempFont->getWidth("ADD") * -0.5f) * 0.01f;
  lv.graphics.print({ { "ADD", { 1, 1, 1, 1 } } }, tempFont.get(),
      love::Matrix4(textX, gridCellSize * 0.3f, 0, shittyFontScale, shittyFontScale, 0, 0, 0, 0));
  lv.graphics.pop();
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
    timeInSong = soundTool.getPlaybackTimeInSong();
    auto bars = stepsToBars(timeInSong);
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

  // draw background
  constexpr auto clearGrey = 204.0f / 255.0f;
  love::Colorf clearColor { clearGrey, clearGrey, clearGrey, 1.0f };
  lv.graphics.clear(clearColor, {}, {});

  // draw different background behind current loop endpoints
  constexpr auto selectedGrey = 221.0f / 255.0f;
  auto [playStartTimeInSong, playEndTimeInSong] = soundTool.getPlaybackEndpoints();
  lv.graphics.setColor({ selectedGrey, selectedGrey, selectedGrey, 1.0f });
  lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL,
      stepsToBars(playStartTimeInSong) * gridCellSize, viewPosition.y + (-1024.0f / viewScale),
      stepsToBars(playEndTimeInSong - playStartTimeInSong) * gridCellSize, 3000.0f / viewScale);

  lv.graphics.setLineWidth(1.0f / viewScale);

  drawGrid(viewScale, viewOffset);
  drawTimeAxis();

  // highlight selected track if applicable
  if (soundTool.selectedTrackIndex >= 0) {
    constexpr auto selectedTrackGrey = 187.0f / 255.0f;
    lv.graphics.setColor({ selectedTrackGrey, selectedTrackGrey, selectedTrackGrey, 1.0f });
    lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, viewPosition.x - gridCellSize,
        gridCellSize * soundTool.selectedTrackIndex, viewWidth, gridCellSize);
  }

  // draw global song playhead under tracks
  if (soundTool.isPlaying) {
    auto lineY = viewPosition.y + (-1024.0f / viewScale);
    auto lineHeight = 3000.0f / viewScale;
    lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 0.4f });
    lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, playheadX, lineY, 0.1f, lineHeight);
  }

  if (soundTool.hasSong()) {
    drawSong(soundTool.song.get(), timeInSong);
  }
  drawDragPattern(gridCellSize);
  drawTrackAxis(soundTool.song.get(), timeInSong /* TODO: BEN */);

  lv.graphics.pop();
}
