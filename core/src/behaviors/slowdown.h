#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct SlowdownComponent : BaseComponent {
  struct Props {
    PROP(
         float, motionSlowdown,
         .label("Translation")
         .min(0)
         ) = 5;
    PROP(
         float, rotationSlowdown,
         .label("Rotation")
         .min(0)
         ) = 0.5;
  } props;

  b2FrictionJoint *joint = nullptr;
};

class SlowdownBehavior : public BaseBehavior<SlowdownBehavior, SlowdownComponent> {
public:
  static constexpr auto name = "Slowdown";
  static constexpr auto behaviorId = 10;
  static constexpr auto displayName = "Slow Down";

  using BaseBehavior::BaseBehavior;


  void handleEnableComponent(ActorId actorId, SlowdownComponent &component);
  void handleDisableComponent(ActorId actorId, SlowdownComponent &component, bool removeActor);

  void handleSetProperty(
      ActorId actorId, SlowdownComponent &component, PropId propId, const ExpressionValue &value);
};
