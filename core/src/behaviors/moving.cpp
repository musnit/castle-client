#include "moving.h"

#include "behaviors/all.h"


//
// Triggers
//

struct VelocityChangesTrigger : BaseTrigger {
  inline static const RuleRegistration<VelocityChangesTrigger, MovingBehavior> registration {
    "velocity changes"
  };

  struct Params {
  } params;
};

struct StopsMovingTrigger : BaseTrigger {
  inline static const RuleRegistration<StopsMovingTrigger, MovingBehavior> registration {
    "stops moving"
  };

  struct Params {
  } params;
};


//
// Responses
//

struct MoveTowardOwnAngleResponse : BaseResponse {
  inline static const RuleRegistration<MoveTowardOwnAngleResponse, MovingBehavior> registration {
    "move toward own angle"
  };

  struct Params {
    PROP(ExpressionRef, speed) = 0;
  } params;

  void run(RuleContext &ctx) override {
    auto &bodyBehavior = ctx.getScene().getBehaviors().byType<BodyBehavior>();
    if (auto body = bodyBehavior.maybeGetPhysicsBody(ctx.actorId)) {
      auto angle = body->GetAngle();
      auto mass = body->GetMass();
      auto speed = params.speed().eval<float>(ctx);
      body->ApplyLinearImpulseToCenter(
          { mass * speed * std::cos(angle), mass * speed * std::sin(angle) }, true);
    }
  }
};

struct MoveTowardActorResponse : BaseResponse {
  // Register for both moving and rotating motion
  inline static const RuleRegistration<MoveTowardActorResponse, MovingBehavior> registration1 {
    "move toward actor", true
  };
  inline static const RuleRegistration<MoveTowardActorResponse, RotatingMotionBehavior>
      registration2 { "move toward actor", true };

  struct Params {
    PROP(Tag, tag);
    PROP(ExpressionRef, speed) = 0;
  } params;

  void run(RuleContext &ctx) override {
    // Need a body
    auto actorId = ctx.actorId;
    auto &scene = ctx.getScene();
    auto &bodyBehavior = scene.getBehaviors().byType<BodyBehavior>();
    if (auto body = bodyBehavior.maybeGetPhysicsBody(actorId)) {
      // Find actors with tag
      auto &tagsBehavior = scene.getBehaviors().byType<TagsBehavior>();
      if (tagsBehavior.numActorsWithTag(params.tag()) == 0) {
        return;
      }

      // Find delta to closest actor among tagged
      auto pos = body->GetPosition();
      auto closestDelta = b2Vec2(0, 0);
      auto closestSqDist = std::numeric_limits<float>::max();
      auto found = false;
      tagsBehavior.forEachActorWithTag(params.tag(), [&](ActorId taggedActorId) {
        if (taggedActorId != actorId) {
          if (auto taggedBody = bodyBehavior.maybeGetPhysicsBody(taggedActorId)) {
            auto delta = taggedBody->GetPosition() - pos;
            auto sqDist = delta.LengthSquared();
            if (sqDist < closestSqDist) {
              closestDelta = delta;
              closestSqDist = sqDist;
              found = true;
            }
          }
        }
      });
      if (found && closestSqDist > 0) {
        // Apply impulse
        auto mass = body->GetMass();
        auto speed = params.speed().eval<float>(ctx);
        body->ApplyLinearImpulseToCenter(
            mass * speed * (1 / std::sqrt(closestSqDist)) * closestDelta, true);
      }
    }
  }
};


//
// Enable, disable
//

void MovingBehavior::handleEnableComponent(ActorId actorId, MovingComponent &component) {
  if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
    body->SetType(b2_dynamicBody); // Do this before setting velocities, otherwise they're ignored
    body->SetLinearVelocity({ component.props.vx(), component.props.vy() });
    body->SetAngularVelocity(float(component.props.angularVelocity() * M_PI / 180));
    handleUpdateComponentFixtures(actorId, component, body);
  }
}

