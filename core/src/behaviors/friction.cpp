#include "friction.h"

#include "behaviors/all.h"


//
// Enable, disable
//

void FrictionBehavior::handleEnableComponent(ActorId actorId, FrictionComponent &component) {
  if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
    handleUpdateComponentFixtures(actorId, component, body);
  }
}

void FrictionBehavior::handleDisableComponent(
    ActorId actorId, FrictionComponent &component, bool removeActor) {
  if (!removeActor) {
    if (auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId)) {
      handleUpdateComponentFixtures(actorId, component, body);
    }
  }
}


//
// Getters, setters
//

void FrictionBehavior::handleSetProperty(
    ActorId actorId, FrictionComponent &component, PropId propId, const ExpressionValue &value) {
  auto body = getBehaviors().byType<BodyBehavior>().maybeGetPhysicsBody(actorId);
  if (!body) {
    return;
  }
  auto &props = component.props;
  if (propId == props.friction.id) {
    props.friction() = value.as<float>();
    handleUpdateComponentFixtures(actorId, component, body);
  } else {
    BaseBehavior::handleSetProperty(actorId, component, propId, value);
  }
}


//
// Fixtures
//

void FrictionBehavior::handleUpdateComponentFixtures(
    ActorId actorId, FrictionComponent &component, b2Body *body) {
  auto friction = component.disabled ? 0 : component.props.friction();
  for (auto fixture = body->GetFixtureList(); fixture; fixture = fixture->GetNext()) {
    fixture->SetFriction(friction);
  }
}
