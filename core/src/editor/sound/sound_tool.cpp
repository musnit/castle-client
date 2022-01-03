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
}

void SoundTool::onSetActive() {
  if (!hasSong()) {
    // pattern = std::make_shared<Pattern>();
  }
}

void SoundTool::play() {
  if (hasSong()) {
    // schedule current song to play now
    // TODO: songs are currently just a singleton pattern
    auto &scene = editor.getScene();
    auto &firstInstrument = song->instruments[0];
    auto &firstPattern = song->pattern;
    scene.getSound().play(scene.getClock().clockId, firstPattern, *firstInstrument);
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

      if (touch.pressed) {
        // grid x is step, grid y is key
        auto step = floor(transformedTouchPosition.x / gridCellSize);
        auto key = floor(-transformedTouchPosition.y / gridCellSize) + 48; // set axis to midi C3
        auto added = song->pattern.toggleNote(double(step), key);
        // sendPatternEvent();

        // if note added, play it
        // TODO: other instruments
        if (added && song->instruments.size()) {
          auto &firstInstrument = song->instruments[0];
          firstInstrument->play(scene.getSound(), { step, key });
        }
      }
    });
  }
}

void SoundTool::drawGrid(float viewScale) {
  // TODO: final grid appearance
  lv.graphics.setColor({ 0.0f, 0.0f, 0.0f, 0.4f });
  auto gridDotRadius = 3.5f;
  love::Vector2 viewPosition(0.0f, -0.75f * SOUND_DEFAULT_VIEW_WIDTH);
  love::Vector2 gridOffset(0.0f, 0.0f);
  grid.draw(gridCellSize, 10.0f + gridCellSize * 0.5f, viewScale, viewPosition, gridOffset,
      gridDotRadius, false);

  lv.graphics.setColor({ 1.0f, 1.0f, 1.0f, 1.0f });
  grid.draw(gridCellSize, 10.0f + gridCellSize * 0.5f, viewScale, viewPosition, gridOffset,
      gridDotRadius, true);
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
}

void SoundTool::drawOverlay() {
  auto viewScale = 800.0f / SOUND_DEFAULT_VIEW_WIDTH;
  love::Vector2 viewPosition(0.0f, -0.75f * SOUND_DEFAULT_VIEW_WIDTH);

  lv.graphics.push(love::Graphics::STACK_ALL);
  viewTransform.reset();
  viewTransform.scale(viewScale, viewScale);
  viewTransform.translate(-viewPosition.x, -viewPosition.y);
  lv.graphics.applyTransform(&viewTransform);

  love::Colorf clearColor { 0.8f, 0.8f, 0.8f, 1.0f };
  lv.graphics.clear(clearColor, {}, {});
  lv.graphics.setLineWidth(0.1f);

  drawGrid(viewScale);
  if (hasSong()) {
    drawPattern(&(song->pattern));
  }

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
      editor->soundTool.play();
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
