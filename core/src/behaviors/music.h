#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"
#include "sound/song.h"

struct MusicComponent : BaseComponent {
  struct Props {
    PROP(Song, song);
    PROP(
         std::string, autoplay,
         .label("autoplay when enabled")
         .allowedValues("none", "once", "loop")
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

  void stopMusic(
      ActorId &actorId, Scene &scene, MusicComponent *component, Sound::StreamOptions opts);
  void stopPattern(ActorId &actorId, Scene &scene, MusicComponent *component,
      const std::string &patternId, Sound::StreamOptions opts);
  void playSong(ActorId &actorId, Scene &scene, MusicComponent *component, bool loop,
      Sound::StreamOptions opts);
  void playPattern(ActorId &actorId, Scene &scene, MusicComponent *component,
      const std::string &patternId, int trackIndex, bool loop, Sound::StreamOptions opts);
  void setTrackMuted(MusicComponent *component, int trackIndex, bool muted);

  // handles to currently-running tracks, by actor id
  std::unordered_map<ActorId, std::vector<int>> activeTracks;

  // handles to currently-running patterns, by pattern id
  std::unordered_map<std::string, int> activePatterns;
};
