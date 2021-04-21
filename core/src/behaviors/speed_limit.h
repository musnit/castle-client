#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct SpeedLimitComponent : BaseComponent {
  struct Props {
    PROP(float, maximumSpeed) = 1;
  } props;

  b2FrictionJoint *joint = nullptr;
};

class SpeedLimitBehavior : public BaseBehavior<SpeedLimitBehavior, SpeedLimitComponent> {
public:
  static constexpr auto name = "SpeedLimit";
  static constexpr auto behaviorId = 12;

  using BaseBehavior::BaseBehavior;


  void handleDisableComponent(ActorId actorId, SpeedLimitComponent &component, bool removeActor);

  void handlePerform(double dt);
};
