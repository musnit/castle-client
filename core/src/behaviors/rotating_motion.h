#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct RotatingMotionComponent : BaseComponent {
  struct Props {
    PROP(float, vx, .label("Velocity X")) = 0;
    PROP(float, vy, .label("Velocity Y")) = 0;
    PROP(float, rotationsPerSecond, .label("Rotations per second")) = 0;
  } props;
};

class RotatingMotionBehavior
    : public BaseBehavior<RotatingMotionBehavior, RotatingMotionComponent> {
public:
  static constexpr auto name = "RotatingMotion";
  static constexpr auto behaviorId = 13;
  static constexpr auto displayName = "Fixed Motion";

  using BaseBehavior::BaseBehavior;


  void handleEnableComponent(ActorId actorId, RotatingMotionComponent &component);
  void handleDisableComponent(
      ActorId actorId, RotatingMotionComponent &component, bool removeActor);

  ExpressionValue handleGetProperty(
      ActorId actorId, const RotatingMotionComponent &component, PropId propId) const;
  void handleSetProperty(ActorId actorId, RotatingMotionComponent &component, PropId propId,
      const ExpressionValue &value);
};
