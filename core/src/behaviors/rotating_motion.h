#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct RotatingMotionComponent : BaseComponent {
  struct Props {
    PROP(float, vx) = 0;
    PROP(float, vy) = 0;
    PROP(float, rotationsPerSecond) = 0;
  } props;
};

class RotatingMotionBehavior : public BaseBehavior<RotatingMotionBehavior, RotatingMotionComponent> {
public:
  static constexpr char name[] = "RotatingMotion";

  using BaseBehavior::BaseBehavior;


  void handleEnableComponent(ActorId actorId, RotatingMotionComponent &component);
  void handleDisableComponent(ActorId actorId, RotatingMotionComponent &component, bool removeActor);

  void handlePerform(double dt);
};
