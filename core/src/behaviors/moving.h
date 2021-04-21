#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct MovingComponent : BaseComponent {
  struct Props {
    PROP(float, vx) = 0;
    PROP(float, vy) = 0;
    PROP(float, angularVelocity) = 0;
    PROP(float, density) = 1;
  } props;
};

class MovingBehavior : public BaseBehavior<MovingBehavior, MovingComponent> {
public:
  static constexpr auto name = "Moving";
  static constexpr auto behaviorId = 7;

  using BaseBehavior::BaseBehavior;


  void handleEnableComponent(ActorId actorId, MovingComponent &component);
  void handleDisableComponent(ActorId actorId, MovingComponent &component, bool removeActor);
};