void MovingBehavior::handleDisableComponent(
    ActorId actorId, MovingComponent &component, bool removeActor) {
  if (!removeActor) {
    if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
      handleUpdateComponentFixtures(actorId, component, body);
      body->SetType(b2_staticBody); // Internally sets velocities to zero

      auto &rulesBehavior = getBehaviors().byType<RulesBehavior>();
      rulesBehavior.fire<VelocityChangesTrigger>(actorId, {});
      // rulesBehavior.fire<StopsMovingTrigger>(actorId, {}); // NOTE: Should we do this?
    }
  }
}


//
// Perform
//

void MovingBehavior::handlePerform(double dt) {
  // Motion triggers
  auto &rulesBehavior = getBehaviors().byType<RulesBehavior>();
  forEachEnabledComponent([&](ActorId actorId, MovingComponent &component) {
    if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
      // Check if velocity changed
      if (rulesBehavior.hasTrigger<VelocityChangesTrigger>(actorId)) {
        auto [vx, vy] = body->GetLinearVelocity();
        auto va = body->GetAngularVelocity();
        auto &prevVelocity = component.prevVelocity;
        if (!prevVelocity || prevVelocity->x != vx || prevVelocity->y != vy
            || prevVelocity->a != va) {
          rulesBehavior.fire<VelocityChangesTrigger>(actorId, {});
        }
        prevVelocity = { vx, vy, va };
      }

      // Check if position changed
      if (rulesBehavior.hasTrigger<StopsMovingTrigger>(actorId)) {
        constexpr auto translationThreshold = 0.0005;
        constexpr auto rotationThreshold = 0.001;
        auto [x, y] = body->GetPosition();
        auto a = body->GetAngle();
        auto &prevPosition = component.prevPosition;
        if (prevPosition) {
          auto moving = std::abs(prevPosition->x - x) >= translationThreshold
              || std::abs(prevPosition->y - y) >= translationThreshold
              || std::abs(prevPosition->a - a) >= rotationThreshold;
          if (component.isMoving != moving) {
            if (!moving) {
              rulesBehavior.fire<StopsMovingTrigger>(actorId, {});
            }
            component.isMoving = moving;
          }
        }
        prevPosition = { x, y, a };
      }
    }
  });
}


//
// Getters, setters
//

ExpressionValue MovingBehavior::handleGetProperty(
    ActorId actorId, const MovingComponent &component, PropId propId) const {
  auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId);
  if (!body) {
    return {};
  }
  auto &props = component.props;
  if (propId == props.vx.id) {
    return body->GetLinearVelocity().x;
  } else if (propId == props.vy.id) {
    return body->GetLinearVelocity().y;
  } else if (propId == props.angularVelocity.id) {
    return body->GetAngularVelocity() * 180 / M_PI;
  } else if (propId == props.density.id) {
    return props.density();
  } else {
    return BaseBehavior::handleGetProperty(actorId, component, propId);
  }
}

void MovingBehavior::handleSetProperty(
    ActorId actorId, MovingComponent &component, PropId propId, const ExpressionValue &value) {
  auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId);
  if (!body) {
    return;
  }
  auto &props = component.props;
  if (propId == props.vx.id) {
    body->SetLinearVelocity({ value.as<float>(), body->GetLinearVelocity().y });
  } else if (propId == props.vy.id) {
    body->SetLinearVelocity({ body->GetLinearVelocity().x, value.as<float>() });
  } else if (propId == props.angularVelocity.id) {
    body->SetAngularVelocity(float(value.as<double>() * M_PI / 180));
  } else if (propId == props.density.id) {
    props.density() = value.as<float>();
    handleUpdateComponentFixtures(actorId, component, body);
  } else {
    BaseBehavior::handleSetProperty(actorId, component, propId, value);
  }
}


//
// Fixtures
//

void MovingBehavior::handleUpdateComponentFixtures(
    ActorId actorId, MovingComponent &component, b2Body *body) {
  auto density = component.disabled ? 1 : component.props.density();
  for (auto fixture = body->GetFixtureList(); fixture; fixture = fixture->GetNext()) {
    fixture->SetDensity(density);
  }
  body->ResetMassData();
}
