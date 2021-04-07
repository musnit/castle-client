#pragma once

#include "precomp.h"

#include "behaviors/base.h"
#include "props.h"


struct BodyComponent : BaseComponent {
  struct Props {
    PROP(float, x) = 0;
    PROP(float, y) = 0;
    PROP(float, angle) = 0;

    PROP(float, width) = 1;
    PROP(float, height) = 1;
    PROP(float, widthScale) = 0.1;
    PROP(float, heightScale) = 0.1;

    // NOTE: Skipping because it's never `true`
    // PROP(bool, bullet) = false;

    PROP(bool, visible) = true;

    // NOTE: Skipping because we start static and other behaviors (eg. `MovingBehavior`) set this
    // PROP(std::string, bodyType) = "static";

    // NOTE: Skipping because this is automatically calculated with `b2Body::ResetMassData()` after
    //       creating / updating fixtures
    // PROP((std::array<float, 4>), massData) = { 0.0f, 0.0f, 0.0f, 0.0f };

    PROP(std::string, layerName) = "main";

    struct FixtureProps {
      PROP(std::string, shapeType) = "polygon";
      PROP(std::vector<float>, points);
      PROP(float, x) = 0;
      PROP(float, y) = 0;
      PROP(float, radius) = 0;
    };
    PROP(std::vector<FixtureProps>, fixtures);
  } props;

  b2Body *body = nullptr;
};

class BodyBehavior : public BaseBehavior<BodyBehavior, BodyComponent> {
public:
  static constexpr char name[] = "Body";

  using BaseBehavior::BaseBehavior;


  void handleEnableComponent(ActorId actorId, BodyComponent &component);
  void handleDisableComponent(ActorId actorId, BodyComponent &component, bool removeActor);


  const b2Body *maybeGetPhysicsBody(ActorId actorId) const; // `nullptr` if not present


private:
  friend class SolidBehavior; // Other behaviors that modify the Box2D body
  friend class MovingBehavior;
  friend class FallingBehavior;
  friend class BouncyBehavior;
  friend class FrictionBehavior;
  friend class RotatingMotionBehavior;
  friend class SlowdownBehavior;
  friend class SpeedLimitBehavior;
  friend class SlidingBehavior;
  friend class SlingBehavior;

  b2Body *maybeGetPhysicsBody(ActorId actorId); // `nullptr` if not present

  b2Fixture *addFixture(BodyComponent &component, b2Shape *shape);
};


// Inline implementations

inline b2Body *BodyBehavior::maybeGetPhysicsBody(ActorId actorId) {
  if (auto component = maybeGetComponent(actorId)) {
    return component->body;
  }
  return nullptr;
}

inline const b2Body *BodyBehavior::maybeGetPhysicsBody(ActorId actorId) const {
  if (auto component = maybeGetComponent(actorId)) {
    return component->body;
  }
  return nullptr;
}
