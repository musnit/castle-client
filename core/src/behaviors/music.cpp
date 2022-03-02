#include "music.h"
#include "behaviors/all.h"
#include "sound/stream.h"

void MusicBehavior::handleEnableComponent(ActorId actorId, MusicComponent &component) {
  auto &song = component.props.song();
  if (song.tracks.size() == 0) {
    auto emptyPattern = Pattern::makeEmptyPattern();
    auto defaultTrack = Song::makeDefaultTrack("sampler");
    Song::Track::SequenceElem firstElem { emptyPattern->patternId(), true };
    defaultTrack->sequence.emplace(0, firstElem);
    song.patterns.emplace(emptyPattern->patternId(), *emptyPattern);
    song.tracks.push_back(std::move(defaultTrack));
  }
  if (!getScene().getIsEditing()) {
    // possibly autoplay at next bar
    auto &autoplay = component.props.autoplay();
    if (autoplay != "none") {
      Sound::StreamOptions opts;
      opts.quantize = true;
      opts.quantizeUnits = Clock::Quantize::Bar;
      playSong(actorId, &component, autoplay == "loop", opts);
    }
  }
}

void MusicBehavior::handleDisableComponent(
    ActorId actorId, MusicComponent &component, bool removeActor) {
  Sound::StreamOptions opts;
  if (!getScene().getIsEditing()) {
    // default in play mode is to stop actor's streams at the next bar
    opts.quantize = true;
    opts.quantizeUnits = Clock::Quantize::Bar;
  }
  stopMusic(actorId, &component, opts);
}

void MusicBehavior::handleSceneEnd() {
  Sound::StreamOptions opts;
  if (!getScene().getIsEditing()) {
    // default in play mode is to stop actor's streams at the next bar
    opts.quantize = true;
    opts.quantizeUnits = Clock::Quantize::Bar;
  }
  forEachComponent([&](ActorId actorId, MusicComponent &component) {
    stopMusic(actorId, &component, opts);
  });
}

std::string MusicBehavior::hash(const std::string &json) {
  auto hash = std::hash<std::string> {}(json);

  char str[256];
  snprintf(str, sizeof str, "%zu", hash);

  return std::string(str);
}

void MusicBehavior::stopMusic(
    ActorId &actorId, MusicComponent *component, Sound::StreamOptions opts) {
  auto &scene = getScene();
  auto &clock = scene.getClock();
  if (auto found = activeStreams.find(actorId); found != activeStreams.end()) {
    auto &[_, streams] = *found;
    for (auto &[trackIndex, streamId] : streams) {
      scene.getSound().stopStream(clock.clockId, streamId, opts);
    }
    activeStreams.erase(actorId);
  }
}

void MusicBehavior::stopTrack(
    ActorId &actorId, MusicComponent *component, int trackIndex, Sound::StreamOptions opts) {
  auto &scene = getScene();
  auto &clock = scene.getClock();
  if (auto found = activeStreams.find(actorId); found != activeStreams.end()) {
    auto &[_, streamsByTrack] = *found;
    if (auto foundTrack = streamsByTrack.find(trackIndex); foundTrack != streamsByTrack.end()) {
      auto streamId = foundTrack->second;
      scene.getSound().stopStream(clock.clockId, streamId, opts);
      streamsByTrack.erase(trackIndex);
    }
  }
}

void MusicBehavior::playSong(
    ActorId &actorId, MusicComponent *component, bool loop, Sound::StreamOptions opts) {
  auto &scene = getScene();
  auto &clock = scene.getClock();

  // stop any existing for the same actor
  stopMusic(actorId, component, opts);

  auto &song = component->props.song();
  std::unordered_map<int, int> streamsCreated;
  auto patterns = song.flattenTracksForPlayback(0, song.getLength(clock), clock);
  for (size_t idx = 0; idx < song.tracks.size(); idx++) {
    auto &pattern = patterns[idx];
    auto &track = song.tracks[idx];
    pattern->loop = loop ? Pattern::Loop::ExplicitLength : Pattern::Loop::None;
    auto instrumentClone = track->instrument->clone();
    auto streamId = scene.getSound().play(
        clock.clockId, std::move(pattern), std::move(instrumentClone), opts);
    if (streamId >= 0) {
      streamsCreated.emplace(idx, streamId);
    }
  }
  // can safely emplace because of prior `stopMusic` call
  activeStreams.emplace(actorId, streamsCreated);
}

