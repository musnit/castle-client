#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct FallingComponent : BaseComponent {
  struct Props {
    PROP(float, gravity) = 1;
  } props;
};

class FallingBehavior : public BaseBehavior<FallingBehavior, FallingComponent> {
public:
  static constexpr auto name = "Falling";
  static constexpr auto behaviorId = 8;

  using BaseBehavior::BaseBehavior;


  void handleEnableComponent(ActorId actorId, FallingComponent &component);
  void handleDisableComponent(ActorId actorId, FallingComponent &component, bool removeActor);

  void handleSetProperty(
      ActorId actorId, FallingComponent &component, PropId propId, const ExpressionValue &value);
};
