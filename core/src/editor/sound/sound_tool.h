#pragma once

#include "precomp.h"
#include "lv.h"
#include "sound/song.h"
#include "behaviors/music.h"
#include "song_tool.h"
#include "track_tool.h"

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
  void setPatternId(std::string patternId);
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
  void setMode(Mode mode);

private:
  friend class TrackTool;
  friend class SongTool;
  friend struct SoundToolActionReceiver;

  Lv &lv { Lv::getInstance() };
  Editor &editor;

  Mode mode = Mode::Song;

  std::unique_ptr<Song> song;
  int selectedTrackIndex = -1;
  std::string selectedPatternId;
  void useSelectedActorMusicComponent();
  MusicComponent *maybeGetSelectedActorMusicComponent();
  void updateSelectedComponent(std::string commandDescription);
  void validateSelection();

  // for playback
  bool isPlaying = false;
  bool viewFollowsPlayhead = false;
  double playStartTime = 0;
  double songLoopLength = 0;
  std::vector<double> trackLoopLengths;

  Song::Track *getSelectedTrack();
  Pattern *getSelectedPattern();
};

inline void SoundTool::setTrackIndex(int trackIndex) {
  selectedTrackIndex = trackIndex;
}

inline void SoundTool::setPatternId(std::string patternId) {
  selectedPatternId = patternId;
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
