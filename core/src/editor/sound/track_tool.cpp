#include "track_tool.h"
#include "engine.h"
#include "bridge.h"
#include "sound/instruments/sampler.h"
#include "sound_tool.h"

TrackTool::TrackTool(SoundTool &soundTool_)
    : soundTool(soundTool_) {
}

Scene &TrackTool::getScene() {
  return soundTool.editor.getScene();
}

void TrackTool::resetState() {
  hasTouch = false;
  selectedSubtool = Subtool::Select;
  viewWidth = PATTERN_DEFAULT_VIEW_WIDTH;
}

void TrackTool::onSetActive() {
  hasTouch = false;
  selectedSubtool = Subtool::Select;
  viewWidth = PATTERN_DEFAULT_VIEW_WIDTH;
  viewPosition.x = 0.0f;
  viewPosition.y = 0.0f;
  tempNote.time = -1;
  tempNote.key = 999;
  updateViewConstraints();
}

void TrackTool::updateViewConstraints() {
  double lastTime = 0;
  if (auto pattern = soundTool.getSelectedPattern(); pattern) {
    auto endNotes = pattern->rbegin();
    if (endNotes != pattern->rend()) {
      // add some buffer beyond last time
      auto &scene = getScene();
      lastTime = endNotes->first;
      lastTime += scene.getClock().getStepsPerBeat();
    }
  }
  panZoom.viewMax.x = std::max(PATTERN_DEFAULT_VIEW_BOUND, float(lastTime * gridCellSize));
}

void TrackTool::update(double dt) {
  auto &scene = getScene();
  const Gesture &gesture = scene.getGesture();
  if (gesture.getCount() == 1 && gesture.getMaxCount() == 1) {
    gesture.withSingleTouch([&](const Touch &touch) {
      auto track = soundTool.getSelectedTrack();
      if (!track) {
        return;
      }
      auto pattern = soundTool.getSelectedPattern();
      if (!pattern) {
        return;
      }
      love::Vector2 originalTouchPosition = { touch.screenPos.x, touch.screenPos.y };
      auto transformedTouchPosition = viewTransform.inverseTransformPoint(originalTouchPosition);

      // grid x is step, grid y is key
      auto step = double(floor(transformedTouchPosition.x / gridCellSize));
      auto key
          = floor(-transformedTouchPosition.y / gridCellSize) + 60; // set axis to midi middle C
      bool playNote = false;

      if (touch.released) {
        switch (selectedSubtool) {
        case Subtool::Select: {
          if (step >= 0 && !pattern->hasNote(step, key)) {
            pattern->addNote(step, key);
            soundTool.updateSelectedComponent("add notes");
          }
          break; // Subtool::Select
        }
        case Subtool::Erase: {
          if (step >= 0 && pattern->hasNote(step, key)) {
            pattern->removeNote(step, key);
            soundTool.updateSelectedComponent("remove notes");
          }
          break; // Subtool::Erase
        }
        }
        hasTouch = false;
        tempNote.key = 999; // reset for next gesture
      } else {
        hasTouch = true;
        switch (selectedSubtool) {
        case Subtool::Select: {
          if (touch.pressed || key != tempNote.key) {
            // moved to a different note while touch was active
            playNote = true;
          }
          break; // Subtool::Select
        }
        case Subtool::Erase: {
          break; // Subtool::Erase
        }
        }
        tempNote.time = step;
        tempNote.key = key;
      }
      if (playNote) {
        if (track) {
          track->instrument->play(scene.getSound(), { step, key });
        }
      }
    });
  } else if (gesture.getCount() == 2) {
    hasTouch = false;
    // cancel touch, don't add note

    panZoom.update(gesture, viewTransform);
    auto newView = panZoom.apply(viewPosition, viewWidth);
    viewPosition = newView.first;
    viewWidth = newView.second;
  }

  if (gesture.getCount() != 2 && panZoom.isActive()) {
    panZoom.clear();
  }
}

