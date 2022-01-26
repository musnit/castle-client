#include "music.h"
#include "behaviors/all.h"
#include "sound/stream.h"

void MusicBehavior::handleEnableComponent(ActorId actorId, MusicComponent &component) {
  auto &song = component.props.song();
  if (song.tracks.size() == 0) {
    auto emptyPattern = Pattern::makeEmptyPattern();
    auto defaultTrack = Song::makeDefaultTrack();
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
      playSong(actorId, getScene(), &component, autoplay == "loop", opts);
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
  stopMusic(actorId, getScene(), &component, opts);
}

void MusicBehavior::handleSceneEnd() {
  Sound::StreamOptions opts;
  if (!getScene().getIsEditing()) {
    // default in play mode is to stop actor's streams at the next bar
    opts.quantize = true;
    opts.quantizeUnits = Clock::Quantize::Bar;
  }
  forEachComponent([&](ActorId actorId, MusicComponent &component) {
    stopMusic(actorId, getScene(), &component, opts);
  });
}

std::string MusicBehavior::hash(const std::string &json) {
  auto hash = std::hash<std::string> {}(json);

  char str[256];
  snprintf(str, sizeof str, "%zu", hash);

  return std::string(str);
}

void MusicBehavior::stopMusic(
    ActorId &actorId, Scene &scene, MusicComponent *component, Sound::StreamOptions opts) {
  // stop tracks
  auto &clock = scene.getClock();
  if (auto found = activeTracks.find(actorId); found != activeTracks.end()) {
    auto &[_, streams] = *found;
    for (auto streamId : streams) {
      scene.getSound().stopStream(clock.clockId, streamId, opts);
    }
    activeTracks.erase(actorId);
  }
  // stop patterns
  auto &song = component->props.song();
  for (auto &[patternId, _] : song.patterns) {
    stopPattern(actorId, scene, component, patternId, opts);
  }
}

void MusicBehavior::stopPattern(ActorId &actorId, Scene &scene, MusicComponent *component,
    const std::string &patternId, Sound::StreamOptions opts) {
  auto &clock = scene.getClock();
  if (auto found = activePatterns.find(patternId); found != activePatterns.end()) {
    auto &[_, streamId] = *found;
    scene.getSound().stopStream(clock.clockId, streamId, opts);
    activePatterns.erase(patternId);
  }
}

void MusicBehavior::playSong(ActorId &actorId, Scene &scene, MusicComponent *component, bool loop,
    Sound::StreamOptions opts) {
  auto &clock = scene.getClock();

  // stop any existing for the same actor
  stopMusic(actorId, scene, component, opts);

  auto &song = component->props.song();
  std::vector<int> streamsCreated;
  auto patterns = song.flattenTracksForPlayback(0, song.getLength(clock), clock);
  for (size_t idx = 0; idx < song.tracks.size(); idx++) {
    auto &pattern = patterns[idx];
    auto &track = song.tracks[idx];
    pattern->loop = loop ? Pattern::Loop::ExplicitLength : Pattern::Loop::None;
    auto instrumentClone = track->instrument->clone();
    auto streamId = scene.getSound().play(
        clock.clockId, std::move(pattern), std::move(instrumentClone), opts);
    if (streamId >= 0) {
      streamsCreated.push_back(streamId);
    }
  }
  activeTracks.emplace(actorId, streamsCreated);
}

void MusicBehavior::playPattern(ActorId &actorId, Scene &scene, MusicComponent *component,
    const std::string &patternId, int trackIndex, bool loop, Sound::StreamOptions opts) {
  auto &clock = scene.getClock();
  auto &song = component->props.song();
  if (auto found = song.patterns.find(patternId); found != song.patterns.end()) {
    auto &refPattern = found->second;
    if (trackIndex >= 0 && trackIndex < int(song.tracks.size())) {
      auto &track = song.tracks[trackIndex];

      // if this pattern is already playing, stop
      stopPattern(actorId, scene, component, patternId, opts);

      auto pattern = std::make_unique<Pattern>(refPattern);
      if (!loop) {
        pattern->loop = Pattern::Loop::None;
      }
      auto instrumentClone = track->instrument->clone();
      auto streamId = scene.getSound().play(
          clock.clockId, std::move(pattern), std::move(instrumentClone), opts);
      if (streamId >= 0) {
        activePatterns.emplace(patternId, streamId);
      }
    }
  }
}

void MusicBehavior::setTrackMuted(
    ActorId &actorId, MusicComponent *component, int trackIndex, bool muted) {
  auto &clock = getScene().getClock();
  // look up existing stream corresponding to this track and modify its instrument
  if (auto found = activeTracks.find(actorId); found != activeTracks.end()) {
    auto &[_, streams] = *found;
    if (trackIndex >= 0 && trackIndex < int(streams.size())) {
      auto streamIdForTrack = streams[trackIndex];
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
      musicBehavior.playSong(actorId, scene, component, params.loop(), opts);
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
      musicBehavior.stopMusic(actorId, scene, component, {});
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
          actorId, scene, component, params.patternId(), params.trackIndex(), params.loop(), opts);
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
