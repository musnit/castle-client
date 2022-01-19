#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"
#include "sound/song.h"

struct MusicComponent : BaseComponent {
  struct Props {
    PROP(Song, song);
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

  void stopSong(ActorId &actorId, Scene &scene, MusicComponent *component);
  void playSong(ActorId &actorId, Scene &scene, MusicComponent *component, bool loop);

  // handles to currently-running music streams, by actor
  std::unordered_map<ActorId, std::vector<int>> activeStreams;
};