void TrackTool::drawGrid(float viewScale, love::Vector2 &viewOffset) {
  // draw lines on each beat and bar
  auto &scene = getScene();
  unsigned int stepIndexVisible = int(std::floor(std::max(viewPosition.x, 0.0f) / gridCellSize));
  float gridX = float(stepIndexVisible) * gridCellSize;
  unsigned int stepsPerBeat = scene.getClock().getStepsPerBeat(),
               stepsPerBar = stepsPerBeat * scene.getClock().getBeatsPerBar();
  auto lineY = -1024.0f / viewScale;
  auto lineHeight = 2048.0f / viewScale;
  while (gridX < viewPosition.x + viewWidth) {
    if (stepIndexVisible % stepsPerBar == 0) {
      lv.graphics.setColor({ 0.0f, 0.0f, 0.0f, 1.0f });
      lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, gridX, lineY, 0.05f, lineHeight);
    } else if (stepIndexVisible % stepsPerBeat == 0) {
      lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
      lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, gridX, lineY, 0.05f, lineHeight);
    }
    stepIndexVisible++;
    gridX += gridCellSize;
  }

  // draw lines on each octave
  lv.graphics.setColor({ 0.4f, 0.4f, 0.4f, 1.0f });
  int noteIndexVisible = int(std::floor((viewPosition.y - viewOffset.y) / gridCellSize));
  float gridY = float(noteIndexVisible) * gridCellSize;
  auto lineX = viewPosition.x;
  auto lineWidth = viewWidth;
  auto viewBottom = viewPosition.y - viewOffset.y + viewWidth * (7.0f / 5.0f);
  while (gridY < viewBottom) {
    if (noteIndexVisible % 12 == 0) {
      lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, lineX, gridY, lineWidth, 0.05f);
    }
    noteIndexVisible++;
    gridY += gridCellSize;
  }

  // draw normal grid dots
  lv.graphics.setColor({ 0.0f, 0.0f, 0.0f, 0.4f });
  auto gridDotRadius = 3.5f;
  auto gridSize = 0.0f; // indicates infinite grid
  grid.draw(gridCellSize, gridSize, viewScale, viewPosition, viewOffset, gridDotRadius, false);

  lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
  grid.draw(gridCellSize, gridSize, viewScale, viewPosition, viewOffset, gridDotRadius, true);
};

void TrackTool::drawPattern(Pattern *pattern) {
  if (!pattern) {
    return;
  }
  love::Colorf noteColor { 0.3f, 0.3f, 0.3f, 1.0f };
  lv.graphics.setColor(noteColor);

  for (auto &[time, notes] : *pattern) {
    auto x = time * gridCellSize;
    for (auto &note : notes) {
      auto y = ((note.key - 60) * -gridCellSize) - gridCellSize;
      lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, x, y, gridCellSize, gridCellSize);
    }
  }
  if (hasTouch && selectedSubtool == Subtool::Select) {
    // draw temp note
    auto x = tempNote.time * gridCellSize;
    auto y = ((tempNote.key - 60) * -gridCellSize) - gridCellSize;
    lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, x, y, gridCellSize, gridCellSize);
  }
}

void TrackTool::drawNoteAxis() {
  // TODO: this should be dependent on the instrument we're using
  auto x = viewPosition.x - gridCellSize; // always on left edge of view

  // midi 60 is y = 0, go four octaves above and below
  for (auto note = 0; note < 96; note++) {
    auto y = ((note - 60) * -gridCellSize) - gridCellSize;
    auto scaleDegree = note % 12;
    auto isBlack = scaleDegree == 1 || scaleDegree == 3 || scaleDegree == 6 || scaleDegree == 8
        || scaleDegree == 10;
    if (isBlack) {
      lv.graphics.setColor({ 0.1f, 0.1f, 0.1f, 1.0f });
    } else {
      lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
    }
    if (hasTouch && note == tempNote.key) {
      lv.graphics.setColor({ 0.8f, 0.0f, 0.0f, 1.0f });
    }
    lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, x, y, gridCellSize, gridCellSize);
    lv.graphics.setColor({ 0.0f, 0.0f, 0.0f, 1.0f });
    lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_LINE, x, y, gridCellSize, gridCellSize);
  }
}

