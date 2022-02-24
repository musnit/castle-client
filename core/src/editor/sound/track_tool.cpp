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

void TrackTool::drawGrid(Song::Track *track, love::Vector2 &viewOffset) {
  auto &scene = getScene();
  unsigned int initialStepIndexVisible
      = int(std::floor(std::max(viewPosition.x, 0.0f) / gridCellSize));
  float initialGridX = float(initialStepIndexVisible) * gridCellSize;
  float gridWidth = (viewPosition.x + viewWidth) - initialGridX;
  int initialNoteIndexVisible = int(std::floor((viewPosition.y - viewOffset.y) / gridCellSize));
  float initialGridY = float(initialNoteIndexVisible) * gridCellSize;
  float gridHeight = (viewPosition.y - viewOffset.y + viewWidth * (7.0f / 5.0f)) - initialGridY;

  lv.graphics.push();
  lv.graphics.translate(initialGridX, initialGridY);

  gridWidth /= gridCellSize;
  gridHeight /= gridCellSize;
  lv.graphics.scale(gridCellSize, gridCellSize);

  unsigned int stepsPerBeat = scene.getClock().getStepsPerBeat(),
               stepsPerBar = stepsPerBeat * scene.getClock().getBeatsPerBar();
  auto lineY = 0.0f;
  auto lineHeight = gridHeight;
  auto lineX = 0.0f;
  auto lineWidth = gridWidth;

  // instrument has a chance to control grid cell color here
  track->instrument->drawEditorGridCellColors(
      lv, initialStepIndexVisible, initialNoteIndexVisible, gridWidth, gridHeight);

  // draw light grid on every step and note
  {
    float gridX = 0.0f;
    unsigned int stepIndexVisible = initialStepIndexVisible;
    constexpr auto stepGrey = 0xbb / 255.0f;
    lv.graphics.setColor({ stepGrey, stepGrey, stepGrey, 1.0f });
    while (gridX < gridWidth) {
      lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, gridX, lineY, 0.05f, lineHeight);
      stepIndexVisible++;
      gridX += 1.0f;
    }

    int noteIndexVisible = initialNoteIndexVisible;
    float gridY = 0.0f;
    while (gridY < gridHeight) {
      lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, lineX, gridY, lineWidth, 0.05f);
      noteIndexVisible++;
      gridY += 1.0f;
    }
  }

  // draw darker lines on each beat
  {
    float gridX = 0;
    unsigned int stepIndexVisible = initialStepIndexVisible;
    while (stepIndexVisible % stepsPerBeat != 0) {
      stepIndexVisible++;
      gridX += 1.0f;
    }
    constexpr auto beatGrey = 0x99 / 255.0f;
    lv.graphics.setColor({ beatGrey, beatGrey, beatGrey, 1.0f });
    while (gridX < gridWidth) {
      lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, gridX, lineY, 0.05f, lineHeight);
      stepIndexVisible += stepsPerBeat;
      gridX += stepsPerBeat;
    }
  }

  // draw even darker lines on each bar
  {
    float gridX = 0;
    unsigned int stepIndexVisible = initialStepIndexVisible;
    while (stepIndexVisible % stepsPerBar != 0) {
      stepIndexVisible++;
      gridX += 1.0f;
    }
    constexpr auto darkGrey = 0x55 / 255.0f;
    lv.graphics.setColor({ darkGrey, darkGrey, darkGrey, 1.0f });
    while (gridX < gridWidth) {
      lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, gridX, lineY, 0.05f, lineHeight);
      stepIndexVisible += stepsPerBar;
      gridX += stepsPerBar;
    }
  }

  // draw lines on each octave
  {
    int noteIndexVisible = initialNoteIndexVisible;
    float gridY = 0.0f;
    constexpr auto darkGrey = 0x55 / 255.0f;
    lv.graphics.setColor({ darkGrey, darkGrey, darkGrey, 1.0f });
    while (noteIndexVisible % 12 != 0) {
      noteIndexVisible++;
      gridY += 1.0f;
    }
    while (gridY < gridHeight) {
      lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, lineX, gridY, lineWidth, 0.05f);
      noteIndexVisible += 12;
      gridY += 12.0f;
    }
  }

  lv.graphics.pop();
};

float TrackTool::getNoteAxisWidth() {
  return std::max(gridCellSize * 2.0f, noZoomUnits(72.0f));
}

void TrackTool::drawNoteAxis(Song::Track *track) {
  auto x = std::max(viewPosition.x, 0.0f) - getNoteAxisWidth(); // always on left edge of view
  lv.graphics.push();
  lv.graphics.translate(x, 0.0f);
  auto noteAxisWidth = getNoteAxisWidth() / gridCellSize;
  lv.graphics.scale(gridCellSize, gridCellSize);

  // instrument controls axis appearance
  track->instrument->drawEditorKeyAxis(lv, axisFont.get(), noteAxisWidth,
      getCurrentSubtool()->highlightAxis(), getCurrentSubtool()->highlightAxisKey());

  // draw border line on edge of axis
  constexpr auto darkGrey = 0x55 / 255.0f;
  lv.graphics.setColor({ darkGrey, darkGrey, darkGrey, 1.0f });
  lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, noteAxisWidth, -48.0f, 0.1f, 96.0f);

  lv.graphics.pop();
}

