#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct BouncyComponent : BaseComponent {
  struct Props {
    PROP(float, bounciness) = 0.8;
  } props;
};

class BouncyBehavior : public BaseBehavior<BouncyBehavior, BouncyComponent> {
public:
  static constexpr char name[] = "Bouncy";

  using BaseBehavior::BaseBehavior;


  void handleEnableComponent(ActorId actorId, BouncyComponent &component);
  void handleDisableComponent(ActorId actorId, BouncyComponent &component, bool removeActor);
};
