#include "sound_tool.h"
#include "editor/editor.h"
#include "engine.h"
#include "bridge.h"
#include "behaviors/all.h"

SoundTool::SoundTool(Editor &editor_)
    : editor(editor_) {
  resetState();
}

Scene &SoundTool::getScene() {
  return editor.getScene();
}

void SoundTool::resetState() {
  song = nullptr;
  clearSelection();
  songTool.resetState();
  trackTool.resetState();
  lastHash = "";
  playStartTime = 0;
  playStartTimeInSong = 0;
  playEndTimeInSong = 0;
  playbackMonitor.clear();
  computeSongLength();
}

void SoundTool::onSetActive() {
  playbackMonitor.clear();
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
  if (isPlaying) {
    updatePlaybackStreams();
  }
}

void SoundTool::discardChanges() {
  // recompute our current hash in case it differs from the actor's
  auto newSongJson = song->serialize();
  lastHash = MusicBehavior::hash(newSongJson);

  // reset to actor's component if different
  useSelectedActorMusicComponent();

  sendUIEvent();
}

void SoundTool::computeSongLength() {
  if (song) {
    auto &scene = getScene();
    songTotalLength = song->getLength(scene.getClock());
  } else {
    songTotalLength = 0;
  }
}

MusicComponent *SoundTool::maybeGetSelectedActorMusicComponent() {
  auto &scene = getScene();
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
    auto emptyPattern = Pattern::makeEmptyPattern();
    Song::Track::SequenceElem firstElem { emptyPattern->patternId(), true };
    track->sequence.emplace(steps, firstElem);
    song->patterns.emplace(emptyPattern->patternId(), *emptyPattern);
    setPatternId(emptyPattern->patternId(), steps);
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

std::pair<double, double> SoundTool::getPlaybackEndpoints() {
  auto &scene = getScene();
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
  return { songStartTime, songEndTime };
}

void SoundTool::scheduleSongForPlayback(
    double songStartTime, double songEndTime, double initialTimeInSong) {
  auto &scene = getScene();
  auto patterns = song->flattenTracksForPlayback(songStartTime, songEndTime, scene.getClock());
  Sound::StreamOptions opts;
  opts.initialTimeInStream = initialTimeInSong;
  for (size_t idx = 0; idx < song->tracks.size(); idx++) {
    auto &pattern = patterns[idx];
    auto &track = song->tracks[idx];
    auto patternClone = std::make_unique<Pattern>(*pattern);
    auto instrumentClone = track->instrument->clone();
    playbackMonitor.add(scene.getClock(), std::move(patternClone), opts);
    scene.getSound().play(
        scene.getClock().clockId, std::move(pattern), std::move(instrumentClone), opts);
  }
}

void SoundTool::stopPlayback() {
  auto &scene = getScene();
  isPlaying = false;
  playbackMonitor.clear();
  scene.getSound().stopAll();
}

void SoundTool::togglePlayback() {
  if (hasSong()) {
    auto &scene = getScene();
    if (isPlaying) {
      stopPlayback();
    } else {
      // schedule current song to play now
      auto [songStartTime, songEndTime] = getPlaybackEndpoints();
      scheduleSongForPlayback(songStartTime, songEndTime, 0);
      playStartTime = scene.getClock().getTime();
      playStartTimeInSong = songStartTime;
      playEndTimeInSong = songEndTime;
      isPlaying = true;
    }
  }
  sendUIEvent();
}

void SoundTool::updatePlaybackStreams() {
  if (hasSong() && isPlaying) {
    // stop old streams
    auto &scene = getScene();
    playbackMonitor.clear();
    scene.getSound().clearStreams();

    // maintain existing `isPlaying` and `playStartTime` and song endpoints,
    // schedule latest song data to play now, but fast forward the amount we already played
    auto timePlaying = scene.getClock().getTime() - playStartTime;
    scheduleSongForPlayback(playStartTimeInSong, playEndTimeInSong, timePlaying);
  }
}

double SoundTool::getPlaybackTimeInSong() {
  auto timePlaying = getScene().getClock().getTime() - playStartTime;
  auto songLoopLength = playEndTimeInSong - playStartTimeInSong;
  while (songLoopLength > 0 && timePlaying > songLoopLength) {
    timePlaying -= songLoopLength;
  }
  return playStartTimeInSong + timePlaying;
}

std::optional<double> SoundTool::getPlaybackTimeInSequenceElem(
    Song::Track::Sequence::iterator startSeq, double timeInSong) {
  auto loopLength
      = song->patterns[startSeq->second.patternId()].getLoopLength(getScene().getClock());
  auto timeInSeq = timeInSong - startSeq->first;
  if (startSeq->second.loop() || timeInSeq < loopLength) {
    while (loopLength > 0 && timeInSeq > loopLength) {
      timeInSeq -= loopLength;
    }
    return timeInSeq;
  }
  // we aren't in this sequence elem
  return std::nullopt;
}

void SoundTool::update(double dt) {
  if (!editor.hasScene()) {
    return;
  }
  if (!hasSong()) {
    return;
  }
  if (isPlaying) {
    auto &clock = getScene().getClock();
    playbackMonitor.update(dt, clock.getTime());
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
      soundTool.togglePlayback();
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
    } else if (action == "forkSelectedPattern") {
      if (auto selectedPattern = soundTool.getSelectedPattern(); selectedPattern) {
        // fork old pattern
        auto newPattern = Pattern::fork(*selectedPattern);
        auto newPatternId = newPattern->patternId();
        soundTool.song->patterns[newPattern->patternId()] = *newPattern;

        // sub into selected sequence here, update selection
        if (auto selectedTrack = soundTool.getSelectedTrack(); selectedTrack) {
          auto startTime = soundTool.selectedSequenceStartTime;
          selectedTrack->sequence[startTime].patternId = newPatternId;
          soundTool.setPatternId(newPatternId, startTime);
          soundTool.song->cleanUpUnusedPatterns();
          soundTool.updateSelectedComponent("fork pattern");
        }
      }
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
    subtoolStr = trackTool.currentSubtoolName;
    break;
  }

  SoundToolEvent e { modeStr, subtoolStr, isPlaying, selectedTrackIndex, selectedPatternId,
    selectedSequenceStartTime, viewFollowsPlayhead };
  editor.getBridge().sendEvent("EDITOR_SOUND_TOOL", e);
}

struct SoundToolAddTrackReceiver {
  inline static const BridgeRegistration<SoundToolAddTrackReceiver> registration {
    "EDITOR_SOUND_TOOL_ADD_TRACK"
  };

  struct Params {
    PROP(std::string, type);
  } params;

  void receive(Engine &engine) {
    auto editor = engine.maybeGetEditor();
    if (!editor)
      return;

    auto &soundTool = editor->soundTool;
    editor->soundTool.addTrack(params.type());
  }
};

void SoundTool::addTrack(const std::string &type) {
  if (hasSong()) {
    auto emptyPattern = Pattern::makeEmptyPattern();
    auto defaultTrack = Song::makeDefaultTrack(type);
    Song::Track::SequenceElem firstElem { emptyPattern->patternId(), true };
    defaultTrack->sequence.emplace(0, firstElem);
    song->patterns.emplace(emptyPattern->patternId(), *emptyPattern);
    song->tracks.push_back(std::move(defaultTrack));
    setPatternId(emptyPattern->patternId(), 0);
    setTrackIndex(song->tracks.size() - 1);
    updateSelectedComponent("add track");
  }
}

struct NewTrackEvent {};

void SoundTool::sendNewTrackEvent() {
  NewTrackEvent e;
  editor.getBridge().sendEvent("SHOW_ADD_TRACK_SHEET", e);
};

void SoundTool::openTrackInspector() {
  NewTrackEvent e;
  editor.getBridge().sendEvent("SHOW_TRACK_INSPECTOR", e);
};

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
    } else if (params.mode() == "track") {
      editor->soundTool.trackTool.setCurrentSubtool(params.subtool());
    }
    editor->soundTool.sendUIEvent();
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