void MusicBehavior::playPattern(ActorId &actorId, MusicComponent *component,
    const std::string &patternId, int trackIndex, bool loop, Sound::StreamOptions opts) {
  auto &scene = getScene();
  auto &clock = scene.getClock();
  auto &song = component->props.song();
  if (auto found = song.patterns.find(patternId); found != song.patterns.end()) {
    auto &refPattern = found->second;
    if (trackIndex >= 0 && trackIndex < int(song.tracks.size())) {
      auto &track = song.tracks[trackIndex];

      // if this track is already playing, stop
      stopTrack(actorId, component, trackIndex, opts);

      auto pattern = std::make_unique<Pattern>(refPattern);
      if (!loop) {
        pattern->loop = Pattern::Loop::None;
      }
      auto instrumentClone = track->instrument->clone();
      auto streamId = scene.getSound().play(
          clock.clockId, std::move(pattern), std::move(instrumentClone), opts);
      if (streamId >= 0) {
        if (auto trackMap = activeStreams.find(actorId); trackMap == activeStreams.end()) {
          activeStreams.emplace(actorId, std::unordered_map<int, int>());
        }
        if (auto trackMap = activeStreams.find(actorId); trackMap != activeStreams.end()) {
          trackMap->second.emplace(trackIndex, streamId);
        }
      }
    }
  }
}

void MusicBehavior::playPatternStep(ActorId &actorId, MusicComponent *component,
    const std::string &patternId, int trackIndex, double timeInPattern) {
  auto &scene = getScene();
  auto &song = component->props.song();
  if (auto found = song.patterns.find(patternId); found != song.patterns.end()) {
    auto &refPattern = found->second;
    if (trackIndex >= 0 && trackIndex < int(song.tracks.size())) {
      auto &track = song.tracks[trackIndex];
      if (auto notesItr = refPattern.notes().find(timeInPattern); notesItr != refPattern.end()) {
        auto &notes = notesItr->second;
        for (auto &note : notes) {
          track->instrument->play(scene.getSound(), note);
        }
      }
    }
  }
}

void MusicBehavior::setTrackMuted(
    ActorId &actorId, MusicComponent *component, int trackIndex, bool muted) {
  auto &clock = getScene().getClock();
  // look up existing stream corresponding to this track and modify its instrument
  if (auto found = activeStreams.find(actorId); found != activeStreams.end()) {
    auto &[_, streams] = *found;
    if (auto foundTrack = streams.find(trackIndex); foundTrack != streams.end()) {
      auto streamIdForTrack = foundTrack->second;
      auto stream = getScene().getSound().maybeGetStream(clock.clockId, streamIdForTrack);
      if (stream) {
        // TODO: dangerous, probably need a lock on this stream
        stream->instrument->props.muted() = muted;
      }
    }
  }

  // additionally modify the source track in the song for future streams
  auto &song = component->props.song();
  if (trackIndex >= 0 && trackIndex < int(song.tracks.size())) {
    auto &track = song.tracks[trackIndex];
    track->instrument->props.muted() = muted;
  }
}


//
// Responses
//

struct PlaySongResponse : BaseResponse {
  inline static const RuleRegistration<PlaySongResponse, MusicBehavior> registration {
    "play song"
  };
  static constexpr auto description = "Play this actor's song";

  struct Params {
    PROP(bool, loop) = true;
    PROP(bool, quantize, .label("quantize to clock")) = true;
    PROP(
         Clock::Quantize, quantizeUnits,
         .label("quantize units")
         .allowedValues("bar", "beat", "step")
         ) = Clock::Quantize::Bar;
  } params;

  void run(RuleContext &ctx) override {
    auto actorId = ctx.actorId;
    auto &scene = ctx.getScene();
    auto &musicBehavior = scene.getBehaviors().byType<MusicBehavior>();
    if (auto component = musicBehavior.maybeGetComponent(actorId)) {
      Sound::StreamOptions opts;
      opts.quantize = params.quantize();
      opts.quantizeUnits = params.quantizeUnits();
      musicBehavior.playSong(actorId, component, params.loop(), opts);
    }
  }
};

struct StopSongResponse : BaseResponse {
  inline static const RuleRegistration<StopSongResponse, MusicBehavior> registration {
    "stop song"
  };
  static constexpr auto description = "Stop this actor's song";

  struct Params {
  } params;

  void run(RuleContext &ctx) override {
    auto actorId = ctx.actorId;
    auto &scene = ctx.getScene();
    auto &musicBehavior = scene.getBehaviors().byType<MusicBehavior>();
    if (auto component = musicBehavior.maybeGetComponent(actorId)) {
      musicBehavior.stopMusic(actorId, component, {});
    }
  }
};