void TrackTool::drawOverlay() {
  auto track = soundTool.getSelectedTrack();
  if (!track) {
    return;
  }
  float windowWidth = 800.0f;
  auto viewScale = windowWidth / viewWidth;
  love::Vector2 viewOffset;
  viewOffset.x = gridCellSize; // 1-cell x offset to accommodate axis
  constexpr auto viewHeightToWidthRatio = 7.0f / 5.0f;
  viewOffset.y = 0.5f * (viewWidth * viewHeightToWidthRatio - ((50 + 44) / viewScale));

  float playheadX = 0.0f;
  if (soundTool.isPlaying) {
    auto timeInSong = soundTool.getPlaybackTimeInSong();
    auto startSeq = Song::sequenceElemAtTime(*track, timeInSong);
    if (startSeq != track->sequence.end()
        && startSeq->second.patternId() == soundTool.selectedPatternId) {
      auto timeInSeq = soundTool.getPlaybackTimeInSequenceElem(startSeq, timeInSong);
      if (timeInSeq) {
        playheadX = *timeInSeq * gridCellSize;
        if (soundTool.viewFollowsPlayhead) {
          auto halfWidth = 0.33f * viewWidth;
          viewPosition.x = std::max(halfWidth, playheadX) - halfWidth;
        }
      }
    }
  }

  lv.graphics.push(love::Graphics::STACK_ALL);
  viewTransform.reset();
  viewTransform.scale(viewScale, viewScale);
  viewTransform.translate(-viewPosition.x, -viewPosition.y);
  viewTransform.translate(viewOffset.x, viewOffset.y);
  lv.graphics.applyTransform(&viewTransform);

  love::Colorf clearColor { 0.8f, 0.8f, 0.8f, 1.0f };
  lv.graphics.clear(clearColor, {}, {});
  lv.graphics.setLineWidth(0.1f);

  drawGrid(viewScale, viewOffset);
  drawPattern(soundTool.getSelectedPattern());

  // draw playhead
  if (soundTool.isPlaying) {
    auto lineY = -1024.0f / viewScale;
    auto lineHeight = 2048.0f / viewScale;
    lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
    lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, playheadX, lineY, 0.1f, lineHeight);
  }

  drawNoteAxis();

  lv.graphics.pop();
}

//
// Events
//

struct TrackToolChangeInstrumentReceiver {
  inline static const BridgeRegistration<TrackToolChangeInstrumentReceiver> registration {
    "TRACK_TOOL_CHANGE_INSTRUMENT"
  };

  struct Params {
    PROP(std::string, action);
    PROP(Instrument::Props, props);

    // TODO: other instrument types besides sampler
    PROP(Sample, sampleValue);
  } params;

  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    if (!editor)
      return;

    auto &soundTool = editor->soundTool;
    if (auto selectedTrack = soundTool.getSelectedTrack(); selectedTrack) {
      auto action = params.action();
      if (action == "setProps") {
        Instrument *instrument = selectedTrack->instrument.get();
        instrument->props = params.props();
        soundTool.updateSelectedComponent("change track");
      } else if (action == "setSample") {
        Sampler *sampler = (Sampler *)selectedTrack->instrument.get();
        sampler->sample = params.sampleValue();
        soundTool.updateSelectedComponent("change sample");
      }
    }
  }
};

struct TrackToolChangePatternReceiver {
  inline static const BridgeRegistration<TrackToolChangePatternReceiver> registration {
    "TRACK_TOOL_CHANGE_PATTERN"
  };

  struct Params {
    PROP(Pattern, value);
  } params;

  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    if (!editor)
      return;

    editor->soundTool.trackTool.changePattern(params.value());
  }
};

void TrackTool::changePattern(Pattern &pattern) {
  // this only supports changing pattern props besides notes, such as color
  if (auto selectedPattern = soundTool.getSelectedPattern(); selectedPattern) {
    selectedPattern->color = pattern.color;
  }
  soundTool.updateSelectedComponent("change pattern");
}
