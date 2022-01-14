#include "sound_tool.h"
#include "editor/editor.h"
#include "engine.h"
#include "bridge.h"
#include "behaviors/all.h"

SoundTool::SoundTool(Editor &editor_)
    : editor(editor_) {
  resetState();
}

void SoundTool::resetState() {
  song = nullptr;
  selectedTrackIndex = 0;
  songTool.resetState();
  trackTool.resetState();
  trackLoopLengths.clear();
  songLoopLength = 0;
}

void SoundTool::onSetActive() {
  useSelectedActorMusicComponent();
  setMode(Mode::Song);
  sendUIEvent();
}

void SoundTool::setMode(SoundTool::Mode mode_) {
  if (mode != mode_) {
    mode = mode_;
    switch (mode) {
    case Mode::Song:
      songTool.onSetActive();
      break;
    case Mode::Track:
      trackTool.onSetActive();
      break;
    }
  }
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
    return nullptr;
  }
  auto &musicBehavior = scene.getBehaviors().byType<MusicBehavior>();
  auto actorId = editor.getSelection().firstSelectedActorId();
  return musicBehavior.maybeGetComponent(actorId);
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
      trackLoopLengths.clear();
      songLoopLength = 0;
      for (auto &track : song->tracks) {
        scene.getSound().play(scene.getClock().clockId, track->pattern, *track->instrument);
        auto trackLoopLength = track->pattern.getLoopLength(scene.getClock());
        trackLoopLengths.push_back(trackLoopLength);
        if (trackLoopLength > songLoopLength) {
          songLoopLength = trackLoopLength;
        }
      }
      playStartTime = scene.getClock().getTime();
      isPlaying = true;
    }
  }
  sendUIEvent();
}

void SoundTool::update(double dt) {
  if (!editor.hasScene()) {
    return;
  }
  if (!hasSong()) {
    return;
  }
  switch (mode) {
  case Mode::Song:
    songTool.update(dt);
    break;
  case Mode::Track:
    trackTool.update(dt);
    break;
  }
}

void SoundTool::drawOverlay() {
  switch (mode) {
  case Mode::Song:
    songTool.drawOverlay();
    break;
  case Mode::Track:
    trackTool.drawOverlay();
    break;
  }
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
    auto action = params.action();

    if (action == "play") {
      soundTool.togglePlay();
    } else if (action == "setViewFollowsPlayhead") {
      soundTool.viewFollowsPlayhead = (params.doubleValue() == 1.0) ? true : false;
      soundTool.sendUIEvent();
    } else if (action == "addTrack") {
      if (editor->editMode != Editor::EditMode::Sound) {
        soundTool.useSelectedActorMusicComponent();
      }
      if (soundTool.hasSong()) {
        soundTool.song->tracks.push_back(Song::makeDefaultTrack());
        soundTool.setTrackIndex(soundTool.song->tracks.size() - 1);
        soundTool.updateSelectedComponent("add track");
      }
    } else if (action == "deleteTrack") {
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

struct SoundToolEvent {
  PROP(bool, isPlaying) = false;
  PROP(int, selectedTrackIndex) = 0;
  PROP(bool, viewFollowsPlayhead) = false;
};

void SoundTool::sendUIEvent() {
  SoundToolEvent e { isPlaying, selectedTrackIndex, viewFollowsPlayhead };
  editor.getBridge().sendEvent("EDITOR_SOUND_TOOL", e);
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
      [this, actorId, newSongJson](Editor &editor, bool) {
        setMusicProps(editor, actorId, newSongJson);
        switch (mode) {
        case Mode::Song:
          songTool.updateViewConstraints();
          break;
        case Mode::Track:
          trackTool.updateViewConstraints();
          break;
        }
        sendUIEvent();
      },
      [this, actorId, oldSongJson](Editor &editor, bool) {
        setMusicProps(editor, actorId, oldSongJson);
        switch (mode) {
        case Mode::Song:
          songTool.updateViewConstraints();
          break;
        case Mode::Track:
          trackTool.updateViewConstraints();
          break;
        }
        sendUIEvent();
      });
}
