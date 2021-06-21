#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct MovingComponent : BaseComponent {
  struct Props {
    PROP(float, vx, .label("Velocity X")) = 0;
    PROP(float, vy, .label("Velocity Y")) = 0;
    PROP(float, angularVelocity, .label("Rotation speed (degrees)")) = 0;
    PROP(
         float, density,
         .label("Density")
         .min(0.1)
         ) = 1;
  } props;

  // Tracking for motion triggers. These values are only updated when the relevant triggers are
  // present on the actor.
  struct PrevCoords {
    float x, y, a;
  };
  std::optional<PrevCoords> prevPosition;
  std::optional<PrevCoords> prevVelocity;
  bool isMoving = false; // Whether currently above the motion threshold
};

class MovingBehavior : public BaseBehavior<MovingBehavior, MovingComponent> {
public:
  static constexpr auto name = "Moving";
  static constexpr auto behaviorId = 7;
  static constexpr auto displayName = "Dynamic Motion";

  using BaseBehavior::BaseBehavior;


  void handleEnableComponent(ActorId actorId, MovingComponent &component);
  void handleDisableComponent(ActorId actorId, MovingComponent &component, bool removeActor);

  void handlePerform(double dt);

  ExpressionValue handleGetProperty(
      ActorId actorId, const MovingComponent &component, PropId propId) const;
  void handleSetProperty(
      ActorId actorId, MovingComponent &component, PropId propId, const ExpressionValue &value);

  friend class BodyBehavior;
  void handleUpdateComponentFixtures(ActorId actorId, MovingComponent &component, b2Body *body);
};
