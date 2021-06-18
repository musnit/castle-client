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
  static constexpr auto name = "Friction";
  static constexpr auto behaviorId = 11;
  static constexpr auto displayName = "Friction";

  using BaseBehavior::BaseBehavior;


  void handleEnableComponent(ActorId actorId, FrictionComponent &component);
  void handleDisableComponent(ActorId actorId, FrictionComponent &component, bool removeActor);

  void handleSetProperty(
      ActorId actorId, FrictionComponent &component, PropId propId, const ExpressionValue &value);

  friend class BodyBehavior;
  void handleUpdateComponentFixtures(ActorId actorId, FrictionComponent &component, b2Body *body);
};
