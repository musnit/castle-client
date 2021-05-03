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
  static constexpr auto name = "Bouncy";
  static constexpr auto behaviorId = 6;

  using BaseBehavior::BaseBehavior;


  void handleEnableComponent(ActorId actorId, BouncyComponent &component);
  void handleDisableComponent(ActorId actorId, BouncyComponent &component, bool removeActor);

  friend class BodyBehavior;
  void handleUpdateComponentFixtures(ActorId actorId, BouncyComponent &component, b2Body *body);
};
