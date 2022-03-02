#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"
#include "sound/song.h"

struct MusicComponent : BaseComponent {
  struct Props {
    PROP(Song, song, .rulesGet(false) .rulesSet(false));
    PROP(
         std::string, autoplay,
         .label("autoplay when enabled")
         .allowedValues("none", "once", "loop")
         .rulesGet(false)
         .rulesSet(false)
         ) = "loop";
  } props;
};

class MusicBehavior : public BaseBehavior<MusicBehavior, MusicComponent> {
public:
  static constexpr auto name = "Music";
  static constexpr auto behaviorId = 22;
  static constexpr auto displayName = "Music";
  static constexpr auto allowsDisableWithoutRemoval = false;

  using BaseBehavior::BaseBehavior;

  static std::string hash(const std::string &songJson);
  void handleEnableComponent(ActorId actorId, MusicComponent &component);
  void handleDisableComponent(ActorId actorId, MusicComponent &component, bool removeActor);
  void handleSceneEnd();

  void stopMusic(ActorId &actorId, MusicComponent *component, Sound::StreamOptions opts);
  void stopTrack(
      ActorId &actorId, MusicComponent *component, int trackIndex, Sound::StreamOptions opts);
  void playSong(ActorId &actorId, MusicComponent *component, bool loop, Sound::StreamOptions opts);
  void playPattern(ActorId &actorId, MusicComponent *component, const std::string &patternId,
      int trackIndex, bool loop, Sound::StreamOptions opts);
  void setTrackMuted(ActorId &actorId, MusicComponent *component, int trackIndex, bool muted);
  void playPatternStep(ActorId &actorId, MusicComponent *component, const std::string &patternId,
      int trackIndex, double timeInPattern);

  // handles to currently-running streams
  // ActorId -> track index -> stream id
  // one (actorId, track) can only play one stream at a time
  std::unordered_map<ActorId, std::unordered_map<int, int>> activeStreams;
};
