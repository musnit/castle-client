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
  selectedTrackIndex = -1;
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
    if (selectedTrackIndex >= int(song->tracks.size())) {
      selectedTrackIndex = song->tracks.size() - 1;
    }
  } else {
    selectedPatternId = "";
    selectedTrackIndex = -1;
  }
  if (mode == Mode::Track && selectedTrackIndex < 0) {
    // no selected track, not allowed to be in track mode
    setMode(Mode::Song);
  }
}

void SoundTool::addPattern(double steps, int trackIndex) {
  if (!hasSong()) {
    return;
  }
  if (auto &track = song->tracks[trackIndex]; track) {
    auto emptyPattern = Song::makeEmptyPattern();
    track->sequence.emplace(steps, emptyPattern->patternId);
    song->patterns.emplace(emptyPattern->patternId, *emptyPattern);
    setPatternId(emptyPattern->patternId);
    updateSelectedComponent("add pattern");
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
      trackLoopLengths.clear();
      songLoopLength = 0;
      auto trackIndex = 0;
      for (auto &track : song->tracks) {
        auto pattern = song->flattenSequence(
            trackIndex, 0, 0, scene.getClock()); // TODO: set bounds if we've selected a range
        auto trackLoopLength = pattern->getLoopLength(scene.getClock());
        scene.getSound().play(scene.getClock().clockId, std::move(pattern), *track->instrument);
        trackLoopLengths.push_back(trackLoopLength);
        if (trackLoopLength > songLoopLength) {
          songLoopLength = trackLoopLength;
        }
        trackIndex++;
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
    PROP(std::string, stringValue);
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
    } else if (action == "setMode") {
      auto modeStr = params.stringValue();
      if (modeStr == "song") {
        soundTool.setMode(SoundTool::Mode::Song);
      } else if (modeStr == "track") {
        soundTool.setMode(SoundTool::Mode::Track);
      }
      soundTool.sendUIEvent();
    } else if (action == "selectTrack") {
      auto trackIndex = int(params.doubleValue());
      if (trackIndex >= 0 && trackIndex < int(soundTool.song->tracks.size())) {
        soundTool.setPatternId("");
        soundTool.setTrackIndex(trackIndex);
      } else {
        soundTool.setPatternId("");
        soundTool.setTrackIndex(-1);
      }
      soundTool.validateSelection();
      soundTool.sendUIEvent();
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
        soundTool.setPatternId("");
        soundTool.validateSelection();
        soundTool.updateSelectedComponent("delete track");
      }
    }
  }
};

struct SoundToolEvent {
  PROP(std::string, mode);
  PROP(bool, isPlaying) = false;
  PROP(int, selectedTrackIndex) = -1;
  PROP(bool, viewFollowsPlayhead) = false;
};

void SoundTool::sendUIEvent() {
  std::string modeStr;
  switch (mode) {
  case Mode::Song:
    modeStr = "song";
    break;
  case Mode::Track:
    modeStr = "track";
    break;
  }

  SoundToolEvent e { modeStr, isPlaying, selectedTrackIndex, viewFollowsPlayhead };
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
