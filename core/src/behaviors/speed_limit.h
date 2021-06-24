#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct SpeedLimitComponent : BaseComponent {
  struct Props {
    PROP(
         float, maximumSpeed,
         .label("Max speed")
         .min(0.1)
         ) = 1;
  } props;

  b2FrictionJoint *joint = nullptr;
};

class SpeedLimitBehavior : public BaseBehavior<SpeedLimitBehavior, SpeedLimitComponent> {
public:
  static constexpr auto name = "SpeedLimit";
  static constexpr auto behaviorId = 12;
  static constexpr auto displayName = "Speed Limit";
  static constexpr auto allowsDisableWithoutRemoval = true;

  using BaseBehavior::BaseBehavior;


  void handleDisableComponent(ActorId actorId, SpeedLimitComponent &component, bool removeActor);

  void handlePerform(double dt);
};
