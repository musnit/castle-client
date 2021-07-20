#include "rotating_motion.h"

#include "behaviors/all.h"


//
// Enable, disable
//

void RotatingMotionBehavior::handleEnableComponent(
    ActorId actorId, RotatingMotionComponent &component) {
  if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
    body->SetType(b2_kinematicBody);
    body->SetLinearVelocity({ component.props.vx(), component.props.vy() });
    body->SetAngularVelocity(float(2 * M_PI * component.props.rotationsPerSecond()));
  }
}

void RotatingMotionBehavior::handleDisableComponent(
    ActorId actorId, RotatingMotionComponent &component, bool removeActor) {
  if (!removeActor) {
    if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
      body->SetType(b2_staticBody); // Internally sets velocities to zero
    }
  }
}


//
// Getters, setters
//

ExpressionValue RotatingMotionBehavior::handleGetProperty(
    ActorId actorId, const RotatingMotionComponent &component, PropId propId) const {
  auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId);
  if (!body) {
    return {};
  }
  auto &props = component.props;
  if (propId == props.vx.id) {
    return body->GetLinearVelocity().x;
  } else if (propId == props.vy.id) {
    return body->GetLinearVelocity().y;
  } else if (propId == props.rotationsPerSecond.id) {
    return body->GetAngularVelocity() / (2 * M_PI);
  } else {
    return BaseBehavior::handleGetProperty(actorId, component, propId);
  }
}

void RotatingMotionBehavior::handleSetProperty(ActorId actorId, RotatingMotionComponent &component,
    PropId propId, const ExpressionValue &value) {
  auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId);
  if (!body) {
    return;
  }
  auto &props = component.props;
  if (propId == props.vx.id) {
    props.vx() = value.as<float>();
    body->SetLinearVelocity({ props.vx(), body->GetLinearVelocity().y });
  } else if (propId == props.vy.id) {
    props.vy() = value.as<float>();
    body->SetLinearVelocity({ body->GetLinearVelocity().x, props.vy() });
  } else if (propId == props.rotationsPerSecond.id) {
    props.rotationsPerSecond() = value.as<float>();
    body->SetAngularVelocity(float(2 * M_PI * props.rotationsPerSecond()));
  }
  BaseBehavior::handleSetProperty(actorId, component, propId, value);
}
