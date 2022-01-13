#include "sound_tool.h"
#include "editor/editor.h"
#include "engine.h"
#include "bridge.h"
#include "behaviors/all.h"
#include "sound/instruments/sampler.h"

SoundTool::SoundTool(Editor &editor_)
    : editor(editor_) {
  resetState();
}

void SoundTool::resetState() {
  song = nullptr;
  selectedTrackIndex = 0;
  hasTouch = false;
  viewWidth = SOUND_DEFAULT_VIEW_WIDTH;
}

void SoundTool::onSetActive() {
  hasTouch = false;
  viewWidth = SOUND_DEFAULT_VIEW_WIDTH;
  viewPosition.x = 0.0f;
  viewPosition.y = 0.0f;
  updateViewConstraints();
  useSelectedActorMusicComponent();
}

void SoundTool::useSelectedActorMusicComponent() {
  song = nullptr;
  auto component = maybeGetSelectedActorMusicComponent();
  if (component) {
    song = std::make_unique<Song>(component->props.song());
  }
}

MusicComponent *SoundTool::maybeGetSelectedActorMusicComponent() {
  auto &scene = editor.getScene();
  if (!editor.getSelection().hasSelection()) {
    return;
  }
  auto &musicBehavior = scene.getBehaviors().byType<MusicBehavior>();
  auto actorId = editor.getSelection().firstSelectedActorId();
  return musicBehavior.maybeGetComponent(actorId);
}

void SoundTool::updateViewConstraints() {
  double lastTime = 0;
  if (auto track = getSelectedTrack(); track) {
    auto endNotes = track->pattern.rbegin();
    if (endNotes != track->pattern.rend()) {
      // add some buffer beyond last time
      auto &scene = editor.getScene();
      lastTime = endNotes->first;
      lastTime += scene.getClock().getStepsPerBeat();
    }
  }
  panZoom.viewMax.x = std::max(SOUND_DEFAULT_VIEW_BOUND, float(lastTime * gridCellSize));
}

void SoundTool::validateSelection() {
  if (hasSong()) {
    if (song->tracks.size() >= selectedTrackIndex) {
      selectedTrackIndex = song->tracks.size() - 1;
    }
  } else {
    selectedTrackIndex = 0;
  }
}

