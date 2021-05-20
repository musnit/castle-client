#include "falling.h"

#include "behaviors/all.h"


//
// Enable, disable
//

void FallingBehavior::handleEnableComponent(ActorId actorId, FallingComponent &component) {
  if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
    body->SetGravityScale(component.props.gravity());
    body->SetAwake(true);
  }
}

void FallingBehavior::handleDisableComponent(
    ActorId actorId, FallingComponent &component, bool removeActor) {
  if (!removeActor) {
    if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
      body->SetGravityScale(0);
    }
  }
}


//
// Getters, setters
//

void FallingBehavior::handleSetProperty(
    ActorId actorId, FallingComponent &component, PropId propId, const ExpressionValue &value) {
  auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId);
  if (!body) {
    return;
  }
  auto &props = component.props;
  if (propId == props.gravity.id) {
    auto gravity = value.as<float>();
    props.gravity() = gravity;
    body->SetGravityScale(gravity);
  } else {
    BaseBehavior::handleSetProperty(actorId, component, propId, value);
  }
}
