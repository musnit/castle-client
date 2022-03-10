#pragma once

#include "sound/stream.h"

class Pattern;

//
// A helper class which maintains graphics state for song/pattern playback
// in the editor, without using the clock thread.
//
class PlaybackMonitor {
public:
  PlaybackMonitor() = default;
  PlaybackMonitor(const PlaybackMonitor &) = delete;
  const PlaybackMonitor &operator=(const PlaybackMonitor &) = delete;

  void add(
      int trackIndex, Clock &clock, std::unique_ptr<Pattern> pattern, Sound::StreamOptions opts);
  void clear();
  void update(double dt, double clockTime);
  float getPower(int trackIndex);

  struct TrackPlaybackState {
    std::unique_ptr<Stream> stream;
    float power = 0;
  };
  std::unordered_map<int, TrackPlaybackState> tracks;
};

inline void PlaybackMonitor::clear() {
  tracks.clear();
}

inline float PlaybackMonitor::getPower(int trackIndex) {
  if (auto found = tracks.find(trackIndex); found != tracks.end()) {
    return tracks[trackIndex].power;
  }
  return 0.0f;
}
