#include "sound_tool.h"
#include "editor/editor.h"
#include "engine.h"
#include "bridge.h"
#include "sound/instruments/sampler.h"

SoundTool::SoundTool(Editor &editor_)
    : editor(editor_) {
  resetState();
}

void SoundTool::resetState() {
  song = nullptr;
  sessionId = "";
  hasTouch = false;
  viewWidth = SOUND_DEFAULT_VIEW_WIDTH;
}

void SoundTool::onSetActive() {
  if (!hasSong()) {
    // pattern = std::make_shared<Pattern>();
  }
  hasTouch = false;
  viewWidth = SOUND_DEFAULT_VIEW_WIDTH;
  viewPosition.x = 0.0f;
  viewPosition.y = 0.0f;
}

void SoundTool::togglePlay() {
  if (hasSong()) {
    auto &scene = editor.getScene();
    if (isPlaying) {
      isPlaying = false;
      scene.getSound().stopAll();
    } else {
      // schedule current song to play now
      // TODO: songs are currently just a singleton pattern
      auto &firstInstrument = song->instruments[0];
      auto &firstPattern = song->pattern;
      scene.getSound().play(scene.getClock().clockId, firstPattern, *firstInstrument);
      playStartTime = scene.getClock().getPerformTime();
      isPlaying = true;
    }
  }
}