struct StopTrackResponse : BaseResponse {
  inline static const RuleRegistration<StopTrackResponse, MusicBehavior> registration {
    "stop track"
  };
  static constexpr auto description = "Stop a track from this actor's song";

  struct Params {
    PROP(int, trackIndex, .label("track")) = 0;
  } params;

  void run(RuleContext &ctx) override {
    auto actorId = ctx.actorId;
    auto &scene = ctx.getScene();
    auto &musicBehavior = scene.getBehaviors().byType<MusicBehavior>();
    if (auto component = musicBehavior.maybeGetComponent(actorId)) {
      musicBehavior.stopTrack(actorId, component, params.trackIndex(), {});
    }
  }
};

struct PlayPatternResponse : BaseResponse {
  inline static const RuleRegistration<PlayPatternResponse, MusicBehavior> registration {
    "play pattern"
  };
  static constexpr auto description = "Play a pattern from this actor's song";

  struct Params {
    PROP(std::string, patternId, .label("pattern"));
    PROP(int, trackIndex, .label("track")) = 0;
    PROP(bool, loop) = true;
    PROP(bool, quantize, .label("quantize to clock")) = true;
    PROP(
         Clock::Quantize, quantizeUnits,
         .label("quantize units")
         .allowedValues("bar", "beat", "step")
         ) = Clock::Quantize::Bar;
  } params;

  void run(RuleContext &ctx) override {
    auto actorId = ctx.actorId;
    auto &scene = ctx.getScene();
    auto &musicBehavior = scene.getBehaviors().byType<MusicBehavior>();
    if (auto component = musicBehavior.maybeGetComponent(actorId)) {
      Sound::StreamOptions opts;
      opts.quantize = params.quantize();
      opts.quantizeUnits = params.quantizeUnits();
      musicBehavior.playPattern(
          actorId, component, params.patternId(), params.trackIndex(), params.loop(), opts);
    }
  }
};

struct PlayPatternStepResponse : BaseResponse {
  inline static const RuleRegistration<PlayPatternStepResponse, MusicBehavior> registration {
    "play pattern step"
  };
  static constexpr auto description = "Play one step from a pattern in this actor's song";

  struct Params {
    PROP(std::string, patternId, .label("pattern"));
    PROP(int, trackIndex, .label("track")) = 0;
    PROP(
         ExpressionRef, timeInPattern,
         .label("time in pattern (steps)")
         ) = 0;
  } params;

  void run(RuleContext &ctx) override {
    auto actorId = ctx.actorId;
    auto &scene = ctx.getScene();
    auto &musicBehavior = scene.getBehaviors().byType<MusicBehavior>();
    if (auto component = musicBehavior.maybeGetComponent(actorId)) {
      auto timeInPattern = params.timeInPattern().eval<double>(ctx);
      musicBehavior.playPatternStep(
          actorId, component, params.patternId(), params.trackIndex(), timeInPattern);
    }
  }
};

struct MuteTrackResponse : BaseResponse {
  inline static const RuleRegistration<MuteTrackResponse, MusicBehavior> registration {
    "mute track"
  };
  static constexpr auto description = "Mute a track from this actor's song";

  struct Params {
    PROP(int, trackIndex, .label("track")) = 0;
  } params;

  void run(RuleContext &ctx) override {
    auto actorId = ctx.actorId;
    auto &scene = ctx.getScene();
    auto &musicBehavior = scene.getBehaviors().byType<MusicBehavior>();
    if (auto component = musicBehavior.maybeGetComponent(actorId)) {
      musicBehavior.setTrackMuted(actorId, component, params.trackIndex(), true);
    }
  }
};

struct UnmuteTrackResponse : BaseResponse {
  inline static const RuleRegistration<UnmuteTrackResponse, MusicBehavior> registration {
    "unmute track"
  };
  static constexpr auto description = "Unmute a track from this actor's song";

  struct Params {
    PROP(int, trackIndex, .label("track")) = 0;
  } params;

  void run(RuleContext &ctx) override {
    auto actorId = ctx.actorId;
    auto &scene = ctx.getScene();
    auto &musicBehavior = scene.getBehaviors().byType<MusicBehavior>();
    if (auto component = musicBehavior.maybeGetComponent(actorId)) {
      musicBehavior.setTrackMuted(actorId, component, params.trackIndex(), false);
    }
  }
};
