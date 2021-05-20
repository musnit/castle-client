#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct SlowdownComponent : BaseComponent {
  struct Props {
    PROP(float, motionSlowdown) = 5;
    PROP(float, rotationSlowdown) = 0.5;
  } props;

  b2FrictionJoint *joint = nullptr;
};

class SlowdownBehavior : public BaseBehavior<SlowdownBehavior, SlowdownComponent> {
public:
  static constexpr auto name = "Slowdown";
  static constexpr auto behaviorId = 10;

  using BaseBehavior::BaseBehavior;


  void handleEnableComponent(ActorId actorId, SlowdownComponent &component);
  void handleDisableComponent(ActorId actorId, SlowdownComponent &component, bool removeActor);

  void handleSetProperty(
      ActorId actorId, SlowdownComponent &component, PropId propId, const ExpressionValue &value);
};
