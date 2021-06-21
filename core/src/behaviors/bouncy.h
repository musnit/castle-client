#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct BouncyComponent : BaseComponent {
  struct Props {
    PROP(
         float, bounciness,
         .label("Rebound")
         .min(0)
         .max(2)
         ) = 0.8;
  } props;
};

class BouncyBehavior : public BaseBehavior<BouncyBehavior, BouncyComponent> {
public:
  static constexpr auto name = "Bouncy";
  static constexpr auto behaviorId = 6;
  static constexpr auto displayName = "Bounce";

  using BaseBehavior::BaseBehavior;


  void handleEnableComponent(ActorId actorId, BouncyComponent &component);
  void handleDisableComponent(ActorId actorId, BouncyComponent &component, bool removeActor);

  void handleSetProperty(
      ActorId actorId, BouncyComponent &component, PropId propId, const ExpressionValue &value);

  friend class BodyBehavior;
  void handleUpdateComponentFixtures(ActorId actorId, BouncyComponent &component, b2Body *body);
};
