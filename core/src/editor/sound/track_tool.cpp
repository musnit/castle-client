#include "track_tool.h"
#include "engine.h"
#include "bridge.h"
#include "sound/instruments/sampler.h"
#include "sound/instruments/drums.h"
#include "sound_tool.h"
#include "subtools/pattern_add_note_subtool.h"
#include "subtools/pattern_erase_note_subtool.h"
#include "subtools/pattern_note_velocity_subtool.h"

TrackTool::TrackTool(SoundTool &soundTool_)
    : soundTool(soundTool_) {
  subtools.emplace("add_note", std::make_unique<PatternAddNoteSubtool>(soundTool_));
  subtools.emplace("erase_note", std::make_unique<PatternEraseNoteSubtool>(soundTool_));
  subtools.emplace("note_velocity", std::make_unique<PatternNoteVelocitySubtool>(soundTool_));
}

Scene &TrackTool::getScene() {
  return soundTool.getScene();
}

void TrackTool::resetState() {
  currentSubtoolName = "add_note";
  getCurrentSubtool()->onReset();
  viewWidth = PATTERN_DEFAULT_VIEW_WIDTH;
}

void TrackTool::onSetActive() {
  currentSubtoolName = "add_note";
  getCurrentSubtool()->onReset();
  zoomToFit();
  updateViewConstraints();
}

void TrackTool::zoomToFit() {
  viewWidth = PATTERN_DEFAULT_VIEW_WIDTH;
  viewPosition.x = 0.0f;
  viewPosition.y = 0.0f;
  // find min note and max note,
  // set view width to try to encompass the range between them
  // set view y to center between them
  if (auto pattern = soundTool.getSelectedPattern(); pattern) {
    if (auto track = soundTool.getSelectedTrack(); track) {
      float minY = std::numeric_limits<float>::max(), maxY = -minY;
      auto zeroKey = track->instrument->getZeroKey();
      for (auto &[time, notes] : *pattern) {
        auto x = time * gridCellSize;
        if (x > PATTERN_MAX_VIEW_WIDTH) {
          // don't consider notes that are too far along to be visible at first
          break;
        } else {
          for (auto &note : notes) {
            auto y = ((note.key - zeroKey) * -gridCellSize) - gridCellSize;
            if (y < minY) {
              minY = y;
            }
            if (y > maxY) {
              maxY = y;
            }
          }
        }
      }
      // add top and bottom buffer
      minY -= gridCellSize * 3.0f;
      maxY += gridCellSize * 8.0f;
      auto range = maxY - minY;
      auto center = (maxY + minY) * 0.5f;
      viewPosition.y = center;
      viewWidth = std::max(
          PATTERN_DEFAULT_VIEW_WIDTH, std::min(PATTERN_MAX_VIEW_WIDTH, range * (5.0f / 7.0f)));
    }
  }
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
  panZoom.viewMax.x = std::max(PATTERN_DEFAULT_VIEW_X_BOUND, float(lastTime * gridCellSize));
}

void TrackTool::update(double dt) {
  auto track = soundTool.getSelectedTrack();
  if (!track) {
    return;
  }
  auto &scene = getScene();
  const Gesture &gesture = scene.getGesture();
  if (gesture.getCount() == 1 && gesture.getMaxCount() == 1) {
    auto zeroKey = track->instrument->getZeroKey();
    gesture.withSingleTouch([&](const Touch &touch) {
      love::Vector2 originalTouchPosition = { touch.screenPos.x, touch.screenPos.y };
      auto transformedTouchPosition = viewTransform.inverseTransformPoint(originalTouchPosition);

      // grid x is step, grid y is key
      auto step = double(floor(transformedTouchPosition.x / gridCellSize));
      auto key = floor(-transformedTouchPosition.y / gridCellSize)
          + zeroKey; // set axis to midi middle C

      SoundSubtoolTouch subtoolTouch(touch);
      subtoolTouch.touchX = transformedTouchPosition.x;
      subtoolTouch.touchY = transformedTouchPosition.y;
      subtoolTouch.step = step;
      subtoolTouch.key = key;

      getCurrentSubtool()->onTouch(subtoolTouch);
    });
  } else if (gesture.getCount() == 2) {
    // cancel touch, don't add note
    getCurrentSubtool()->onReset();

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
  love::Vector2 gridBounds = { 0.0f, 0.0f }; // infinite grid
  grid.draw(gridCellSize, gridBounds, gridBounds, viewScale, viewPosition, viewOffset,
      gridDotRadius, false);

  lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
  grid.draw(gridCellSize, gridBounds, gridBounds, viewScale, viewPosition, viewOffset,
      gridDotRadius, true);
};

float TrackTool::getNoteAxisWidth() {
  return gridCellSize * 4.0f;
}

void TrackTool::drawNoteAxis(Song::Track *track) {
  auto x = viewPosition.x - getNoteAxisWidth(); // always on left edge of view
  lv.graphics.push();
  lv.graphics.translate(x, 0.0f);
  lv.graphics.scale(gridCellSize, gridCellSize);
  track->instrument->drawEditorKeyAxis(lv, axisFont.get(), 4.0f,
      getCurrentSubtool()->highlightAxis(), getCurrentSubtool()->highlightAxisKey());
  lv.graphics.pop();
}

void TrackTool::drawOverlay() {
  auto track = soundTool.getSelectedTrack();
  if (!track) {
    return;
  }
  float windowWidth = 800.0f;
  auto viewScale = windowWidth / viewWidth;
  love::Vector2 viewOffset;
  viewOffset.x = getNoteAxisWidth(); // x offset to accommodate axis
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
  lv.graphics.setLineWidth(noZoomUnits(1.0f));

  drawGrid(viewScale, viewOffset);
  getCurrentSubtool()->drawOverlay(lv);

  // draw playhead
  if (soundTool.isPlaying) {
    auto lineY = -1024.0f / viewScale;
    auto lineHeight = 2048.0f / viewScale;
    lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
    lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, playheadX, lineY, 0.1f, lineHeight);
  }

  drawNoteAxis(track);

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

    PROP(Sample, sampleValue);
    PROP(Drums::Params, drumsValue);
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
      } else if (action == "setDrums") {
        Drums *drums = (Drums *)selectedTrack->instrument.get();
        drums->params = params.drumsValue();
        drums->dirtyCache();
        soundTool.updateSelectedComponent("change drums");
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
    selectedPattern->color = pattern.color();
    selectedPattern->name = pattern.name();
  }
  soundTool.updateSelectedComponent("change pattern");
}
