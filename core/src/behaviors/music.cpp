#include "music.h"
#include "behaviors/all.h"

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
}

void MusicBehavior::handleDisableComponent(
    ActorId actorId, MusicComponent &component, bool removeActor) {
  stopSong(actorId, getScene(), &component);
}

std::string MusicBehavior::hash(const std::string &json) {
  auto hash = std::hash<std::string> {}(json);

  char str[256];
  snprintf(str, sizeof str, "%zu", hash);

  return std::string(str);
}

void MusicBehavior::stopSong(ActorId &actorId, Scene &scene, MusicComponent *component) {
  if (auto found = activeStreams.find(actorId); found != activeStreams.end()) {
    auto &clock = scene.getClock();
    auto &[_, streams] = *found;
    for (auto streamId : streams) {
      scene.getSound().stopStream(clock.clockId, streamId);
    }
    activeStreams.erase(actorId);
  }
}

void MusicBehavior::playSong(ActorId &actorId, Scene &scene, MusicComponent *component, bool loop,
    Sound::StreamOptions opts) {
  auto &clock = scene.getClock();

  // stop any existing for the same actor
  stopSong(actorId, scene, component);

  auto &song = component->props.song();
  std::vector<int> streamsCreated;
  auto patterns = song.flattenTracksForPlayback(0, song.getLength(clock), clock);
  for (size_t idx = 0; idx < song.tracks.size(); idx++) {
    auto &pattern = patterns[idx];
    auto &track = song.tracks[idx];
    pattern->loop = loop ? Pattern::Loop::ExplicitLength : Pattern::Loop::None;
    auto streamId
        = scene.getSound().play(clock.clockId, std::move(pattern), *track->instrument, opts);
    if (streamId >= 0) {
      streamsCreated.push_back(streamId);
    }
  }
  activeStreams.emplace(actorId, streamsCreated);
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
    PROP(bool, quantize) = true;
    PROP(
         // TODO: add read/write on Clock::Quantize
         std::string, quantizeUnits,
         .label("quantize units")
         .allowedValues("bar", "beat", "step")
         ) = "bar";
  } params;

  void run(RuleContext &ctx) override {
    auto actorId = ctx.actorId;
    auto &scene = ctx.getScene();
    auto &musicBehavior = scene.getBehaviors().byType<MusicBehavior>();
    if (auto component = musicBehavior.maybeGetComponent(actorId)) {
      Sound::StreamOptions opts;
      opts.quantize = params.quantize();
      auto quantizeUnitsStr = params.quantizeUnits();
      if (quantizeUnitsStr == "bar") {
        opts.quantizeUnits = Clock::Quantize::Bar;
      } else if (quantizeUnitsStr == "beat") {
        opts.quantizeUnits = Clock::Quantize::Beat;
      } else if (quantizeUnitsStr == "step") {
        opts.quantizeUnits = Clock::Quantize::Step;
      }
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
      musicBehavior.stopSong(actorId, scene, component);
    }
  }
};
