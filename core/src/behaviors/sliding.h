#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct SlidingComponent : BaseComponent {
  struct Props {
    PROP(std::string, direction) = "both";
    PROP(bool, isRotationAllowed) = true;
  } props;

  b2Joint *joint = nullptr;
};

class SlidingBehavior : public BaseBehavior<SlidingBehavior, SlidingComponent> {
public:
  static constexpr auto name = "Sliding";
  static constexpr auto behaviorId = 9;

  using BaseBehavior::BaseBehavior;


  void handleEnableComponent(ActorId actorId, SlidingComponent &component);
  void handleDisableComponent(ActorId actorId, SlidingComponent &component, bool removeActor);
};
