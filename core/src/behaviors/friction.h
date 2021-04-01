#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct FrictionComponent : BaseComponent {
  struct Props {
    PROP(float, friction) = 0.2;
  } props;
};

class FrictionBehavior : public BaseBehavior<FrictionBehavior, FrictionComponent> {
public:
  static constexpr char name[] = "Friction";

  using BaseBehavior::BaseBehavior;


  void handleEnableComponent(ActorId actorId, FrictionComponent &component);
  void handleDisableComponent(ActorId actorId, FrictionComponent &component, bool removeActor);
};
