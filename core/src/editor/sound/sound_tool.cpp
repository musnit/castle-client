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
  clearSelection();
  songTool.resetState();
  trackTool.resetState();
  lastHash = "";
  songLoopLength = 0;
  computeSongLength();
}

void SoundTool::onSetActive() {
  useSelectedActorMusicComponent();
  setMode(Mode::Song, true);
  sendUIEvent();
}

void SoundTool::setMode(SoundTool::Mode mode_, bool init) {
  if (mode != mode_ || init) {
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
  auto component = maybeGetSelectedActorMusicComponent();
  if (component) {
    auto hash = MusicBehavior::hash(component->props.song().serialize());
    if (hash != lastHash) {
      song = std::make_unique<Song>(component->props.song());
      lastHash = hash;
    }
  } else {
    song = nullptr;
    lastHash = "";
  }
  computeSongLength();
}

void SoundTool::computeSongLength() {
  if (song) {
    auto &scene = editor.getScene();
    songTotalLength = song->getLength(scene.getClock());
  } else {
    songTotalLength = 0;
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

void SoundTool::clearSelection() {
  selectedPatternId = "";
  selectedSequenceStartTime = 0;
  selectedTrackIndex = -1;
}

void SoundTool::validateSelection() {
  if (hasSong()) {
    if (selectedTrackIndex >= int(song->tracks.size())) {
      selectedTrackIndex = song->tracks.size() - 1;
    }
  } else {
    clearSelection();
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
    Song::Track::SequenceElem firstElem { emptyPattern->patternId, true };
    track->sequence.emplace(steps, firstElem);
    song->patterns.emplace(emptyPattern->patternId, *emptyPattern);
    setPatternId(emptyPattern->patternId, steps);
    updateSelectedComponent("add pattern");
  }
}

void SoundTool::setSelectedSequenceLoops(bool loop) {
  if (auto track = getSelectedTrack(); track) {
    auto itr = track->sequence.find(selectedSequenceStartTime);
    if (itr != track->sequence.end()) {
      if (itr->second.loop() != loop) {
        itr->second.loop() = loop;
        updateSelectedComponent("change loop");
      }
    }
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
      auto trackIndex = 0;
      double songStartTime = 0, songEndTime = songTotalLength;
      if (selectedPatternId != "") {
        // if editing a specific pattern in a sequence, only loop this part of the sequence
        if (auto track = getSelectedTrack(); track) {
          auto itr = track->sequence.find(selectedSequenceStartTime);
          if (itr != track->sequence.end()) {
            songStartTime = selectedSequenceStartTime;
            if (!itr->second.loop()) {
              // selected pattern doesn't loop in song view, so don't capture space after it
              auto &pattern = song->patterns[itr->second.patternId()];
              songEndTime = selectedSequenceStartTime + pattern.getLoopLength(scene.getClock());
            } else {
              // selected patern loops, so go until next pattern, or end of song
              auto next = std::next(itr);
              if (next != track->sequence.end()) {
                songEndTime = next->first;
              }
            }
          }
        }
      }
      songLoopLength = songEndTime - songStartTime;
      for (auto &track : song->tracks) {
        auto pattern
            = song->flattenSequence(trackIndex, songStartTime, songEndTime, scene.getClock());

        // loop all tracks to full selection length (needed if a track ends with silence)
        pattern->loop = Pattern::Loop::ExplicitLength;
        pattern->loopLength = songLoopLength;

        scene.getSound().play(scene.getClock().clockId, std::move(pattern), *track->instrument);
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
        soundTool.setPatternId("", 0);
        soundTool.setTrackIndex(trackIndex);
      } else {
        soundTool.setPatternId("", 0);
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
        soundTool.setPatternId("", 0);
        soundTool.validateSelection();
        soundTool.updateSelectedComponent("delete track");
      }
    } else if (action == "setSequenceLoops") {
      // TODO: if we have more complex changes to make to SequenceElem, consider splitting
      // into separate receiver that just takes SequenceElem prop
      bool loop = params.doubleValue() == 1 ? true : false;
      soundTool.setSelectedSequenceLoops(loop);
    }
  }
};

struct SoundToolEvent {
  PROP(std::string, mode);
  PROP(std::string, subtool);
  PROP(bool, isPlaying) = false;
  PROP(int, selectedTrackIndex) = -1;
  PROP(std::string, selectedPatternId);
  PROP(double, selectedSequenceStartTime) = 0;
  PROP(bool, viewFollowsPlayhead) = false;
};

void SoundTool::sendUIEvent() {
  std::string modeStr;
  std::string subtoolStr;
  switch (mode) {
  case Mode::Song:
    modeStr = "song";
    switch (songTool.selectedSubtool) {
    case SongTool::Subtool::Select:
      subtoolStr = "select";
      break;
    case SongTool::Subtool::Erase:
      subtoolStr = "erase";
      break;
    }
    break;
  case Mode::Track:
    modeStr = "track";
    break;
  }

  SoundToolEvent e { modeStr, subtoolStr, isPlaying, selectedTrackIndex, selectedPatternId,
    selectedSequenceStartTime, viewFollowsPlayhead };
  editor.getBridge().sendEvent("EDITOR_SOUND_TOOL", e);
}

struct SoundToolSetSubtoolReceiver {
  inline static const BridgeRegistration<SoundToolSetSubtoolReceiver> registration {
    "EDITOR_SOUND_TOOL_SET_SUBTOOL"
  };

  struct Params {
    PROP(std::string, mode);
    PROP(std::string, subtool);
  } params;

  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    if (!editor)
      return;

    if (params.mode() == "song") {
      if (params.subtool() == "select") {
        editor->soundTool.songTool.selectedSubtool = SongTool::Subtool::Select;
      } else if (params.subtool() == "erase") {
        editor->soundTool.songTool.selectedSubtool = SongTool::Subtool::Erase;
      }
      editor->soundTool.clearSelection();
      editor->soundTool.sendUIEvent();
    }
  }
};

void SoundTool::updateSelectedComponent(std::string commandDescription) {
  auto actorId = editor.getSelection().firstSelectedActorId();
  auto component = maybeGetSelectedActorMusicComponent();

  auto newSongJson = song->serialize();
  auto oldSongJson = component->props.song().serialize();
  lastHash = MusicBehavior::hash(newSongJson);

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
          scene.getLibrary().ensureGhostActorsExist();
        };

  Commands::Params commandParams;
  editor.getCommands().execute(
      std::move(commandDescription), commandParams,
      [this, actorId, newSongJson](Editor &editor, bool) {
        setMusicProps(editor, actorId, newSongJson);
        useSelectedActorMusicComponent();
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
        useSelectedActorMusicComponent();
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