float TrackTool::getTimeAxisHeight() {
  return noZoomUnits(36.0f);
}

void TrackTool::drawTimeAxis(love::Vector2 &viewOffset) {
  auto &scene = getScene();
  unsigned int stepsPerBeat = scene.getClock().getStepsPerBeat(),
               stepsPerBar = stepsPerBeat * scene.getClock().getBeatsPerBar();
  auto timeAxisHeight = getTimeAxisHeight();
  auto shittyFontScale = timeAxisHeight / 25.0f;
  love::Vector2 fontPosition(noZoomUnits(12.0f), noZoomUnits(20.0f));

  lv.graphics.push();
  lv.graphics.translate(std::max(viewPosition.x, 0.0f), viewPosition.y - viewOffset.y);
  timeAxisHeight /= gridCellSize;
  lv.graphics.scale(gridCellSize, gridCellSize);

  // background bar
  constexpr auto bgGrey = 0xee / 255.0f;
  lv.graphics.setColor({ bgGrey, bgGrey, bgGrey, 1.0f });
  lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, -getNoteAxisWidth() / gridCellSize,
      0.0f, 64.0f, timeAxisHeight);

  float xViewPos = std::max(viewPosition.x, 0.0f);
  int initialStepIndexVisible = int(std::floor(xViewPos / gridCellSize));
  float initialX = ((initialStepIndexVisible * gridCellSize) - xViewPos) / gridCellSize;

  // beat lines
  {
    constexpr auto beatGrey = 0x99 / 255.0f;
    lv.graphics.setColor({ beatGrey, beatGrey, beatGrey, 1.0f });
    int stepIndex = initialStepIndexVisible;
    float x = initialX;
    while (stepIndex % stepsPerBeat != 0) {
      stepIndex++;
      x += 1.0f;
    }
    float lineHeight = timeAxisHeight * 0.5f;
    while (x < 64.0f) {
      if (x > 0.0f) {
        lv.graphics.rectangle(
            love::Graphics::DrawMode::DRAW_FILL, x, timeAxisHeight - lineHeight, 0.1f, lineHeight);
        if (stepIndex % stepsPerBar != 0) {
          auto bars = std::floor(stepIndex / stepsPerBar);
          auto beats = int((stepIndex - bars * stepsPerBar) / stepsPerBeat);
          auto beatLabel = fmt::format("{}.{}", bars + 1, beats + 1);
          lv.graphics.print({ { beatLabel, { 1, 1, 1, 1 } } }, axisFont.get(),
              love::Matrix4(x + fontPosition.x, fontPosition.y, 0, shittyFontScale, shittyFontScale,
                  0, 0, 0, 0));
        }
      }
      stepIndex += stepsPerBeat;
      x += stepsPerBeat;
    }
  }

  // bar lines
  {
    constexpr auto darkGrey = 0x55 / 255.0f;
    lv.graphics.setColor({ darkGrey, darkGrey, darkGrey, 1.0f });
    int stepIndex = initialStepIndexVisible;
    float x = initialX;
    while (stepIndex % stepsPerBar != 0) {
      stepIndex++;
      x += 1.0f;
    }
    while (x < 64.0f) {
      if (x > 0.0f) {
        lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, x, 0.0f, 0.1f, timeAxisHeight);
        auto barLabel = fmt::format("{}.1", int(stepIndex / stepsPerBar) + 1);
        lv.graphics.print({ { barLabel, { 1, 1, 1, 1 } } }, axisFont.get(),
            love::Matrix4(x + fontPosition.x, fontPosition.y, 0, shittyFontScale, shittyFontScale,
                0, 0, 0, 0));
      }
      stepIndex += stepsPerBar;
      x += stepsPerBar;
    }
  }

  // zero-axis line
  {
    constexpr auto darkGrey = 0x55 / 255.0f;
    lv.graphics.setColor({ darkGrey, darkGrey, darkGrey, 1.0f });
    lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, 0.0f, 0.0f, 0.1f, timeAxisHeight);
  }

  // draw border line on edge of axis
  {
    constexpr auto darkGrey = 0x55 / 255.0f;
    lv.graphics.setColor({ darkGrey, darkGrey, darkGrey, 1.0f });
    lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, 0.0f, timeAxisHeight, 64.0f, 0.1f);
  }

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
  viewOffset.x = getNoteAxisWidth(); // offset to accommodate axes
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

  constexpr auto bgGrey = 0xdd / 255.0f;
  love::Colorf clearColor { bgGrey, bgGrey, bgGrey, 1.0f };
  lv.graphics.clear(clearColor, {}, {});
  lv.graphics.setLineWidth(noZoomUnits(1.0f));

  drawGrid(track, viewOffset);
  lv.graphics.push();
  lv.graphics.scale(gridCellSize, gridCellSize);
  getCurrentSubtool()->drawOverlay(lv);
  lv.graphics.pop();

  // draw playhead
  if (soundTool.isPlaying) {
    auto lineY = -1024.0f / viewScale;
    auto lineHeight = 2048.0f / viewScale;
    lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
    lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, playheadX, lineY, 0.1f, lineHeight);
  }

  drawNoteAxis(track);
  drawTimeAxis(viewOffset);

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
