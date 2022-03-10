#include "playback_monitor.h"
#include "sound/stream.h"

void PlaybackMonitor::add(
    int trackIndex, Clock &clock, std::unique_ptr<Pattern> pattern, Sound::StreamOptions opts) {
  auto wait = 0;
  if (opts.quantize) {
    wait = clock.getTimeUntilNext(opts.quantizeUnits, 1);
  }
  auto stream = std::make_unique<Stream>(clock, std::move(pattern), nullptr, wait);
  stream->fastForward(opts.initialTimeInStream);
  tracks[trackIndex] = { std::move(stream), 0.0f };
}

void PlaybackMonitor::update(double dt, double clockTime) {
  auto iter = tracks.begin();
  while (iter != tracks.end()) {
    auto &[trackIndex, state] = *iter;

    // cool down this track
    if (state.power > 0.0f) {
      state.power *= pow(0.03f, float(dt));
      if (state.power <= 0.05f) {
        state.power = 0.0f;
      }
    }

    // activate this track if stream has notes
    if (state.stream->hasNext()) {
      if (clockTime >= state.stream->nextTime()) {
        state.power = 1;
        state.stream->skipToNext();
      }
      ++iter;
    } else {
      // stream is exhausted, remove
      iter = tracks.erase(iter);
    }
  }
}
