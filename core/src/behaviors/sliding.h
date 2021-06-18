#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct SlidingComponent : BaseComponent {
  struct Props {
    PROP(std::string, direction) = "both";
    PROP(bool, isRotationAllowed) = true;
  } props;

  b2Body *anchorBody = nullptr;
  b2Joint *joint = nullptr;
};

class SlidingBehavior : public BaseBehavior<SlidingBehavior, SlidingComponent> {
public:
  static constexpr auto name = "Sliding";
  static constexpr auto behaviorId = 9;
  static constexpr auto displayName = "Axis Lock";

  using BaseBehavior::BaseBehavior;


  void handleEnableComponent(ActorId actorId, SlidingComponent &component);
  void handleDisableComponent(ActorId actorId, SlidingComponent &component, bool removeActor);

  void handleSetProperty(
      ActorId actorId, SlidingComponent &component, PropId propId, const ExpressionValue &value);

  friend class BodyBehavior;
  void handleUpdateComponentPosition(ActorId actorId, SlidingComponent &component, b2Body *body);
};