void SoundTool::togglePlay() {
  if (hasSong()) {
    auto &scene = editor.getScene();
    if (isPlaying) {
      isPlaying = false;
      scene.getSound().stopAll();
    } else {
      // schedule current song to play now
      // TODO: tracks are currently just a singleton pattern
      for (auto &track : song->tracks) {
        scene.getSound().play(scene.getClock().clockId, track->pattern, *track->instrument);
      }
      playStartTime = scene.getClock().getTime();
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
      auto track = getSelectedTrack();
      if (!track) {
        return;
      }
      love::Vector2 originalTouchPosition = { touch.screenPos.x, touch.screenPos.y };
      auto transformedTouchPosition = viewTransform.inverseTransformPoint(originalTouchPosition);

      // grid x is step, grid y is key
      auto step = double(floor(transformedTouchPosition.x / gridCellSize));
      auto key = floor(-transformedTouchPosition.y / gridCellSize) + 48; // set axis to midi C3
      bool playNote = false;

      if (touch.released) {
        if (step >= 0) {
          bool oldHasNote = track->pattern.hasNote(step, key);
          if (oldHasNote) {
            getSelectedTrack()->pattern.removeNote(step, key);
            updateSelectedComponent("remove notes");
          } else {
            getSelectedTrack()->pattern.addNote(step, key);
            updateSelectedComponent("add notes");
          }
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
      if (playNote) {
        auto selectedTrack = getSelectedTrack();
        if (selectedTrack) {
          selectedTrack->instrument->play(scene.getSound(), { step, key });
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
    if (hasTouch && note == tempNote.key) {
      lv.graphics.setColor({ 0.8f, 0.0f, 0.0f, 1.0f });
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
  if (auto track = getSelectedTrack(); track) {
    drawPattern(&(track->pattern));
  }

  // draw playhead
  if (isPlaying) {
    auto &scene = editor.getScene();
    auto steps = scene.getClock().getTime() - playStartTime;
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

struct SoundToolActionReceiver {
  inline static const BridgeRegistration<SoundToolActionReceiver> registration {
    "EDITOR_SOUND_TOOL_ACTION"
  };

  struct Params {
    PROP(std::string, action);
    PROP(double, doubleValue);
  } params;

  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    if (!editor)
      return;

    auto &soundTool = editor->soundTool;

    if (params.action() == "play") {
      soundTool.togglePlay();
    } else if (params.action() == "addTrack") {
      if (editor->editMode != Editor::EditMode::Sound) {
        soundTool.useSelectedActorMusicComponent();
      }
      if (soundTool.hasSong()) {
        soundTool.song->tracks.push_back(Song::makeDefaultTrack());
        soundTool.setTrackIndex(soundTool.song->tracks.size() - 1);
        soundTool.updateSelectedComponent("add track");
      }
    } else if (params.action() == "deleteTrack") {
      int index = int(params.doubleValue());
      if (editor->editMode != Editor::EditMode::Sound) {
        soundTool.useSelectedActorMusicComponent();
      }
      if (soundTool.hasSong()) {
        auto &tracks = soundTool.song->tracks;
        if (index < int(tracks.size())) {
          tracks.erase(tracks.begin() + index);
        }
        soundTool.validateSelection();
        soundTool.updateSelectedComponent("delete track");
      }
    }
  }
};

struct SoundToolSetDataReceiver {
  inline static const BridgeRegistration<SoundToolSetDataReceiver> registration {
    "SOUND_TOOL_START_EDITING"
  };

  struct Params {
    PROP(int, trackIndex) = 0;
  } params;

  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    if (!editor)
      return;

    editor->soundTool.setTrackIndex(params.trackIndex());
  }
};

struct SoundToolChangeInstrumentReceiver {
  inline static const BridgeRegistration<SoundToolChangeInstrumentReceiver> registration {
    "SOUND_TOOL_CHANGE_INSTRUMENT"
  };

  struct Params {
    // TODO: other instrument types besides sampler
    PROP(Sample, sampleValue);
  } params;

  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    if (!editor)
      return;

    editor->soundTool.changeInstrument(params.sampleValue());
  }
};

void SoundTool::changeInstrument(Sample &sample) {
  if (auto selectedTrack = getSelectedTrack(); selectedTrack) {
    Sampler *sampler = (Sampler *)selectedTrack->instrument.get();
    sampler->sample = sample;
  }
  updateSelectedComponent("change instrument");
}

void SoundTool::updateSelectedComponent(std::string commandDescription) {
  auto actorId = editor.getSelection().firstSelectedActorId();
  auto component = maybeGetSelectedActorMusicComponent();

  auto newSongJson = song->serialize();
  auto oldSongJson = component->props.song().serialize();

  static const auto setMusicProps
      = [](Editor &editor, ActorId actorId, const std::string &songJson) {
          auto &scene = editor.getScene();
          auto &musicBehavior = scene.getBehaviors().byType<MusicBehavior>();
          auto musicComponent = musicBehavior.maybeGetComponent(actorId);
          auto archive = Archive::fromJson(songJson.c_str());
          archive.read([&](Archive::Reader &r) {
            musicComponent->props.song().read(r);
          });
          editor.updateBlueprint(actorId, {});
          editor.setSelectedComponentStateDirty(MusicBehavior::behaviorId);
        };

  Commands::Params commandParams;
  editor.getCommands().execute(
      std::move(commandDescription), commandParams,
      [actorId, newSongJson](Editor &editor, bool) {
        setMusicProps(editor, actorId, newSongJson);
      },
      [actorId, oldSongJson](Editor &editor, bool) {
        setMusicProps(editor, actorId, oldSongJson);
      });
  updateViewConstraints();
}