void SoundTool::update(double dt) {
  if (!editor.hasScene()) {
    return;
  }
  if (!hasSong()) {
    return;
  }
  auto &scene = editor.getScene();
  const Gesture &gesture = scene.getGesture();
  if (gesture.getCount() == 1 && gesture.getMaxCount() == 1) {
    gesture.withSingleTouch([&](const Touch &touch) {
      love::Vector2 originalTouchPosition = { touch.screenPos.x, touch.screenPos.y };
      auto transformedTouchPosition = viewTransform.inverseTransformPoint(originalTouchPosition);

      // grid x is step, grid y is key
      auto step = double(floor(transformedTouchPosition.x / gridCellSize));
      auto key = floor(-transformedTouchPosition.y / gridCellSize) + 48; // set axis to midi C3
      bool playNote = false;

      if (touch.released) {
        if (step >= 0) {
          Commands::Params commandParams;
          commandParams.coalesce = true;
          bool oldHasNote = song->pattern.hasNote(step, key);
          editor.getCommands().execute(
              "change notes", commandParams,
              [this, oldHasNote, step, key](Editor &editor, bool) {
                if (oldHasNote) {
                  song->pattern.removeNote(step, key);
                } else {
                  song->pattern.addNote(step, key);
                }
                // sendPatternEvent();
              },
              [this, oldHasNote, step, key](Editor &editor, bool) {
                if (oldHasNote) {
                  song->pattern.addNote(step, key);
                } else {
                  song->pattern.removeNote(step, key);
                }
              });
        }
        hasTouch = false;
      } else {
        hasTouch = true;
        if (touch.pressed || key != tempNote.key) {
          // moved to a different note while touch was active
          playNote = true;
        }
        tempNote.time = step;
        tempNote.key = key;
      }
      if (playNote && song->instruments.size()) {
        // TODO: other instruments
        auto &firstInstrument = song->instruments[0];
        firstInstrument->play(scene.getSound(), { step, key });
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

void SoundTool::drawGrid(float viewScale, love::Vector2 &viewOffset) {
  // draw lines on each beat and bar
  auto &scene = editor.getScene();
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
  auto lineX = 0.0f;
  auto lineWidth = 2048.0f / viewScale;
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

void SoundTool::drawPattern(Pattern *pattern) {
  if (!hasSong()) {
    return;
  }

  love::Colorf noteColor { 0.3f, 0.3f, 0.3f, 1.0f };
  lv.graphics.setColor(noteColor);

  for (auto &[time, notes] : *pattern) {
    auto x = time * gridCellSize;
    for (auto &note : notes) {
      auto y = ((note.key - 48) * -gridCellSize) - gridCellSize;
      lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, x, y, gridCellSize, gridCellSize);
    }
  }
  if (hasTouch) {
    // draw temp note
    auto x = tempNote.time * gridCellSize;
    auto y = ((tempNote.key - 48) * -gridCellSize) - gridCellSize;
    lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, x, y, gridCellSize, gridCellSize);
  }
}

void SoundTool::drawNoteAxis() {
  // TODO: this should be dependent on the instrument we're using
  // midi 48 is y = 0, go four octaves above and below
  for (auto note = 0; note < 96; note++) {
    auto y = ((note - 48) * -gridCellSize) - gridCellSize;
    auto x = viewPosition.x - gridCellSize; // always on left edge of view
    auto scaleDegree = note % 12;
    auto isBlack = scaleDegree == 1 || scaleDegree == 3 || scaleDegree == 6 || scaleDegree == 8
        || scaleDegree == 10;
    if (isBlack) {
      lv.graphics.setColor({ 0.1f, 0.1f, 0.1f, 1.0f });
    } else {
      lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
    }
    lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_FILL, x, y, gridCellSize, gridCellSize);
    lv.graphics.setColor({ 0.0f, 0.0f, 0.0f, 1.0f });
    lv.graphics.rectangle(love::Graphics::DrawMode::DRAW_LINE, x, y, gridCellSize, gridCellSize);
  }
}

void SoundTool::drawOverlay() {
  float windowWidth = 800.0f;
  auto viewScale = windowWidth / viewWidth;
  love::Vector2 viewOffset;
  viewOffset.x = gridCellSize; // 1-cell x offset to accommodate axis
  constexpr auto viewHeightToWidthRatio = 7.0f / 5.0f;
  viewOffset.y = 0.5f * (viewWidth * viewHeightToWidthRatio - ((50 + 44) / viewScale));

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
  if (hasSong()) {
    drawPattern(&(song->pattern));
  }

  // draw playhead
  if (isPlaying) {
    auto &scene = editor.getScene();
    auto playbackTime = scene.getClock().getPerformTime() - playStartTime;
    auto timePerStep = scene.getClock().getTimePerStep();
    auto steps = playbackTime / timePerStep;
    auto lineY = -1024.0f / viewScale;
    auto lineHeight = 2048.0f / viewScale;
    lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
    lv.graphics.rectangle(
        love::Graphics::DrawMode::DRAW_FILL, steps * gridCellSize, lineY, 0.1f, lineHeight);
  }

  drawNoteAxis();

  lv.graphics.pop();
}

//
// Events
//

struct SoundToolSceneMusicReceiver {
  inline static const BridgeRegistration<SoundToolSceneMusicReceiver> registration {
    "EDITOR_MUSIC_ACTION"
  };

  struct Params {
    PROP(std::string, songId);
    PROP(std::string, action);
  } params;

  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    if (!editor)
      return;

    if (params.action() == "add") {
      editor->getScene().songs.emplace(params.songId(), Song(params.songId()));

      // for now add a single Sampler to all songs
      // TODO: support multiple instruments/tracks
      auto sampler = std::make_unique<Sampler>();
      editor->getScene().songs[params.songId()].instruments.push_back(std::move(sampler));
    } else if (params.action() == "remove") {
      editor->getScene().songs.erase(params.songId());
    }
    editor->soundTool.sendSceneMusicData();
  }
};

struct SoundToolActionReceiver {
  inline static const BridgeRegistration<SoundToolActionReceiver> registration {
    "EDITOR_SOUND_TOOL_ACTION"
  };

  struct Params {
    PROP(std::string, action);
  } params;

  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    if (!editor)
      return;

    if (params.action() == "play") {
      editor->soundTool.togglePlay();
    }
  }
};

struct SoundToolSceneMusicDataEvent {
  struct SongData {
    PROP(std::string, songId);
  };
  PROP(std::vector<SongData>, songs);
};

void SoundTool::sendSceneMusicData() {
  SoundToolSceneMusicDataEvent ev;
  auto &scene = editor.getScene();
  for (auto &[songId, song] : scene.songs) {
    ev.songs().push_back({ songId });
  }
  editor.getBridge().sendEvent("EDITOR_MUSIC", ev);
}

struct SoundToolSetDataReceiver {
  inline static const BridgeRegistration<SoundToolSetDataReceiver> registration {
    "SOUND_TOOL_START_EDITING"
  };

  struct Params {
    PROP(std::string, songId);
  } params;

  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    if (!editor)
      return;

    if (params.songId() != "") {
      // TODO: extend to support songs and not just a pattern
      auto &song = editor->getScene().songs[params.songId()];
      editor->soundTool.setSong(song);
    }
  }
};

struct SoundToolPatternEvent {
  PROP(std::string, sessionId);
  PROP(Pattern *, pattern);
};

void SoundTool::sendPatternEvent() {
  if (hasSong()) {
    SoundToolPatternEvent ev { sessionId, &(song->pattern) };
    editor.getBridge().sendEvent("EDITOR_SOUND_TOOL_PATTERN", ev);
  }
}
