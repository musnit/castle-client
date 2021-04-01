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
  static constexpr char name[] = "Falling";

  using BaseBehavior::BaseBehavior;


  void handleEnableComponent(ActorId actorId, FallingComponent &component);
  void handleDisableComponent(ActorId actorId, FallingComponent &component, bool removeActor);
};
