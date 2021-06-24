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
    body->SetLinearVelocity({ value.as<float>(), body->GetLinearVelocity().y });
  } else if (propId == props.vy.id) {
    body->SetLinearVelocity({ body->GetLinearVelocity().x, value.as<float>() });
  } else if (propId == props.rotationsPerSecond.id) {
    body->SetAngularVelocity(float(2 * M_PI * value.as<double>()));
  }
  BaseBehavior::handleSetProperty(actorId, component, propId, value);
}
