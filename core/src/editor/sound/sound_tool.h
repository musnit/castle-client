#pragma once

#include "precomp.h"
#include "lv.h"
#include "sound/song.h"
#include "behaviors/music.h"
#include "song_tool.h"
#include "track_tool.h"
#include "playback_monitor.h"

class Editor;

class SoundTool {
public:
  SoundTool(const SoundTool &) = delete; // Prevent accidental copies
  const SoundTool &operator=(const SoundTool &) = delete;

  explicit SoundTool(Editor &editor_);

  void resetState();
  void onSetActive();
  void update(double dt);
  void drawOverlay();

  void setTrackIndex(int trackIndex);
  void setPatternId(std::string patternId, double sequenceStartTime);
  void clearSelection();
  bool hasSong();

  void sendUIEvent();

  // play/pause currently edited song
  void togglePlay();

  // sound tool edit modes
  enum class Mode {
    Song,
    Track,
  };
  SongTool songTool { *this };
  TrackTool trackTool { *this };
  inline Mode getMode() {
    return mode;
  }
  void setMode(Mode mode, bool init = false);

private:
  friend class TrackTool;
  friend class SongTool;
  friend struct SoundToolActionReceiver;
  friend struct TrackToolChangeInstrumentReceiver;

  Lv &lv { Lv::getInstance() };
  Editor &editor;

  Mode mode = Mode::Song;

  std::unique_ptr<Song> song;
  int selectedTrackIndex = -1;
  std::string selectedPatternId;
  double selectedSequenceStartTime = 0;
  std::string lastHash;
  void useSelectedActorMusicComponent();
  MusicComponent *maybeGetSelectedActorMusicComponent();
  void updateSelectedComponent(std::string commandDescription);
  void validateSelection();

  void addPattern(double steps, int trackIndex);
  void setSelectedSequenceLoops(bool loop);

  // for playback
  bool isPlaying = false;
  bool viewFollowsPlayhead = false;
  double playStartTime = 0;
  double playStartTimeInSong = 0, playEndTimeInSong = 0;
  double songTotalLength = 0;
  PlaybackMonitor playbackMonitor;
  std::pair<double, double> getPlaybackEndpoints();
  void updatePlaybackStreams();
  void scheduleSongForPlayback(double songStartTime, double songEndTime, double initialTimeInSong);
  double getPlaybackTimeInSong();
  std::optional<double> getPlaybackTimeInSequenceElem(
      Song::Track::Sequence::iterator startSeq, double timeInSong);

  void computeSongLength();

  Song::Track *getSelectedTrack();
  Pattern *getSelectedPattern();
};

inline void SoundTool::setTrackIndex(int trackIndex) {
  selectedTrackIndex = trackIndex;
}

inline void SoundTool::setPatternId(std::string patternId, double sequenceStartTime) {
  selectedPatternId = patternId;
  selectedSequenceStartTime = sequenceStartTime;
}

inline bool SoundTool::hasSong() {
  return song != nullptr;
}

inline Song::Track *SoundTool::getSelectedTrack() {
  if (hasSong() && selectedTrackIndex >= 0 && int(song->tracks.size()) > selectedTrackIndex) {
    return song->tracks[selectedTrackIndex].get();
  }
  return nullptr;
}

inline Pattern *SoundTool::getSelectedPattern() {
  Pattern *result = nullptr;
  if (hasSong() && selectedPatternId != "") {
    return &song->patterns[selectedPatternId];
  }
  return result;
}
