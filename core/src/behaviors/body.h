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


  // `ActorId` <-> `b2Body` association

  const b2Body *maybeGetPhysicsBody(ActorId actorId) const; // `nullptr` if not present
  ActorId maybeGetActorId(const b2Body *body) const; // `nullActor` if not present


  // Queries

  template<typename F> // `F` takes `(ActorId, const b2Fixture *)`, returns `false` to stop query
  void forEachActorAtBoundingBox(float minX, float minY, float maxX, float maxY, F &&f) const;
  template<typename F>
  void forEachActorAtPoint(float x, float y, F &&f) const;


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
  friend class DragBehavior;
  friend class AnalogStickBehavior;

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

inline ActorId BodyBehavior::maybeGetActorId(const b2Body *body) const {
  auto actorId = ActorId(const_cast<b2Body *>(body)->GetUserData().pointer - 1);
  return hasComponent(actorId) ? actorId : nullActor;
}

template<typename F>
void BodyBehavior::forEachActorAtBoundingBox(
    float minX, float minY, float maxX, float maxY, F &&f) const {
  struct Callback : b2QueryCallback {
    const BodyBehavior &bodyBehavior;
    const F f;

    Callback(const BodyBehavior &bodyBehavior_, F &&f_)
        : bodyBehavior(bodyBehavior_)
        , f(std::forward<F>(f_)) {
    }

    bool ReportFixture(b2Fixture *fixture) final {
      if (auto actorId = bodyBehavior.maybeGetActorId(fixture->GetBody()); actorId != nullActor) {
        return f(actorId, (const b2Fixture *)fixture);
      }
      return true;
    }
  } cb(*this, std::forward<F>(f));
  getScene().getPhysicsWorld().QueryAABB(&cb, { { minX, minY }, { maxX, maxY } });
}

template<typename F>
void BodyBehavior::forEachActorAtPoint(float x, float y, F &&f) const {
  forEachActorAtBoundingBox(
      x - 0.01, y - 0.01, x + 0.01, y + 0.01, [&](ActorId actorId, const b2Fixture *fixture) {
        if (fixture->TestPoint({ x, y })) {
          return f(actorId, fixture);
        }
        return true;
      });
}
