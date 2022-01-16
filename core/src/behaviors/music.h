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
};
